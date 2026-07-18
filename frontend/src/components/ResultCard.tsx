import type { MCQResult } from "../types";

interface ResultCardProps {
  index: number;
  result: MCQResult;
}

export default function ResultCard({ index, result }: ResultCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Q.{index}) {result.topic}:
      </p>

      <p className="mb-4 whitespace-pre-wrap text-slate-800">{result.question}</p>

      <p className="mb-4 text-slate-700">
        Answer: <span className="font-bold text-emerald-700">{result.correct_answer}</span>
      </p>

      <p className="text-sm text-slate-500">Explanation:</p>
      <p className="text-slate-700">{result.explanation}</p>
    </div>
  );
}
