import Link from "next/link";
import { notFound } from "next/navigation";
import { getValidCheckinRequest } from "@/lib/checkin-link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckinLandingPage({ params }: PageProps) {
  const { token } = await params;
  const checkinRequest = await getValidCheckinRequest(token);
  if (!checkinRequest) {
    return notFound();
  }

  const questionnaire = await db.questionnaire.findFirst({
    where: { isActive: true },
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
      <div className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90 sm:p-8">
        <div className="border-b border-zinc-100 pb-6">
          <p className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-zinc-400">
            Pop Check
          </p>
          <h1 className="mt-2 text-xl font-medium leading-snug tracking-tight text-zinc-800 sm:text-2xl">
            {questionnaire.title}
          </h1>
          <p className="mt-2 text-sm font-normal leading-relaxed text-zinc-500 sm:text-base">
            Hi {checkinRequest.participant.name}, what would you like to do?
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:mt-8">
          <Button asChild className="h-12 w-full touch-manipulation text-base font-normal sm:h-11" size="lg">
            <Link href={`/checkin/${enc}/form`}>Daily check-in</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full touch-manipulation border-zinc-200/90 bg-white/60 text-base font-normal text-zinc-800 shadow-sm backdrop-blur-sm hover:bg-white/90 sm:h-11"
            size="lg"
          >
            <Link href={`/checkin/${enc}/stats`}>View my stats</Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-xs font-normal leading-relaxed text-zinc-400">
          After you submit a check-in, this link stops working. You can view stats anytime before then.
        </p>
      </div>
    </main>
  );
}
