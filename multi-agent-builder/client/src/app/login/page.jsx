"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const ERROR_MESSAGES = {
  OAuthCallback:      "Google sign-in failed. Check that the redirect URI is registered in your Google Cloud Console.",
  OAuthCreateAccount: "Could not create account with Google. Try again.",
  Callback:           "Authentication callback error. Try again.",
  CredentialsSignin:  "Invalid email or password.",
  Default:            "Something went wrong. Please try again.",
};

function LoginForm() {
  const params = useSearchParams();
  const errorKey  = params.get("error");
  const errorText = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.Default) : null;

  const [tab,     setTab]     = useState("signin"); // "signin" | "google"
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [loading, setLoading] = useState(false);
  const [formErr, setFormErr] = useState("");

  async function handleCredentials(e) {
    e.preventDefault();
    setFormErr("");
    if (!email || !password) { setFormErr("Please fill in all fields."); return; }
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setFormErr("Invalid email or password.");
    } else {
      window.location.href = "/";
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-xl border border-hairline bg-panel px-8 py-10 shadow-2xl">

        {/* Wordmark */}
        <div className="mb-8 flex justify-center">
          <svg width="156" height="28" viewBox="0 0 65 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.56445 2.81836L1.66992 11.6777H0L3.94336 0.181641H6.2168L5.68945 11.6777H4.01367L4.56445 2.81836ZM9.99023 6.62109H12.3223L11.7715 9.44531C11.459 11.0547 10.5078 11.8613 8.91797 11.8652C7.33203 11.8652 6.69531 11.0586 7.00781 9.44531L8.37891 2.41406C8.69141 0.804687 9.64062 0 11.2266 0C12.8164 0 13.4551 0.804687 13.1426 2.41406L12.8379 3.96094H11.1797L11.4844 2.41406C11.582 1.89844 11.3906 1.63867 10.9102 1.63477H10.8984C10.4219 1.63477 10.1348 1.89453 10.0371 2.41406L8.66602 9.44531C8.56445 9.96484 8.75391 10.2246 9.23438 10.2246C9.71875 10.2246 10.0117 9.96484 10.1133 9.44531L10.3477 8.26172H9.67383L9.99023 6.62109ZM14.9824 0.181641H19.2832L18.9668 1.81641H16.3242L15.3867 6.63867H17.6602L17.3438 8.2793H15.0703L14.7246 10.043H17.3672L17.0508 11.6777H12.75L14.9824 0.181641ZM20.5137 0.181641H22.1719L22.4473 6.84961L23.7422 0.181641H25.2773L23.0449 11.6777H21.3867L21.1289 5.2207L19.875 11.6777H18.2812L20.5137 0.181641ZM31.1016 0.181641L30.7852 1.81641H29.2324L27.3164 11.6777H25.6582L27.5742 1.81641H26.0215L26.3379 0.181641H31.1016Z" fill="#E60000"/>
            <path d="M32.1621 0.181641H34.7168C36.1895 0.185547 36.7695 0.992187 36.457 2.60156L35.1621 9.26367C34.8496 10.8691 33.9219 11.6738 32.3789 11.6777H29.9297L32.1621 0.181641ZM33.5039 1.81641L31.9043 10.043H32.6309C33.1113 10.043 33.4023 9.7832 33.5039 9.26367L34.7988 2.60156C34.9004 2.07813 34.7109 1.81641 34.2305 1.81641H33.5039ZM38.3379 0.181641H40.752C42.2246 0.185547 42.8047 0.992187 42.4922 2.60156L41.8594 5.85938C41.6641 6.87109 41.0996 7.53711 40.166 7.85742L41.2852 11.6777H39.4688L38.6602 8.15039L38.4434 8.17969L37.7637 11.6777H36.1055L38.3379 0.181641ZM39.6797 1.81641L38.7422 6.63867H39.123C39.3535 6.63867 39.5156 6.62305 39.668 6.5918C39.9336 6.4707 40.1309 6.22656 40.2012 5.85938L40.834 2.60156C40.9355 2.07813 40.7461 1.81641 40.2656 1.81641H39.6797ZM44.4844 0.181641H46.1426L43.9102 11.6777H42.252L44.4844 0.181641ZM48.9258 11.6777H46.6523L46.9219 4.24805L47.1738 0.181641H48.8496L48.293 9.04102L51.1875 0.181641H52.8633L51.5332 4.25977L48.9258 11.6777ZM53.8652 0.181641H58.166L57.8496 1.81641H55.207L54.2695 6.63867H56.543L56.2266 8.2793H53.9531L53.6074 10.043H56.25L55.9336 11.6777H51.6328L53.8652 0.181641ZM59.3965 0.181641H61.8105C63.2832 0.185547 63.8633 0.992187 63.5508 2.60156L62.918 5.85938C62.7227 6.87109 62.1582 7.53711 61.2246 7.85742L62.3438 11.6777H60.5273L59.7188 8.15039L59.502 8.17969L58.8223 11.6777H57.1641L59.3965 0.181641ZM60.7383 1.81641L59.8008 6.63867H60.1816C60.4121 6.63867 60.5742 6.62305 60.668 6.5918C60.9922 6.4707 61.1895 6.22656 61.2598 5.85938L61.8926 2.60156C61.9941 2.07813 61.8047 1.81641 61.3242 1.81641H60.7383Z" fill="currentColor"/>
          </svg>
        </div>

        <p className="mb-6 text-center text-[13px] text-muted">Sign in to continue</p>

        {/* OAuth error banner */}
        {errorText && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
            {errorText}
          </div>
        )}

        {/* Email / password form */}
        <form onSubmit={handleCredentials} className="mb-4 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-hairlineStrong bg-canvas px-3 py-2 text-[13px] text-ink placeholder-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-hairlineStrong bg-canvas px-3 py-2 text-[13px] text-ink placeholder-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />

          {formErr && (
            <p className="text-[12px] text-red-500">{formErr}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : "Sign in"}
          </button>
        </form>

        {/* Forgot password */}
        <div className="mb-4 text-right">
          <a href="/forgot-password" className="text-[12px] text-muted transition hover:text-ink">
            Forgot password?
          </a>
        </div>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-[11px] text-muted">or</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-hairlineStrong bg-panel px-4 py-2.5 text-[13px] font-medium text-ink shadow-sm transition hover:bg-canvasSoft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-hairlineStrong border-t-primary" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Register link */}
        <p className="mt-6 text-center text-[12px] text-muted">
          No account?{" "}
          <a href="/register" className="font-medium text-ink transition hover:text-primary">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
