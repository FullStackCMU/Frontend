import { useState } from "react";
import {
  Check,
  Clock,
  Eye,
  FileText,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { acceptConsent, getErrorMessage } from "../lib/api";
import {
  CONSENT_POLICY_VERSION,
  CONSENT_ROWS,
  type ConsentIcon,
} from "../lib/consent-policy";
import type { ConsentStatus } from "../types";

const ICONS: Record<ConsentIcon, LucideIcon> = {
  file: FileText,
  eye: Eye,
  sparkles: Sparkles,
  clock: Clock,
  shield: ShieldCheck,
};

function ConsentLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.15" />
      <rect x="7" y="11" width="16" height="11" rx="3" fill="white" fillOpacity="0.9" />
      <path d="M10 22l-2 3 5-3" fill="white" fillOpacity="0.9" />
      <rect x="17" y="17" width="16" height="11" rx="3" fill="white" fillOpacity="0.5" />
      <path d="M30 28l2 3-5-3" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

export default function ConsentPage({
  onAccepted,
  onDecline,
}: {
  onAccepted: (status: ConsentStatus) => void;
  onDecline: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setSubmitting(true);
    setError("");
    try {
      onAccepted(await acceptConsent(CONSENT_POLICY_VERSION));
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col min-[900px]:flex-row">
      <div className="relative flex w-full shrink-0 flex-col overflow-hidden bg-[#4A5B8C] min-[900px]:w-[40%] min-[900px]:min-w-[420px]">
        <div className="flex items-center gap-3 px-6 py-4 min-[900px]:hidden">
          <ConsentLogo size={28} />
          <span className="text-base font-bold tracking-tight text-white">CollabReflect</span>
        </div>

        <div className="hidden h-full flex-col justify-between px-12 py-12 min-[900px]:flex">
          <div className="flex flex-col gap-10">
            <div className="flex items-center gap-3">
              <ConsentLogo size={36} />
              <span className="text-lg font-bold tracking-tight text-white">CollabReflect</span>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl leading-tight font-semibold text-white">
                ความเห็นของคุณ
                <br />
                ถึงเพื่อน
                <br />
                ไม่ระบุชื่อ
              </h2>
              <p className="text-sm leading-relaxed text-white/80">
                เพื่อนจะเห็นความเห็นโดยไม่รู้ว่าใครเขียน
                <br />
                หลังจากอาจารย์เผยแพร่ผลแล้วเท่านั้น
              </p>
            </div>
          </div>
          <p className="text-xs text-white/60">มหาวิทยาลัยเชียงใหม่ · คณะวิศวกรรมศาสตร์</p>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-15 -bottom-15 hidden opacity-[0.08] select-none min-[900px]:block"
        >
          <ConsentLogo size={280} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-card">
        <div className="mx-auto w-full max-w-[520px] px-6 py-10 sm:px-16">
          <p className="mb-1.5 text-xs text-muted-foreground">ขั้นตอนที่ 2 จาก 2</p>
          <h1 className="mb-1 text-2xl font-bold text-foreground">ก่อนเริ่มใช้งาน</h1>
          <p className="mb-7 text-sm text-muted-foreground">
            โปรดอ่านสรุปด้านล่างก่อนให้ความยินยอม
          </p>

          <ul className="mb-7 flex flex-col gap-5">
            {CONSENT_ROWS.map(({ icon, label, detail }) => {
              const Icon = ICONS[icon];
              return (
                <li key={label} className="flex items-start gap-3.5">
                  <Icon size={20} className="mt-0.5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-sm leading-snug font-semibold text-foreground">{label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mb-4 h-px bg-border" />

          <label className="-mx-2 mb-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 transition-colors select-none hover:bg-muted">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-border bg-white transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
              {checked && <Check size={13} strokeWidth={3} className="text-white" />}
            </span>
            <span className="text-sm leading-snug text-foreground">
              ฉันเข้าใจและยินยอมให้เก็บและประมวลผลข้อมูลตามที่ระบุ
            </span>
          </label>

          {error && (
            <Alert className="mb-3">{error}</Alert>
          )}

          <div className="mb-2 flex items-center gap-2">
            <Button variant="outline" className="w-[140px] shrink-0" onClick={onDecline} disabled={submitting}>
              ไม่ยอมรับ
            </Button>
            <Button className="flex-1" onClick={handleAccept} disabled={!checked || submitting}>
              {submitting ? "กำลังบันทึก..." : "ยอมรับและเริ่มใช้งาน"}
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            หากไม่ยอมรับ จะไม่สามารถใช้งานระบบได้ กรุณาติดต่ออาจารย์ผู้สอน
          </p>
        </div>
      </div>
    </div>
  );
}
