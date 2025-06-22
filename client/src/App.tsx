import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import LuckAndRollPage from "@/pages/games/luck-and-roll";
import FlipJonathanPage from "@/pages/games/flip-jonathan";
import PaldoPage from "@/pages/games/paldo";
import IpisSipiPage from "@/pages/games/ipis-sipi";
import BlowJoyBalloonPage from "@/pages/games/blow-joy-balloon";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/games/luck-and-roll" component={LuckAndRollPage} />
      <Route path="/games/flip-jonathan" component={FlipJonathanPage} />
      <Route path="/games/paldo" component={PaldoPage} />
      <Route path="/games/ipis-sipi" component={IpisSipiPage} />
      <Route path="/games/blow-joy-balloon" component={BlowJoyBalloonPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
