# Admin Full CRUD - V6

## Mục tiêu
Admin quản trị tập trung toàn bộ dữ liệu ứng dụng, trong khi credential/token nhạy cảm vẫn không bị hiển thị trực tiếp.

## Màn hình mới
`/[locale]/admin/data`

Admin có thể create/update/delete 26 nhóm dữ liệu nghiệp vụ:
- StudentProfile, TeacherProfile
- School, AcademicYear, Class, ClassMembership
- MediaAsset, ReadingPassage
- QuestionBankItem, QuestionBankOption
- Rubric, RubricCriterion
- Exam, ExamVersion, ExamSection, QuestionGroup, ExamQuestion, ExamQuestionOption
- ExamAssignment, ExamAttempt, AttemptAnswer
- ManualGrade, CriterionGrade
- Notification, TeacherTask
- SiteSetting

Form được sinh từ Prisma schema metadata, hỗ trợ String/Int/Float/Boolean/DateTime/Enum và dropdown quan hệ theo ID.

## Account & security
Trang `/admin/users` vẫn là nơi CRUD account. Bổ sung thao tác revoke toàn bộ session của từng account. Password hash, session token và access token không được hiển thị ở Data Center.

## Audit
Mọi create/update/delete từ Data Center ghi AuditLog:
- ADMIN_DATA_CREATED
- ADMIN_DATA_UPDATED
- ADMIN_DATA_DELETED

## Lưu ý quan hệ
Xóa dữ liệu có quan hệ Restrict sẽ bị database từ chối. Admin cần xóa dữ liệu phụ thuộc trước. Các quan hệ Cascade/SetNull tiếp tục theo Prisma schema.
