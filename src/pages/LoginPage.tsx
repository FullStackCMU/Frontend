import { Alert } from "../components/ui/Alert";
import { useSearchParams } from "react-router-dom";
import { buttonClass } from "../components/ui/button-variants";
import { Card } from "../components/ui/Card";
import { LogoMark } from "../components/ui/Brand";
import { LOGIN_URL } from "../lib/api";
import { loginErrorMessage } from "../lib/login-errors";

function CmuMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#5B2D8E" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="white"
      >
        CMU
      </text>
    </svg>
  );
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = loginErrorMessage(searchParams.get("error"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12 md:bg-linear-to-br md:from-indigo-50 md:to-slate-100">
      <div className="w-full max-w-sm">
        <Card padding="lg" className="flex flex-col items-center gap-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <LogoMark size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                CollabReflect
              </h1>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                ระบบประเมินเพื่อนร่วมทีมที่ให้ฟีดแบ็กอย่างสร้างสรรค์
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          <div className="flex w-full flex-col items-center gap-4">
            {error && <Alert className="w-full">{error}</Alert>}
            {/* <a> ไม่ใช่ <button> — ต้องเปลี่ยนหน้าเต็มเพื่อให้ backend redirect ไป CMU */}
            <a href={LOGIN_URL} className={buttonClass({ size: "lg", fullWidth: true })}>
              <CmuMark />
              เข้าสู่ระบบด้วยบัญชี CMU
            </a>
            <p className="text-center text-xs text-muted-foreground">
              ใช้บัญชี @cmu.ac.th เท่านั้น
            </p>
          </div>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          CollabReflect · Chiang Mai University
        </p>
      </div>
    </div>
  );
}
