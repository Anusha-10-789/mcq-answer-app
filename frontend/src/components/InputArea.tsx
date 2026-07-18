interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  topic: string;
  onTopicChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading: boolean;
}

export default function InputArea({
  value,
  onChange,
  topic,
  onTopicChange,
  onSubmit,
  onClear,
  loading,
}: InputAreaProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <label htmlFor="mcq-topic" className="mb-2 block text-sm font-medium text-slate-700">
        Topic name (optional)
      </label>
      <input
        id="mcq-topic"
        type="text"
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
        placeholder="e.g. Physics"
        className="mb-4 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />

      <label htmlFor="mcq-input" className="mb-2 block text-sm font-medium text-slate-700">
        Paste one or more multiple-choice questions (start each with Q.1), Q.2), etc.)
      </label>
      <textarea
        id="mcq-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          "Q.1) What is the capital of India?\n\nA. Mumbai\nB. New Delhi\nC. Chennai\nD. Kolkata\n\nQ.2) What is 2 + 2?\n\nA. 3\nB. 4\nC. 5\nD. 6"
        }
        rows={12}
        className="w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Getting Answer..." : "Get Answer"}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
