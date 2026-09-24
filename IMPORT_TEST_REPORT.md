# Import Word smoke test

Test source: `DE CUONG-GKI-K12- Quizzi.docx`

Results for the V8.1 parser/import shape:

- Questions parsed: 160
- Question groups: 40
- Questions with exactly 4 options: 160/160
- Answers detected from Word underline: 159/160
- Expected option records: 640
- SQLite schema write simulation: 160 questions / 640 options / 40 groups
- Builder-like read-back: 160 questions
- SQLite `PRAGMA integrity_check`: `ok`

V8.1 removes the artificial production database write gate. Import is available whenever the teacher is authorized and the uploaded file passes validation.
