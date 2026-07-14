import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboardSummary, useGetRecentActivity, useListWorkspaces, useListBusinesses } from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Bot, Activity, Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [, setLocation] = useLocation();

  const { data: workspaces, isLoading: workspacesLoading } = useListWorkspaces();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });

  // Effect to redirect to workspaces if none selected but available
  useEffect(() => {
    if (!workspacesLoading && workspaces && workspaces.length > 0 && !activeWorkspaceId) {
      setLocation("/workspaces");
    }
  }, [workspaces, activeWorkspaceId, workspacesLoading, setLocation]);

  if (workspacesLoading || (activeWorkspaceId && summaryLoading)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">No Workspace Selected</h2>
        <p className="text-muted-foreground max-w-sm">
          Please select or create a workspace to view your dashboard.
        </p>
        <Link href="/workspaces" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          Go to Workspaces
        </Link>
      </div>
    );
  }

  const activeWorkspace = workspaces?.find(w => w.id === activeWorkspaceId);

  // Prepare chart data
  const statusColors: Record<string, string> = {
    active: "hsl(142.1 76.2% 36.3%)", // green
    inactive: "hsl(215 20.2% 65.1%)", // muted
    draft: "hsl(38 92% 50%)", // amber
  };

  const providerColors: Record<string, string> = {
    openai: "hsl(142.1 76.2% 36.3%)",
    anthropic: "hsl(280 65% 60%)",
    gemini: "hsl(217 91% 60%)",
    deepseek: "hsl(340 75% 55%)",
  };

  const statusData = summary?.agentsByStatus.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: statusColors[s.status] || "hsl(217 91% 60%)"
  })) || [];

  const providerData = summary?.agentsByProvider.map(p => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.count,
    color: providerColors[p.provider] || "hsl(217 91% 60%)"
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your <span className="font-semibold text-foreground">{activeWorkspace?.name}</span> workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/agents">
            <Button>
              <Bot className="mr-2 h-4 w-4" /> New Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate transition-colors border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalAgents || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-colors border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.activeAgents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalAgents ? Math.round(((summary?.activeAgents || 0) / summary.totalAgents) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-colors border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalBusinesses || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-colors border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">{activeWorkspace?.plan || "Free"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts */}
        <Card className="col-span-1 lg:col-span-4 border-border/50">
          <CardHeader>
            <CardTitle>Agents by Provider</CardTitle>
            <CardDescription>Distribution of underlying models used by your agents</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {providerData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--secondary))'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {providerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="col-span-1 lg:col-span-3 border-border/50">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>Current operational state of agents</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions performed in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {activityLoading ? (
               <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : activity && activity.length > 0 ? (
              activity.map((item, i) => (
                <div key={item.id} className="flex gap-4">
                  <div className="mt-0.5 relative">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    {i !== activity.length - 1 && (
                      <div className="absolute top-4 left-1 bottom-[-32px] w-[1px] bg-border" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground mt-1">{item.description}</span>
                    <span className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent activity to show.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
