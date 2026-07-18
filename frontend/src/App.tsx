import { useState } from "react";
import InputArea from "./components/InputArea";
import PasswordGate from "./components/PasswordGate";
import ResultsList from "./components/ResultsList";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import { clearStoredPassword } from "./auth";
import { downloadResultsDocx, fetchAnswers, UnauthorizedError } from "./api";
import { splitQuestions } from "./utils/splitQuestions";
import type { MCQResult } from "./types";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<MCQResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  async function handleGetAnswer() {
    setError("");

    const questions = splitQuestions(inputText);
    if (questions.length === 0) {
      setError("Please enter at least one question before submitting.");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const data = await fetchAnswers(questions, topic);
      setResults(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearStoredPassword();
        setNeedsPassword(true);
        setError("Incorrect password. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClearAll() {
    setInputText("");
    setTopic("");
    setResults([]);
    setError("");
  }

  async function handleDownload() {
    setError("");
    setDownloading(true);
    try {
      await downloadResultsDocx(results);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearStoredPassword();
        setNeedsPassword(true);
        setError("Incorrect password. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to download the document.");
      }
    } finally {
      setDownloading(false);
    }
  }

  if (needsPassword) {
    return <PasswordGate onUnlock={() => setNeedsPassword(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            AI MCQ Answer & Explanation
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Paste one or more multiple-choice questions to get the correct answer and a short
            explanation.
          </p>
        </header>

        <div className="space-y-6">
          <InputArea
            value={inputText}
            onChange={setInputText}
            topic={topic}
            onTopicChange={setTopic}
            onSubmit={handleGetAnswer}
            onClear={handleClearAll}
            loading={loading}
          />

          {error && <ErrorMessage message={error} />}
          {loading && <LoadingSpinner />}

          <ResultsList results={results} onDownload={handleDownload} downloading={downloading} />
        </div>
      </div>
    </div>
  );
}
