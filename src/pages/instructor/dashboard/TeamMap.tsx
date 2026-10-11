import { useLayoutEffect, useRef, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import type { NamedGroup } from "../../../lib/signals";
import type { CourseRound, OverviewRow, RoundOverview } from "../../../types";

const MARGIN = { top: 8, right: 8, bottom: 40, left: 44 };
const DOT_R = 6;
const GHOST_R = 4;
// จุดที่คะแนนเต็มไม่ไปชนขอบและไม่ทับป้ายช่อง
const DOMAIN_PAD = 0.25;
const LABEL_H = 14;

// ลำดับช่อง: บนซ้าย, บนขวา, ล่างซ้าย, ล่างขวา
const WASHES = ["fill-sky-500/[0.06]", "fill-emerald-500/[0.06]", "fill-red-500/[0.06]", "fill-amber-500/[0.06]"];

export type MapMode = "self" | "focus";

type Quadrant = { label: string; meaning: string };

const MODES: Record<
  MapMode,
  {
    tab: string;
    subtitle: string;
    xTitle: string;
    yTitle: string;
    // ชื่อสั้นของแกน X · Y ใช้ใน tooltip และหมายเหตุ
    short: [string, string];
    x: (row: OverviewRow) => number | null;
    y: (row: OverviewRow) => number | null;
    medians: (section: RoundOverview["section"]) => [number | null, number | null];
    missing: (row: OverviewRow) => string;
    diagonal: boolean;
    quadrants: [Quadrant, Quadrant, Quadrant, Quadrant];
  }
> = {
  self: {
    tab: "ตัวเอง vs เพื่อน",
    subtitle: "คะแนนรวมที่ให้ตัวเอง เทียบกับที่เพื่อนให้",
    xTitle: "ตัวเองประเมิน →",
    yTitle: "เพื่อนประเมิน →",
    short: ["ตัวเอง", "เพื่อน"],
    x: (r) => r.overall.selfAverage,
    y: (r) => r.overall.peerAverage,
    medians: (s) => [s.selfMedian, s.peerMedian],
    missing: (r) => (r.overall.selfAverage === null ? "ยังไม่ได้ประเมินตัวเอง" : "ยังไม่มีเพื่อนประเมิน"),
    diagonal: true,
    quadrants: [
      { label: "จุดแข็งที่มองไม่เห็น", meaning: "เพื่อนให้สูง แต่ให้ตัวเองต่ำกว่า" },
      { label: "จุดแข็งที่รู้ตัว", meaning: "ทั้งตัวเองและเพื่อนให้สูง" },
      { label: "ต้องการการสนับสนุน", meaning: "ทั้งตัวเองและเพื่อนให้ต่ำ" },
      { label: "มองตัวเองสูงกว่าเพื่อน", meaning: "ให้ตัวเองสูง แต่เพื่อนให้ต่ำกว่า" },
    ],
  },
  focus: {
    tab: "งาน vs ทีม",
    subtitle: "คะแนนจากเพื่อน แยกด้านงานกับด้านการทำงานร่วมกัน",
    xTitle: "ด้านงาน →",
    yTitle: "ด้านทีม →",
    short: ["งาน", "ทีม"],
    x: (r) => r.focus.task,
    y: (r) => r.focus.team,
    medians: (s) => [s.taskMedian, s.teamMedian],
    missing: () => "ยังไม่มีเพื่อนประเมิน",
    diagonal: false,
    quadrants: [
      { label: "เด่นด้านทีม", meaning: "ทำงานร่วมกับเพื่อนได้ดี แต่ด้านงานต่ำกว่าค่ากลาง" },
      { label: "เด่นทั้งงานและทีม", meaning: "เพื่อนให้สูงทั้งสองด้าน" },
      { label: "ต้องการการสนับสนุน", meaning: "เพื่อนให้ต่ำทั้งสองด้าน" },
      { label: "เด่นด้านงาน", meaning: "ผลงานดี แต่ด้านการทำงานร่วมกันต่ำกว่าค่ากลาง" },
    ],
  },
};

type Rect = { x: number; y: number; w: number; h: number };
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const within = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const around = (x: number, y: number, r: number): Rect => ({ x: x - r - 1, y: y - r - 1, w: r * 2 + 2, h: r * 2 + 2 });

// สระบน/ล่างและวรรณยุกต์ไทยไม่กินความกว้าง
function textWidth(text: string, charWidth: number) {
  return text.replace(/[ัิ-ฺ็-๎]/g, "").length * charWidth;
}

type Dot = {
  id: string;
  name: string;
  vx: number;
  vy: number;
  peerCount: number;
  x: number;
  y: number;
  // ตำแหน่งในรอบที่เทียบ (ถ้ามีและไม่ซ้ำกับรอบนี้)
  from: { vx: number; vy: number; x: number; y: number } | null;
};

// วางชื่อรอบจุดในตำแหน่งแรกที่ไม่ทับจุดอื่น ชื่ออื่น หรือป้ายช่อง — วางไม่ได้ก็ไม่แสดง (ยังดูได้จาก tooltip และตาราง)
function placeLabels(dots: Dot[], plot: Rect, obstacles: Rect[]) {
  const taken = [...obstacles, ...dots.flatMap((d) => (d.from ? [around(d.from.x, d.from.y, GHOST_R)] : []))];
  const placed = new Map<string, { x: number; y: number }>();
  for (const d of dots) {
    const w = textWidth(d.name, 7.2) + 2;
    const g = DOT_R + 4;
    const candidates: Rect[] = [
      { x: d.x + g, y: d.y - LABEL_H / 2 },
      { x: d.x - g - w, y: d.y - LABEL_H / 2 },
      { x: d.x - w / 2, y: d.y - g - LABEL_H },
      { x: d.x - w / 2, y: d.y + g },
      { x: d.x + g, y: d.y - g - LABEL_H / 2 },
      { x: d.x + g, y: d.y + g - LABEL_H / 2 },
      { x: d.x - g - w, y: d.y - g - LABEL_H / 2 },
      { x: d.x - g - w, y: d.y + g - LABEL_H / 2 },
    ].map((c) => ({ ...c, w, h: LABEL_H }));
    const others = dots.filter((o) => o.id !== d.id).map((o) => around(o.x, o.y, DOT_R));
    const spot = candidates.find((c) => within(c, plot) && ![...taken, ...others].some((r) => overlaps(c, r)));
    if (spot) {
      taken.push(spot);
      placed.set(d.id, { x: spot.x, y: spot.y + LABEL_H - 3 });
    }
  }
  return placed;
}

export default function TeamMap({
  overview,
  group,
  mode,
  onModeChange,
  earlierRounds,
  compareRound,
  compare,
  onCompareChange,
  onOpenStudent,
}: {
  overview: RoundOverview;
  group: NamedGroup;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  earlierRounds: CourseRound[];
  compareRound: CourseRound | undefined;
  // undefined = ไม่เทียบ หรือกำลังโหลดรอบที่เทียบ
  compare: RoundOverview | undefined;
  onCompareChange: (roundId: string | null) => void;
  onOpenStudent: (studentId: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  // วัดก่อน paint ครั้งแรก ไม่งั้นกราฟโผล่ช้ากว่าส่วนอื่นหนึ่งเฟรม
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const view = MODES[mode];
  const [medianX, medianY] = view.medians(overview.section);
  const plotted = group.rows.flatMap((row) => {
    const vx = view.x(row);
    const vy = view.y(row);
    return vx === null || vy === null ? [] : [{ row, vx, vy }];
  });
  const missing = group.rows.filter((row) => view.x(row) === null || view.y(row) === null);

  // แกนเดียวกันทุกกลุ่มในรอบนี้ (และรอบที่เทียบ) สลับกลุ่มแล้วตำแหน่งเทียบกันได้
  const hi = overview.round.scaleMax;
  const allRows = [...overview.groups, ...(compare?.groups ?? [])].flatMap((g) => g.rows);
  const values = allRows.flatMap((r) => [view.x(r), view.y(r)]).filter((v): v is number => v !== null);
  const lo = Math.max(overview.round.scaleMin, Math.min(Math.floor(Math.min(...values, hi)), hi - 2));

  const height = Math.round(Math.min(Math.max(width * 0.85, 280), 420));
  const plot: Rect = {
    x: MARGIN.left,
    y: MARGIN.top,
    w: Math.max(width - MARGIN.left - MARGIN.right, 0),
    h: height - MARGIN.top - MARGIN.bottom,
  };
  const span = hi - lo + DOMAIN_PAD * 2;
  const sx = (v: number) => plot.x + ((v - lo + DOMAIN_PAD) / span) * plot.w;
  const sy = (v: number) => plot.y + plot.h - ((v - lo + DOMAIN_PAD) / span) * plot.h;
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

  const previous = new Map((compare?.groups ?? []).flatMap((g) => g.rows).map((r) => [r.student.id, r]));
  const dots: Dot[] = plotted.map((p) => {
    // คะแนนตรงกันเป๊ะ → เรียงข้างกันให้เห็นครบทุกคน (ค่าจริงอยู่ใน tooltip)
    const same = plotted.filter((o) => o.vx === p.vx && o.vy === p.vy);
    const shift = (same.indexOf(p) - (same.length - 1) / 2) * (DOT_R * 2 + 2);
    const before = previous.get(p.row.student.id);
    const fx = before ? view.x(before) : null;
    const fy = before ? view.y(before) : null;
    return {
      id: p.row.student.id,
      name: p.row.student.name.split(" ")[0],
      vx: p.vx,
      vy: p.vy,
      peerCount: p.row.peerCount,
      x: sx(p.vx) + shift,
      y: sy(p.vy),
      from: fx !== null && fy !== null && (fx !== p.vx || fy !== p.vy) ? { vx: fx, vy: fy, x: sx(fx), y: sy(fy) } : null,
    };
  });

  const ready = width > 0 && medianX !== null && medianY !== null && plotted.length > 0;
  const mx = ready ? sx(medianX) : 0;
  const my = ready ? sy(medianY) : 0;
  const right = plot.x + plot.w;
  const bottom = plot.y + plot.h;
  const quadrantRects: Rect[] = [
    { x: plot.x, y: plot.y, w: mx - plot.x, h: my - plot.y },
    { x: mx, y: plot.y, w: right - mx, h: my - plot.y },
    { x: plot.x, y: my, w: mx - plot.x, h: bottom - my },
    { x: mx, y: my, w: right - mx, h: bottom - my },
  ];
  // ป้ายช่องอยู่มุมนอกสุดของแต่ละช่อง — ซ้ายชิดซ้าย ขวาชิดขวา
  const quadrantLabels = view.quadrants.map((q, i) => {
    const w = textWidth(q.label, 6.4);
    const left = i % 2 === 0;
    const top = i < 2;
    return {
      label: q.label,
      anchorX: left ? plot.x + 6 : right - 6,
      baseline: top ? plot.y + 15 : bottom - 7,
      anchor: left ? ("start" as const) : ("end" as const),
      rect: { x: left ? plot.x + 6 : right - 6 - w, y: top ? plot.y + 4 : bottom - 19, w, h: 15 },
      // ช่องแคบกว่าข้อความ ไม่แสดงป้าย (ความหมายยังอยู่ในคำอธิบายใต้กราฟ)
      fits: w + 10 <= quadrantRects[i].w,
    };
  });
  const labels = ready
    ? placeLabels(
        dots,
        plot,
        quadrantLabels.filter((q) => q.fits).map((q) => q.rect)
      )
    : new Map<string, { x: number; y: number }>();
  const tip = dots.find((d) => d.id === active);
  const compareLabel = compareRound ? `รอบที่ ${compareRound.sequenceNo}` : "";
  const focusNames = (focus: "task" | "team") =>
    overview.questions
      .filter((q) => q.focus === focus)
      .map((q) => q.prompt)
      .join(", ");

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-sm font-bold text-foreground">แผนภาพทีม</h3>
          <p className="text-[11px] text-muted-foreground">{view.subtitle} · กดที่จุดเพื่อดูรายคน</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {earlierRounds.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              เทียบกับ
              <select
                value={compareRound?.id ?? ""}
                onChange={(e) => onCompareChange(e.target.value || null)}
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"
              >
                <option value="">ไม่เทียบ</option>
                {earlierRounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    รอบที่ {r.sequenceNo}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div role="group" aria-label="มุมมองแผนภาพ" className="flex overflow-hidden rounded-lg border border-border">
            {(Object.keys(MODES) as MapMode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => onModeChange(m)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {MODES[m].tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={container} className="relative">
        {ready ? (
          <>
            <svg
              width={width}
              height={height}
              role="group"
              aria-label={`แผนภาพทีม ${group.name}: ${view.subtitle}`}
              className="block"
            >
              {quadrantRects.map((r, i) => (
                <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} className={WASHES[i]} />
              ))}

              {ticks.map((t) => (
                <g key={t}>
                  <line x1={sx(t)} x2={sx(t)} y1={plot.y} y2={bottom} className="stroke-border" />
                  <line x1={plot.x} x2={right} y1={sy(t)} y2={sy(t)} className="stroke-border" />
                  <text x={sx(t)} y={bottom + 16} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {t}
                  </text>
                  <text x={plot.x - 8} y={sy(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                    {t}
                  </text>
                </g>
              ))}
              <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} className="fill-none stroke-border" />

              {view.diagonal && (
                <line x1={plot.x} y1={bottom} x2={right} y2={plot.y} strokeDasharray="4 4" className="stroke-zinc-400" />
              )}
              <line x1={mx} x2={mx} y1={plot.y} y2={bottom} className="stroke-zinc-500" />
              <line x1={plot.x} x2={right} y1={my} y2={my} className="stroke-zinc-500" />

              {quadrantLabels.map(
                (q) =>
                  q.fits && (
                    <text
                      key={q.label}
                      x={q.anchorX}
                      y={q.baseline}
                      textAnchor={q.anchor}
                      className="fill-muted-foreground text-[11px] font-semibold"
                    >
                      {q.label}
                    </text>
                  )
              )}

              <text x={plot.x + plot.w / 2} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-xs">
                {view.xTitle}
              </text>
              <text
                transform={`translate(12 ${plot.y + plot.h / 2}) rotate(-90)`}
                textAnchor="middle"
                className="fill-muted-foreground text-xs"
              >
                {view.yTitle}
              </text>

              {dots.map(
                (d) =>
                  d.from && (
                    <g key={d.id} aria-hidden="true">
                      <line x1={d.from.x} y1={d.from.y} x2={d.x} y2={d.y} strokeWidth={2} className="stroke-ramp-2" />
                      <circle cx={d.from.x} cy={d.from.y} r={GHOST_R} strokeWidth={2} className="fill-ramp-2 stroke-card" />
                    </g>
                  )
              )}

              {dots.map((d) => {
                const label = labels.get(d.id);
                return (
                  <g
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${d.name} ${view.short[0]} ${d.vx.toFixed(1)} ${view.short[1]} ${d.vy.toFixed(1)}`}
                    className="cursor-pointer outline-none"
                    onClick={() => onOpenStudent(d.id)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      onOpenStudent(d.id);
                    }}
                    onPointerEnter={() => setActive(d.id)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(d.id)}
                    onBlur={() => setActive(null)}
                  >
                    <circle cx={d.x} cy={d.y} r={14} fill="transparent" />
                    <circle
                      cx={d.x}
                      cy={d.y}
                      r={active === d.id ? DOT_R + 1.5 : DOT_R}
                      strokeWidth={2}
                      className="fill-primary stroke-card transition-[r]"
                    />
                    {label && (
                      <text x={label.x} y={label.y} className="fill-foreground text-xs font-semibold">
                        {d.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {tip && (
              <div
                role="tooltip"
                className="pointer-events-none absolute z-10 rounded-lg border border-border bg-card px-3 py-2 text-xs whitespace-nowrap shadow-md"
                style={{
                  left: Math.min(Math.max(tip.x - 70, 0), Math.max(width - 160, 0)),
                  top: tip.y > plot.y + 100 ? tip.y - (tip.from ? 90 : 72) : tip.y + 16,
                }}
              >
                <p className="font-mono text-sm font-bold text-foreground">
                  {tip.vx.toFixed(1)} · {tip.vy.toFixed(1)}
                </p>
                <p className="text-muted-foreground">
                  {view.short[0]} · {view.short[1]} ({tip.peerCount} คนประเมิน)
                </p>
                {tip.from && (
                  <p className="text-muted-foreground">
                    {compareLabel}: {tip.from.vx.toFixed(1)} · {tip.from.vy.toFixed(1)}
                  </p>
                )}
                <p className="mt-0.5 font-semibold text-foreground">{tip.name}</p>
              </div>
            )}
          </>
        ) : (
          <p className="py-10 text-center text-xs text-muted-foreground">
            {width > 0 && "ยังไม่มีข้อมูลพอสำหรับแผนภาพในรอบนี้"}
          </p>
        )}
      </div>

      {ready && compareRound && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-ramp-2" /> {compareLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-primary" /> รอบที่ {overview.round.sequenceNo} (รอบนี้)
          </span>
          <span>คนที่ตำแหน่งเดิมหรือไม่มีข้อมูลในรอบที่เทียบจะไม่มีเส้น</span>
        </p>
      )}
      {ready && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          เส้นแบ่ง = ค่ากลางของทั้งวิชาในรอบนี้ ({view.short[0]} {medianX.toFixed(1)} · {view.short[1]} {medianY.toFixed(1)})
          {view.diagonal
            ? " · เส้นประ = ตัวเองกับเพื่อนให้ตรงกัน"
            : ` · งาน = ${focusNames("task")} · ทีม = ${focusNames("team")}`}
        </p>
      )}
      {ready && missing.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          ไม่อยู่ในแผนภาพ: {missing.map((r) => `${r.student.name.split(" ")[0]} (${view.missing(r)})`).join(", ")}
        </p>
      )}

      <details className="border-t border-border pt-3 text-xs">
        <summary className="cursor-pointer font-semibold text-foreground">ความหมายของแต่ละช่อง</summary>
        <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {view.quadrants.map((q) => (
            <div key={q.label}>
              <dt className="font-semibold text-foreground">{q.label}</dt>
              <dd className="text-muted-foreground">{q.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Card>
  );
}
