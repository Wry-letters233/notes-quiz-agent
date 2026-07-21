"""
rag_core.py
Handles: PDF parsing -> chunking -> embeddings -> Chroma vector store -> retrieval

Embeddings: 100% local via sentence-transformers (no API key, no internet
needed after the model downloads once). No OpenAI dependency for embeddings.

Chat/generation: defaults to Ollama (free, local LLM). Can switch to OpenAI
by setting LLM_PROVIDER=openai in .env if you'd rather use a hosted model.
"""
import os
import uuid
import json
import requests
from pathlib import Path

import io
import pdfplumber
import chromadb
from chromadb.utils import embedding_functions
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# ---------- Embeddings: local, free, no API key ----------
# Downloads ~80MB once on first run, then runs fully offline.
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

chroma_client = chromadb.PersistentClient(path=str(DATA_DIR / "chroma_store"))

# ---------- LLM provider switch ----------
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "ollama")  # "ollama" or "openai"
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

_openai_client = None
if LLM_PROVIDER == "openai":
    from openai import OpenAI
    _openai_client = OpenAI()  # reads OPENAI_API_KEY from env


def extract_pages(pdf_bytes: bytes):
    """Returns list of (page_number, text) tuples, 1-indexed pages."""
    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages.append((i + 1, text))
    return pages


def chunk_pages(pages, source: str):
    """
    Chunk text while preserving page number + source filename metadata.
    Returns list of dicts: {id, text, page, source}
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " "],
    )
    chunks = []
    for page_num, text in pages:
        for piece in splitter.split_text(text):
            if len(piece.strip()) < 30:
                continue
            chunks.append({
                "id": str(uuid.uuid4()),
                "text": piece.strip(),
                "page": page_num,
                "source": source,
            })
    return chunks


def create_notebook(files: list, owner_id: str) -> dict:
    """
    Parses one or more PDFs into a single combined knowledge base,
    owned by the given user.
    files: list of (filename, pdf_bytes) tuples.
    """
    import datetime
    notebook_id = str(uuid.uuid4())[:8]
    all_chunks = []
    file_summaries = []

    for filename, pdf_bytes in files:
        pages = extract_pages(pdf_bytes)
        chunks = chunk_pages(pages, source=filename)
        all_chunks.extend(chunks)
        file_summaries.append({
            "filename": filename,
            "num_pages": len(pages),
            "num_chunks": len(chunks),
        })

    if not all_chunks:
        raise ValueError("Could not extract readable text from these PDFs.")

    collection = chroma_client.create_collection(
        name=f"nb_{notebook_id}",
        embedding_function=embedding_fn,
    )

    collection.add(
        ids=[c["id"] for c in all_chunks],
        documents=[c["text"] for c in all_chunks],
        metadatas=[{"page": c["page"], "source": c["source"]} for c in all_chunks],
    )

    meta = {
        "notebook_id": notebook_id,
        "owner_id": owner_id,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "files": file_summaries,
        "filenames": [f["filename"] for f in file_summaries],
        "num_chunks": len(all_chunks),
        "num_pages": sum(f["num_pages"] for f in file_summaries),
        "num_files": len(file_summaries),
    }
    (DATA_DIR / notebook_id).mkdir(exist_ok=True)
    with open(DATA_DIR / notebook_id / "meta.json", "w") as f:
        json.dump(meta, f)

    return meta


def list_notebooks(owner_id: str) -> list:
    """Returns metadata for every notebook belonging to this user, newest first."""
    results = []
    for entry in DATA_DIR.iterdir():
        if not entry.is_dir():
            continue
        meta_path = entry / "meta.json"
        if not meta_path.exists():
            continue
        meta = json.load(open(meta_path))
        if meta.get("owner_id") == owner_id:
            results.append(meta)
    results.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    return results


def add_files_to_notebook(notebook_id: str, files: list) -> dict:
    """Adds more PDFs to an existing notebook's collection."""
    collection = get_collection(notebook_id)
    meta_path = DATA_DIR / notebook_id / "meta.json"
    meta = json.load(open(meta_path)) if meta_path.exists() else {
        "notebook_id": notebook_id, "files": [], "filenames": [], "num_chunks": 0, "num_pages": 0, "num_files": 0
    }

    new_chunks = []
    for filename, pdf_bytes in files:
        pages = extract_pages(pdf_bytes)
        chunks = chunk_pages(pages, source=filename)
        new_chunks.extend(chunks)
        meta["files"].append({"filename": filename, "num_pages": len(pages), "num_chunks": len(chunks)})
        meta["filenames"].append(filename)
        meta["num_pages"] += len(pages)

    if not new_chunks:
        raise ValueError("Could not extract readable text from these PDFs.")

    collection.add(
        ids=[c["id"] for c in new_chunks],
        documents=[c["text"] for c in new_chunks],
        metadatas=[{"page": c["page"], "source": c["source"]} for c in new_chunks],
    )

    meta["num_chunks"] += len(new_chunks)
    meta["num_files"] = len(meta["files"])
    with open(meta_path, "w") as f:
        json.dump(meta, f)

    return meta


def get_notebook_meta(notebook_id: str) -> dict:
    meta_path = DATA_DIR / notebook_id / "meta.json"
    if not meta_path.exists():
        raise ValueError("Notebook not found.")
    return json.load(open(meta_path))


def get_collection(notebook_id: str):
    return chroma_client.get_collection(
        name=f"nb_{notebook_id}", embedding_function=embedding_fn
    )


def retrieve_chunks(notebook_id: str, query: str, k: int = 4):
    collection = get_collection(notebook_id)
    results = collection.query(query_texts=[query], n_results=k)
    out = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        out.append({"text": doc, "page": meta["page"], "source": meta["source"]})
    return out


def sample_chunks_for_quiz(notebook_id: str, n: int = 8, prefer_sources: list = None):
    """Pull a spread of chunks. If prefer_sources given, bias toward those for adaptive mode."""
    collection = get_collection(notebook_id)
    all_data = collection.get()
    docs = all_data["documents"]
    metas = all_data["metadatas"]
    total = len(docs)
    if total == 0:
        return []

    all_chunks = [{"text": docs[i], "page": metas[i]["page"], "source": metas[i]["source"]}
                  for i in range(total)]

    if prefer_sources:
        preferred = [c for c in all_chunks if c["source"] in prefer_sources]
        others = [c for c in all_chunks if c["source"] not in prefer_sources]
        # Take up to half from preferred sources
        n_pref = min(len(preferred), n // 2)
        n_other = n - n_pref
        step_pref = max(1, len(preferred) // max(n_pref, 1))
        step_other = max(1, len(others) // max(n_other, 1))
        picked = [preferred[i] for i in range(0, len(preferred), step_pref)][:n_pref]
        picked += [others[i] for i in range(0, len(others), step_other)][:n_other]
        return picked[:n]

    step = max(1, total // n)
    picked = [all_chunks[i] for i in range(0, total, step)][:n]
    return picked


def chat_completion(system_prompt: str, user_prompt: str) -> str:
    if LLM_PROVIDER == "openai":
        resp = _openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
        )
        return resp.choices[0].message.content

    # Default: Ollama (free, local). Requires `ollama serve` running
    # and a model pulled, e.g. `ollama pull llama3.2`.
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "options": {"temperature": 0.4},
            },
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Could not reach Ollama at "
            f"{OLLAMA_HOST}. Is it running? Start it with `ollama serve` "
            f"(and make sure you've run `ollama pull {OLLAMA_MODEL}` at least once)."
        )
