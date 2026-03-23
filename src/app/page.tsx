import Link from "next/link";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramToString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const authenticated = await isAdminAuthenticated();
  const error = paramToString(params.error);
  const saved = paramToString(params.saved);
  const manualUrl = paramToString(params.manualUrl);
  const sentNow = paramToString(params.sentNow);

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-10">
        <form
          action="/api/admin/login"
          method="post"
          className="space-y-4 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg shadow-zinc-300/30 backdrop-blur-xl ring-1 ring-zinc-100/90"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Pop Check</h1>
          <p className="text-sm text-zinc-600">
            Enter your passphrase to open your dashboard.
          </p>
          <input
            type="password"
            name="passphrase"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            placeholder="Admin passphrase"
            required
          />
          {error === "invalid" && <p className="text-sm text-red-600">Wrong passphrase.</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </main>
    );
  }

  const participant = await db.participant.findFirst({
    where: { active: true },
    include: { scheduleSetting: true },
  });
  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
    include: {
      questions: { where: { enabled: true }, orderBy: { position: "asc" } },
    },
  });
  const latestCheckins = await db.checkin.findMany({
    orderBy: { submittedAt: "desc" },
    take: 10,
    include: {
      answers: { include: { question: true } },
      participant: true,
    },
  });
  const totalCheckins = await db.checkin.count();

  if (!participant || !questionnaire) {
    return <main className="p-6">Run the seed script first: `npm run db:seed`.</main>;
  }

  const activeQuestionCount = questionnaire.questions.length;
  const latestSubmittedAt = latestCheckins[0]?.submittedAt;
  const schedule = participant.scheduleSetting;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90">
        <p className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-zinc-400">
          Pop Check · Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Admin home</h1>
        <p className="mt-1 text-zinc-700">
          Manage prompts, reminders, and quick-send check-in links.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/admin/stats" className="text-blue-700 underline">
            Open trends chart
          </Link>
        </p>
      </header>

      {(error || saved || manualUrl || sentNow) && (
        <div className="space-y-2">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error === "no-questions"
                ? "Please add at least one question."
                : error === "no-questionnaire"
                  ? "No active questionnaire found."
                  : error === "participant"
                    ? "No active participant selected."
                    : "Something went wrong."}
            </p>
          )}
          {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved: {saved}</p>}
          {sentNow && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Text sent with a fresh check-in link.
            </p>
          )}
          {manualUrl && (
            <p className="break-all rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Manual link: {manualUrl}
            </p>
          )}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Participant</p>
          <p className="mt-1 text-lg font-medium text-zinc-900">{participant.name}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Active prompts</p>
          <p className="mt-1 text-lg font-medium text-zinc-900">{activeQuestionCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total check-ins</p>
          <p className="mt-1 text-lg font-medium text-zinc-900">{totalCheckins}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Last check-in</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">
            {latestSubmittedAt ? new Date(latestSubmittedAt).toLocaleString() : "No check-ins yet"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <form action="/api/admin/send-now" method="post">
              <input type="hidden" name="participantId" value={participant.id} />
              <Button type="submit" className="w-full">Send check-in text now</Button>
            </form>
            <form action="/api/admin/manual-link" method="post">
              <input type="hidden" name="participantId" value={participant.id} />
              <Button type="submit" variant="outline" className="w-full">
                Generate persistent manual link
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Current: {schedule?.dailyTimeLocal ?? "18:00"} ({schedule?.timezone ?? participant.timezone})
          </p>
          <form action="/api/admin/schedule" method="post" className="mt-4 space-y-4">
            <input type="hidden" name="participantId" value={participant.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium">Daily time</span>
                <input
                  type="time"
                  name="dailyTimeLocal"
                  defaultValue={schedule?.dailyTimeLocal ?? "18:00"}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Timezone</span>
                <input
                  name="timezone"
                  defaultValue={schedule?.timezone ?? participant.timezone}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="reminderEnabled" defaultChecked={schedule?.reminderEnabled ?? true} />
              Send daily reminder SMS
            </label>
            <Button type="submit">Save schedule</Button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Questionnaire</h2>
        <form action="/api/admin/questions" method="post" className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input
              name="title"
              defaultValue={questionnaire.title}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Scale min</span>
              <input
                type="number"
                name="scaleMin"
                defaultValue={questionnaire.scaleMin}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Scale max</span>
              <input
                type="number"
                name="scaleMax"
                defaultValue={questionnaire.scaleMax}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium">
              Scale labels (one per value from {questionnaire.scaleMin} to {questionnaire.scaleMax})
            </span>
            <textarea
              name="scaleLabels"
              defaultValue={(() => {
                const labels = (questionnaire as { scaleLabels?: unknown }).scaleLabels;
                if (Array.isArray(labels)) return labels.join("\n");
                if (questionnaire.minLabel && questionnaire.maxLabel) {
                  const middle = questionnaire.scaleMax - questionnaire.scaleMin - 1;
                  return [questionnaire.minLabel, ...Array.from({ length: middle }, () => ""), questionnaire.maxLabel].join("\n");
                }
                return "";
              })()}
              rows={questionnaire.scaleMax - questionnaire.scaleMin + 1}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Questions (one per line)</span>
            <textarea
              name="prompts"
              defaultValue={questionnaire.questions.map((q) => q.prompt).join("\n")}
              className="mt-1 min-h-40 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>
          <Button type="submit">Save questionnaire</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Latest check-ins</h2>
        <div className="mt-4 space-y-3">
          {latestCheckins.length === 0 ? (
            <p className="text-sm text-zinc-700">No check-ins yet.</p>
          ) : (
            latestCheckins.map((checkin) => (
              <article key={checkin.id} className="rounded-xl border border-zinc-200 p-3">
                <p className="text-sm font-medium text-zinc-900">
                  {checkin.participant.name} - {new Date(checkin.submittedAt).toLocaleString()}
                </p>
                <ul className="mt-2 text-sm text-zinc-700">
                  {checkin.answers.map((answer) => (
                    <li key={answer.id}>
                      {answer.question.prompt}: <strong>{answer.value}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
