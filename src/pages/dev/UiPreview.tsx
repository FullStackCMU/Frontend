import { Button } from "../../components/ui/Button";
import { buttonClass } from "../../components/ui/button-variants";
import { Card } from "../../components/ui/Card";
import { StatusDot, StatusPill } from "../../components/ui/StatusPill";
import { Avatar } from "../../components/ui/Avatar";
import { Brand, LogoMark } from "../../components/ui/Brand";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { STATUS, getRoundStatus, type Status } from "../../lib/status";

const DAY = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const ROUND_SAMPLES = [
  { label: "เปิดพรุ่งนี้", opensAt: at(1), closesAt: at(8) },
  { label: "เปิดเมื่อวาน ปิดอีก 6 วัน", opensAt: at(-1), closesAt: at(6) },
  { label: "ปิดแล้ว ยังไม่ release", opensAt: at(-14), closesAt: at(-7) },
  { label: "ปิดแล้ว release คะแนนแล้ว", opensAt: at(-14), closesAt: at(-7), scoresReleasedAt: at(-3) },
  { label: "ปิดแล้ว ตั้ง release ไว้พรุ่งนี้", opensAt: at(-14), closesAt: at(-7), feedbackReleasedAt: at(1) },
];

export default function UiPreview() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <Breadcrumb segments={[{ label: "หน้าแรก", to: "/" }, { label: "dev" }, { label: "UI primitives" }]} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Brand / Avatar</h2>
        <div className="flex items-center gap-4">
          <LogoMark size="lg" />
          <Brand />
          <Avatar name="ปฏิพันธ์ เลขนอก" />
          <Avatar name="วิชัย ตันติวัฒนกุล" size="md" />
          <Avatar name="WICHAI TANTIWATTANAKUL" size="lg" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">เปิดรอบ</Button>
          <Button>เริ่มประเมิน</Button>
          <Button size="lg">ส่งแบบประเมิน</Button>
          <Button variant="outline">ยกเลิก</Button>
          <Button variant="ghost">ข้ามข้อนี้</Button>
          <Button disabled>ปิดใช้งาน</Button>
          <a href="#" className={buttonClass({ variant: "outline", size: "sm" })}>
            ลิงก์แบบปุ่ม
          </a>
        </div>
        <Button size="lg" fullWidth>
          เข้าสู่ระบบด้วยบัญชี CMU
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">StatusPill (mapping เดียว)</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS) as Status[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <StatusDot status={s} />
              <StatusPill status={s} />
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">getRoundStatus</h2>
        <Card padding="none" className="divide-y divide-border">
          {ROUND_SAMPLES.map(({ label, ...round }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{label}</span>
              <StatusPill status={getRoundStatus(round)} />
            </div>
          ))}
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="font-semibold">Card ปกติ</p>
          <p className="mt-1 text-sm text-muted-foreground">261497 · Fullstack Development</p>
        </Card>
        <Card interactive>
          <p className="font-semibold">Card คลิกได้</p>
          <p className="mt-1 text-sm text-muted-foreground">hover แล้วขอบเป็นสี primary</p>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Score ramp</h2>
        <div className="flex gap-2">
          {["bg-ramp-1", "bg-ramp-2", "bg-ramp-3", "bg-ramp-4", "bg-ramp-5"].map((c, i) => (
            <span key={c} className={`flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white ${c}`}>
              {i + 1}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
