import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Building2, Plus, ArrowRight, Settings, Loader2, Trash2 } from "lucide-react";
import { 
  useListWorkspaces, 
  useCreateWorkspace, 
  useDeleteWorkspace,
  getListWorkspacesQueryKey
} from "@workspace/api-client-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

export default function WorkspacesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: workspaces, isLoading } = useListWorkspaces();
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("name", value);
    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createWorkspace.mutate({ data: values }, {
      onSuccess: (newWorkspace) => {
        queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        
        // Auto-select if it's their first workspace
        if (!workspaces || workspaces.length === 0) {
          setActiveWorkspaceId(newWorkspace.id);
        }
        
        toast({
          title: "Workspace created",
          description: "Your new workspace has been set up successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to create workspace",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteWorkspace.mutate({ workspaceId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
        if (activeWorkspaceId === id) {
          setActiveWorkspaceId(null);
        }
        toast({
          title: "Workspace deleted",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organizations and switch contexts.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new workspace</DialogTitle>
              <DialogDescription>
                Workspaces isolate your businesses, agents, and data.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} onChange={handleNameChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="acme-corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Headquarters for Acme Corp agents..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createWorkspace.isPending}>
                    {createWorkspace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Workspace
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces?.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Create your first workspace to start deploying AI agents.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces?.map((workspace) => {
            const isActive = activeWorkspaceId === workspace.id;
            
            return (
              <Card 
                key={workspace.id} 
                className={`flex flex-col transition-all hover-elevate ${
                  isActive ? "border-primary ring-1 ring-primary shadow-md" : "border-border/50"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {workspace.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{workspace.name}</CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">/{workspace.slug}</CardDescription>
                      </div>
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workspace.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize px-2 py-1 rounded bg-secondary">{workspace.plan} Plan</span>
                    <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border/50 bg-secondary/20 pt-4">
                  {isActive ? (
                    <Button variant="outline" className="w-full bg-background" asChild>
                      <Link href="/dashboard">
                        Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => {
                        setActiveWorkspaceId(workspace.id);
                        toast({ title: `Switched to ${workspace.name}` });
                      }}
                    >
                      Switch to Workspace
                    </Button>
                  )}
                  
                  <div className="ml-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the 
                            <span className="font-semibold text-foreground"> {workspace.name} </span> 
                            workspace and all associated businesses and agents.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(workspace.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteWorkspace.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
