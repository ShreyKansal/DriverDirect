import { Bot, Calendar, ExternalLink, FolderOpen, GitBranch, Link2, Mail, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useWorkflowStore } from "../../store/workflowStore.js";

function Avatar({ user, size = "lg" }) {
  const name  = user?.name || user?.email || "?";
  const initials = name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const dim   = size === "lg" ? "h-20 w-20 text-[22px]" : "h-9 w-9 text-[13px]";

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${dim} rounded-full border-2 border-hairline object-cover`}
      />
    );
  }
  return (
    <div className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white`}>
      {initials}
    </div>
  );
}

function StatPill({ value, label, Icon }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-body">
      <Icon size={13} className="shrink-0 text-muted" />
      <span className="font-semibold text-ink">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function ProjectCard({ project, isActive }) {
  const nodes = project.workflow?.nodes || [];
  const edges = project.workflow?.edges || [];
  const target = project.workflow?.builderTarget || "langgraph";

  const updated = project.updatedAt
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(project.updatedAt))
    : "—";

  return (
    <div className={`px-5 py-4 transition-colors hover:bg-canvasSoft/50 ${isActive ? "bg-primary/3" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-[14px] font-semibold ${isActive ? "text-primary" : "text-ink"}`}>
              {project.name || "Untitled project"}
            </p>
            {isActive && (
              <span className="rounded-full border border-primary/30 bg-primary/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                Active
              </span>
            )}
          </div>

          {(project.description || project.workflow?.description) && (
            <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">
              {project.description || project.workflow?.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-sm ${target === "langgraph" ? "bg-emerald-500" : "bg-blue-500"}`} />
              {target === "langgraph" ? "LangGraph" : "LangChain"}
            </span>
            <span className="flex items-center gap-1">
              <Bot size={10} />
              {nodes.length} node{nodes.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Link2 size={10} />
              {edges.length} connection{edges.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              Updated {updated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileModal({ onClose }) {
  const { data: session } = useSession();
  const projects        = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);

  const user = session?.user;

  const totalAgents = projects.reduce((sum, p) => sum + (p.workflow?.nodes?.length || 0), 0);
  const totalEdges  = projects.reduce((sum, p) => sum + (p.workflow?.edges?.length || 0), 0);

  const joinDate = (() => {
    if (!projects.length) return null;
    const earliest = Math.min(...projects.map((p) => new Date(p.createdAt || 0).getTime()));
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(earliest));
  })();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 flex h-[min(620px,90vh)] w-[min(780px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-2xl">

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-panel px-5 py-3">
          <p className="text-[13px] font-semibold text-ink">Profile</p>
          <button className="icon-btn h-8 w-8" onClick={onClose} title="Close">
            <X size={14} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left: identity panel */}
          <aside className="flex w-60 shrink-0 flex-col border-r border-hairline bg-panel px-5 py-6">

            <Avatar user={user} size="lg" />

            <div className="mt-4">
              <h2 className="text-[17px] font-bold leading-tight text-ink">
                {user?.name || "Anonymous"}
              </h2>
              {user?.name && user?.email && (
                <p className="mt-0.5 text-[12px] text-muted">{user.email}</p>
              )}
            </div>

            <div className="my-4 h-px bg-hairline" />

            {/* Stats */}
            <div className="space-y-2.5">
              <StatPill value={projects.length} label="Projects"    Icon={FolderOpen} />
              <StatPill value={totalAgents}     label="Agents built" Icon={Bot} />
              <StatPill value={totalEdges}      label="Connections"  Icon={GitBranch} />
            </div>

            <div className="my-4 h-px bg-hairline" />

            {/* Meta */}
            <div className="space-y-2 text-[11px] text-muted">
              {user?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {joinDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="shrink-0" />
                  <span>Member since {joinDate}</span>
                </div>
              )}
            </div>

          </aside>

          {/* Right: projects */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

            {/* Tab bar */}
            <div className="flex shrink-0 items-center gap-4 border-b border-hairline bg-panel px-5">
              <button className="relative flex h-10 items-center gap-1.5 text-[13px] font-semibold text-ink">
                <FolderOpen size={13} />
                Projects
                <span className="ml-0.5 rounded-full bg-surfaceStrong px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                  {projects.length}
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-primary" />
              </button>
            </div>

            {/* Project list */}
            <div className="panel-scroll flex-1 overflow-auto">
              {projects.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairlineStrong bg-canvasSoft">
                    <FolderOpen size={20} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">No projects yet</p>
                    <p className="mt-1 text-[12px] text-muted">Create your first workflow to get started.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {[...projects]
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isActive={project.id === activeProjectId}
                      />
                    ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
