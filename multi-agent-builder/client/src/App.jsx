import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "./components/layout/Header.jsx";
import ThreePanelLayout from "./components/layout/ThreePanelLayout.jsx";
import ArchitecturePicker from "./components/modals/ArchitecturePicker.jsx";
import { useWorkflowStore } from "./store/workflowStore.js";
import { syncUser } from "./api/projectApi.js";
import { useTheme } from "./hooks/useTheme.js";

export default function App() {
  const needsArchitectureSelection = useWorkflowStore((s) => s.needsArchitectureSelection);
  const hydrateFromStorage         = useWorkflowStore((s) => s.hydrateFromStorage);
  const setCurrentUser             = useWorkflowStore((s) => s.setCurrentUser);
  const { data: session, status }  = useSession();
  const router                     = useRouter();
  useTheme();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const user = session.user;
    setCurrentUser(user);
    syncUser({ id: user.id, email: user.email, name: user.name, picture: user.image })
      .catch(() => {})
      .finally(() => hydrateFromStorage(user.email));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairlineStrong border-t-primary" />
          <span className="text-[12px] text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return (
    <div className="h-screen bg-canvas text-ink">
      <Header />
      <ThreePanelLayout />
      {needsArchitectureSelection && <ArchitecturePicker />}
    </div>
  );
}
