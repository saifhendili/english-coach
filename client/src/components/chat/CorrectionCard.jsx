import { CheckCircle2, PencilLine } from 'lucide-react';
import { segments } from '../../lib/markup';
import { MISTAKE_LABEL } from '../../lib/mistakes';


function Marked({ text, fragments, hitClass }) {
  return segments(text, fragments).map((s, i) =>
    s.hit ? (
      <mark key={i} className={`rounded px-0.5 ${hitClass}`}>
        {s.text}
      </mark>
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );
}

// What the coach found in the learner's message: the sentence with the mistakes struck out,
// the corrected sentence, and one short explanation per mistake.
export default function CorrectionCard({ original, correction }) {
  if (!correction.hasMistakes) {
    return (
      <p className="mt-1.5 flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" aria-hidden="true" /> No mistakes
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-sm dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        <PencilLine className="size-3.5" aria-hidden="true" /> Corrections
      </p>

      <p className="leading-relaxed text-slate-500 dark:text-slate-400">
        <Marked
          text={original}
          fragments={correction.items.map((i) => i.wrong)}
          hitClass="bg-rose-100 text-rose-700 line-through decoration-2 dark:bg-rose-500/20 dark:text-rose-300"
        />
      </p>
      <p className="mt-1.5 font-medium leading-relaxed text-slate-800 dark:text-slate-100">
        <Marked
          text={correction.corrected}
          fragments={correction.items.map((i) => i.right)}
          hitClass="bg-emerald-100 font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
        />
      </p>

      <ul className="mt-3 space-y-2 border-t border-amber-200/70 pt-3 dark:border-amber-500/20">
        {correction.items.map((item) => (
          <li key={item.wrong + item.right} className="leading-snug">
            <span className="mr-2 inline-flex flex-wrap items-center gap-1.5 font-semibold">
              <span className="text-rose-600 line-through dark:text-rose-300">{item.wrong}</span>
              <span aria-hidden="true">→</span>
              <span className="sr-only">corrected to</span>
              <span className="text-emerald-700 dark:text-emerald-300">{item.right}</span>
            </span>
            <span className="chip !px-2 !py-0.5 !text-[11px]">{MISTAKE_LABEL[item.type] ?? item.type}</span>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">{item.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
