# Import V8.1 - Word import focused fix

- Removed the artificial persistent-database/Turso import gate.
- Import is always available when the teacher is authorized and the file is valid.
- Quizzi parser keeps support for Word groups, Question N labels, (<n>) labels, A-D options, and underlined answers.
- AI remains optional and failures do not abort deterministic Word import.
- The builder shows a normal not-found state instead of infrastructure advice.
