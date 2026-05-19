import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "./components/layout/Header.jsx";
import ThreePanelLayout from "./components/layout/ThreePanelLayout.jsx";
import ArchitecturePicker from "./components/modals/ArchitecturePicker.jsx";
import { useWorkflowStore } from "./store/workflowStore.js";
import { syncUser } from "./api/projectApi.js";

export default function App() {
  const needsArchitectureSelection = useWorkflowStore((s) => s.needsArchitectureSelection);
  const hydrateFromStorage         = useWorkflowStore((s) => s.hydrateFromStorage);
  const setCurrentUser             = useWorkflowStore((s) => s.setCurrentUser);
  const { data: session, status }  = useSession();
  const router                     = useRouter();

  // Use session?.user?.email (a stable string) as the dependency — NOT session?.user (an object).
  // next-auth creates a new user object reference on every session refresh (browser tab refocus,
  // token expiry, etc.), which would re-run this effect and call hydrateFromStorage, resetting
  // the active workspace tab to "workflow" even when the user has settings open.
  const userEmail = session?.user?.email;
  const userId    = session?.user?.id;
  useEffect(() => {
    if (status !== "authenticated" || !userEmail) return;
    const user = session.user;
    setCurrentUser(user);
    syncUser({ id: userId, email: userEmail, name: user.name, picture: user.image })
      .catch(() => {})
      .finally(() => hydrateFromStorage(userEmail || userId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmail, userId]);

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
