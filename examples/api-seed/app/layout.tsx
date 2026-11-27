import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "OpenDesigma API seed",
  description: "Minimal Next App Router API stubs for the optional backend path.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#e6eef3",
          color: "#0f1c24",
        }}
      >
        {children}
      </body>
    </html>
  );
}
