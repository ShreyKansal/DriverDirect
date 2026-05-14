export default function RawTraceViewer({ trace, visible }) {
  if (!visible) return null;
  return (
    <pre className="max-h-72 overflow-auto rounded-xl border border-hairline bg-panel p-3 font-mono text-xs text-body">
      {JSON.stringify(trace || {}, null, 2)}
    </pre>
  );
}
