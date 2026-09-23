import type { FitScore } from "@/lib/scoring";
import { Card } from "@/components/ui/primitives";

const tones = {
  green: { ring: "stroke-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  yellow: { ring: "stroke-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  red: { ring: "stroke-red-500", text: "text-red-700", bg: "bg-red-50" },
};

export function FitScoreCard({ fit, overspent, total, balance }: { fit: FitScore; overspent: number; total: number; balance: number | null }) {
  const t = tones[fit.tone];
  const c = 2 * Math.PI * 34;
  return (
    <Card className="flex items-center gap-5 p-5">
      <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`Budget fit score ${fit.score} out of 100`}>
        <circle cx="42" cy="42" r="34" className="stroke-slate-200" strokeWidth="8" fill="none" />
        <circle
          cx="42"
          cy="42"
          r="34"
          className={t.ring}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fit.score / 100)}
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="48" textAnchor="middle" className={`fill-current text-xl font-bold ${t.text}`}>
          {fit.score}
        </text>
      </svg>
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Budget fit score</p>
        <p className={`inline-block rounded px-2 py-0.5 text-sm font-semibold ${t.bg} ${t.text}`}>{fit.label}</p>
        <p className="text-xs text-slate-500">
          {overspent} of {total} categories over allocation
          {balance !== null && ` · allocation spread ±${balance.toFixed(0)}%`}
        </p>
      </div>
    </Card>
  );
}
