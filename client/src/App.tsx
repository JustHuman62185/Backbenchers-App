import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNavigation from "@/components/bottom-navigation";
import Chatbot from "@/pages/chatbot";
import ExcuseGeneratorPage from "@/pages/excuse-generator";
import NotesMakerPage from "@/pages/notes-maker";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col h-full">
      <Switch>
        <Route path="/" component={NotesMakerPage} />
        <Route path="/notes-maker" component={NotesMakerPage} />
        <Route path="/excuse-generator" component={ExcuseGeneratorPage} />
        <Route path="/community-chat" component={Chatbot} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route component={NotFound} />
      </Switch>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen"> {/* THIS is the fix */}
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
