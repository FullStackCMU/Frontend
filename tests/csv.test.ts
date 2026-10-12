import { describe, expect, it } from "vitest";
import { parseStudentCsv, readCsvFile } from "../src/lib/csv";

const HEADER = "student_id,cmu_account,name_th";

function rowsOf(text: string) {
  const result = parseStudentCsv(text);
  if (!result.rows) throw new Error(`คาดว่าอ่านได้ แต่ได้ข้อผิดพลาด: ${result.error}`);
  return result.rows;
}

describe("parseStudentCsv", () => {
  it("อ่านไฟล์ตามรูปแบบตัวอย่าง เลขบรรทัดเริ่มที่ 2", () => {
    expect(rowsOf(`${HEADER}\n670610001,somchai_j@cmu.ac.th,สมชาย ใจดี\n670610002,somying_t@cmu.ac.th,สมหญิง ตั้งใจ`)).toEqual([
      { line: 2, studentId: "670610001", cmuAccount: "somchai_j@cmu.ac.th", nameTh: "สมชาย ใจดี", error: undefined },
      { line: 3, studentId: "670610002", cmuAccount: "somying_t@cmu.ac.th", nameTh: "สมหญิง ตั้งใจ", error: undefined },
    ]);
  });

  it("รับหัวตารางภาษาไทย ตัวพิมพ์ใหญ่ และมีช่องว่าง", () => {
    const [row] = rowsOf("รหัสนักศึกษา, Email ,ชื่อ-นามสกุล\n670610001,somchai_j@cmu.ac.th,สมชาย ใจดี");
    expect(row).toMatchObject({ studentId: "670610001", cmuAccount: "somchai_j@cmu.ac.th", nameTh: "สมชาย ใจดี" });
  });

  it("รวมคอลัมน์ชื่อจริงกับนามสกุล และยุบช่องว่างซ้ำ", () => {
    const [row] = rowsOf("student_id,cmu_account,firstname_th,lastname_th\n670610001,a@cmu.ac.th,  สมชาย ,  ใจดี ");
    expect(row.nameTh).toBe("สมชาย ใจดี");
  });

  it("ช่องในเครื่องหมายคำพูดมีจุลภาคและเครื่องหมายคำพูดซ้อนได้", () => {
    const [row] = rowsOf(`${HEADER}\n670610001,a@cmu.ac.th,"ใจดี, ""เอ"" สมชาย"`);
    expect(row.nameTh).toBe('ใจดี, "เอ" สมชาย');
    expect(row.error).toBeUndefined();
  });

  it("รับบรรทัดแบบ Windows และข้ามบรรทัดว่าง", () => {
    const rows = rowsOf(`${HEADER}\r\n\r\n670610001,a@cmu.ac.th,สมชาย\r\n,,\r\n670610002,b@cmu.ac.th,สมหญิง\r\n`);
    expect(rows.map((r) => [r.line, r.studentId])).toEqual([
      [2, "670610001"],
      [3, "670610002"],
    ]);
  });

  it("อีเมลตัวพิมพ์ใหญ่ถูกแปลงเป็นตัวพิมพ์เล็ก", () => {
    const [row] = rowsOf(`${HEADER}\n670610001,Somchai_J@CMU.AC.TH,สมชาย`);
    expect(row).toMatchObject({ cmuAccount: "somchai_j@cmu.ac.th", error: undefined });
  });

  it("บอกข้อผิดพลาดรายแถว", () => {
    const rows = rowsOf(
      [HEADER, "67061001,a@cmu.ac.th,สั้นไป", "670610002,b@gmail.com,ผิดโดเมน", "670610003,c@cmu.ac.th,", "670610004,d@cmu.ac.th,ถูกต้อง"].join(
        "\n"
      )
    );
    expect(rows.map((r) => r.error)).toEqual([
      "รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก",
      "ต้องเป็นอีเมล @cmu.ac.th",
      "ไม่มีชื่อ",
      undefined,
    ]);
  });

  it("รหัสหรืออีเมลซ้ำ แถวหลังถูกเตือน แถวแรกผ่าน", () => {
    const rows = rowsOf(
      [HEADER, "670610001,a@cmu.ac.th,คนแรก", "670610001,b@cmu.ac.th,รหัสซ้ำ", "670610003,a@cmu.ac.th,อีเมลซ้ำ"].join("\n")
    );
    expect(rows.map((r) => r.error)).toEqual([undefined, "ซ้ำในไฟล์", "ซ้ำในไฟล์"]);
  });

  it("ไฟล์ว่าง ขาดคอลัมน์ หรือมีแต่หัวตาราง คืนข้อผิดพลาดของทั้งไฟล์", () => {
    expect(parseStudentCsv("").error).toBe("ไฟล์ว่าง ไม่มีข้อมูล");
    expect(parseStudentCsv("student_id,name_th\n670610001,สมชาย").error).toContain("ไม่พบคอลัมน์ที่ต้องมี");
    expect(parseStudentCsv(HEADER).error).toBe("ไฟล์มีแต่หัวตาราง ไม่มีรายชื่อนักศึกษา");
  });
});

describe("readCsvFile", () => {
  it("ตัด BOM ของไฟล์ UTF-8 ออก", async () => {
    const file = new File(["﻿" + HEADER], "students.csv");
    expect(await readCsvFile(file)).toBe(HEADER);
  });

  it("ไฟล์จาก Excel ภาษาไทยที่เป็น Windows-874 ยังอ่านชื่อไทยได้", async () => {
    // "สมชาย" ในรหัส Windows-874 ซึ่งไม่ใช่ UTF-8 ที่ถูกต้อง
    const file = new File([new Uint8Array([0xca, 0xc1, 0xaa, 0xd2, 0xc2])], "students.csv");
    expect(await readCsvFile(file)).toBe("สมชาย");
  });
});
