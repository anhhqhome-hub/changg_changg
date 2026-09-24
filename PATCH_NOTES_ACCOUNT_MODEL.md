# Account workflow update

## Final account model

- Students self-register with full name, username and password. Email is never requested from the user.
- Newly self-registered students are active immediately and start without a school/class assignment.
- Teachers do not create or reset student accounts. Teachers search existing student accounts and enroll them in their classes.
- When a teacher enrolls an unassigned student into a class, the student's school is inherited from that class.
- A student already assigned to another school cannot be enrolled into a class from a different school.
- Administrators manage all accounts from `/[locale]/admin/users`.

## Admin account CRUD

Administrators can:

- create ADMIN, TEACHER and STUDENT accounts;
- edit name and username;
- change role;
- change status (APPROVED / SUSPENDED / PENDING / REJECTED);
- assign school and student grade;
- reset any account password;
- delete accounts.

Safeguards:

- an administrator cannot delete their own currently logged-in account;
- an administrator cannot suspend/demote their own currently logged-in account;
- the last administrator account cannot be deleted.

## Internal Better Auth compatibility

Better Auth still has an `email` column internally. The app generates an internal-only address such as `username@local.invalid`. It is not collected from or shown to users.
