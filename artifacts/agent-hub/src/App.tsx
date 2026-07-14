import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

import Layout from "@/components/layout/Layout";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkspacesPage from "@/pages/WorkspacesPage";
import BusinessesPage from "@/pages/BusinessesPage";
import AgentsPage from "@/pages/AgentsPage";
import AgentDetailPage from "@/pages/AgentDetailPage";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(217, 91%, 60%)",
    colorForeground: "hsl(210, 40%, 98%)",
    colorMutedForeground: "hsl(215, 20.2%, 65.1%)",
    colorDanger: "hsl(0, 62.8%, 30.6%)",
    colorBackground: "hsl(224, 41%, 8%)",
    colorInput: "hsl(224, 35%, 15%)",
    colorInputForeground: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(224, 35%, 15%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive-foreground",
    logoBox: "flex justify-center",
    logoImage: "h-8 object-contain",
    socialButtonsBlockButton: "border-border hover:bg-secondary/50",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "bg-input text-foreground border-border focus:ring-primary",
    footerAction: "border-t border-border pt-4 mt-4",
    dividerLine: "bg-border",
    alert: "bg-destructive/20 border-destructive",
    otpCodeFieldInput: "bg-input border-border text-foreground",
    formFieldRow: "gap-2",
    main: "gap-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to AgentHub AI",
          },
        },
        signUp: {
          start: {
            title: "Start building agents",
            subtitle: "Deploy intelligent agents today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <WorkspaceProvider>
          <TooltipProvider>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              
              <Route path="/dashboard">
                <ProtectedRoute component={DashboardPage} />
              </Route>
              <Route path="/workspaces">
                <ProtectedRoute component={WorkspacesPage} />
              </Route>
              <Route path="/businesses">
                <ProtectedRoute component={BusinessesPage} />
              </Route>
              <Route path="/agents">
                <ProtectedRoute component={AgentsPage} />
              </Route>
              <Route path="/agents/:id">
                <ProtectedRoute component={AgentDetailPage} />
              </Route>
              
              <Route>
                <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 text-center">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">404</h1>
                  <p className="mt-2 text-muted-foreground">Page not found</p>
                </div>
              </Route>
            </Switch>
            <Toaster />
          </TooltipProvider>
        </WorkspaceProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
