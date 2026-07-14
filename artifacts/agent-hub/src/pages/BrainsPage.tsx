import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Brain, Plus, Loader2, MoreVertical, Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { 
  useListBrains, 
  useCreateBrain,
  useDeleteBrain,
  useListAgents,
  getListBrainsQueryKey 
} from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormDescription,
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  agentId: z.string().optional().or(z.literal("none")),
  systemPrompt: z.string().optional(),
  fallbackMessage: z.string().optional(),
});

export default function BrainsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: brains, isLoading } = useListBrains(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });
  
  const { data: agents } = useListAgents(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });

  const createBrain = useCreateBrain();
  const deleteBrain = useDeleteBrain();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      agentId: "none",
      systemPrompt: "",
      fallbackMessage: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeWorkspaceId) return;

    createBrain.mutate({ 
      workspaceId: activeWorkspaceId,
      data: {
        name: values.name,
        agentId: values.agentId && values.agentId !== "none" ? parseInt(values.agentId) : undefined,
        systemPrompt: values.systemPrompt,
        fallbackMessage: values.fallbackMessage,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBrainsQueryKey(activeWorkspaceId) });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Brain created successfully" });
      },
      onError: (error) => {
        toast({
          title: "Failed to create brain",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteBrain.mutate({ brainId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBrainsQueryKey(activeWorkspaceId!) });
        toast({ title: "Brain deleted" });
      }
    });
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
          <h1 className="text-3xl font-bold tracking-tight">AI Brains</h1>
          <p className="text-muted-foreground mt-1">
            Knowledge bundles that power your agents
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Brain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Brain</DialogTitle>
              <DialogDescription>
                A Brain stores a collection of knowledge and system prompts for an agent.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brain Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Support Knowledge Base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Agent</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Agent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Unassigned)</SelectItem>
                            {agents?.map(a => (
                              <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="You are an expert on..." 
                          className="h-32 font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fallbackMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fallback Message</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="I don't know the answer to that." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        What the agent says when it doesn't know the answer based on this brain's knowledge.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createBrain.isPending}>
                    {createBrain.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Brain
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : brains?.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Brains yet</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Create a brain to start building a knowledge base for your AI agents.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Brain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brains?.map((brain) => {
            const assignedAgent = agents?.find(a => a.id === brain.agentId);
            return (
              <Card key={brain.id} className="flex flex-col border-border/50 hover-elevate transition-all group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Brain className="h-6 w-6 text-indigo-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{brain.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 font-normal text-xs bg-secondary/50">
                          {assignedAgent ? `Agent: ${assignedAgent.name}` : "Unassigned"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/brains/${brain.id}`}>Manage Knowledge</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => handleDelete(brain.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {brain.systemPrompt ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">System Prompt</p>
                      <p className="text-sm text-muted-foreground line-clamp-3 font-mono bg-secondary/30 p-2 rounded-md">
                        {brain.systemPrompt}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No system prompt configured.</p>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
                    Created {new Date(brain.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <Link href={`/brains/${brain.id}`}>
                    <Button variant="outline" size="sm" className="w-full border-border/50 text-xs">
                      Manage Knowledge <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
