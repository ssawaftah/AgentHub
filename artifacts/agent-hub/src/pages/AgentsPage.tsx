import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Bot,
  Plus,
  Loader2,
  MoreVertical,
  Trash2,
  Power,
  Settings2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useListAgents,
  useCreateAgent,
  useDeleteAgent,
  useToggleAgentStatus,
  useListBusinesses,
  getListAgentsQueryKey,
} from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role is required"),
  description: z.string().optional(),
  provider: z.enum(["deepseek", "gemini", "openai", "claude", "groq"]),
  model: z.string().min(1, "Model is required"),
  businessId: z.string().optional(),
});

const step2Schema = z.object({
  tone: z.enum(["professional", "friendly", "casual", "formal", "empathetic"]),
  language: z.string(),
  emojiLevel: z.number().min(0).max(10),
  humorLevel: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
});

const step3Schema = z.object({
  goal: z.string().optional(),
  instructions: z.string().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormValues = z.infer<typeof fullSchema>;

// ─── Model options by provider ────────────────────────────────────────────────

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  gemini: [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ],
  deepseek: [{ value: "deepseek-chat", label: "DeepSeek Chat" }],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  ],
  claude: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Free)" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Free)" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B (Free)" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Free)" },
  ],
};

// ─── Status helpers ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "border-green-500/40 text-green-400 bg-green-500/10"
      : status === "draft"
        ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
        : "border-border text-muted-foreground bg-secondary/50";
  return (
    <Badge variant="outline" className={`capitalize text-xs font-normal ${cls}`}>
      {status}
    </Badge>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <Badge variant="secondary" className="capitalize text-xs font-normal">
      {provider}
    </Badge>
  );
}

// ─── Multi-step Create Dialog ─────────────────────────────────────────────────

