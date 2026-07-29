export function SafeSpaceArt({ size = 132 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="พื้นที่ปลอดภัยสำหรับสะท้อนการทำงานเป็นทีม"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="44" fill="var(--cr-secondary)" opacity="0.14" />
      <g transform="translate(0 4)">
        <circle
          cx="50"
          cy="30"
          r="7"
          stroke="var(--cr-primary)"
          strokeWidth="2.4"
          fill="none"
        />
        <path
          d="M29 45c3 15 14 22 21 22s18-7 21-22"
          stroke="var(--cr-primary)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M50 68V56"
          stroke="var(--cr-secondary)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M50 60c-5 0-8-3-8-8 5 0 8 3 8 8z"
          stroke="var(--cr-positive)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M50 56c5 0 8-3 8-8-5 0-8 3-8 8z"
          stroke="var(--cr-positive)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function EmptyCoursesArt({ size = 108 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 108"
      fill="none"
      role="img"
      aria-label="ยังไม่มีรายวิชา"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="54" cy="54" r="50" fill="var(--cr-secondary)" opacity="0.05" />
      <rect x="34" y="30" width="30" height="42" rx="3" stroke="var(--cr-secondary)" strokeWidth="2.2" fill="var(--cr-bg)" />
      <rect x="44" y="36" width="30" height="42" rx="3" stroke="var(--cr-primary)" strokeWidth="2.2" fill="var(--cr-bg)" />
      <line x1="50" y1="47" x2="68" y2="47" stroke="var(--cr-muted)" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="55" x2="68" y2="55" stroke="var(--cr-muted)" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="63" x2="61" y2="63" stroke="var(--cr-muted)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
