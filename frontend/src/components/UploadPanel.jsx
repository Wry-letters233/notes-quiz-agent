import { useState, useRef } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { uploadPdfs } from "../api";

export default function UploadPanel({ onUploaded, ownerId, t }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const pdfs = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      setError("Please choose PDF files only.");
      return;
    }
    setError(null);
    setSelectedFiles((prev) => [...prev, ...pdfs]);
  }

  function removeFile(name) {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleBuild() {
    if (selectedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const meta = await uploadPdfs(selectedFiles, ownerId);
      onUploaded(meta);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-2xl font-bold mb-2 text-textMain neon-text">{t.dropTitle}</h2>
      <p className="text-inkSoft mb-8">{t.dropSub}</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-md p-12 text-center cursor-pointer transition-all bg-surface/40
          ${dragOver ? "border-pen shadow-neonRed scale-[1.01]" : "border-paperLine hover:border-ink hover:shadow-neon"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <UploadCloud size={28} className={`mx-auto mb-3 transition-transform ${dragOver ? "scale-110 text-pen" : "text-ink"}`} />
        <p className="font-display text-base font-semibold mb-1 text-textMain">{t.dropZone}</p>
        <p className="text-xs text-inkSoft font-mono">{t.dropHint}</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-5 space-y-2 stagger-in">
          {selectedFiles.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between bg-surface border border-paperLine rounded-sm px-3 py-2 lift-on-hover"
            >
              <span className="flex items-center gap-2 text-sm font-mono truncate pr-3 text-textMain">
                <FileText size={14} className="text-ink shrink-0" />
                {f.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                className="text-pen text-xs font-medium hover:underline"
              >
                remove
              </button>
            </div>
          ))}

          <button
            onClick={handleBuild}
            disabled={loading}
            className="w-full mt-3 bg-ink text-paper py-3 rounded-sm font-semibold hover:brightness-110 active:scale-[0.99] shadow-neon transition disabled:opacity-50"
          >
            {loading ? t.reading : t.buildBtn(selectedFiles.length)}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-pen font-medium">{error}</p>}
    </div>
  );
}
