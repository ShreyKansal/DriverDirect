export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        canvasSoft: "rgb(var(--color-canvas-soft) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        surfaceCard: "rgb(var(--color-panel) / <alpha-value>)",
        surfaceStrong: "rgb(var(--color-surface-strong) / <alpha-value>)",
        cloud: "rgb(var(--color-canvas-soft) / <alpha-value>)",
        fog: "rgb(var(--color-surface-strong) / <alpha-value>)",
        hairline: "rgb(var(--color-hairline) / <alpha-value>)",
        hairlineSoft: "rgb(var(--color-hairline-soft) / <alpha-value>)",
        hairlineStrong: "rgb(var(--color-hairline-strong) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        body: "rgb(var(--color-body) / <alpha-value>)",
        bodyStrong: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        mutedSoft: "rgb(var(--color-muted-soft) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        primaryActive: "rgb(var(--color-primary-active) / <alpha-value>)",
        timelineThinking: "rgb(var(--color-timeline-thinking) / <alpha-value>)",
        timelineGrep: "rgb(var(--color-timeline-grep) / <alpha-value>)",
        timelineRead: "rgb(var(--color-timeline-read) / <alpha-value>)",
        timelineEdit: "rgb(var(--color-timeline-edit) / <alpha-value>)",
        timelineDone: "rgb(var(--color-timeline-done) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        surface: "rgb(var(--color-canvas) / <alpha-value>)",
        panelSoft: "rgb(var(--color-canvas-soft) / <alpha-value>)",
        border: "rgb(var(--color-hairline) / <alpha-value>)",
        accent: "rgb(var(--color-primary) / <alpha-value>)"
      },
      fontFamily: {
        mono: ["'Cascadia Code'", "Consolas", "'Courier New'", "monospace"],
      },
      boxShadow: {
        soft: "none",
        modal: "none"
      }
    }
  },
  plugins: []
};
