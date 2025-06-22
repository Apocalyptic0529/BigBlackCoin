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

const symbols = ["🍒", "🍋", "🍇", "⭐", "💎", "🔔", "💰", "🎰"];
const paylines = 25;

export default function PaldoPage() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBet, setSelectedBet] = useState(1.00);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([
    ["🍒", "🍋", "🍇"],
    ["⭐", "💎", "🔔"],
    ["💰", "🎰", "🍒"],
    ["🍋", "🍇", "⭐"],
    ["💎", "🔔", "💰"]
  ]);
  const [freeSpins, setFreeSpins] = useState(0);
  const [inBonusRound, setInBonusRound] = useState(false);

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

  const generateReels = () => {
    return Array(5).fill(null).map(() => 
      Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
    );
  };

  const checkWin = (reelResult: string[][]) => {
    let totalWin = 0;
    let scatterCount = 0;
    
    // Count scatters (🎰)
    reelResult.forEach(reel => {
      reel.forEach(symbol => {
        if (symbol === "🎰") scatterCount++;
      });
    });

    // Basic payline wins (simplified)
    const centerLine = reelResult.map(reel => reel[1]);
    const symbolCount = centerLine.reduce((acc, symbol) => {
      acc[symbol] = (acc[symbol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(symbolCount).forEach(([symbol, count]) => {
      if (count >= 3) {
        const multiplier = symbol === "💎" ? 10 : symbol === "⭐" ? 5 : symbol === "💰" ? 8 : 2;
        totalWin += selectedBet * multiplier * count;
      }
    });

    return { totalWin, scatterCount };
  };

  const spinReels = () => {
    if (!user || parseFloat(user.coinBalance) < selectedBet) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough coins to place this bet",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    
    // Animate spinning
    const spinInterval = setInterval(() => {
      setReels(generateReels());
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      const finalReels = generateReels();
      setReels(finalReels);
      
      const { totalWin, scatterCount } = checkWin(finalReels);
      let bonusTriggered = false;
      let bbcWon = "0.00000000";

      // Bonus round trigger (3+ scatters)
      if (scatterCount >= 3 && !inBonusRound) {
        setFreeSpins(10);
        setInBonusRound(true);
        bonusTriggered = true;
        bbcWon = (selectedBet * 0.1).toFixed(8);
      }

      // Free spins handling
      if (inBonusRound && freeSpins > 0) {
        setFreeSpins(prev => prev - 1);
        if (freeSpins === 1) {
          setInBonusRound(false);
        }
      }

      const gameData = {
        gameType: "Paldo!",
        betAmount: selectedBet.toString(),
        winAmount: totalWin.toString(),
        bbcWon,
        result: bonusTriggered ? 
          `🎰 BONUS ROUND! Free spins activated + ${bbcWon} $BBC!` :
          totalWin > 0 ? 
            `🎉 You won ${totalWin.toFixed(2)} coins!` :
            "No win this time. Try again!"
      };

      playGameMutation.mutate(gameData);
      setIsSpinning(false);

      toast({
        title: bonusTriggered ? "Bonus Round!" : totalWin > 0 ? "Winner!" : "Spin Again",
        description: gameData.result,
        variant: totalWin > 0 || bonusTriggered ? "default" : "destructive",
      });
    }, 2000);
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
          <h1 className="text-2xl font-orbitron font-bold casino-orange">🎰 Paldo!</h1>
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
                    5-reel, 3-row video slot with 25 paylines. Land 3+ scatters for free spins and $BBC rewards!
                  </p>
                </div>

                {/* Bonus Status */}
                {(inBonusRound || freeSpins > 0) && (
                  <div className="text-center mb-6 p-4 bg-casino-gold/20 border border-casino-gold rounded-lg">
                    <h3 className="text-xl font-bold casino-gold">🎰 BONUS ROUND ACTIVE</h3>
                    <p className="casino-gold">Free Spins Remaining: {freeSpins}</p>
                  </div>
                )}

                {/* Slot Reels */}
                <div className="bg-casino-dark/50 border-4 border-casino-orange/50 rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-5 gap-2">
                    {reels.map((reel, reelIndex) => (
                      <div key={reelIndex} className="space-y-2">
                        {reel.map((symbol, symbolIndex) => (
                          <motion.div
                            key={`${reelIndex}-${symbolIndex}`}
                            className="w-16 h-16 bg-casino-gray border-2 border-casino-orange/30 rounded-lg flex items-center justify-center text-3xl"
                            animate={isSpinning ? { y: [-20, 0, -20] } : {}}
                            transition={{ 
                              duration: 0.1, 
                              repeat: isSpinning ? Infinity : 0,
                              delay: reelIndex * 0.1 
                            }}
                          >
                            {symbol}
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Controls */}
                <div className="text-center">
                  <Button
                    onClick={spinReels}
                    disabled={isSpinning || playGameMutation.isPending}
                    className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                  >
                    {isSpinning ? "Spinning..." : 
                     playGameMutation.isPending ? "Processing..." :
                     inBonusRound ? `FREE SPIN` :
                     `SPIN (${selectedBet} coins)`}
                  </Button>
                </div>
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
                      disabled={inBonusRound}
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

            {/* Paytable */}
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">Paytable</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>💎 Diamond (3+):</span>
                    <span className="casino-orange">10x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💰 Money (3+):</span>
                    <span className="casino-orange">8x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⭐ Star (3+):</span>
                    <span className="casino-orange">5x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🎰 Scatter (3+):</span>
                    <span className="casino-gold">FREE SPINS + $BBC</span>
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