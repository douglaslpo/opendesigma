import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

type SharedProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export type ButtonProps = SharedProps &
  (
    | ({ href: string } & Omit<
        ButtonHTMLAttributes<HTMLAnchorElement>,
        "href" | "children" | "className"
      >)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:brightness-110 focus-visible:outline-accent",
  ghost:
    "bg-transparent text-ink border border-line hover:bg-surface focus-visible:outline-accent",
};

function buttonClass(variant: Variant, className: string) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3",
    "text-base font-medium tracking-tight transition-[filter,background-color]",
    "duration-[var(--motion-fast)] ease-[var(--ease-out)]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Canonical action control. Agents must reuse this instead of inventing
 * another button with one-off hex styles.
 *
 * Code Connect stub: `./button.figma.ts` · registry: `code-connect/registry.json`
 */
export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = buttonClass(variant, className);

  if ("href" in rest && rest.href) {
    const { href, ...linkRest } = rest;
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a href={href} className={classes} {...linkRest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonHTMLAttributes<
    HTMLButtonElement
  > & { href?: undefined };

  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
