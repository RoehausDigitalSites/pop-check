import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminOr401 } from "@/lib/admin";

export const runtime = "edge";

export async function GET(): Promise<NextResponse> {
  const authError = await requireAdminOr401();
  if (authError) {
    return authError;
  }

  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ questionnaire });
}

export async function POST(request: Request): Promise<NextResponse> {
  const authError = await requireAdminOr401();
  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "Daily Check-In").trim();
  const scaleMin = Number(formData.get("scaleMin") ?? "1");
  const scaleMax = Number(formData.get("scaleMax") ?? "5");
  const minLabel = String(formData.get("minLabel") ?? "Better").trim();
  const maxLabel = String(formData.get("maxLabel") ?? "Harder").trim();
  const scaleLabelsRaw = String(formData.get("scaleLabels") ?? "").trim();
  const scaleLabels: string[] = scaleLabelsRaw
    ? scaleLabelsRaw.split("\n").map((s) => s.trim()).filter((s) => s.length > 0)
    : [];
  const rawPrompts = String(formData.get("prompts") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rawPrompts.length === 0) {
    return NextResponse.redirect(new URL("/admin?error=no-questions", request.url));
  }

  const questionnaire = await db.questionnaire.findFirst({ where: { isActive: true } });
  if (!questionnaire) {
    return NextResponse.redirect(new URL("/admin?error=no-questionnaire", request.url));
  }

  const expectedLabelCount = scaleMax - scaleMin + 1;
  const scaleLabelsJson =
    scaleLabels.length === expectedLabelCount ? scaleLabels : null;

  await db.$transaction(async (tx) => {
    await tx.questionnaire.update({
      where: { id: questionnaire.id },
      data: {
        title,
        scaleMin,
        scaleMax,
        minLabel,
        maxLabel,
        scaleLabels: scaleLabelsJson ?? Prisma.DbNull,
      },
    });

    await tx.question.deleteMany({ where: { questionnaireId: questionnaire.id } });
    await tx.question.createMany({
      data: rawPrompts.map((prompt, index) => ({
        questionnaireId: questionnaire.id,
        prompt,
        position: index + 1,
        enabled: true,
      })),
    });
  });

  return NextResponse.redirect(new URL("/admin?saved=questions", request.url));
}
