import type { MCQResult } from "../types";
import ResultCard from "./ResultCard";

interface ResultsListProps {
  results: MCQResult[];
  onDownload: () => void;
  downloading: boolean;
}

export default function ResultsList({ results, onDownload, downloading }: ResultsListProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Results</h2>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? "Preparing..." : "Download as Word"}
        </button>
      </div>

      {results.map((result, index) => (
        <ResultCard key={index} index={index + 1} result={result} />
      ))}
    </div>
  );
}
