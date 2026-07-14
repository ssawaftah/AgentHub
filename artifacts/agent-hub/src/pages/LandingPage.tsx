import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Zap, Shield, ArrowRight, Activity, BarChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">AgentHub <span className="text-primary">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          {/* Decorative background elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
                <Zap className="mr-2 h-4 w-4" />
                Next-Gen Customer Support is Here
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                AI Agents for <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Modern Customer Support</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Deploy, manage, and monitor intelligent conversational agents. The ultimate command center for businesses to automate support without losing the human touch.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 hover:scale-105 w-full sm:w-auto">
                  Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/sign-in" className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-card px-8 text-base font-medium shadow-sm transition-all hover:bg-secondary w-full sm:w-auto">
                  View Demo
                </Link>
              </div>
            </motion.div>

            {/* Dashboard Preview Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-20 mx-auto max-w-5xl rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-secondary/50">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="ml-4 text-xs font-mono text-muted-foreground flex-1 flex justify-center">
                  <div className="bg-background/80 px-24 py-1 rounded-md border border-border/50">agenthub.ai/dashboard</div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-12 gap-6">
                <div className="col-span-3 space-y-4">
                  <div className="h-8 w-full bg-secondary rounded"></div>
                  <div className="h-8 w-3/4 bg-secondary rounded"></div>
                  <div className="h-8 w-5/6 bg-secondary rounded"></div>
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="flex gap-4">
                    <div className="h-24 flex-1 bg-secondary rounded-lg border border-border/50"></div>
                    <div className="h-24 flex-1 bg-secondary rounded-lg border border-border/50"></div>
                    <div className="h-24 flex-1 bg-secondary rounded-lg border border-border/50"></div>
                  </div>
                  <div className="h-64 w-full bg-secondary rounded-lg border border-border/50"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Command Center for AI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to orchestrate multiple AI agents across your business.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: Users, title: "Multi-Business Management", desc: "Manage multiple brands, companies, or storefronts from a single unified dashboard." },
                { icon: Shield, title: "Personality Controls", desc: "Dial in exact tone, emoji usage, and creativity levels to match your brand voice perfectly." },
                { icon: MessageSquare, title: "Any Provider", desc: "Bring your own models. Choose from OpenAI, Anthropic Claude, Google Gemini, or DeepSeek." },
                { icon: Activity, title: "Live Monitoring", desc: "Watch conversations happen in real-time and jump in if the agent needs human assistance." },
                { icon: BarChart, title: "Advanced Analytics", desc: "Track resolution rates, customer sentiment, and agent performance over time." },
                { icon: Zap, title: "Lightning Fast", desc: "Built on modern edge infrastructure to deliver sub-second response times to your customers." },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Providers Section */}
        <section className="py-24 border-b border-border/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-8">Powered by the world's best models</h2>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Replace with actual provider logos if needed, using text for now to avoid external images */}
              <span className="text-2xl font-bold tracking-tighter">OpenAI</span>
              <span className="text-2xl font-bold tracking-tighter font-serif">Anthropic</span>
              <span className="text-2xl font-bold tracking-tighter">Google Gemini</span>
              <span className="text-2xl font-bold tracking-tighter">DeepSeek</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">AgentHub AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AgentHub AI. Built for the future.
          </p>
        </div>
      </footer>
    </div>
  );
}
