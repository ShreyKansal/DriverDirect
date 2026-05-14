// Next.js route handler for /api/run.
// This takes precedence over the next.config.js rewrite for this path, giving us
// full control over SSE streaming — the rewrite proxy buffers responses, which
// breaks live event delivery and can cause 500 errors on long-running workflows.

const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => null);

  // Forward to Express with the SSE Accept header so it knows to stream
  let upstream;
  try {
    upstream = await fetch(`${BACKEND}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return Response.json(
      { status: "error", message: err.message || "Could not reach backend server." },
      { status: 503 }
    );
  }

  // Non-2xx from Express (validation 400, etc.) — pass JSON error through
  if (!upstream.ok) {
    const data = await upstream.json().catch(() => ({}));
    return Response.json(data, { status: upstream.status });
  }

  // Stream the SSE body straight to the browser — no buffering
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }
  });
}
