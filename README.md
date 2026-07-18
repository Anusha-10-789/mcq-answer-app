# AI MCQ Answer & Explanation Application

A web application that reads one or more multiple-choice questions (MCQs), uses Google's Gemini AI to identify the correct answer and generate a short explanation, and lets you export everything as a downloadable Word (`.docx`) report.

## Features

- Paste one or many MCQs into a single input box.
- Get the correct option and a short (2-4 sentence) plain-English explanation for each question.
- Explanations never use bullet points or bold/markdown formatting.
- Download all questions, answers, and explanations as a formatted Word document.
- Loading indicator while answers are generated.
- Clear error message if you submit with no input.
- "Clear All" button to reset the form.
- Responsive UI built with Tailwind CSS.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (built with Vite)
- **Backend:** Python FastAPI
- **AI:** Google Gemini (default `gemini-3.1-flash-lite`) via the official `google-genai` Python package, using JSON-formatted responses for reliable parsing.
- **Word Export:** `python-docx`

## Folder Structure

```
mcq-answer-app/
│
├── backend/
│   ├── main.py            # FastAPI app + /answer and /download endpoints
│   ├── gemini_service.py   # Calls the Gemini API to get answers/explanations
│   ├── prompt.py           # Shared system prompt + topic-resolution logic
│   ├── text_cleanup.py     # Strips duplicate option-letter lines from pasted questions
│   ├── word_export.py      # Builds the .docx report with python-docx
│   ├── models.py           # Pydantic request/response models
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/     # InputArea, ResultCard, ResultsList, etc.
│   │   ├── utils/
│   │   │   └── splitQuestions.ts  # Splits pasted text into individual MCQs
│   │   ├── App.tsx
│   │   ├── api.ts          # fetch() calls to the backend
│   │   ├── types.ts
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- A Google Gemini API key

### Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Create an API key (Gemini has a free tier with rate limits — no credit card required to get started).
3. Add it to `backend/.env` as `GEMINI_API_KEY=...` (see Backend setup below).

## Installation & Setup

### 1. Backend (FastAPI)

```bash
cd mcq-answer-app/backend

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your local config
copy .env.example .env      # Windows
# cp .env.example .env       # macOS/Linux
```

`.env` sets the frontend's origin for CORS and your Gemini API key:

```
CORS_ORIGINS=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

The API is now available at `http://localhost:8000` (interactive docs at `http://localhost:8000/docs`).

### 2. Frontend (React + Vite)

In a new terminal:

```bash
cd mcq-answer-app/frontend

npm install

copy .env.example .env      # Windows
# cp .env.example .env       # macOS/Linux
```

The default `.env` already points at `http://localhost:8000`, which matches the backend above.

Run the frontend:

```bash
npm run dev
```

Open the printed URL (typically `http://localhost:5173`) in your browser.

## Usage

1. Paste one or more MCQs into the text area, starting each with `Q.1)`, `Q.2)`, ..., `Q.n)`:

   ```
   Q.1) What is the capital of India?

   A. Mumbai
   B. New Delhi
   C. Chennai
   D. Kolkata

   Q.2) What is 2 + 2?

   A. 3
   B. 4
   C. 5
   D. 6
   ```

   Older formats ("Question:", `Q1:`, or plain `1.`) still work too. Each question gets its own answer and explanation, labeled `Q.1`, `Q.2`, ... in the results — the `Q.n)` marker itself is stripped and never shown in the output.

2. Optionally type a **Topic name** (e.g. "Physics"). If set, it's used as-is for every question's topic label instead of letting the AI classify it.
3. Click **Get Answer**. A loading indicator appears while the app asks Gemini.
4. Each question's correct answer and explanation appear as a card below the input.
5. Click **Download as Word** to save all results as `MCQ_Answer_Report.docx`.
6. Click **Clear All** to reset the input and results.

## API Reference

### `POST /answer`

Request:

```json
{
  "questions": ["Q.1) What is the capital of India?\n\nA. Mumbai\nB. New Delhi\nC. Chennai\nD. Kolkata"],
  "topic": null
}
```

`topic` is optional (omit or set `null` to let the AI classify each question's topic).

Response:

```json
{
  "results": [
    {
      "question": "What is the capital of India?\n\nA. Mumbai\nB. New Delhi\nC. Chennai\nD. Kolkata",
      "topic": "General Knowledge",
      "correct_answer": "B",
      "explanation": "New Delhi is the capital city of India and is the seat of the central government. It is located within the National Capital Territory of Delhi."
    }
  ]
}
```

`correct_answer` is always just the single capital letter of the correct option (A, B, C, D, ...), counted in order regardless of how the original question labeled its options.

### `POST /download`

Request:

```json
{
  "results": [
    {
      "question": "...",
      "topic": "...",
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}
```

Returns a downloadable `.docx` file (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).

## Troubleshooting

- **CORS errors in the browser console:** Make sure `CORS_ORIGINS` in `backend/.env` includes the exact origin your frontend runs on (default `http://localhost:5173`), then restart the backend.
- **"GEMINI_API_KEY is not set" (400 error):** Add `GEMINI_API_KEY=...` to `backend/.env` and restart the backend.
- **400 "Gemini API rejected the request":** Usually an invalid or expired API key — check the value in `backend/.env` (no quotes, no extra spaces) at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
- **502 Gemini server/API error:** Gemini's API had a transient issue — wait a moment and try again.
- **Empty input error:** The app requires at least one non-empty question before calling "Get Answer".
- **Answers seem low quality or inconsistent:** Try a stronger model (e.g. `gemini-3.1-pro-preview`) by updating `MODEL_ID` in `backend/gemini_service.py`, then restart the backend.
- **404 "model is no longer available to new users":** Google periodically retires model IDs for new API keys. Run the model list script below to find a currently available model and update `MODEL_ID` in `backend/gemini_service.py`:

  ```bash
  python -c "from google import genai; import os; from dotenv import load_dotenv; load_dotenv(); c = genai.Client(api_key=os.environ['GEMINI_API_KEY']); [print(m.name) for m in c.models.list()]"
  ```
