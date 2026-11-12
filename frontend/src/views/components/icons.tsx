import type { ReactNode } from "react";
function Icon({
  children,
  size = 20,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export const icons = {
  play: (
    <Icon>
      <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
    </Icon>
  ),
  step: (
    <Icon>
      <path d="M5 5v14M9 6l9 6-9 6V6Z" stroke="currentColor" strokeWidth="1.8" />
    </Icon>
  ),
  reset: (
    <Icon>
      <path
        d="M4.6 9A8 8 0 1 1 4 15m.6-6V4m0 5h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  ),
  nodes: (
    <Icon>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="7" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.3 7.2 7.4 3.6M8.8 17.5l6.9-4.2" stroke="currentColor" strokeWidth="1.7" />
    </Icon>
  ),
  info: (
    <Icon>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v6m0-10v.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  ),
  check: (
    <Icon>
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  ),
  ticket: (
    <Icon>
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a3 3 0 0 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a3 3 0 0 0 0-6V7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9 9v6" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.5" />
    </Icon>
  ),
};
