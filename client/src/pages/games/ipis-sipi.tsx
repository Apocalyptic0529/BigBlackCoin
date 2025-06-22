import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { X, Home } from "lucide-react";
import Navigation from "@/components/navigation";

const betAmounts = [0.25, 0.50, 1.00, 1.50, 2.00, 5.00, 10.00, 50.00, 100.00, 500.00, 1000.00];

export default function IpisSipiPage() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBet, setSelectedBet] = useState(1.00);
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [isMoving, setIsMoving] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  // 9 steps with increasing multipliers and risk
  const stepMultipliers = [1.2, 1.5, 2.0, 2.8, 4.0, 6.0, 9.0, 14.0, 21.0];
  const stepRisks = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]; // Risk of getting caught

  const playGameMutation = useMutation({
    mutationFn: async (gameResult: any) => {
      const response = await apiRequest("POST", "/api/games/play", gameResult);
      return response.json();
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent-wins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Game error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startGame = () => {
    if (!user || parseFloat(user.coinBalance) < selectedBet) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough coins to place this bet",
        variant: "destructive",
      });
      return;
    }

    setIsGameActive(true);
    setCurrentStep(0);
    setCurrentMultiplier(1.0);
    setGameEnded(false);
  };

  const moveForward = () => {
    if (!isGameActive || isMoving || gameEnded) return;

    setIsMoving(true);
    
    setTimeout(() => {
      const risk = stepRisks[currentStep];
      const caught = Math.random() < risk;
      
      if (caught) {
        // Caught! Game over
        endGame(false, "💥 CAUGHT! The cockroach was spotted and eliminated!");
      } else {
        // Safe! Move to next step
        const newStep = currentStep + 1;
        const newMultiplier = stepMultipliers[currentStep];
        
        setCurrentStep(newStep);
        setCurrentMultiplier(newMultiplier);
        
        if (newStep >= 9) {
          // Completed all steps!
          endGame(true, "🎉 ESCAPED! The cockroach made it through all 9 steps!");
        } else {
          toast({
            title: "Safe!",
            description: `Step ${newStep}/9 completed. Multiplier: ${newMultiplier}x`,
          });
        }
      }
      setIsMoving(false);
    }, 1500);
  };

  const cashOut = () => {
    if (!isGameActive || isMoving || currentStep === 0) return;
    endGame(true, `Cashed out at step ${currentStep} with ${currentMultiplier}x multiplier!`);
  };

  const endGame = (won: boolean, message: string) => {
    const winAmount = won ? selectedBet * currentMultiplier : 0;
    let bbcWon = "0.00000000";
    
    // BBC reward for completing 7+ steps
    if (won && currentStep >= 7) {
      bbcWon = (selectedBet * 0.15).toFixed(8);
    }

    const gameData = {
      gameType: "Ipis Sipi",
      betAmount: selectedBet.toString(),
      winAmount: winAmount.toString(),
      bbcWon,
      result: message + (bbcWon !== "0.00000000" ? ` + ${bbcWon} $BBC!` : "")
    };

    playGameMutation.mutate(gameData);
    
    setIsGameActive(false);
    setGameEnded(true);

    toast({
      title: won ? "Success!" : "Game Over",
      description: gameData.result,
      variant: won ? "default" : "destructive",
    });
  };

  // Don't redirect if no user - let them see the game page
  // if (!user) {
  //   setLocation("/");
  //   return null;
  // }

  // Admin users should not access games
  if (user?.isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen casino-black text-white">
      <Navigation 
        user={user} 
        activeSection="games" 
        onSectionChange={() => setLocation("/")}
        onLogout={() => setLocation("/login")}
      />
      
      {/* Game Header */}
      <div className="flex items-center justify-between p-4 border-b border-casino-orange/20">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-casino-orange hover:text-casino-orange hover:bg-casino-orange/10"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <h1 className="text-2xl font-orbitron font-bold casino-orange">🪳 Ipis Sipi</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-casino-orange hover:text-casino-orange hover:bg-casino-orange/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <p className="text-lg text-gray-300 mb-6">
                    Guide the brave cockroach through 9 dangerous kitchen steps. Higher steps = higher rewards but greater risk!
                  </p>
                </div>

                {/* Game Status */}
                {isGameActive && (
                  <div className="text-center mb-6 p-4 bg-casino-dark/50 border border-casino-orange/30 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="casino-orange-accent text-sm">Current Step</p>
                        <p className="casino-orange text-2xl font-bold">{currentStep}/9</p>
                      </div>
                      <div>
                        <p className="casino-orange-accent text-sm">Multiplier</p>
                        <p className="casino-orange text-2xl font-bold">{currentMultiplier}x</p>
                      </div>
                      <div>
                        <p className="casino-orange-accent text-sm">Potential Win</p>
                        <p className="casino-orange text-2xl font-bold">{(selectedBet * currentMultiplier).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kitchen Path */}
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-casino-orange/30 rounded-lg">
                  <div className="grid grid-cols-9 gap-2">
                    {Array(9).fill(null).map((_, index) => (
                      <div key={index} className="relative">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          index < currentStep ? 'bg-green-500 border-green-400' :
                          index === currentStep ? 'bg-casino-orange border-casino-orange text-black' :
                          'bg-gray-600 border-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-center mt-1 text-xs casino-orange-accent">
                          {stepMultipliers[index]}x
                        </div>
                        {index === currentStep && isGameActive && (
                          <motion.div
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl"
                            animate={isMoving ? { y: [-10, 0, -10] } : {}}
                            transition={{ duration: 0.5, repeat: isMoving ? Infinity : 0 }}
                          >
                            🪳
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Controls */}
                {!isGameActive ? (
                  <div className="text-center">
                    <Button
                      onClick={startGame}
                      disabled={playGameMutation.isPending}
                      className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                    >
                      START ADVENTURE ({selectedBet} coins)
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={moveForward}
                        disabled={isMoving || gameEnded || currentStep >= 9}
                        className="bg-red-600 text-white px-6 py-4 rounded-lg font-rajdhani text-lg font-bold hover:bg-red-700 transition-all"
                      >
                        {isMoving ? "MOVING..." : "SCURRY FORWARD"}
                      </Button>
                      <Button
                        onClick={cashOut}
                        disabled={isMoving || gameEnded || currentStep === 0}
                        className="bg-casino-gold text-casino-black px-6 py-4 rounded-lg font-rajdhani text-lg font-bold hover-glow"
                      >
                        CASH OUT
                      </Button>
                    </div>
                    
                    <div className="text-center text-sm casino-orange-accent">
                      Risk of getting caught: <span className="casino-orange">{((stepRisks[currentStep] || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Betting Panel */}
          <div className="space-y-6">
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">Place Your Bet</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {betAmounts.map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => setSelectedBet(amount)}
                      variant="outline"
                      size="sm"
                      disabled={isGameActive}
                      className={`font-rajdhani font-semibold ${
                        selectedBet === amount 
                          ? "bg-casino-orange text-casino-black glow-orange" 
                          : "casino-gray border-casino-orange/30 text-white hover:bg-casino-orange hover:text-casino-black"
                      }`}
                    >
                      {amount < 1 ? amount.toFixed(2) : amount >= 100 ? amount.toString() : amount}
                    </Button>
                  ))}
                </div>
                <p className="casino-orange-accent text-sm">
                  Selected: <span className="casino-orange font-bold">{selectedBet}</span> Coins
                </p>
                <p className="casino-orange-accent text-xs mt-2">
                  Balance: <span className="casino-orange">{user.coinBalance}</span> Coins
                </p>
              </CardContent>
            </Card>

            {/* Step Guide */}
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">Step Rewards</h3>
                <div className="space-y-1 text-sm">
                  {stepMultipliers.map((multiplier, index) => (
                    <div key={index} className={`flex justify-between ${
                      index < currentStep ? 'text-green-400' :
                      index === currentStep ? 'text-casino-orange font-bold' :
                      'text-gray-400'
                    }`}>
                      <span>Step {index + 1}:</span>
                      <span>{multiplier}x</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-casino-orange/30 text-xs casino-orange-accent">
                    💎 Steps 7-9 reward $BBC tokens!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}