function CreateAgentDialog({
  workspaceId,
  businesses,
  onSuccess,
}: {
  workspaceId: number;
  businesses: { id: number; name: string }[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const createAgent = useCreateAgent();

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      name: "",
      role: "",
      description: "",
      provider: "gemini",
      model: "gemini-2.0-flash",
      businessId: "none",
      tone: "professional",
      language: "en",
      emojiLevel: 3,
      humorLevel: 2,
      creativity: 5,
      goal: "",
      instructions: "",
    },
  });

  const provider = form.watch("provider");

  const goNext = async () => {
    const fieldsToValidate: (keyof FormValues)[] =
      step === 1
        ? ["name", "role", "provider", "model"]
        : step === 2
          ? ["tone", "language", "emojiLevel", "humorLevel", "creativity"]
          : [];
    const valid = await form.trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = (values: FormValues) => {
    const businessId =
      values.businessId && values.businessId !== "none"
        ? parseInt(values.businessId)
        : undefined;

    createAgent.mutate(
      {
        workspaceId,
        data: {
          name: values.name,
          role: values.role,
          description: values.description,
          provider: values.provider,
          model: values.model,
          tone: values.tone,
          language: values.language,
          emojiLevel: values.emojiLevel,
          humorLevel: values.humorLevel,
          creativity: values.creativity,
          goal: values.goal,
          instructions: values.instructions,
          ...(businessId ? { businessId } : {}),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Agent created successfully" });
          form.reset();
          setStep(1);
          setOpen(false);
          onSuccess();
        },
        onError: (err) => {
          toast({ title: "Failed to create agent", description: err.message, variant: "destructive" });
        },
      },
    );
  };

  const stepLabels = ["Identity", "Personality", "Instructions"];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset();
          setStep(1);
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create AI Agent</DialogTitle>
          <DialogDescription>Configure your agent in 3 steps.</DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 py-2">
          {stepLabels.map((label, idx) => {
            const n = idx + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border transition-colors ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {n}
                </div>
                <span
                  className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
                {idx < stepLabels.length - 1 && (
                  <div className={`h-px flex-1 ${done ? "bg-primary/50" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            {/* Step 1: Identity */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Aria, Support Bot" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Customer Support Agent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Provider</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            const defaultModel = MODEL_OPTIONS[v]?.[0]?.value || "";
                            form.setValue("model", defaultModel);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="groq">Groq (Free ✓)</SelectItem>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="deepseek">DeepSeek</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="claude">Anthropic Claude</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(MODEL_OPTIONS[provider] || []).map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {businesses.length > 0 && (
                    <FormField
                      control={form.control}
                      name="businessId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Assign to Business (optional)</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="None — General Agent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None — General Agent</SelectItem>
                              {businesses.map((b) => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What does this agent do? Who does it help?"
                          className="h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Personality */}
            {step === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Tone</FormLabel>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(["professional", "friendly", "casual", "formal", "empathetic"] as const).map((tone) => (
                          <Badge
                            key={tone}
                            variant={field.value === tone ? "default" : "outline"}
                            className="cursor-pointer capitalize text-sm py-1.5 px-4"
                            onClick={() => field.onChange(tone)}
                          >
                            {tone}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Language</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creativity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Creativity</FormLabel>
                        <span className="text-sm font-mono text-primary">{field.value}/10</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0} max={10} step={1}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Strict / Factual</span>
                        <span>Creative / Fluid</span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emojiLevel"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Emoji Usage</FormLabel>
                        <span className="text-sm font-mono text-primary">{field.value}/10</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0} max={10} step={1}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>None</span>
                        <span>Frequent</span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="humorLevel"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Humor Level</FormLabel>
                        <span className="text-sm font-mono text-primary">{field.value}/10</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0} max={10} step={1}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>All Business</span>
                        <span>Light &amp; Playful</span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Instructions */}
            {step === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Goal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Help customers track orders and resolve issues quickly."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="You are a helpful support agent. Always greet the customer by name if available. Never share pricing details unless the customer asks directly..."
                          className="min-h-[180px] font-mono text-sm resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="flex-row gap-2 pt-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              )}
              <div className="flex-1" />
              {step < 3 ? (
                <Button type="button" onClick={goNext}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={createAgent.isPending}>
                  {createAgent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Agent
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onDelete,
  onToggle,
}: {
  agent: {
    id: number;
    name: string;
    role: string;
    status: string;
    provider: string;
    model: string;
    tone: string;
    emojiLevel: number;
    humorLevel: number;
    creativity: number;
    description?: string | null;
  };
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  return (
    <Card className="flex flex-col border-border/50 hover-elevate transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  agent.status === "active"
                    ? "bg-green-500"
                    : agent.status === "draft"
                      ? "bg-amber-500"
                      : "bg-gray-500"
                }`}
              />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{agent.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{agent.role}</CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground -mr-2"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}`}>
                  <Settings2 className="mr-2 h-4 w-4" /> Configure
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle(agent.id)}>
                <Power className="mr-2 h-4 w-4" />
                {agent.status === "active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(agent.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {agent.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={agent.status} />
          <ProviderBadge provider={agent.provider} />
          <Badge variant="outline" className="capitalize text-xs font-normal border-border/50 text-muted-foreground">
            {agent.tone}
          </Badge>
        </div>

        {/* Personality bars */}
        <div className="space-y-1.5 pt-1">
          {[
            { label: "Creativity", value: agent.creativity },
            { label: "Humor", value: agent.humorLevel },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-16 text-xs text-muted-foreground">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
              <span className="w-5 text-right text-xs text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <div className="px-6 pb-4">
        <Link href={`/agents/${agent.id}`}>
          <Button variant="outline" size="sm" className="w-full border-border/50 text-xs">
            Open Agent <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: agents, isLoading } = useListAgents(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId },
  });

  const { data: businesses } = useListBusinesses(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId },
  });

  const deleteAgent = useDeleteAgent();
  const toggleStatus = useToggleAgentStatus();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey(activeWorkspaceId!) });
  };

  const handleDelete = (id: number) => {
    deleteAgent.mutate(
      { agentId: id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Agent deleted" });
        },
        onError: (err) => {
          toast({ title: "Failed to delete agent", description: err.message, variant: "destructive" });
        },
      },
    );
  };

  const handleToggle = (id: number) => {
    toggleStatus.mutate(
      { agentId: id },
      {
        onSuccess: (data) => {
          invalidate();
          toast({ title: `Agent is now ${data.status}` });
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Deploy and manage intelligent agents that respond to customers automatically.
          </p>
        </div>
        <CreateAgentDialog
          workspaceId={activeWorkspaceId}
          businesses={businesses || []}
          onSuccess={invalidate}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : agents?.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-72 text-center">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bot className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first AI agent. It will reply to customer messages automatically, 24/7.
            </p>
            <CreateAgentDialog
              workspaceId={activeWorkspaceId}
              businesses={businesses || []}
              onSuccess={invalidate}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary strip */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{agents?.length}</span>{" "}
              {agents?.length === 1 ? "agent" : "agents"}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-green-400 font-medium">
              {agents?.filter((a) => a.status === "active").length} active
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-amber-400 font-medium">
              {agents?.filter((a) => a.status === "draft").length} draft
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents?.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
