'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

type Question = {
  id: string;
  prompt: string;
};

type CheckinFormProps = {
  token: string;
  questionnaire: {
    title: string;
    scaleMin: number;
    scaleMax: number;
    scaleLabels: string[] | null;
    questions: Question[];
  };
};

export function CheckinForm({ token, questionnaire }: CheckinFormProps) {
  const { scaleMin, scaleMax, scaleLabels, questions } = questionnaire;

  function getLabel(val: number): string {
    if (!scaleLabels || scaleLabels.length === 0) return String(val);
    const idx = val - scaleMin;
    const label = scaleLabels[idx]?.trim();
    return label ? `${val} – ${label}` : String(val);
  }

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, scaleMin])),
  );

  return (
    <form
      className="mt-6 space-y-6 sm:mt-8 sm:space-y-7"
      action="/api/checkin/submit"
      method="post"
    >
      <input type="hidden" name="token" value={token} />
      {questions.map((question) => {
        const val = values[question.id] ?? scaleMin;
        return (
          <fieldset
            key={question.id}
            className="space-y-4 rounded-2xl border border-zinc-100 bg-white/70 p-4 shadow-sm shadow-zinc-200/40 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <legend className="min-w-0 flex-1 text-base font-normal leading-snug text-zinc-700 sm:text-[1.05rem]">
                {question.prompt}
              </legend>
              <span className="max-w-[45%] shrink-0 text-right text-sm font-normal tabular-nums leading-tight text-zinc-500 sm:text-base">
                {getLabel(val)}
              </span>
            </div>
            <input type="hidden" name={`question_${question.id}`} value={val} />
            <div className="space-y-3">
              {/* Extra vertical padding gives a larger touch target area on phones */}
              <div className="flex min-h-12 items-center py-1">
                <Slider
                  min={scaleMin}
                  max={scaleMax}
                  step={1}
                  value={[val]}
                  onValueChange={([v]) =>
                    setValues((prev) => ({ ...prev, [question.id]: v }))
                  }
                  className="w-full flex-1 touch-manipulation"
                />
              </div>
              {scaleLabels && scaleLabels.length > 0 && (
                <div className="flex justify-between gap-3 px-0.5 text-xs font-normal leading-tight text-zinc-400 sm:text-sm">
                  <span className="max-w-[42%] text-left">{scaleLabels[0]}</span>
                  <span className="max-w-[42%] text-right">
                    {scaleLabels[scaleLabels.length - 1]}
                  </span>
                </div>
              )}
            </div>
          </fieldset>
        );
      })}

      <label className="block">
        <span className="text-sm font-normal text-zinc-600 sm:text-base">
          Optional note
        </span>
        <textarea
          name="note"
          rows={4}
          inputMode="text"
          autoComplete="off"
          className="mt-2 min-h-26 w-full resize-y rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 text-base font-normal text-zinc-800 shadow-inner placeholder:font-normal placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-200/80 sm:min-h-28"
          placeholder="Anything important today?"
        />
      </label>

      <Button
        type="submit"
        className="h-12 w-full touch-manipulation text-base font-normal sm:h-11"
        size="lg"
      >
        Submit check-in
      </Button>
    </form>
  );
}
