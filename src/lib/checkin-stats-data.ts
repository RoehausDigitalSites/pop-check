import { format } from "date-fns";
import { db } from "@/lib/db";
import type { StatsRow, StatsSeries } from "@/lib/checkin-stats-types";

export type CheckinStatsPayload = {
  questionnaireTitle: string;
  participantName: string;
  rows: StatsRow[];
  series: StatsSeries[];
  scaleMin: number;
  scaleMax: number;
};

/** Load chart series + rows for the active questionnaire and a participant. */
export async function getCheckinStatsForParticipant(
  participantId: string,
): Promise<CheckinStatsPayload | null> {
  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
    include: {
      questions: { where: { enabled: true }, orderBy: { position: "asc" } },
    },
  });

  if (!questionnaire) {
    return null;
  }

  const participant = await db.participant.findUnique({
    where: { id: participantId },
  });

  const checkins = await db.checkin.findMany({
    where: {
      participantId,
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
    label: q.prompt.length > 36 ? `${q.prompt.slice(0, 34)}…` : q.prompt,
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

  return {
    questionnaireTitle: questionnaire.title,
    participantName: participant?.name ?? "Participant",
    rows,
    series,
    scaleMin: questionnaire.scaleMin,
    scaleMax: questionnaire.scaleMax,
  };
}
