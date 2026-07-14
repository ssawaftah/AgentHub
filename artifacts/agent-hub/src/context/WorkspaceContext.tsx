import { createContext, useContext, useState, useEffect } from "react";

interface WorkspaceContextType {
  activeWorkspaceId: number | null;
  setActiveWorkspaceId: (id: number | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("agenthub_workspace_id");
    return stored ? parseInt(stored, 10) : null;
  });

  const setActiveWorkspaceId = (id: number | null) => {
    setActiveWorkspaceIdState(id);
    if (id !== null) {
      localStorage.setItem("agenthub_workspace_id", id.toString());
    } else {
      localStorage.removeItem("agenthub_workspace_id");
    }
  };

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, setActiveWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
