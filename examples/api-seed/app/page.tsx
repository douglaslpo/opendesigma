export default function Home() {
  return (
    <main style={{ maxWidth: 40 * 16, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#0c7c72",
          marginBottom: 12,
        }}
      >
        OpenDesigma
      </p>
      <h1 style={{ fontSize: "2rem", lineHeight: 1.2, margin: "0 0 12px" }}>
        API seed — optional backend stubs
      </h1>
      <p style={{ color: "#4a5d6a", lineHeight: 1.6, marginBottom: 24 }}>
        UI-first work stays in{" "}
        <code style={{ fontFamily: "ui-monospace, monospace" }}>
          examples/web-seed
        </code>
        . This package ships minimal Next route handlers you can copy into a
        web app or run alone.
      </p>
      <ul style={{ lineHeight: 1.8, paddingLeft: 18, color: "#0f1c24" }}>
        <li>
          <code>GET /api/health</code> — liveness JSON
        </li>
        <li>
          <code>POST /api/echo</code> — echoes a small JSON body
        </li>
      </ul>
      <p style={{ marginTop: 24, color: "#4a5d6a", fontSize: 14 }}>
        Guide: <code>docs/backend-path.md</code> · skill{" "}
        <code>scaffold-backend</code>
      </p>
    </main>
  );
}
