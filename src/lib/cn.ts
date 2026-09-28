// ไม่ merge class ที่ชนกัน — เปลี่ยนค่าของ component ให้เพิ่ม prop แทนส่ง className ทับ
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
