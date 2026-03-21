import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckinPage({ params }: PageProps) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  const checkinRequest = await db.checkinRequest.findUnique({
    where: { tokenHash },
    include: { participant: true },
  });

  if (!checkinRequest || checkinRequest.usedAt || checkinRequest.expiresAt <= new Date()) {
    return notFound();
  }

  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });

  if (!questionnaire) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
        <p>No active questionnaire configured.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{questionnaire.title}</h1>
        <p className="mt-2 text-sm text-zinc-700">Hi {checkinRequest.participant.name}, how are you today?</p>

        <form className="mt-6 space-y-6" action="/api/checkin/submit" method="post">
          <input type="hidden" name="token" value={token} />
          {questionnaire.questions.map((question) => (
            <fieldset key={question.id} className="space-y-3">
              <legend className="font-medium text-zinc-900">{question.prompt}</legend>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  { length: questionnaire.scaleMax - questionnaire.scaleMin + 1 },
                  (_, idx) => idx + questionnaire.scaleMin,
                ).map((value) => (
                  <label key={value} className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm">
                    <input
                      className="mr-1"
                      type="radio"
                      name={`question_${question.id}`}
                      value={value}
                      required
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <label className="block">
            <span className="text-sm font-medium text-zinc-900">Optional note</span>
            <textarea
              name="note"
              className="mt-2 min-h-24 w-full rounded-xl border border-zinc-300 px-3 py-2"
              placeholder="Anything important today?"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-800"
          >
            Submit check-in
          </button>
        </form>
      </div>
    </main>
  );
}
