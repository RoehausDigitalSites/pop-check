export const runtime = "edge";

export default function CheckinSuccessPage() {
  return (
    <main className="w-full">
      <div className="rounded-3xl border border-white/80 bg-white/75 p-6 text-center shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90 sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-xl text-emerald-700 ring-1 ring-emerald-500/20">
          ✓
        </div>
        <h1 className="text-xl font-medium tracking-tight text-zinc-800 sm:text-2xl">
          Thank you
        </h1>
        <p className="mt-3 text-sm font-normal leading-relaxed text-zinc-500 sm:text-base">
          Your check-in was saved. You can close this page now.
        </p>
      </div>
    </main>
  );
}
