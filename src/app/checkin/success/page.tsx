export default function CheckinSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Thank you</h1>
        <p className="mt-3 text-zinc-700">
          Your check-in was saved. You can close this page now.
        </p>
      </div>
    </main>
  );
}
