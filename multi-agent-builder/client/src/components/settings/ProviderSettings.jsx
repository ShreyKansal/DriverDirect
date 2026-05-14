import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  TriangleAlert,
  Zap
} from "lucide-react";

const PROVIDER_COLOR = {
  groq:      "border-orange-400/30 bg-orange-50 text-orange-500",
  openai:    "border-zinc-300/50 bg-zinc-50 text-zinc-900",
  anthropic: "border-[#D77655]/25 bg-[#D77655]/10",
  google:    "border-blue-300/30 bg-blue-50/70"
};

function OpenAILogo({ className = "" }) {
  return (
    <svg viewBox="0 0 320 320" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z"
      />
    </svg>
  );
}

function AnthropicLogo({ className = "" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 509.64" className={className} aria-hidden="true">
      <path fill="#D77655" d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.612-115.613 115.612H115.612C52.026 509.639 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"/>
      <path fill="#FCF2EE" fillRule="nonzero" d="M142.27 316.619l73.655-41.326 1.238-3.589-1.238-1.996-3.589-.001-12.31-.759-42.084-1.138-36.498-1.516-35.361-1.896-8.897-1.895-8.34-10.995.859-5.484 7.482-5.03 10.717.935 23.683 1.617 35.537 2.452 25.782 1.517 38.193 3.968h6.064l.86-2.451-2.073-1.517-1.618-1.517-36.776-24.922-39.81-26.338-20.852-15.166-11.273-7.683-5.687-7.204-2.451-15.721 10.237-11.273 13.75.935 3.513.936 13.928 10.716 29.749 23.027 38.848 28.612 5.687 4.727 2.275-1.617.278-1.138-2.553-4.271-21.13-38.193-22.546-38.848-10.035-16.101-2.654-9.655c-.935-3.968-1.617-7.304-1.617-11.374l11.652-15.823 6.445-2.073 15.545 2.073 6.547 5.687 9.655 22.092 15.646 34.78 24.265 47.291 7.103 14.028 3.791 12.992 1.416 3.968 2.449-.001v-2.275l1.997-26.641 3.69-32.707 3.589-42.084 1.239-11.854 5.863-14.206 11.652-7.683 9.099 4.348 7.482 10.716-1.036 6.926-4.449 28.915-8.72 45.294-5.687 30.331h3.313l3.792-3.791 15.342-20.372 25.782-32.227 11.374-12.789 13.27-14.129 8.517-6.724 16.1-.001 11.854 17.617-5.307 18.199-16.581 21.029-13.75 17.819-19.716 26.54-12.309 21.231 1.138 1.694 2.932-.278 44.536-9.479 24.062-4.347 28.714-4.928 12.992 6.066 1.416 6.167-5.106 12.613-30.71 7.583-36.018 7.204-53.636 12.689-.657.48.758.935 24.164 2.275 10.337.556h25.301l47.114 3.514 12.309 8.139 7.381 9.959-1.238 7.583-18.957 9.655-25.579-6.066-59.702-14.205-20.474-5.106-2.83-.001v1.694l17.061 16.682 31.266 28.233 39.152 36.397 1.997 8.999-5.03 7.102-5.307-.758-34.401-25.883-13.27-11.651-30.053-25.302-1.996-.001v2.654l6.926 10.136 36.574 54.975 1.895 16.859-2.653 5.485-9.479 3.311-10.414-1.895-21.408-30.054-22.092-33.844-17.819-30.331-2.173 1.238-10.515 113.261-4.929 5.788-11.374 4.348-9.478-7.204-5.03-11.652 5.03-23.027 6.066-30.052 4.928-23.886 4.449-29.674 2.654-9.858-.177-.657-2.173.278-22.37 30.71-34.021 45.977-26.919 28.815-6.445 2.553-11.173-5.789 1.037-10.337 6.243-9.2 37.257-47.392 22.47-29.371 14.508-16.961-.101-2.451h-.859l-98.954 64.251-17.618 2.275-7.583-7.103.936-11.652 3.589-3.791 29.749-20.474-.101.102.024.101z"/>
    </svg>
  );
}

function GeminiLogo({ className = "" }) {
  return (
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" className={className} aria-hidden="true">
      <mask id="gemini-mask-2025" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65">
        <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/>
        <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#gemini-grad-2025)"/>
      </mask>
      <g mask="url(#gemini-mask-2025)">
        <g filter="url(#gf0)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/></g>
        <g filter="url(#gf1)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/></g>
        <g filter="url(#gf2)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g>
        <g filter="url(#gf3)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/></g>
        <g filter="url(#gf4)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/></g>
        <g filter="url(#gf5)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/></g>
        <g filter="url(#gf6)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/></g>
        <g filter="url(#gf7)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/></g>
        <g filter="url(#gf8)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/></g>
        <g filter="url(#gf9)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/></g>
      </g>
      <defs>
        <linearGradient id="gemini-grad-2025" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4893FC"/>
          <stop offset=".27" stopColor="#4893FC"/>
          <stop offset=".777" stopColor="#969DFF"/>
          <stop offset="1" stopColor="#BD99FE"/>
        </linearGradient>
        <filter id="gf0" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf1" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf2" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf3" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf4" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf5" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf6" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf7" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf8" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67"/></filter>
        <filter id="gf9" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67"/></filter>
      </defs>
    </svg>
  );
}

function GroqLogo({ className = "" }) {
  return <Zap className={className} aria-hidden="true" />;
}

function ProviderLogoFallback({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 2.75 20 7.25v9.5l-8 4.5-8-4.5v-9.5zm0 2.3L6 8.43v6.14l6 3.38 6-3.38V8.43zm0 4.08 3.05 1.74v2.26L12 14.87l-3.05-1.74v-2.26z" />
    </svg>
  );
}

