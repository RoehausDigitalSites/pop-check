import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getValidCheckinRequest } from "@/lib/checkin-link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  CheckinStatsChart,
  type StatsRow,
  type StatsSeries,
} from "./checkin-stats-chart";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckinStatsPage({ params }: PageProps) {
  const { token } = await params;
  const checkinRequest = await getValidCheckinRequest(token);
  if (!checkinRequest) {
    return notFound();
  }

  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
    include: {
      questions: { where: { enabled: true }, orderBy: { position: "asc" } },
    },
  });

  if (!questionnaire) {
    return (
      <main className="w-full">
        <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-6 text-center text-zinc-600 shadow-lg shadow-zinc-200/40 backdrop-blur-md">
          <p className="text-sm font-normal sm:text-base">
            No active questionnaire configured.
          </p>
        </div>
      </main>
    );
  }

  const checkins = await db.checkin.findMany({
    where: {
      participantId: checkinRequest.participantId,
      questionnaireId: questionnaire.id,
    },
    orderBy: { submittedAt: "asc" },
    take: 120,
    include: {
      answers: { include: { question: true } },
    },
  });

  const questions = questionnaire.questions;

  const series: StatsSeries[] = questions.map((q) => ({
    key: `q_${q.id}`,
    label:
      q.prompt.length > 36 ? `${q.prompt.slice(0, 34)}…` : q.prompt,
  }));

  const rows: StatsRow[] = checkins.map((c) => {
    const row: StatsRow = {
      label: format(c.submittedAt, "MMM d, h:mm a"),
      fullDate: format(c.submittedAt, "MMM d, yyyy · h:mm a"),
    };
    for (const q of questions) {
      const ans = c.answers.find((a) => a.questionId === q.id);
      row[`q_${q.id}`] = ans?.value ?? null;
    }
    return row;
  });

  const enc = encodeURIComponent(token);

  return (
    <main className="w-full space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90 sm:p-7">
        <div className="border-b border-zinc-100 pb-5">
          <p className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-zinc-400">
            Stats
          </p>
          <h1 className="mt-2 text-xl font-medium leading-snug tracking-tight text-zinc-800 sm:text-2xl">
            {questionnaire.title}
          </h1>
          <p className="mt-2 text-sm font-normal leading-relaxed text-zinc-500 sm:text-base">
            {checkinRequest.participant.name}, here’s how your recent check-ins look.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              asChild
              variant="outline"
              className="w-full border-zinc-200/90 bg-white/60 font-normal sm:w-auto"
              size="sm"
            >
              <Link href={`/checkin/${enc}`}>← Back to options</Link>
            </Button>
            <Button asChild className="w-full font-normal sm:w-auto" size="sm">
              <Link href={`/checkin/${enc}/form`}>Go to check-in</Link>
            </Button>
          </div>
        </div>
      </div>

      <CheckinStatsChart
        rows={rows}
        series={series}
        scaleMin={questionnaire.scaleMin}
        scaleMax={questionnaire.scaleMax}
      />
    </main>
  );
}
