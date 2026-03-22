import type { Viewport } from "next";

export const runtime = "edge";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-linear-to-b from-slate-50 via-sky-50/50 to-violet-50/40">
      <div
        className="pointer-events-none fixed -left-24 top-0 h-96 w-96 rounded-full bg-sky-200/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(255,255,255,0.85),transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div
          className="w-full max-w-lg pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