const PROVIDER_LOGO = {
  groq:      GroqLogo,
  openai:    OpenAILogo,
  anthropic: AnthropicLogo,
  google:    GeminiLogo
};

function ProviderRow({ provider, projectId, initialStatus, onStatusChange }) {
  const [status, setStatus]     = useState(initialStatus);
  const [editing, setEditing]   = useState(!initialStatus);
  const [apiKey, setApiKey]     = useState("");
  const [showKey, setShowKey]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const isConfigured = !!status;
  const colorCls     = PROVIDER_COLOR[provider.id] || "border-hairline bg-surfaceStrong text-muted";
  const ProviderLogo = PROVIDER_LOGO[provider.id] || ProviderLogoFallback;
  const logoSize     = (provider.id === "anthropic" || provider.id === "google") ? "h-7 w-7" : "h-4 w-4";

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true); setTestResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/keys/${provider.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      if (res.ok) {
        const next = { preview: `${apiKey.trim().slice(0, 6)}........`, updatedAt: new Date().toISOString() };
        setStatus(next); onStatusChange(provider.id, next); setApiKey(""); setEditing(false);
      }
    } finally { setSaving(false); }
  }

  async function handleTest() {
    if (!apiKey.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/keys/${provider.id}/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      setTestResult(await res.json());
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    finally { setTesting(false); }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await fetch(`/api/projects/${projectId}/keys/${provider.id}`, { method: "DELETE" });
      setStatus(null); onStatusChange(provider.id, null); setEditing(true); setApiKey("");
    } finally { setRemoving(false); }
  }

  return (
    <div>
      {/* ── Provider header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${colorCls}`}>
          <ProviderLogo className={logoSize} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">{provider.name}</span>
            {isConfigured && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                <CheckCircle2 size={9} /> Configured
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted">{provider.keyHint}</p>
        </div>
        <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-[11px] text-muted transition hover:text-ink flex items-center gap-0.5">
          Get key <ExternalLink size={10} />
        </a>
      </div>

      {/* ── Configured: key preview strip ───────────────────────────────── */}
      {isConfigured && !editing && (
        <div className="flex items-center gap-2 border-t border-hairline/60 bg-canvasSoft/60 px-4 py-2">
          <span className="min-w-0 flex-1 font-mono text-[12px] text-body">{status.preview}</span>
          {status.updatedAt && (
            <span className="shrink-0 text-[11px] text-muted">
              Updated {new Date(status.updatedAt).toLocaleDateString("en-GB")}
            </span>
          )}
          <button className="btn h-7 px-2.5 text-[11px]" onClick={() => setEditing(true)}>
            Change
          </button>
          <button className="btn-danger h-7 w-7 p-0" onClick={handleRemove} disabled={removing} title="Remove key">
            {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
          </button>
        </div>
      )}

      {/* ── Unconfigured / editing: input row ───────────────────────────── */}
      {(!isConfigured || editing) && (
        <div className="border-t border-hairline/60 px-4 py-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                className="input w-full pr-9 font-mono text-[12px]"
                type={showKey ? "text" : "password"}
                placeholder={provider.keyHint}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus={editing && isConfigured}
              />
              <button
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:text-ink"
                onClick={() => setShowKey((v) => !v)}
                tabIndex={-1}
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <button className="btn h-9 px-3 text-[12px]" onClick={handleTest} disabled={!apiKey.trim() || testing}>
              {testing ? <Loader2 size={12} className="animate-spin" /> : "Test"}
            </button>
            <button className="btn-primary h-9 px-3 text-[12px]" onClick={handleSave} disabled={!apiKey.trim() || saving}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : (isConfigured ? "Update" : "Save")}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isConfigured && editing && (
              <button className="text-[11px] text-muted transition hover:text-ink"
                onClick={() => { setEditing(false); setApiKey(""); setTestResult(null); }}>
                Cancel
              </button>
            )}
            {testResult && (
              <p className={`flex items-center gap-1 text-[12px] ${testResult.ok ? "text-success" : "text-error"}`}>
                {testResult.ok
                  ? <><CheckCircle2 size={12} /> Valid key</>
                  : <><TriangleAlert size={12} /> {testResult.error}</>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProviderSettings({ projectId }) {
  const [providers, setProviders] = useState([]);
  const [configured, setConfigured] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/api/agents/providers").then((response) => response.json()),
      fetch(`/api/projects/${projectId}/keys`).then((response) => response.json())
    ])
      .then(([{ providers: providerList }, { configured: configuredList }]) => {
        setProviders(providerList || []);
        const map = {};
        for (const entry of configuredList || []) map[entry.providerId] = entry;
        setConfigured(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleStatusChange = useCallback((providerId, status) => {
    setConfigured((prev) => {
      const next = { ...prev };
      if (status) next[providerId] = status;
      else delete next[providerId];
      return next;
    });
  }, []);

  if (!projectId) {
    return (
      <div className="rounded-md border border-dashed border-hairlineStrong px-4 py-6 text-center">
        <p className="text-[13px] font-semibold text-ink">Save the project first</p>
        <p className="mt-1 text-[12px] text-muted">Provider keys need a project identifier before they can be stored.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-[12px] text-muted"><Loader2 size={13} className="animate-spin" />Loading providers...</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-panel divide-y divide-hairline">
      {providers.map((provider) => (
        <ProviderRow
          key={`${projectId}-${provider.id}`}
          provider={provider}
          projectId={projectId}
          initialStatus={configured[provider.id] || null}
          onStatusChange={handleStatusChange}
        />
      ))}
      {providers.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-ink">No providers available</p>
          <p className="mt-1 text-[12px] text-muted">The server did not return any configured model providers.</p>
        </div>
      )}
    </div>
  );
}
