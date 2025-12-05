export default function RacingDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-50">
      <div className="absolute -top-10 right-10 rotate-12 w-64 h-24 bg-[linear-gradient(45deg,#111_25%,#fff_25%,#fff_50%,#111_50%,#111_75%,#fff_75%,#fff_100%)] bg-[length:20px_20px] opacity-60" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-red-900/60 to-transparent" />
    </div>
  );
}
