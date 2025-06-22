import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Home } from "lucide-react";
import Navigation from "@/components/navigation";

const betAmounts = [0.25, 0.50, 1.00, 1.50, 2.00, 5.00, 10.00, 50.00, 100.00, 500.00, 1000.00];

export default function LuckAndRollPage() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBet, setSelectedBet] = useState(1.00);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // 16-slice wheel: 6 Bankrupt, 9 Multipliers, 1 Jackpot
  const wheelSlices = [
    { type: "bankrupt", value: 0, color: "#ef4444" },
    { type: "multiplier", value: 1.1, color: "#3b82f6" },
    { type: "bankrupt", value: 0, color: "#ef4444" },
    { type: "multiplier", value: 1.3, color: "#8b5cf6" },
    { type: "bankrupt", value: 0, color: "#ef4444" },
    { type: "multiplier", value: 1.5, color: "#10b981" },
    { type: "jackpot", value: "BBC", color: "#fbbf24" },
    { type: "multiplier", value: 1.8, color: "#f59e0b" },
    { type: "bankrupt", value: 0, color: "#ef4444" },
    { type: "multiplier", value: 2.0, color: "#06b6d4" },
    { type: "bankrupt", value: 0, color: "#ef4444" },
    { type: "multiplier", value: 4.0, color: "#84cc16" },
    { type: "bankrupt", value: 0, color: "#ef4444" },
    { type: "multiplier", value: 5.0, color: "#ec4899" },
    { type: "multiplier", value: 8.0, color: "#f97316" },
    { type: "multiplier", value: 10.0, color: "#dc2626" }
  ];

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

  const spinWheel = () => {
    if (!user || parseFloat(user.coinBalance) < selectedBet) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough coins to place this bet",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    
    // Calculate random slice (0-15)
    const winningSlice = Math.floor(Math.random() * 16);
    const sliceAngle = 360 / 16;
    const targetAngle = (winningSlice * sliceAngle) + (sliceAngle / 2);
    const spins = 3 + Math.random() * 2; // 3-5 full rotations
    const finalRotation = (spins * 360) + (360 - targetAngle); // Adjust for pointer at top
    
    setWheelRotation(prev => prev + finalRotation);
    
    setTimeout(() => {
      const result = wheelSlices[winningSlice];
      let winAmount = 0;
      let bbcWon = "0.00000000";
      let resultMessage = "";

      if (result.type === "bankrupt") {
        resultMessage = "💥 Bankrupt! Better luck next time!";
      } else if (result.type === "jackpot") {
        bbcWon = (selectedBet * 0.05).toFixed(8);
        resultMessage = `🎰 JACKPOT! You won ${bbcWon} $BBC tokens!`;
      } else {
        winAmount = selectedBet * result.value;
        resultMessage = `🎉 You won ${winAmount.toFixed(2)} coins! (${result.value}x)`;
      }

      const gameData = {
        gameType: "Luck and Roll",
        betAmount: selectedBet.toString(),
        winAmount: winAmount.toString(),
        bbcWon,
        result: resultMessage
      };

      setGameResult(gameData);
      setShowResult(true);
      setIsSpinning(false);
      
      playGameMutation.mutate(gameData);

      toast({
        title: result.type === "bankrupt" ? "Bankrupt!" : result.type === "jackpot" ? "Jackpot!" : "Winner!",
        description: resultMessage,
        variant: result.type === "bankrupt" ? "destructive" : "default",
      });
    }, 3000);
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
          <h1 className="text-2xl font-orbitron font-bold casino-orange">🎲 Luck and Roll</h1>
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
                    Spin the 16-slice wheel! Hit multipliers to win coins or the jackpot for $BBC tokens!
                  </p>
                </div>

                {/* Wheel Container */}
                <div className="relative w-80 h-80 mx-auto mb-8">
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-casino-orange"></div>
                  </div>
                  
                  {/* Wheel */}
                  <div 
                    className="w-80 h-80 rounded-full border-4 border-casino-orange relative transition-transform duration-3000 ease-out"
                    style={{ 
                      transform: `rotate(${wheelRotation}deg)`,
                      background: `conic-gradient(
                        ${wheelSlices.map((slice, index) => 
                          `${slice.color} ${index * 22.5}deg ${(index + 1) * 22.5}deg`
                        ).join(', ')}
                      )`
                    }}
                  >
                    {wheelSlices.map((slice, index) => {
                      const angle = (360 / 16) * index;
                      return (
                        <div
                          key={index}
                          className="absolute w-full h-full flex items-start justify-center"
                          style={{
                            transform: `rotate(${angle + 11.25}deg)`,
                            transformOrigin: 'center center'
                          }}
                        >
                          <div 
                            className="text-xs font-bold mt-4"
                            style={{
                              color: slice.type === "jackpot" ? "#000" : "#fff",
                              transform: 'rotate(-11.25deg)'
                            }}
                          >
                            {slice.type === "bankrupt" ? "💥" : 
                             slice.type === "jackpot" ? "🎰" : 
                             `${slice.value}x`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Game Controls */}
                <div className="text-center">
                  <Button
                    onClick={spinWheel}
                    disabled={isSpinning || playGameMutation.isPending}
                    className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                  >
                    {isSpinning ? "Spinning..." : 
                     playGameMutation.isPending ? "Processing..." :
                     `SPIN (${selectedBet} coins)`}
                  </Button>
                </div>

                {/* Result Display */}
                {showResult && gameResult && (
                  <div className="mt-8 p-6 bg-casino-dark/50 border border-casino-orange/30 rounded-lg">
                    <h3 className="text-xl font-bold casino-orange mb-2">Result</h3>
                    <p className="text-white">{gameResult.result}</p>
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

            {/* Game Info */}
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">How to Play</h3>
                <div className="space-y-2 text-sm casino-orange-accent">
                  <p>• 16-slice wheel with different outcomes</p>
                  <p>• 6 Bankrupt slices (lose bet)</p>
                  <p>• 9 Multiplier slices (1.1x - 10.0x)</p>
                  <p>• 1 Jackpot slice (0.05x bet as $BBC)</p>
                  <p>• Spin and hope for the best!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}