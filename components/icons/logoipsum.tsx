import type { SVGProps } from "react";

type LogoipsumProps = SVGProps<SVGSVGElement> & {
  variant?: 1 | 2 | 3;
};

const marks = {
  1: (
    <path d="M16 4l3.5 7 7.5 1-5.5 5 1.5 7.5L16 21l-7 3.5L10.5 17 5 12l7.5-1L16 4z" />
  ),
  2: (
    <path d="M16 4a12 12 0 1 0 12 12 6 6 0 0 1-6-6V4h-6z" />
  ),
  3: (
    <path d="M4 16C4 9 9 4 16 4s12 5 12 12-5 12-12 12c-3 0-6-1.5-8-4l4-4c1 1.5 2.5 2 4 2 3.3 0 6-2.7 6-6s-2.7-6-6-6c-1.5 0-3 .5-4 2L8 8c2-2.5 5-4 8-4z" />
  ),
} as const;

export function LogoipsumLogo({ variant = 1, ...props }: LogoipsumProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 32"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <g transform="translate(0, 0)">{marks[variant]}</g>
      <text
        x="40"
        y="22"
        fontFamily="Outfit, system-ui, sans-serif"
        fontSize="18"
        fontWeight="700"
        fill="currentColor"
      >
        Logoipsum
      </text>
    </svg>
  );
}
