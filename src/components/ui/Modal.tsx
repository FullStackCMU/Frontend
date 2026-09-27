import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * กล่อง modal ตาม design-ref — ใช้ <dialog> ของ browser (showModal)
 * จึงได้ focus trap, กด Esc ปิด, และ inert เนื้อหาด้านหลังมาเอง
 * render เมื่อต้องการเปิด แล้ว unmount เมื่อปิด (ไม่มี prop open)
 * ช่องที่ต้องการ focus ตอนเปิด ใส่ data-autofocus (ไม่ใช่ autoFocus)
 */
const WIDTH = {
  md: "max-w-[560px]",
  lg: "max-w-[640px]",
};

export function Modal({
  title,
  onClose,
  footer,
  size = "md",
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  size?: keyof typeof WIDTH;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    // autoFocus ของ React ทำงานก่อน showModal (dialog ยังปิด) จึงใช้ data-autofocus แทน
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      // Esc → cancel: ปล่อยให้ parent unmount เอง (กัน dialog ปิดก่อน state เปลี่ยน)
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // คลิกพื้นหลัง (ตัว dialog เอง ไม่ใช่เนื้อหาข้างใน) = ปิด
      onClick={(e) => e.target === e.currentTarget && onClose()}
      // open:flex — ห้ามใส่ flex ตรงๆ เพราะจะทับ display:none ของ dialog ที่ปิดอยู่
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] ${WIDTH[size]} flex-col rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 open:flex`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
        <h2 id="modal-title" className="text-base font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
