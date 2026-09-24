# Student self-registration with school/class selection

Registration now follows this flow:

1. Student enters full name, username and password.
2. Student selects an active school.
3. Student selects an active academic year available at that school.
4. Student selects an active, non-archived class.
5. The server validates that school + academic year + class still match.
6. The account, student profile and class membership are created together.

Public registration never accepts email. Better Auth's required email value remains an internal generated value (`username@local.invalid`).

Only active schools, active academic years and non-archived classes are shown. Admin CRUD for all accounts remains unchanged.
