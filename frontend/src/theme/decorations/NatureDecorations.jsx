export default function NatureDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-60">
      <div className="absolute -left-10 top-10 w-40 h-40 bg-emerald-200/50 blur-3xl rounded-full" />
      <div className="absolute right-0 top-20 w-32 h-32 bg-green-300/40 blur-2xl rounded-full" />
    </div>
  );
}
