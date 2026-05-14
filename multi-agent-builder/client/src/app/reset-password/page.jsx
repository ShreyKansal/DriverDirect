"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const params  = useSearchParams();
  const router  = useRouter();
  const token   = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);
  const [tokenOk,  setTokenOk]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    fetch(`/api/users/reset-password/${token}`)
      .then((r) => r.json())
      .then((d) => setTokenOk(d.status === "ok"))
      .catch(() => setTokenOk(false))
      .finally(() => setChecking(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/users/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Reset failed."); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-xl border border-hairline bg-panel px-8 py-10 shadow-2xl">

        <div className="mb-8 flex justify-center">
          <svg width="156" height="28" viewBox="0 0 65 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.56445 2.81836L1.66992 11.6777H0L3.94336 0.181641H6.2168L5.68945 11.6777H4.01367L4.56445 2.81836ZM9.99023 6.62109H12.3223L11.7715 9.44531C11.459 11.0547 10.5078 11.8613 8.91797 11.8652C7.33203 11.8652 6.69531 11.0586 7.00781 9.44531L8.37891 2.41406C8.69141 0.804687 9.64062 0 11.2266 0C12.8164 0 13.4551 0.804687 13.1426 2.41406L12.8379 3.96094H11.1797L11.4844 2.41406C11.582 1.89844 11.3906 1.63867 10.9102 1.63477H10.8984C10.4219 1.63477 10.1348 1.89453 10.0371 2.41406L8.66602 9.44531C8.56445 9.96484 8.75391 10.2246 9.23438 10.2246C9.71875 10.2246 10.0117 9.96484 10.1133 9.44531L10.3477 8.26172H9.67383L9.99023 6.62109ZM14.9824 0.181641H19.2832L18.9668 1.81641H16.3242L15.3867 6.63867H17.6602L17.3438 8.2793H15.0703L14.7246 10.043H17.3672L17.0508 11.6777H12.75L14.9824 0.181641ZM20.5137 0.181641H22.1719L22.4473 6.84961L23.7422 0.181641H25.2773L23.0449 11.6777H21.3867L21.1289 5.2207L19.875 11.6777H18.2812L20.5137 0.181641ZM31.1016 0.181641L30.7852 1.81641H29.2324L27.3164 11.6777H25.6582L27.5742 1.81641H26.0215L26.3379 0.181641H31.1016Z" fill="#E60000"/>
            <path d="M32.1621 0.181641H34.7168C36.1895 0.185547 36.7695 0.992187 36.457 2.60156L35.1621 9.26367C34.8496 10.8691 33.9219 11.6738 32.3789 11.6777H29.9297L32.1621 0.181641ZM33.5039 1.81641L31.9043 10.043H32.6309C33.1113 10.043 33.4023 9.7832 33.5039 9.26367L34.7988 2.60156C34.9004 2.07813 34.7109 1.81641 34.2305 1.81641H33.5039ZM38.3379 0.181641H40.752C42.2246 0.185547 42.8047 0.992187 42.4922 2.60156L41.8594 5.85938C41.6641 6.87109 41.0996 7.53711 40.166 7.85742L41.2852 11.6777H39.4688L38.6602 8.15039L38.4434 8.17969L37.7637 11.6777H36.1055L38.3379 0.181641ZM39.6797 1.81641L38.7422 6.63867H39.123C39.3535 6.63867 39.5156 6.62305 39.668 6.5918C39.9336 6.4707 40.1309 6.22656 40.2012 5.85938L40.834 2.60156C40.9355 2.07813 40.7461 1.81641 40.2656 1.81641H39.6797ZM44.4844 0.181641H46.1426L43.9102 11.6777H42.252L44.4844 0.181641ZM48.9258 11.6777H46.6523L46.9219 4.24805L47.1738 0.181641H48.8496L48.293 9.04102L51.1875 0.181641H52.8633L51.5332 4.25977L48.9258 11.6777ZM53.8652 0.181641H58.166L57.8496 1.81641H55.207L54.2695 6.63867H56.543L56.2266 8.2793H53.9531L53.6074 10.043H56.25L55.9336 11.6777H51.6328L53.8652 0.181641ZM59.3965 0.181641H61.8105C63.2832 0.185547 63.8633 0.992187 63.5508 2.60156L62.918 5.85938C62.7227 6.87109 62.1582 7.53711 61.2246 7.85742L62.3438 11.6777H60.5273L59.7188 8.15039L59.502 8.17969L58.8223 11.6777H57.1641L59.3965 0.181641ZM60.7383 1.81641L59.8008 6.63867H60.1816C60.4121 6.63867 60.5742 6.62305 60.668 6.5918C60.9922 6.4707 61.1895 6.22656 61.2598 5.85938L61.8926 2.60156C61.9941 2.07813 61.8047 1.81641 61.3242 1.81641H60.7383Z" fill="currentColor"/>
          </svg>
        </div>

        {checking && (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-hairlineStrong border-t-primary" />
          </div>
        )}

        {!checking && !tokenOk && (
          <div className="text-center">
            <p className="mb-2 text-[14px] font-semibold text-ink">Link expired or invalid</p>
            <p className="mb-6 text-[12px] text-muted">Reset links are valid for 1 hour and can only be used once.</p>
            <a href="/forgot-password" className="text-[13px] font-medium text-primary transition hover:underline">
              Request a new link
            </a>
          </div>
        )}

        {!checking && tokenOk && !done && (
          <>
            <p className="mb-6 text-center text-[13px] text-muted">Choose a new password.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-hairlineStrong bg-canvas px-3 py-2 text-[13px] text-ink placeholder-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-md border border-hairlineStrong bg-canvas px-3 py-2 text-[13px] text-ink placeholder-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />

              {error && <p className="text-[12px] text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : "Set new password"}
              </button>
            </form>
          </>
        )}

        {done && (
          <div className="text-center">
            <p className="mb-2 text-[14px] font-semibold text-ink">Password updated</p>
            <p className="text-[12px] text-muted">Redirecting you to sign in…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
