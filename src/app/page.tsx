import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 px-6 py-10">
      <h1 className="text-3xl font-semibold text-zinc-900">Pop Check</h1>
      <p className="text-zinc-700">
        Daily SMS check-ins with your dad — quick ratings, saved history, and a
        simple stats view.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-zinc-700">
        <li>Admin setup: configure questions and daily reminder time.</li>
        <li>Participant flow: open SMS link, pick ratings, submit.</li>
        <li>Anytime flow: use the manual link from admin panel.</li>
      </ul>
      <div className="pt-2">
        <Link className="text-blue-700 underline" href="/admin">
          Open admin dashboard
        </Link>
      </div>
    </main>
  );
}
