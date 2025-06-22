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

export default function FlipJonathanPage() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBet, setSelectedBet] = useState(1.00);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);
  const [lastFlip, setLastFlip] = useState<"heads" | "tails" | null>(null);
  const [currentWinnings, setCurrentWinnings] = useState(0);

  const multipliers = [1.5, 2.0, 3.0, 4.5, 6.0, 9.0, 13.5, 20.0, 30.0, 45.0];

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
    setCurrentStreak(0);
    setCurrentMultiplier(1);
    setCurrentWinnings(selectedBet);
  };

  const flip = async (choice: "heads" | "tails") => {
    if (!isGameActive || isFlipping) return;

    setIsFlipping(true);
    
    const result = Math.random() < 0.5 ? "heads" : "tails";
    setLastFlip(result);

    setTimeout(() => {
      setIsFlipping(false);
      
      if (result === choice) {
        const newStreak = currentStreak + 1;
        const newMultiplier = multipliers[Math.min(newStreak - 1, multipliers.length - 1)] || multipliers[multipliers.length - 1];
        const newWinnings = selectedBet * newMultiplier;
        
        setCurrentStreak(newStreak);
        setCurrentMultiplier(newMultiplier);
        setCurrentWinnings(newWinnings);
        
        toast({
          title: "Correct!",
          description: `Streak: ${newStreak} | Multiplier: ${newMultiplier}x`,
        });
      } else {
        endGame(false);
      }
    }, 1500);
  };

  const cashOut = () => {
    if (!isGameActive) return;
    endGame(true);
  };

  const endGame = (won: boolean) => {
    const finalWinnings = won ? currentWinnings : 0;
    const gameData = {
      gameType: "Flip it Jonathan!",
      betAmount: selectedBet.toString(),
      winAmount: finalWinnings.toString(),
      bbcWon: "0.00000000",
      result: won ? 
        `Cashed out at ${currentMultiplier}x for ${finalWinnings.toFixed(2)} coins!` :
        `Wrong guess after ${currentStreak} correct flips!`
    };

    playGameMutation.mutate(gameData);
    
    setIsGameActive(false);
    setCurrentStreak(0);
    setCurrentMultiplier(1);
    setCurrentWinnings(0);
    setLastFlip(null);

    toast({
      title: won ? "Cashed Out!" : "Game Over",
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
          <h1 className="text-2xl font-orbitron font-bold casino-orange">🪙 Flip it Jonathan!</h1>
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
                    Choose heads or tails and build your streak! Cash out anytime or risk it all!
                  </p>
                </div>

                {/* Coin */}
                <div className="w-64 h-64 mb-8 mx-auto flex items-center justify-center">
                  <motion.div
                    className="w-48 h-48 rounded-full bg-gradient-to-br from-casino-gold to-yellow-600 border-4 border-casino-orange flex items-center justify-center text-casino-black font-orbitron text-4xl font-bold shadow-2xl"
                    animate={isFlipping ? { 
                      rotateY: [0, 180, 360, 540, 720],
                      scale: [1, 1.1, 1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  >
                    {lastFlip ? (lastFlip === "heads" ? "H" : "T") : "?"}
                  </motion.div>
                </div>

                {/* Game Status */}
                {isGameActive && (
                  <div className="text-center mb-6 p-4 bg-casino-dark/50 border border-casino-orange/30 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="casino-orange-accent text-sm">Streak</p>
                        <p className="casino-orange text-2xl font-bold">{currentStreak}</p>
                      </div>
                      <div>
                        <p className="casino-orange-accent text-sm">Multiplier</p>
                        <p className="casino-orange text-2xl font-bold">{currentMultiplier}x</p>
                      </div>
                      <div>
                        <p className="casino-orange-accent text-sm">Potential Win</p>
                        <p className="casino-orange text-2xl font-bold">{currentWinnings.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Controls */}
                {!isGameActive ? (
                  <div className="text-center">
                    <Button
                      onClick={startGame}
                      disabled={playGameMutation.isPending}
                      className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                    >
                      START GAME ({selectedBet} coins)
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => flip("heads")}
                        disabled={isFlipping}
                        className="bg-blue-600 text-white px-6 py-4 rounded-lg font-rajdhani text-lg font-bold hover:bg-blue-700 transition-all"
                      >
                        HEADS
                      </Button>
                      <Button
                        onClick={() => flip("tails")}
                        disabled={isFlipping}
                        className="bg-red-600 text-white px-6 py-4 rounded-lg font-rajdhani text-lg font-bold hover:bg-red-700 transition-all"
                      >
                        TAILS
                      </Button>
                    </div>
                    
                    {currentStreak > 0 && (
                      <Button
                        onClick={cashOut}
                        disabled={isFlipping}
                        className="w-full bg-casino-gold text-casino-black px-6 py-4 rounded-lg font-rajdhani text-lg font-bold hover-glow"
                      >
                        CASH OUT ({currentWinnings.toFixed(2)} coins)
                      </Button>
                    )}
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

            {/* Multiplier Table */}
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">Streak Multipliers</h3>
                <div className="space-y-1 text-sm">
                  {multipliers.map((mult, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="casino-orange-accent">Streak {index + 1}:</span>
                      <span className="casino-orange">{mult}x</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}