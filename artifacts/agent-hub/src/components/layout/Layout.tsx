import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Bot, LayoutDashboard, Building2, Users, Settings, LogOut, Menu, X, PlusCircle } from "lucide-react";
import { useListWorkspaces } from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const [location] = useLocation();
  const { activeWorkspaceId } = useWorkspace();
  const { data: workspaces } = useListWorkspaces();

  const activeWorkspace = workspaces?.find(w => w.id === activeWorkspaceId);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Businesses", href: "/businesses", icon: Building2 },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "Workspaces", href: "/workspaces", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-3 text-lg font-bold tracking-tight text-foreground">AgentHub <span className="text-primary">AI</span></span>
          <button 
            className="ml-auto md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Workspace</p>
          {activeWorkspace ? (
            <div className="flex items-center gap-3 rounded-md bg-secondary/50 px-3 py-2">
              <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
                {activeWorkspace.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{activeWorkspace.name}</span>
                <span className="text-xs text-muted-foreground mt-1 capitalize">{activeWorkspace.plan} Plan</span>
              </div>
            </div>
          ) : (
            <Link href="/workspaces" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2">
              <PlusCircle className="h-4 w-4" />
              Select a workspace
            </Link>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.fullName || "User"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-medium">{user?.firstName?.charAt(0) || "U"}</span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">{user?.fullName || "User"}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-foreground">AgentHub AI</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
