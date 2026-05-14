const nextConfig = (phase) => ({
  distDir: phase === "phase-development-server" ? ".next" : "build",
  async rewrites() {
    // Use `fallback` so App Router route handlers (NextAuth at /api/auth/*)
    // are evaluated first. Only paths with no matching handler reach Express.
    return {
      beforeFiles: [],
      afterFiles:  [],
      fallback: [
        {
          source:      "/api/:path*",
          destination: "http://localhost:4000/api/:path*"
        }
      ]
    };
  }
});

export default nextConfig;
