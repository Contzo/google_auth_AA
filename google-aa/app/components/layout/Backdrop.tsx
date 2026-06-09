/* ============================================================
   Backdrop — shared dotted-grid + glow background.
   `variant="login"` centers a radial mask; "dashboard" fades
   from the top. Purely decorative, pointer-events: none.
   ============================================================ */

interface BackdropProps {
  variant?: "login" | "dashboard";
}

export function Backdrop({ variant = "dashboard" }: BackdropProps) {
  const isLogin = variant === "login";

  const glow = isLogin
    ? "radial-gradient(1100px 560px at 50% -8%, rgba(134,217,198,0.10), transparent 58%)," +
      "radial-gradient(800px 460px at 50% 118%, rgba(70,90,120,0.10), transparent 60%)"
    : "radial-gradient(1200px 520px at 78% -12%, rgba(134,217,198,0.07), transparent 60%)";

  const mask = isLogin
    ? "radial-gradient(620px 620px at 50% 42%, #000 28%, transparent 76%)"
    : "linear-gradient(#000, transparent 30%)";

  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </>
  );
}
