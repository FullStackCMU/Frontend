// Excel ภาษาไทยบน Windows บันทึกเป็น Windows-874 — UTF-8 ไม่ผ่านให้ลองตัวนี้
export async function readCsvFile(file: File) {
  const buffer = await file.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-874").decode(buffer);
  }
  return text.replace(/^﻿/, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export interface StudentCsvRow {
  // หัวตาราง = แถว 1 ไม่นับบรรทัดว่าง
  line: number;
  studentId: string;
  cmuAccount: string;
  nameTh: string;
  // backend ตรวจซ้ำอีกที
  error?: string;
}

const HEADERS = {
  studentId: ["student_id", "studentid", "รหัสนักศึกษา"],
  cmuAccount: ["cmu_account", "cmuaccount", "email", "อีเมล"],
  nameTh: ["name_th", "name", "ชื่อ", "ชื่อ-นามสกุล", "ชื่อนามสกุล"],
  firstnameTh: ["firstname_th", "ชื่อจริง"],
  lastnameTh: ["lastname_th", "นามสกุล"],
};

const STUDENT_ID_RE = /^\d{9}$/;
const CMU_ACCOUNT_RE = /^[a-z0-9._-]+@cmu\.ac\.th$/;

export function parseStudentCsv(
  text: string
): { rows: StudentCsvRow[]; error?: undefined } | { rows?: undefined; error: string } {
  const [header, ...body] = parseCsv(text);
  if (!header) return { error: "ไฟล์ว่าง ไม่มีข้อมูล" };

  const names = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const col = (aliases: string[]) => names.findIndex((n) => aliases.includes(n));
  const idx = {
    studentId: col(HEADERS.studentId),
    cmuAccount: col(HEADERS.cmuAccount),
    nameTh: col(HEADERS.nameTh),
    firstnameTh: col(HEADERS.firstnameTh),
    lastnameTh: col(HEADERS.lastnameTh),
  };

  const hasName = idx.nameTh >= 0 || idx.firstnameTh >= 0;
  if (idx.studentId < 0 || idx.cmuAccount < 0 || !hasName)
    return {
      error: "ไม่พบคอลัมน์ที่ต้องมี: student_id, cmu_account และ name_th — ดูรูปแบบจากไฟล์ตัวอย่าง",
    };
  if (body.length === 0) return { error: "ไฟล์มีแต่หัวตาราง ไม่มีรายชื่อนักศึกษา" };

  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const seen = new Set<string>();

  return {
    rows: body.map((r, i) => {
      const studentId = cell(r, idx.studentId);
      const cmuAccount = cell(r, idx.cmuAccount).toLowerCase();
      const nameTh = (
        idx.nameTh >= 0
          ? cell(r, idx.nameTh)
          : `${cell(r, idx.firstnameTh)} ${cell(r, idx.lastnameTh)}`
      )
        .replace(/\s+/g, " ")
        .trim();

      let error: string | undefined;
      if (!STUDENT_ID_RE.test(studentId)) error = "รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก";
      else if (!CMU_ACCOUNT_RE.test(cmuAccount)) error = "ต้องเป็นอีเมล @cmu.ac.th";
      else if (!nameTh) error = "ไม่มีชื่อ";
      else if (seen.has(studentId) || seen.has(cmuAccount)) error = "ซ้ำในไฟล์";
      seen.add(studentId);
      seen.add(cmuAccount);

      return { line: i + 2, studentId, cmuAccount, nameTh, error };
    }),
  };
}
