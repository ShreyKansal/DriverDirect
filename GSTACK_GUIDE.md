# Using gstack in Claude Code — DriverDirect Guide

gstack is a collection of 48 specialized AI agents that run inside Claude Code as slash commands. Think of them as expert teammates — a staff engineer, a QA lead, a security auditor, a designer — each with their own methodology for a specific job.

---

## How It Works

In any Claude Code session, type a skill name and Claude automatically loads that agent's full methodology. No configuration needed — just type it.

```
/review
/qa
/investigate
/cso
```

gstack is already installed at `~/.claude/skills/gstack` and registered in this project's `CLAUDE.md`, so all skills are available immediately.

---

## The Skills, Explained

### Planning & Architecture

**`/autoplan`** — Full planning pipeline. Runs CEO → design → eng → DX reviews in sequence. Use this at the start of any significant feature before writing code. It will challenge scope, surface edge cases, and flag missing UX decisions.

```
# Good times to use:
/autoplan  # before building a new canvas feature
/autoplan  # before adding a new LLM provider
```

**`/office-hours`** — Product interrogation. Asks forcing questions about what you're actually trying to build and why. Great when a feature feels vague.

**`/plan-eng-review`** — Architecture and edge case audit. Looks for lock-in, missing error handling, and scaling problems in your plan.

**`/plan-design-review`** — Design system audit. Checks whether your plan respects the existing Vodafone theme, component patterns, and visual consistency.

**`/plan-ceo-review`** — Strategic scope challenge. Asks if you're solving the right problem and flags over-engineering.

---

### Code Quality & Debugging

**`/review`** — Staff engineer code review. Reads your changes, flags real issues (not style nitpicks), and auto-fixes them. Use after finishing a feature.

```
/review  # reviews staged/recent changes
```

**`/investigate`** — Root cause debugging methodology. When something is broken and you don't know why, this walks through a structured diagnosis: reproduce → isolate → trace → fix. Much better than guessing.

```
# Example prompts that trigger it:
/investigate — the OutputPanel is not showing tool call results
/investigate — agent execution hangs after the bootstrap phase
```

**`/health`** — Project health check. Scans for broken imports, missing env vars, obvious misconfigurations.

---

### Browser & UI Testing

**`/qa`** — Full browser-based QA with Playwright Chromium. Opens the app in a real browser, exercises user flows, finds bugs, writes regression tests. This is your automated tester.

```
/qa  # runs against the running dev server
```

**`/qa-only`** — Same as /qa but produces a report without modifying code. Use when you want findings without auto-fixes.

**`/browse`** — Manual browser control. Navigate to any URL, click things, take screenshots, fill forms. Use when you need to inspect something specific in the live app.

```
/browse http://localhost:3000  # open the DriverDirect UI
/browse — take a screenshot of the canvas with a node selected
```

**`/design-review`** — Live design audit. Opens the UI, checks spacing, color consistency, typography, and Vodafone brand compliance, then fixes issues.

---

### Design Iteration

**`/design-shotgun`** — Generates 4–6 mockup variants for a UI component or layout. Opens a side-by-side comparison board. Good when you want to explore options before committing.

```
/design-shotgun — explore layouts for the right panel Config tab
/design-shotgun — try variations of the node card design
```

**`/design-html`** — Converts an approved mockup to production HTML/CSS (30KB, zero dependencies). Use after /design-shotgun picks a winner.

**`/design-consultation`** — Builds or refines a design system from scratch. Useful if you want to document the Vodafone theme as a formal system with tokens and rules.

---

### Security

**`/cso`** — Security audit using OWASP Top 10 + STRIDE threat modeling. Reads your code, finds vulnerabilities, and writes fixes. Run this before shipping anything that touches the key store, API endpoints, or the Docker sandbox.

```
/cso  # full audit of current changes
/cso — focus on the keyStore and sandboxManager
```

---

### Documentation

**`/document-generate`** — Generates missing documentation using the Diataxis framework (tutorials, how-tos, reference, explanation). Run when you add a new system like custom providers.

**`/document-release`** — Auto-updates docs to match what actually shipped. Run after merging a feature.

---

### Shipping

**`/ship`** — Full pre-ship checklist: sync, test, audit coverage, push, open PR. Handles the whole pipeline in one command.

**`/canary`** — Post-deploy monitoring loop. Watches logs and metrics after a deploy and alerts on anomalies.

**`/land-and-deploy`** — Merges a PR and verifies production is healthy.

---

### Safety Guardrails

**`/careful`** — Activates warnings before any destructive operation (file deletes, database drops, etc.). Turn this on when doing risky refactors.

**`/freeze`** — Restricts edits to a single directory. Useful when debugging — prevents accidental changes outside the area you're investigating.

```
/freeze server/services/sandboxManager.js  # only edit this file
```

**`/guard`** — Combines /careful + /freeze. Maximum safety mode.

**`/unfreeze`** — Removes the freeze restriction.

---

### Learning & Memory

**`/learn`** — Saves a pattern or decision across sessions. gstack will apply it in future runs.

```
/learn — always use rounded-full for primary action buttons (Vodafone theme)
/learn — the Docker sandbox must be stopped in a finally block
```

**`/retro`** — Weekly engineering retrospective. Reviews what shipped, what broke, what patterns emerged. Good Friday habit.

---

## Recommended Workflows for DriverDirect

### Starting a New Feature
```
/autoplan         → challenge the scope and design
/plan-eng-review  → catch architecture issues early
(build the feature)
/review           → staff engineer review
/qa               → browser test the golden path
/cso              → security check if it touches keys/API/sandbox
/ship             → push and open PR
```

### Debugging a Production Issue
```
/careful          → prevent accidental damage while debugging
/investigate      → structured root cause analysis
/freeze           → lock to the affected file while fixing
/qa               → verify the fix didn't break anything else
/unfreeze
```

### UI Work
```
/design-shotgun   → explore layout options
/design-review    → audit against Vodafone theme
/qa               → Playwright visual regression test
```

### Pre-Ship Security Check
```
/cso              → OWASP + STRIDE audit
/review           → final code review
/ship
```

---

## Maintenance

**Update gstack:**
```
/gstack-upgrade
```
Or manually:
```bash
cd ~/.claude/skills/gstack && git pull && bash ./setup
```
> On Windows, setup uses file copies (not symlinks), so you must re-run `./setup` after every pull.

**Check version:**
```bash
cat ~/.claude/skills/gstack/VERSION
```

---

## Tips

- Skills are context-aware — they read your current files, git diff, and branch automatically.
- You can chain them: `/investigate` findings feed directly into `/review` fixes.
- `/learn` is powerful — the more you teach it about DriverDirect's patterns (Vodafone theme rules, sandbox lifecycle, etc.), the better future sessions get.
- `/browse` uses a real Chromium instance with anti-bot stealth — it can test things that headless tools miss.
- Telemetry is off by default. To check: `~/.claude/skills/gstack/bin/gstack-config get telemetry`
