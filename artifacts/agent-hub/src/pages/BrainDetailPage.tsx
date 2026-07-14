import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Brain, Plus, Loader2, Save, Link as LinkIcon, FileText, HelpCircle, Trash2, Info } from "lucide-react";
import { Link, useRoute } from "wouter";
import { 
  useGetBrain, 
  useUpdateBrain,
  useListKnowledgeItems,
  useCreateKnowledgeItem,
  useDeleteKnowledgeItem,
  useListAgents,
  getGetBrainQueryKey,
  getListKnowledgeItemsQueryKey 
} from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const knowledgeItemSchema = z.object({
  type: z.enum(["text", "url", "faq"]),
  title: z.string().min(2, "Title is required"),
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function BrainDetailPage() {
  const [, params] = useRoute("/brains/:id");
  const brainId = params?.id ? parseInt(params.id, 10) : null;
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const initializedId = useRef<number | null>(null);

  const { data: brain, isLoading: isBrainLoading } = useGetBrain(brainId!, {
    query: { enabled: !!brainId }
  });

  const { data: knowledgeItems, isLoading: isKnowledgeLoading } = useListKnowledgeItems(brainId!, {
    query: { enabled: !!brainId }
  });
  
  const { data: agents } = useListAgents(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });

  const updateBrain = useUpdateBrain();
  const createKnowledgeItem = useCreateKnowledgeItem();
  const deleteKnowledgeItem = useDeleteKnowledgeItem();

  useEffect(() => {
    if (brain && initializedId.current !== brain.id) {
      initializedId.current = brain.id;
      setFormData({
        name: brain.name,
        agentId: brain.agentId?.toString() || "none",
        systemPrompt: brain.systemPrompt || "",
        fallbackMessage: brain.fallbackMessage || "",
      });
    }
  }, [brain]);

  const handleSaveBrain = () => {
    if (!brainId) return;

    updateBrain.mutate({
      brainId,
      data: {
        name: formData.name,
        agentId: formData.agentId === "none" ? null : parseInt(formData.agentId),
        systemPrompt: formData.systemPrompt,
        fallbackMessage: formData.fallbackMessage,
      }
    }, {
      onSuccess: (updatedBrain) => {
        queryClient.setQueryData(getGetBrainQueryKey(brainId), updatedBrain);
        toast({ title: "Brain updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Update failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const form = useForm<z.infer<typeof knowledgeItemSchema>>({
    resolver: zodResolver(knowledgeItemSchema),
    defaultValues: {
      type: "text",
      title: "",
      content: "",
      sourceUrl: "",
    },
  });

  const itemType = form.watch("type");

  const onAddKnowledge = (values: z.infer<typeof knowledgeItemSchema>) => {
    if (!brainId) return;

    createKnowledgeItem.mutate({ 
      brainId,
      data: {
        type: values.type,
        title: values.title,
        content: values.content,
        sourceUrl: values.type === "url" ? values.sourceUrl : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKnowledgeItemsQueryKey(brainId) });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "Knowledge item added" });
      },
      onError: (error) => {
        toast({
          title: "Failed to add knowledge",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteKnowledge = (id: number) => {
    deleteKnowledgeItem.mutate({ itemId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKnowledgeItemsQueryKey(brainId!) });
        toast({ title: "Knowledge item deleted" });
      }
    });
  };

  if (isBrainLoading || !brain) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDirty = JSON.stringify({
    name: formData.name,
    agentId: formData.agentId,
    systemPrompt: formData.systemPrompt,
    fallbackMessage: formData.fallbackMessage,
  }) !== JSON.stringify({
    name: brain.name,
    agentId: brain.agentId?.toString() || "none",
    systemPrompt: brain.systemPrompt || "",
    fallbackMessage: brain.fallbackMessage || "",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/brains" className="hover:text-primary transition-colors flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Brains
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Brain className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="flex-1">
            <Input 
              value={formData.name || ""} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="text-2xl font-bold tracking-tight h-10 w-full max-w-sm px-2 bg-transparent border-transparent hover:border-border focus:border-border transition-colors -ml-2"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Assigned to:</span>
              <Select value={formData.agentId} onValueChange={v => setFormData({...formData, agentId: v})}>
                <SelectTrigger className="h-7 text-xs w-48 bg-secondary/50 border-border">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Unassigned)</SelectItem>
                  {agents?.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[140px] shrink-0">
          <Button 
            className="w-full justify-start"
            disabled={!isDirty || updateBrain.isPending}
            onClick={handleSaveBrain}
          >
            {updateBrain.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">System Prompt</CardTitle>
              <CardDescription>Core identity injected into the agent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea 
                  value={formData.systemPrompt || ""}
                  onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                  placeholder="You are a helpful knowledge assistant..."
                  className="min-h-[200px] font-mono text-sm resize-y bg-secondary/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Fallback Message</Label>
                <Textarea 
                  value={formData.fallbackMessage || ""}
                  onChange={e => setFormData({...formData, fallbackMessage: e.target.value})}
                  placeholder="I don't have that information."
                  className="h-20 font-mono text-sm resize-none bg-secondary/30"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-secondary/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">How Knowledge Works:</strong> Items added here are automatically injected into the agent's context when relevant to the user's message.
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Knowledge Base</h2>
              <Badge variant="secondary" className="rounded-full">{knowledgeItems?.length || 0}</Badge>
            </div>
            
            <Dialog open={isAddOpen} onOpenChange={(open) => {
              if(!open) form.reset();
              setIsAddOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Knowledge Item</DialogTitle>
                  <DialogDescription>
                    Provide data that the agent can reference.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddKnowledge)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="text">Plain Text</SelectItem>
                              <SelectItem value="faq">Q&A / FAQ</SelectItem>
                              <SelectItem value="url">URL Reference</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Return Policy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {itemType === "url" && (
                      <FormField
                        control={form.control}
                        name="sourceUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/docs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={itemType === "faq" ? "Q: What is the return policy?\nA: You have 30 days..." : "Paste relevant knowledge here..."} 
                              className="h-32 font-mono text-sm"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createKnowledgeItem.isPending}>
                        {createKnowledgeItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Item
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isKnowledgeLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : knowledgeItems?.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center p-6">
                <FileText className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-sm font-semibold mb-1">No knowledge items</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add text, URLs, or FAQs to train your agent.
                </p>
                <Button onClick={() => setIsAddOpen(true)} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Knowledge
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {knowledgeItems?.map((item) => (
                <Card key={item.id} className="border-border/50 group overflow-hidden">
                  <div className="p-4 flex gap-4">
                    <div className="shrink-0 mt-1">
                      {item.type === 'text' && <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center"><FileText className="h-4 w-4 text-blue-500" /></div>}
                      {item.type === 'url' && <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center"><LinkIcon className="h-4 w-4 text-green-500" /></div>}
                      {item.type === 'faq' && <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center"><HelpCircle className="h-4 w-4 text-amber-500" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm truncate pr-4">{item.title}</h4>
                        <Badge variant="outline" className="text-[10px] uppercase font-normal tracking-wider px-2 py-0 border-border/50 text-muted-foreground">
                          {item.type}
                        </Badge>
                      </div>
                      {item.sourceUrl && (
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block mt-1">
                          {item.sourceUrl}
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-secondary/30 p-2 rounded">
                        {item.content}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Knowledge Item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the item from the agent's knowledge base.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteKnowledge(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
