# Current academic year automation

Operational screens no longer ask users to choose an academic year manually.

- The current school year follows an August -> July cycle.
- Sep 2026 => `2026-2027`; Jan 2027 => `2026-2027`; Aug 2027 => `2027-2028`.
- The academic-year row is created automatically if it does not exist yet.
- Student self-registration now asks only for **School -> Class**; only classes in the current school year are shown.
- Server-side registration validation rejects a class from another school year even if a request is manually modified.
- New teacher-created classes are automatically assigned to the current school year.
- Teacher reports still retain the year filter so historical school-year reports remain available, but the default is the current year.
