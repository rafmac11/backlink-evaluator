"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        const from = searchParams.get("from") || "/dashboard";
        router.push(from);
      } else {
        setError("Invalid password. Try again.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 4, marginBottom: 8 }}>BACKLINK INTELLIGENCE</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            Link Value <span style={{ color: "var(--accent)" }}>Platform</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Enter your password to access the dashboard</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
          <label style={{ display: "block", fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && password && login()}
            placeholder="Enter password"
            autoFocus
            style={{
              width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "12px 16px", color: "var(--text)",
              fontFamily: "var(--font-mono)", fontSize: 14, outline: "none", marginBottom: 16,
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />

          {error && (
            <div style={{ background: "#1a0a0a", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 14px", color: "var(--danger)", fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading || !password}
            style={{
              width: "100%", padding: "14px", background: loading ? "var(--surface2)" : "var(--accent)",
              color: loading ? "var(--muted)" : "#000", border: "none", borderRadius: 8,
              fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700,
              cursor: loading || !password ? "not-allowed" : "pointer", letterSpacing: 1,
            }}
          >
            {loading ? "VERIFYING..." : "ACCESS DASHBOARD"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
