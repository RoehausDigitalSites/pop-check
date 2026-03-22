import { notFound } from "next/navigation";
import Link from "next/link";
import { getValidCheckinRequest } from "@/lib/checkin-link";
import { db } from "@/lib/db";
import { CheckinForm } from "../checkin-form";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckinFormPage({ params }: PageProps) {
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

  const enc = encodeURIComponent(token);

  return (
    <main className="w-full">
      <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90 sm:p-7">
        <div className="border-b border-zinc-100 pb-5">
          <p className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-zinc-400">
            Pop Check · Check-in
          </p>
          <h1 className="mt-2 text-xl font-medium leading-snug tracking-tight text-zinc-800 sm:text-2xl">
            {questionnaire.title}
          </h1>
          <p className="mt-2 text-sm font-normal leading-relaxed text-zinc-500 sm:text-base">
            Hi {checkinRequest.participant.name}, how are you today?
          </p>
          <p className="mt-3">
            <Link
              href={`/checkin/${enc}`}
              className="text-sm font-normal text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700"
            >
              ← Back to options
            </Link>
          </p>
        </div>

        <CheckinForm
          token={token}
          questionnaire={{
            title: questionnaire.title,
            scaleMin: questionnaire.scaleMin,
            scaleMax: questionnaire.scaleMax,
            scaleLabels: Array.isArray(questionnaire.scaleLabels)
              ? (questionnaire.scaleLabels as string[])
              : null,
            questions: questionnaire.questions,
          }}
        />
      </div>
    </main>
  );
}
