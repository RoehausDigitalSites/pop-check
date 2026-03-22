import Link from 'next/link';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export const runtime = 'edge';

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramToString(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const authenticated = await isAdminAuthenticated();
  const error = paramToString(params.error);
  const saved = paramToString(params.saved);
  const manualUrl = paramToString(params.manualUrl);

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-10">
        <form
          action="/api/admin/login"
          method="post"
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-xl font-semibold text-zinc-900">Pop Check — Admin</h1>
          <p className="text-sm text-zinc-700">
            Use your admin passphrase to manage questions and schedule.
          </p>
          <input
            type="password"
            name="passphrase"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            placeholder="Admin passphrase"
            required
          />
          {error === 'invalid' && (
            <p className="text-sm text-red-600">Wrong passphrase.</p>
          )}
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
      questions: { where: { enabled: true }, orderBy: { position: 'asc' } },
    },
  });
  const latestCheckins = await db.checkin.findMany({
    orderBy: { submittedAt: 'desc' },
    take: 10,
    include: {
      answers: { include: { question: true } },
      participant: true,
    },
  });

  if (!participant || !questionnaire) {
    return (
      <main className="p-6">Run the seed script first: `npm run db:seed`.</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Pop Check</h1>
        <p className="mt-1 text-zinc-700">
          Manage daily prompts, schedule, and manual access.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/admin/stats" className="text-blue-700 underline">
            Stats chart
          </Link>
          {' · '}
          Participant check-in page:{' '}
          <Link href="/" className="text-blue-700 underline">
            home
          </Link>
        </p>
      </header>

      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved: {saved}
        </p>
      )}
      {manualUrl && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 break-all">
          Manual link: {manualUrl}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Questionnaire</h2>
        <form
          action="/api/admin/questions"
          method="post"
          className="mt-4 space-y-4"
        >
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
              <span className="text-sm font-medium">Scale Min</span>
              <input
                type="number"
                name="scaleMin"
                defaultValue={questionnaire.scaleMin}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Scale Max</span>
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
              Scale labels (one per value, from {questionnaire.scaleMin} to{' '}
              {questionnaire.scaleMax})
            </span>
            <textarea
              name="scaleLabels"
              placeholder={`e.g. for 1–5:\nEasiest\nEasy\nOkay\nHard\nHardest`}
              defaultValue={(() => {
                const labels = (questionnaire as { scaleLabels?: unknown }).scaleLabels;
                if (Array.isArray(labels)) return labels.join('\n');
                if (questionnaire.minLabel && questionnaire.maxLabel) {
                  const middle = questionnaire.scaleMax - questionnaire.scaleMin - 1;
                  return [
                    questionnaire.minLabel,
                    ...Array.from({ length: middle }, () => ''),
                    questionnaire.maxLabel,
                  ].join('\n');
                }
                return '';
              })()}
              rows={
                questionnaire.scaleMax - questionnaire.scaleMin + 1
              }
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Line 1 = label for {questionnaire.scaleMin}, last line = label for{' '}
              {questionnaire.scaleMax}. Must have exactly{' '}
              {questionnaire.scaleMax - questionnaire.scaleMin + 1} lines to save.
            </p>
          </label>
          <label className="block">
            <span className="text-sm font-medium">
              Questions (one per line)
            </span>
            <textarea
              name="prompts"
              defaultValue={questionnaire.questions
                .map((q) => q.prompt)
                .join('\n')}
              className="mt-1 min-h-40 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>
          <Button type="submit">Save questionnaire</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Schedule</h2>
        <form
          action="/api/admin/schedule"
          method="post"
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="participantId" value={participant.id} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Daily Time (24h)</span>
              <input
                type="time"
                name="dailyTimeLocal"
                defaultValue={
                  participant.scheduleSetting?.dailyTimeLocal ?? '18:00'
                }
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Timezone</span>
              <input
                name="timezone"
                defaultValue={
                  participant.scheduleSetting?.timezone ?? participant.timezone
                }
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="reminderEnabled"
              defaultChecked={
                participant.scheduleSetting?.reminderEnabled ?? true
              }
            />
            Send daily reminder SMS
          </label>
          <Button type="submit">Save schedule</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Anytime Check-In Link</h2>
        <p className="mt-1 text-sm text-zinc-700">
          This creates a persistent URL your dad can bookmark. Opening it
          generates a fresh one-time check-in link.
        </p>
        <form action="/api/admin/manual-link" method="post" className="mt-4">
          <input type="hidden" name="participantId" value={participant.id} />
          <Button type="submit">Generate manual link</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Latest Check-Ins</h2>
        <div className="mt-4 space-y-3">
          {latestCheckins.length === 0 ? (
            <p className="text-sm text-zinc-700">No check-ins yet.</p>
          ) : (
            latestCheckins.map((checkin) => (
              <article
                key={checkin.id}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <p className="text-sm font-medium text-zinc-900">
                  {checkin.participant.name} -{' '}
                  {new Date(checkin.submittedAt).toLocaleString()}
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
