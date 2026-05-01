import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type Tab = "login" | "register";

type Props = {
  onClose: () => void;
};

type ApiError = { detail?: string; email?: string[]; password?: string[]; password2?: string[]; non_field_errors?: string[] };

function extractError(data: ApiError): string {
  return (
    data.detail ??
    data.non_field_errors?.[0] ??
    data.email?.[0] ??
    data.password?.[0] ??
    data.password2?.[0] ??
    "Something went wrong."
  );
}

export function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "auth/login/" : "auth/register/";
      const body = tab === "login" ? { email, password } : { email, password, password2 };
      const res = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { access?: string; refresh?: string } & ApiError;
      if (!res.ok) {
        setError(extractError(data));
        return;
      }
      await login(data.access!, data.refresh!);
      onClose();
    } catch {
      setError("Unable to reach server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential }),
      });
      const data = (await res.json()) as { access?: string; refresh?: string } & ApiError;
      if (!res.ok) {
        setError(extractError(data));
        return;
      }
      await login(data.access!, data.refresh!);
      onClose();
    } catch {
      setError("Unable to reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-tabs">
          <button
            type="button"
            className={tab === "login" ? "modal-tab active" : "modal-tab"}
            onClick={() => { setTab("login"); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={tab === "register" ? "modal-tab active" : "modal-tab"}
            onClick={() => { setTab("register"); setError(null); }}
          >
            Create Account
          </button>
        </div>

        <div className="modal-google">
          <GoogleLogin
            onSuccess={(cr) => handleGoogleSuccess(cr.credential!)}
            onError={() => setError("Google sign-in failed.")}
            width="100%"
            text={tab === "login" ? "signin_with" : "signup_with"}
          />
        </div>

        <div className="modal-divider"><span>or</span></div>

        <form onSubmit={handleEmailSubmit} className="modal-form">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            minLength={8}
          />

          {tab === "register" && (
            <>
              <label htmlFor="auth-password2">Confirm Password</label>
              <input
                id="auth-password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
              />
            </>
          )}

          {error && <p className="message error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
