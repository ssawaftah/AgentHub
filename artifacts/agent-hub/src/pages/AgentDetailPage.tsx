import { useEffect, useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Bot, Save, Loader2, PlayCircle, StopCircle, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { 
  useGetAgent, 
  useUpdateAgent, 
  useToggleAgentStatus,
  useListBusinesses,
  useChatWithAgent,
  getGetAgentQueryKey,
  AgentTone,
  AgentUpdateProvider
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgentDetailPage() {
  const [match, params] = useRoute("/agents/:id");
  const agentId = params?.id ? parseInt(params.id, 10) : null;
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: agent, isLoading: isAgentLoading } = useGetAgent(agentId!, {
    query: { enabled: !!agentId }
  });

  const { data: businesses } = useListBusinesses(activeWorkspaceId!, {
    query: { enabled: !!activeWorkspaceId }
  });

  const updateAgent = useUpdateAgent();
  const toggleStatus = useToggleAgentStatus();
  const chatWithAgent = useChatWithAgent();

  // Local state for edits
  const [formData, setFormData] = useState<any>({});
  const initializedId = useRef<number | null>(null);

  // Chat Tester state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string, tokensUsed?: number }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (agent && initializedId.current !== agent.id) {
      initializedId.current = agent.id;
      setFormData({
        name: agent.name,
        role: agent.role,
        businessId: agent.businessId?.toString() || "none",
        provider: agent.provider,
        model: agent.model,
        tone: agent.tone,
        emojiLevel: agent.emojiLevel,
        humorLevel: agent.humorLevel,
        creativity: agent.creativity,
        temperature: agent.temperature,
        goal: agent.goal || "",
        instructions: agent.instructions || "",
        language: agent.language || "en",
      });
    }
  }, [agent]);

  const handleSave = () => {
    if (!agentId) return;

    const dataToSubmit = {
      ...formData,
      businessId: formData.businessId === "none" ? null : parseInt(formData.businessId),
    };

    updateAgent.mutate({
      agentId,
      data: dataToSubmit
    }, {
      onSuccess: (updatedAgent) => {
        // Update cache locally instead of invalidating to prevent jumping
        queryClient.setQueryData(getGetAgentQueryKey(agentId), updatedAgent);
        toast({ title: "Agent updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Update failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleToggleStatus = () => {
    if (!agentId) return;
    toggleStatus.mutate({ agentId }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetAgentQueryKey(agentId), (old: any) => 
          old ? { ...old, status: data.status } : old
        );
        toast({ title: `Agent is now ${data.status}` });
      }
    });
  };

  const handleSendMessage = () => {
    if (!agentId || !chatInput.trim()) return;

    const userMessage = chatInput.trim();
    const newHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newHistory);
    setChatInput("");

    chatWithAgent.mutate({
      agentId,
      data: {
        message: userMessage,
        conversationHistory: chatHistory.map(h => ({ role: h.role, content: h.content }))
      }
    }, {
      onSuccess: (data) => {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          tokensUsed: data.tokensUsed
        }]);
      },
      onError: (err) => {
        toast({ title: "Chat failed", description: err.message, variant: "destructive" });
        // Optionally remove the user message if it failed
      }
    });
  };

  if (isAgentLoading || !agent) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDirty = JSON.stringify({
    ...formData,
    businessId: formData.businessId === "none" ? null : parseInt(formData.businessId),
  }) !== JSON.stringify({
    name: agent.name,
    role: agent.role,
    businessId: agent.businessId,
    provider: agent.provider,
    model: agent.model,
    tone: agent.tone,
    emojiLevel: agent.emojiLevel,
    humorLevel: agent.humorLevel,
    creativity: agent.creativity,
    temperature: agent.temperature,
    goal: agent.goal || "",
    instructions: agent.instructions || "",
    language: agent.language || "en",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/agents" className="hover:text-primary transition-colors flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Agents
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center border border-border">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card ${agent.status === 'active' ? 'bg-green-500' : agent.status === 'draft' ? 'bg-amber-500' : 'bg-gray-500'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.role}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize text-xs font-normal border-border">
                {agent.status}
              </Badge>
              <Badge variant="secondary" className="capitalize text-xs font-normal">
                {agent.provider} • {agent.model}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[140px]">
          <Button 
            variant={agent.status === 'active' ? "outline" : "default"} 
            className={`w-full justify-start ${agent.status === 'active' ? 'border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            onClick={handleToggleStatus}
            disabled={toggleStatus.isPending}
          >
            {toggleStatus.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
             agent.status === 'active' ? <StopCircle className="mr-2 h-4 w-4" /> : 
             <PlayCircle className="mr-2 h-4 w-4" />}
            {agent.status === 'active' ? 'Pause Agent' : 'Start Agent'}
          </Button>
          
          <Button 
            className="w-full justify-start"
            disabled={!isDirty || updateAgent.isPending}
            onClick={handleSave}
          >
            {updateAgent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none h-auto bg-transparent p-0">
          <TabsTrigger value="identity" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Identity & Model</TabsTrigger>
          <TabsTrigger value="personality" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Personality</TabsTrigger>
          <TabsTrigger value="instructions" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Prompt & Instructions</TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Chat Tester</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="identity" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core identity of this agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name</Label>
                    <Input id="name" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role / Job Title</Label>
                    <Input id="role" value={formData.role || ""} onChange={e => setFormData({...formData, role: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business">Assign to Business</Label>
                    <Select value={formData.businessId} onValueChange={v => setFormData({...formData, businessId: v})}>
                      <SelectTrigger id="business">
                        <SelectValue placeholder="Select Business" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (General)</SelectItem>
                        {businesses?.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <Select value={formData.language} onValueChange={v => setFormData({...formData, language: v})}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>The underlying LLM powering this agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={formData.provider} onValueChange={v => {
                      const newProv = v as AgentUpdateProvider;
                      const defaultModels: Record<string, string> = {
                        openai: "gpt-4o-mini", anthropic: "claude-3-5-sonnet", gemini: "gemini-2.0-flash", deepseek: "deepseek-chat"
                      };
                      setFormData({...formData, provider: newProv, model: defaultModels[newProv]});
                    }}>
                      <SelectTrigger id="provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="claude">Anthropic</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model Version</Label>
                    <Input id="model" value={formData.model || ""} onChange={e => setFormData({...formData, model: e.target.value})} />
                    <p className="text-xs text-muted-foreground mt-1">Must match provider's API exact model name string.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Tone & Behavior</CardTitle>
                <CardDescription>Dial in exactly how the agent sounds to customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <Label>Base Tone</Label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Object.values(AgentTone).map(tone => (
                      <Badge 
                        key={tone}
                        variant={formData.tone === tone ? "default" : "outline"}
                        className="cursor-pointer capitalize text-sm py-1.5 px-3"
                        onClick={() => setFormData({...formData, tone})}
                      >
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label>Creativity (Temperature)</Label>
                    <span className="text-sm text-primary font-mono">{formData.creativity}/10</span>
                  </div>
                  <Slider 
                    value={[formData.creativity]} min={0} max={10} step={1}
                    onValueChange={v => setFormData({...formData, creativity: v[0]})}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Strict / Factual</span>
                    <span>Creative / Fluid</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label>Emoji Usage</Label>
                    <span className="text-sm text-primary font-mono">{formData.emojiLevel}/10</span>
                  </div>
                  <Slider 
                    value={[formData.emojiLevel]} min={0} max={10} step={1}
                    onValueChange={v => setFormData({...formData, emojiLevel: v[0]})}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>None 😐</span>
                    <span>Excessive 🚀✨🎉</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label>Humor Level</Label>
                    <span className="text-sm text-primary font-mono">{formData.humorLevel}/10</span>
                  </div>
                  <Slider 
                    value={[formData.humorLevel]} min={0} max={10} step={1}
                    onValueChange={v => setFormData({...formData, humorLevel: v[0]})}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>All Business</span>
                    <span>Stand-up Comedian</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border/50 h-full flex flex-col">
              <CardHeader>
                <CardTitle>System Prompts</CardTitle>
                <CardDescription>The core directives that guide the agent's logic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="goal">Primary Goal</Label>
                  <Input 
                    id="goal" 
                    value={formData.goal} 
                    onChange={e => setFormData({...formData, goal: e.target.value})} 
                    placeholder="e.g. Help users reset passwords and navigate the docs."
                  />
                </div>
                
                <div className="space-y-2 flex-1 flex flex-col">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="instructions">Custom Instructions</Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">
                      <RefreshCw className="mr-1 h-3 w-3" /> Insert Template
                    </Button>
                  </div>
                  <Textarea 
                    id="instructions"
                    value={formData.instructions}
                    onChange={e => setFormData({...formData, instructions: e.target.value})}
                    placeholder="You are a helpful support agent. Always verify the user's account before giving sensitive info. Never promise refunds..."
                    className="flex-1 min-h-[300px] font-mono text-sm leading-relaxed resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="focus-visible:outline-none">
            <Card className="border-border/50 h-[600px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <CardTitle>Chat Tester</CardTitle>
                  <CardDescription>Test your agent's behavior and knowledge in real-time.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setChatHistory([])}>
                  Clear conversation
                </Button>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p>Start a conversation to test how <strong>{agent.name}</strong> responds based on its identity, tone, and knowledge.</p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-secondary/50 border border-border/50 rounded-tl-sm'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                        {msg.role === 'assistant' && msg.tokensUsed !== undefined && (
                          <div className="text-[10px] text-muted-foreground/60 mt-2 font-mono text-right">
                            {msg.tokensUsed} tokens
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {chatWithAgent.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-secondary/50 border border-border/50 rounded-tl-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 border-t border-border/50 bg-secondary/10">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex items-center gap-2"
                >
                  <Input 
                    placeholder="Type a message to test your agent..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatWithAgent.isPending}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!chatInput.trim() || chatWithAgent.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {/* Note: The warning banner would be shown here if we tracked API key existence in this component's scope, 
                    but we rely on the API client returning an error toast if missing. */}
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
