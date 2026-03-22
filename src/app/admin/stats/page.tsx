import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCheckinStatsForParticipant } from "@/lib/checkin-stats-data";
import { CheckinStatsChart } from "@/components/checkin-stats-chart";

export const runtime = "edge";

export default async function AdminStatsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin");
  }

  const participant = await db.participant.findFirst({
    where: { active: true },
  });

  if (!participant) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-zinc-700">No active participant. Run the seed script first.</p>
        <Link href="/admin" className="mt-4 inline-block text-blue-700 underline">
          ← Back to admin
        </Link>
      </main>
    );
  }

  const stats = await getCheckinStatsForParticipant(participant.id);

  if (!stats) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-zinc-700">No active questionnaire configured.</p>
        <Link href="/admin" className="mt-4 inline-block text-blue-700 underline">
          ← Back to admin
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
      <header>
        <p className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-zinc-400">
          Pop Check · Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Response chart</h1>
        <p className="mt-1 text-zinc-700">
          {stats.questionnaireTitle} — <span className="font-medium">{stats.participantName}</span>
        </p>
        <p className="mt-3 text-sm">
          <Link href="/admin" className="text-blue-700 underline">
            ← Back to admin
          </Link>
        </p>
      </header>

      <CheckinStatsChart
        rows={stats.rows}
        series={stats.series}
        scaleMin={stats.scaleMin}
        scaleMax={stats.scaleMax}
        title="Responses over time"
        description="One line per question. Higher values are toward the top of the scale."
        emptyDescription="No check-ins yet for this questionnaire."
      />
    </main>
  );
}
