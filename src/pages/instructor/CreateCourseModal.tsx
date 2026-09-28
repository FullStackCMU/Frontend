import { useState, type FormEvent } from "react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { inputClass } from "../../components/ui/field-styles";
import { Modal } from "../../components/ui/Modal";
import { api, getErrorMessage } from "../../lib/api";
import { currentTerm, SEMESTERS } from "../../lib/course";
import type { ApiResponse, Course } from "../../types";

type Errors = Partial<Record<"courseCode" | "section" | "title" | "academicYear", string>>;

// ตรงกับการตรวจใน Backend/src/routes/course.ts
function validate(v: { courseCode: string; section: string; title: string; academicYear: string }) {
  const errors: Errors = {};
  if (!/^\d{6}$/.test(v.courseCode)) errors.courseCode = "รหัสวิชาต้องเป็นตัวเลข 6 หลัก";
  if (v.section && !/^\d{3}$/.test(v.section)) errors.section = "ตอนต้องเป็นตัวเลข 3 หลัก เช่น 001";
  if (!v.title) errors.title = "กรุณากรอกชื่อวิชา";
  const year = Number(v.academicYear);
  if (!Number.isInteger(year) || year < 2500 || year > 2700)
    errors.academicYear = "ใช้ปี พ.ศ. เช่น 2569";
  return errors;
}

export default function CreateCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (course: Course) => void;
}) {
  const initialTerm = currentTerm();
  const [courseCode, setCourseCode] = useState("");
  const [section, setSection] = useState("");
  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState<number>(initialTerm.semester);
  const [academicYear, setAcademicYear] = useState(String(initialTerm.academicYear));
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = {
      courseCode: courseCode.trim(),
      section: section.trim(),
      title: title.trim(),
      academicYear: academicYear.trim(),
    };
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      const res = await api.post<ApiResponse<Course>>("/courses", {
        ...values,
        section: values.section || null,
        semester,
        academicYear: Number(values.academicYear),
      });
      onCreated(res.data.data);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  // id ต้องตรงกับที่ Field สร้าง
  const describe = (name: keyof Errors, hasHint = false) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : hasHint ? `${name}-hint` : undefined,
  });

  return (
    <Modal
      title="สร้างคอร์สใหม่"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="create-course-form" disabled={submitting}>
            {submitting ? "กำลังสร้าง..." : "สร้างคอร์ส"}
          </Button>
        </>
      }
    >
      <form id="create-course-form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
        {serverError && (
          <Alert>{serverError}</Alert>
        )}

        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Field label="รหัสวิชา" htmlFor="courseCode" hint="ใช้รหัสวิชาตามระบบทะเบียน" error={errors.courseCode}>
            <input
              id="courseCode"
              inputMode="numeric"
              maxLength={6}
              data-autofocus
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="261497"
              className={inputClass}
              {...describe("courseCode", true)}
            />
          </Field>
          <Field label="ตอน" htmlFor="section" hint="ไม่บังคับ" error={errors.section}>
            <input
              id="section"
              inputMode="numeric"
              maxLength={3}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="001"
              className={inputClass}
              {...describe("section", true)}
            />
          </Field>
        </div>

        <Field label="ชื่อวิชา" htmlFor="title" error={errors.title}>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Project"
            className={inputClass}
            {...describe("title")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ภาคการศึกษา" htmlFor="semester">
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className={inputClass}
            >
              {SEMESTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ปีการศึกษา (พ.ศ.)" htmlFor="academicYear" error={errors.academicYear}>
            <input
              id="academicYear"
              inputMode="numeric"
              maxLength={4}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className={inputClass}
              {...describe("academicYear")}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
