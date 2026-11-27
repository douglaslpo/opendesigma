import type { HTMLAttributes, ReactNode } from "react";

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: Gap;
  children: ReactNode;
};

const gapClass: Record<Gap, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
  12: "gap-12",
  16: "gap-16",
};

/**
 * Vertical rhythm helper keyed to the DESIGN.md spacing scale.
 * Code Connect stub: `./stack.figma.ts` · registry: `code-connect/registry.json`
 */
export function Stack({
  gap = 4,
  className = "",
  children,
  ...rest
}: StackProps) {
  return (
    <div
      className={["flex flex-col", gapClass[gap], className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
