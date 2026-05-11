"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** px from viewport top when card fits comfortably */
  topPadding?: number;
  /** px from viewport bottom when card is taller than viewport */
  bottomPadding?: number;
  /** Sticky only kicks in at viewports >= this width */
  desktopBreakpoint?: number;
};

/**
 * Smart sticky wrapper.
 *
 * If the inner card fits inside (viewport − top − bottom padding), it sticks
 * to `topPadding` from the viewport top — standard sticky behavior.
 *
 * If the card is taller than the viewport, it sticks such that the card's
 * BOTTOM aligns with `viewport − bottomPadding`. The card scrolls up
 * naturally first; once fully revealed, it stays in view with its bottom
 * (incl. CTA buttons) always visible.
 *
 * Disabled below `desktopBreakpoint` — card flows normally on mobile.
 */
export function StickyCard({
  children,
  topPadding = 96,
  bottomPadding = 24,
  desktopBreakpoint = 1024,
}: Props) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stickyEl = stickyRef.current;
    const cardEl = cardRef.current;
    if (!stickyEl || !cardEl) return;

    const compute = () => {
      if (window.innerWidth < desktopBreakpoint) {
        stickyEl.style.position = "";
        stickyEl.style.top = "";
        return;
      }

      const cardH = cardEl.offsetHeight;
      const vh = window.innerHeight;
      const fits = cardH + topPadding + bottomPadding <= vh;
      const top = fits ? topPadding : vh - cardH - bottomPadding;

      stickyEl.style.position = "sticky";
      stickyEl.style.top = `${top}px`;
    };

    compute();

    const ro = new ResizeObserver(compute);
    ro.observe(cardEl);
    window.addEventListener("resize", compute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [topPadding, bottomPadding, desktopBreakpoint]);

  return (
    <div ref={stickyRef}>
      <div ref={cardRef}>{children}</div>
    </div>
  );
}
