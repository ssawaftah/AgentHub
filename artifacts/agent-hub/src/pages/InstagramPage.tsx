import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Instagram,
  Link2,
  Link2Off,
  CheckCircle2,
  AlertCircle,
  Bot,
  Loader2,
  ChevronRight,
  Webhook,
  Copy,
  Check,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetInstagramAccount,
  useConnectInstagram,
  useDisconnectInstagram,
  useAssignInstagramAgent,
  useListInstagramAgents,
  getGetInstagramAccountQueryKey,
} from "@workspace/api-client-react";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const connectSchema = z.object({
  igUserId: z.string().min(1, "Instagram User ID is required"),
  igUsername: z.string().min(1, "Instagram Username is required"),
  igProfilePicUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  accessToken: z.string().min(10, "Access Token is required"),
  webhookVerifyToken: z
    .string()
    .min(8, "Verify token must be at least 8 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ allowed"),
});

type ConnectFormValues = z.infer<typeof connectSchema>;

// ─── CopyButton helper ────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InstagramPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const { data: account, isLoading } = useGetInstagramAccount(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId, retry: false },
  });

  const { data: agents } = useListInstagramAgents(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId },
  });

  const connectMutation = useConnectInstagram();
  const disconnectMutation = useDisconnectInstagram();
  const assignAgentMutation = useAssignInstagramAgent();

  const form = useForm<ConnectFormValues>({
    resolver: zodResolver(connectSchema),
    defaultValues: {
      igUserId: "",
      igUsername: "",
      igProfilePicUrl: "",
      accessToken: "",
      webhookVerifyToken: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    },
  });

  const onConnect = (values: ConnectFormValues) => {
    if (!activeWorkspaceId) return;
    connectMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        data: {
          igUserId: values.igUserId,
          igUsername: values.igUsername,
          igProfilePicUrl: values.igProfilePicUrl || undefined,
          accessToken: values.accessToken,
          webhookVerifyToken: values.webhookVerifyToken,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetInstagramAccountQueryKey(activeWorkspaceId),
          });
          setIsConnectOpen(false);
          form.reset();
          toast({ title: "Instagram account connected!" });
        },
        onError: (err) => {
          toast({
            title: "Connection failed",
            description: err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const onDisconnect = () => {
    if (!activeWorkspaceId) return;
    disconnectMutation.mutate(
      { workspaceId: activeWorkspaceId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetInstagramAccountQueryKey(activeWorkspaceId),
          });
          toast({ title: "Instagram account disconnected" });
        },
        onError: (err) => {
          toast({
            title: "Failed to disconnect",
            description: err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const onAssignAgent = (agentId: string) => {
    if (!activeWorkspaceId) return;
    assignAgentMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        data: { agentId: agentId === "none" ? null : Number(agentId) },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetInstagramAccountQueryKey(activeWorkspaceId),
          });
          toast({ title: "Agent assigned" });
        },
        onError: (err) => {
          toast({
            title: "Failed to assign agent",
            description: err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
        <p className="text-muted-foreground">Please select a workspace first.</p>
      </div>
    );
  }

  const isConnected = !!account;
  const webhookUrl = `${window.location.origin}/webhook/instagram`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instagram</h1>
          <p className="text-muted-foreground mt-1">
            Connect your Instagram Business account to let AI agents reply to DMs automatically
          </p>
        </div>
        {!isConnected && !isLoading && (
          <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Instagram className="mr-2 h-4 w-4" />
                Connect Instagram
              </Button>
            </DialogTrigger>
            <ConnectDialog
              form={form}
              onConnect={onConnect}
              isLoading={connectMutation.isPending}
              onClose={() => setIsConnectOpen(false)}
            />
          </Dialog>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Not connected */}
      {!isLoading && !isConnected && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Empty state */}
          <Card className="border-border/50 bg-secondary/20 md:col-span-2">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <Instagram className="h-8 w-8 text-pink-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No Instagram account connected</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Connect your Instagram Business account to start auto-replying to DMs using your AI agents.
                </p>
              </div>
              <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Instagram className="mr-2 h-5 w-5" />
                    Connect Instagram Account
                  </Button>
                </DialogTrigger>
                <ConnectDialog
                  form={form}
                  onConnect={onConnect}
                  isLoading={connectMutation.isPending}
                  onClose={() => setIsConnectOpen(false)}
                />
              </Dialog>
            </CardContent>
          </Card>

          {/* How it works */}
          <HowItWorksCard />

          {/* Webhook info */}
          <WebhookInfoCard webhookUrl={webhookUrl} />
        </div>
      )}

      {/* Connected */}
      {!isLoading && isConnected && account && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account status card */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Instagram className="h-5 w-5 text-pink-500" />
                Connected Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {account.igProfilePicUrl ? (
                  <img
                    src={account.igProfilePicUrl}
                    alt={account.igUsername}
                    className="h-14 w-14 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    <Instagram className="h-7 w-7 text-pink-500" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">@{account.igUsername}</p>
                  <p className="text-sm text-muted-foreground">ID: {account.igUserId}</p>
                  <StatusBadge status={account.status} />
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Link2Off className="mr-2 h-4 w-4" />
                    Disconnect Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Instagram?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will stop all automatic DM replies for this workspace. You can reconnect at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDisconnect}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Disconnect"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Agent assignment */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5 text-primary" />
                DM Handler Agent
              </CardTitle>
              <CardDescription>
                Choose which AI agent replies to incoming DMs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={account.agentId ? String(account.agentId) : "none"}
                onValueChange={onAssignAgent}
                disabled={assignAgentMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No agent (paused)</span>
                  </SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      <span className="flex items-center gap-2">
                        {agent.name}
                        <span className="text-xs text-muted-foreground">({agent.role})</span>
                        {agent.status !== "active" && (
                          <span className="text-xs text-yellow-500">inactive</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!account.agentId && (
                <p className="mt-2 text-xs text-yellow-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  No agent assigned — incoming DMs will be queued but not answered
                </p>
              )}
              {account.agentId && (
                <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  DMs will be answered automatically
                </p>
              )}
            </CardContent>
          </Card>

          {/* Webhook info */}
          <WebhookInfoCard
            webhookUrl={webhookUrl}
            verifyToken={account.webhookVerifyToken}
            className="md:col-span-2"
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Active
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge className="mt-1 bg-red-500/10 text-red-500 border-red-500/20">
        <AlertCircle className="mr-1 h-3 w-3" /> Error
      </Badge>
    );
  }
  return (
    <Badge className="mt-1 bg-secondary text-muted-foreground">Disconnected</Badge>
  );
}

function HowItWorksCard() {
  const steps = [
    "Connect your Instagram Business account using a Page Access Token",
    "Set this app's webhook URL in your Meta App dashboard",
    "Assign an AI agent to handle incoming DMs",
    "Incoming DMs are queued and answered automatically",
  ];
  return (
    <Card className="border-border/50 bg-secondary/20">
      <CardHeader>
        <CardTitle className="text-base">How it works</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function WebhookInfoCard({
  webhookUrl,
  verifyToken,
  className,
}: {
  webhookUrl: string;
  verifyToken?: string;
  className?: string;
}) {
  return (
    <Card className={`border-border/50 bg-secondary/20 ${className ?? ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Webhook className="h-5 w-5 text-primary" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Enter these values in your Meta App dashboard under Webhooks → Instagram → Edit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Callback URL
          </p>
          <div className="flex items-center rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
            <span className="flex-1 truncate">{webhookUrl}</span>
            <CopyButton value={webhookUrl} />
          </div>
        </div>
        {verifyToken && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Verify Token
            </p>
            <div className="flex items-center rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
              <span className="flex-1">{verifyToken}</span>
              <CopyButton value={verifyToken} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Subscribe to the <span className="font-medium">messages</span> field.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectDialog({
  form,
  onConnect,
  isLoading,
  onClose,
}: {
  form: any;
  onConnect: (v: ConnectFormValues) => void;
  isLoading: boolean;
  onClose: () => void;
}) {
  const verifyToken = form.watch("webhookVerifyToken");

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-pink-500" />
          Connect Instagram Account
        </DialogTitle>
        <DialogDescription>
          Enter your Instagram Business account details. You'll need a Page Access Token from the{" "}
          <a
            href="https://developers.facebook.com/tools/explorer/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Meta Graph API Explorer
          </a>
          .
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onConnect)} className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="igUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Username</FormLabel>
                <FormControl>
                  <Input placeholder="your_business_account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="igUserId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram User ID</FormLabel>
                <FormControl>
                  <Input placeholder="17841400000000000" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Get this from the Graph API Explorer: <code className="bg-secondary px-1 rounded">GET /me?fields=id,username</code>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accessToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Access Token</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="EAABwzLixnjYBO..."
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Long-lived token with <code className="bg-secondary px-1 rounded">instagram_manage_messages</code> permission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="igProfilePicUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="webhookVerifyToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook Verify Token</FormLabel>
                <FormControl>
                  <Input placeholder="my-secret-verify-token" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  A secret string you'll paste into the Meta App webhook settings. Letters, numbers, - and _ only.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
