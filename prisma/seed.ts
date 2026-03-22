import { PrismaClient } from "@prisma/client";
import { createManualAccessToken } from "../src/lib/tokens";

const prisma = new PrismaClient();

async function main() {
  const participant = await prisma.participant.upsert({
    where: { phone: "+15555550100" },
    update: { name: "Dad", timezone: "America/Los_Angeles", active: true },
    create: {
      name: "Dad",
      phone: "+15555550100",
      timezone: "America/Los_Angeles",
      active: true,
    },
  });

  await prisma.scheduleSetting.upsert({
    where: { participantId: participant.id },
    update: {
      dailyTimeLocal: "18:00",
      timezone: "America/Los_Angeles",
      reminderEnabled: true,
    },
    create: {
      participantId: participant.id,
      dailyTimeLocal: "18:00",
      timezone: "America/Los_Angeles",
      reminderEnabled: true,
    },
  });

  const questionnaire = await prisma.questionnaire.upsert({
    where: { id: "default-questionnaire" },
    update: {
      title: "Daily Emotional Check-In",
      isActive: true,
      scaleMin: 1,
      scaleMax: 5,
      minLabel: "Better",
      maxLabel: "Harder",
      scaleLabels: ["Easiest", "Easy", "Okay", "Hard", "Hardest"],
    },
    create: {
      id: "default-questionnaire",
      title: "Daily Emotional Check-In",
      isActive: true,
      scaleMin: 1,
      scaleMax: 5,
      minLabel: "Better",
      maxLabel: "Harder",
      scaleLabels: ["Easiest", "Easy", "Okay", "Hard", "Hardest"],
    },
  });

  await prisma.question.deleteMany({ where: { questionnaireId: questionnaire.id } });
  await prisma.question.createMany({
    data: [
      "Involuntary facial movement severity today",
      "Overall mood today",
      "Stress level today",
      "Sleep quality last night",
    ].map((prompt, index) => ({
      questionnaireId: questionnaire.id,
      prompt,
      position: index + 1,
      enabled: true,
    })),
  });

  const { tokenHash } = createManualAccessToken();
  await prisma.participant.update({
    where: { id: participant.id },
    data: { manualAccessTokenHash: tokenHash },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
