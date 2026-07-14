import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Plus, Globe, Mail, Phone, Clock, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { 
  useListBusinesses, 
  useCreateBusiness,
  useDeleteBusiness,
  getListBusinessesQueryKey 
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
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  brandVoice: z.string().optional(),
  description: z.string().optional(),
});

export default function BusinessesPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: businesses, isLoading } = useListBusinesses(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });
  
  const createBusiness = useCreateBusiness();
  const deleteBusiness = useDeleteBusiness();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      timezone: "UTC",
      language: "en",
      website: "",
      email: "",
      phone: "",
      brandVoice: "",
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeWorkspaceId) return;

    createBusiness.mutate({ 
      workspaceId: activeWorkspaceId,
      data: values 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey(activeWorkspaceId) });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Business created successfully" });
      },
      onError: (error) => {
        toast({
          title: "Failed to create business",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteBusiness.mutate({ businessId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey(activeWorkspaceId!) });
        toast({ title: "Business deleted" });
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
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-1">
            Manage the brands and companies your agents represent.
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
              <DialogDescription>
                Define the identity and knowledge base for your AI agents to use.
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
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Store" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="support@acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="brandVoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Voice</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Professional but approachable. We use simple language and avoid jargon. We are helpful and empathetic." 
                          className="h-20"
                          {...field} 
                        />
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
                      <FormLabel>Company Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What does your business do? What are your key products or services?" 
                          className="h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createBusiness.isPending}>
                    {createBusiness.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Business
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : businesses?.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No businesses added</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Add businesses to provide context and knowledge for your AI agents.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses?.map((business) => (
            <Card key={business.id} className="flex flex-col border-border/50 hover-elevate transition-all">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Building2 className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{business.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {business.timezone}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10"
                        onClick={() => handleDelete(business.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {business.description || "No description provided."}
                </p>
                
                <div className="space-y-2 text-sm">
                  {business.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={business.website} target="_blank" rel="noreferrer" className="hover:text-primary truncate">
                        {business.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{business.email}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="truncate">{business.phone}</span>
                    </div>
                  )}
                </div>
                
                {business.brandVoice && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">Brand Voice</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{business.brandVoice}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
