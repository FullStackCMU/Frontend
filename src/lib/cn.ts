/** ต่อ className โดยข้ามค่า falsy — ไม่ได้ merge class ที่ชนกัน (ไม่มี tailwind-merge)
 *  ถ้าต้องการเปลี่ยนค่าที่ component ตั้งไว้ ให้เพิ่มเป็น prop แทนการส่ง className ทับ */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
