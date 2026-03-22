import Link from "next/link";
import { notFound } from "next/navigation";
import { getValidCheckinRequest } from "@/lib/checkin-link";
import { getCheckinStatsForParticipant } from "@/lib/checkin-stats-data";
import { Button } from "@/components/ui/button";
import { CheckinStatsChart } from "@/components/checkin-stats-chart";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckinStatsPage({ params }: PageProps) {
  const { token } = await params;
  const checkinRequest = await getValidCheckinRequest(token);
  if (!checkinRequest) {
    return notFound();
  }

  const stats = await getCheckinStatsForParticipant(checkinRequest.participantId);

  if (!stats) {
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

  const enc = encodeURIComponent(token);

  return (
    <main className="w-full space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90 sm:p-7">
        <div className="border-b border-zinc-100 pb-5">
          <p className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-zinc-400">
            Pop Check · Stats
          </p>
          <h1 className="mt-2 text-xl font-medium leading-snug tracking-tight text-zinc-800 sm:text-2xl">
            {stats.questionnaireTitle}
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
        rows={stats.rows}
        series={stats.series}
        scaleMin={stats.scaleMin}
        scaleMax={stats.scaleMax}
      />
    </main>
  );
}
