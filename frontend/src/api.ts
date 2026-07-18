import { getStoredPassword } from "./auth";
import type { MCQResult } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class UnauthorizedError extends Error {}

function authHeaders(): Record<string, string> {
  const password = getStoredPassword();
  return password ? { "X-App-Password": password } : {};
}

export async function fetchAnswers(questions: string[], topic?: string): Promise<MCQResult[]> {
  const response = await fetch(`${API_BASE_URL}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ questions, topic: topic?.trim() || null }),
  });

  if (response.status === 401) {
    throw new UnauthorizedError("Incorrect app password.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Failed to get answers.");
  }

  const data = await response.json();
  return data.results as MCQResult[];
}

export async function downloadResultsDocx(results: MCQResult[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ results }),
  });

  if (response.status === 401) {
    throw new UnauthorizedError("Incorrect app password.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Failed to generate the document.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "MCQ_Answer_Report.docx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
