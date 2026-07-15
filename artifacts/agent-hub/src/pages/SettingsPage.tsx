import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Key, CheckCircle2, XCircle, Loader2, Trash2, Shield, Eye, EyeOff } from "lucide-react";
import { 
  useListApiKeys, 
  useCreateApiKey, 
  useDeleteApiKey, 
  useTestApiKey,
  getListApiKeysQueryKey
} from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const providerColors: Record<string, string> = {
  gemini: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  openai: "bg-green-500/10 text-green-500 border-green-500/20",
  deepseek: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  claude: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  groq: "bg-red-500/10 text-red-400 border-red-500/20",
};

const formSchema = z.object({
  provider: z.enum(["deepseek", "gemini", "openai", "claude", "groq"], {
    required_error: "Please select a provider.",
  }),
  label: z.string().min(2, "Label must be at least 2 characters"),
  key: z.string().min(1, "API Key is required"),
});

export default function SettingsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<number | null>(null);

  const { data: apiKeys, isLoading } = useListApiKeys(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });

  const createApiKey = useCreateApiKey();
  const deleteApiKey = useDeleteApiKey();
  const testApiKey = useTestApiKey();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "openai",
      label: "",
      key: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeWorkspaceId) return;

    createApiKey.mutate({ 
      workspaceId: activeWorkspaceId,
      data: values 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey(activeWorkspaceId) });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "API Key added successfully" });
      },
      onError: (error) => {
        toast({
          title: "Failed to add API key",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteApiKey.mutate({ keyId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey(activeWorkspaceId!) });
        toast({ title: "API Key deleted" });
      }
    });
  };

  const handleTest = (id: number) => {
    setTestingKeyId(id);
    testApiKey.mutate({ keyId: id }, {
      onSuccess: (data) => {
        setTestingKeyId(null);
        toast({ 
          title: data.ok ? "API Key Valid" : "API Key Invalid", 
          description: data.message,
          variant: data.ok ? "default" : "destructive"
        });
      },
      onError: (error) => {
        setTestingKeyId(null);
        toast({ title: "Test failed", description: error.message, variant: "destructive" });
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace API keys and configuration
        </p>
      </div>

      <Tabs defaultValue="apikeys" className="w-full">
        <TabsList className="mb-6 bg-secondary/50 p-1 rounded-lg">
          <TabsTrigger value="apikeys" className="rounded-md">API Keys</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-md" disabled>Billing (Coming soon)</TabsTrigger>
          <TabsTrigger value="team" className="rounded-md" disabled>Team (Coming soon)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apikeys" className="space-y-6 focus-visible:outline-none">
          <Card className="border-border/50 bg-secondary/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Key Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Your API keys are encrypted at rest. We only display the last 4 characters after saving. 
                  These keys are used exclusively to power your AI agents' chat capabilities.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold tracking-tight">Provider Keys</h2>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              if(!open) form.reset();
              setShowKey(false);
              setIsCreateOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add API Key</DialogTitle>
                  <DialogDescription>
                    Configure a new AI provider to power your agents.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="groq">Groq (Free ✓)</SelectItem>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="claude">Anthropic Claude</SelectItem>
                              <SelectItem value="gemini">Google Gemini</SelectItem>
                              <SelectItem value="deepseek">DeepSeek</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Production OpenAI Key" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showKey ? "text" : "password"} 
                                placeholder="sk-..." 
                                {...field} 
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowKey(!showKey)}
                              >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createApiKey.isPending}>
                        {createApiKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Key
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : apiKeys?.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                  Add an API key to allow your agents to process messages.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {apiKeys?.map((apiKey) => (
                <Card key={apiKey.id} className="flex flex-col border-border/50 hover-elevate transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {apiKey.label}
                        </CardTitle>
                        <CardDescription className="mt-1 font-mono text-xs">
                          {apiKey.keyPreview}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={`capitalize border ${providerColors[apiKey.provider] || "border-border"}`}>
                        {apiKey.provider}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-4 flex justify-between gap-2 border-t border-border/30 mt-auto bg-secondary/10 rounded-b-xl">
                    <div className="text-xs text-muted-foreground">
                      Added {new Date(apiKey.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleTest(apiKey.id)}
                        disabled={testingKeyId === apiKey.id}
                      >
                        {testingKeyId === apiKey.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
                        Test
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key? Agents using this provider will stop working unless another key is available.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(apiKey.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
