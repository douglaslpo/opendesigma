import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:brightness-110 focus-visible:outline-accent",
  ghost:
    "bg-transparent text-ink border border-line hover:bg-surface focus-visible:outline-accent",
};

/**
 * Canonical action control. Agents must reuse this instead of inventing
 * another button with one-off hex styles.
 */
export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3",
        "text-base font-medium tracking-tight transition-[filter,background-color]",
        "duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
