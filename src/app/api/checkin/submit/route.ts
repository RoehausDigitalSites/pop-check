import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export const runtime = "edge";

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const token = formData.get("token");
  const note = formData.get("note");

  if (typeof token !== "string" || token.length < 20) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const checkinRequest = await db.checkinRequest.findUnique({
    where: { tokenHash },
    include: {
      participant: true,
    },
  });

  if (!checkinRequest || checkinRequest.usedAt || checkinRequest.expiresAt <= new Date()) {
    return NextResponse.json({ error: "This check-in link is not valid anymore." }, { status: 400 });
  }

  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });

  if (!questionnaire) {
    return NextResponse.json({ error: "No active questionnaire." }, { status: 400 });
  }

  const answers = questionnaire.questions.map((question) => {
    const rawValue = formData.get(`question_${question.id}`);
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value < questionnaire.scaleMin || value > questionnaire.scaleMax) {
      throw new Error(`Invalid answer for question ${question.id}`);
    }

    return { questionId: question.id, value };
  });

  try {
    await db.$transaction(async (tx) => {
      const checkin = await tx.checkin.create({
        data: {
          participantId: checkinRequest.participantId,
          questionnaireId: questionnaire.id,
          note: typeof note === "string" && note.trim() ? note.trim() : null,
        },
      });

      await tx.checkinAnswer.createMany({
        data: answers.map((answer) => ({
          checkinId: checkin.id,
          questionId: answer.questionId,
          value: answer.value,
        })),
      });

      await tx.checkinRequest.update({
        where: { id: checkinRequest.id },
        data: { usedAt: new Date() },
      });
    });
  } catch {
    return NextResponse.json({ error: "Please answer all questions before submitting." }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/checkin/success", request.url));
}
