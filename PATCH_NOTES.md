# School workflow revision

## Account model
- Removed public student registration flow; `/register` redirects to login.
- Login is username + password only through Better Auth's username plugin.
- Email is an internal compatibility value only (`username@local.invalid`) and is never collected from users.
- Admin provisions teacher accounts; teachers provision student accounts.
- Admin can reset teacher passwords; teachers can reset passwords for students in their classes.

## School and academic year
- Admin manages schools and academic years.
- Teacher profile belongs to a school.
- Every new class is tied to the teacher's school and an active academic year.
- Student membership is restricted to the same school at server-action level.

## Exams and practice tracking
- Added `ExamMode`: `TEST` and `PRACTICE`.
- TEST obeys `attemptsAllowed`.
- PRACTICE can be repeated without limit; every attempt remains an `ExamAttempt` with an increasing attempt number.
- Student pages display practice history and allow immediate repeated practice.

## Reports
- Added teacher Reports navigation/page.
- Filter by academic year, class, and student.
- Summary includes test average, practice count, best practice result, and first-to-latest practice improvement.
- Excel export includes `Tong hop`, `Kiem tra`, and `Luyen tap` sheets.

## Demo data
- Bundled SQLite data is migrated to usernames and academic year `2026-2027`.
- Demo school/classes are normalized to `THCS Nguyen Trai`.
- Added a practice assignment with three historical attempts for `minhanh` to demonstrate progress reporting.
- Demo password for all bundled accounts: `ChangeMe123!`.
