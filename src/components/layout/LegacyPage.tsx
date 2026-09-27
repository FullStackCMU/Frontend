import type { ReactNode } from "react";

/**
 * ครอบหน้าเดิม (Pico) ที่ยังไม่ได้ย้าย ให้แสดงใน AppLayout ได้
 * .pico เปิดสไตล์ Pico/CSS เดิมเฉพาะในกล่องนี้ (ดู src/index.css) — ลบเมื่อย้ายหน้าครบ
 */
export default function LegacyPage({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="pico mx-auto min-h-0 max-w-5xl bg-transparent px-4 py-6 min-[900px]:px-8 min-[900px]:py-8">
      {title && <h3 className="page-heading">{title}</h3>}
      {description && <p className="page-description">{description}</p>}
      {children}
    </div>
  );
}
