export default function SourceTag({ page, source }) {
  return (
    <span className="page-tab" title={source}>
      {source ? `${truncate(source)} · ` : ""}p.{page}
    </span>
  );
}

function truncate(name, max = 18) {
  if (!name) return "";
  const base = name.replace(/\.pdf$/i, "");
  return base.length > max ? base.slice(0, max - 1) + "…" : base;
}
