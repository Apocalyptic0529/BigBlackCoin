import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { X, Home } from "lucide-react";
import Navigation from "@/components/navigation";

const betAmounts = [0.25, 0.50, 1.00, 1.50, 2.00, 5.00, 10.00, 50.00, 100.00, 500.00, 1000.00];

export default function BlowJoyBalloonPage() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBet, setSelectedBet] = useState(1.00);
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState(2.00);
  const [balloonSize, setBalloonSize] = useState(50);
  const [hasPopped, setHasPopped] = useState(false);
  const [isBonusBalloon, setIsBonusBalloon] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

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
    setCurrentMultiplier(1.00);
    setBalloonSize(50);
    setHasPopped(false);
    setGameEnded(false);
    
    // 5% chance for bonus balloon
    const isBonus = Math.random() < 0.05;
    setIsBonusBalloon(isBonus);
    
    if (isBonus) {
      toast({
        title: "🎈 BONUS BALLOON!",
        description: "Higher ceiling and $BBC rewards!",
      });
    }

    // Start inflation animation
    inflateLoop();
  };

  const inflateLoop = () => {
    const popPoint = isBonusBalloon ? 
      2.0 + Math.random() * 8.0 : // Bonus: 2.0x - 10.0x
      1.5 + Math.random() * 3.5;  // Normal: 1.5x - 5.0x

    const interval = setInterval(() => {
      setCurrentMultiplier(prev => {
        const newMultiplier = prev + 0.01;
        setBalloonSize(50 + (newMultiplier - 1) * 100);
        
        // Auto cashout check
        if (autoCashout && newMultiplier >= autoCashoutValue) {
          clearInterval(interval);
          cashOut(newMultiplier);
          return newMultiplier;
        }
        
        // Pop check
        if (newMultiplier >= popPoint) {
          clearInterval(interval);
          popBalloon();
          return newMultiplier;
        }
        
        return newMultiplier;
      });
    }, 100);
  };

  const cashOut = (multiplier?: number) => {
    if (!isGameActive || gameEnded) return;
    
    const finalMultiplier = multiplier || currentMultiplier;
    const winAmount = selectedBet * finalMultiplier;
    let bbcWon = "0.00000000";
    
    // BBC reward for bonus balloons or high multipliers
    if (isBonusBalloon || finalMultiplier >= 4.0) {
      bbcWon = (selectedBet * 0.08).toFixed(8);
    }

    const gameData = {
      gameType: "Blow Joy Balloon",
      betAmount: selectedBet.toString(),
      winAmount: winAmount.toString(),
      bbcWon,
      result: `💰 Cashed out at ${finalMultiplier.toFixed(2)}x for ${winAmount.toFixed(2)} coins!` +
              (bbcWon !== "0.00000000" ? ` + ${bbcWon} $BBC!` : "")
    };

    playGameMutation.mutate(gameData);
    setIsGameActive(false);
    setGameEnded(true);

    toast({
      title: "Cashed Out!",
      description: gameData.result,
    });
  };

  const popBalloon = () => {
    setHasPopped(true);
    setIsGameActive(false);
    setGameEnded(true);

    const gameData = {
      gameType: "Blow Joy Balloon",
      betAmount: selectedBet.toString(),
      winAmount: "0",
      bbcWon: "0.00000000",
      result: `💥 BALLOON POPPED at ${currentMultiplier.toFixed(2)}x! Better luck next time!`
    };

    playGameMutation.mutate(gameData);

    toast({
      title: "Balloon Popped!",
      description: gameData.result,
      variant: "destructive",
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
          <h1 className="text-2xl font-orbitron font-bold casino-orange">🎈 Blow Joy Balloon</h1>
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
                    Watch the balloon inflate and cash out before it pops! Use auto-cashout for strategic play.
                  </p>
                </div>

                {/* Bonus Balloon Indicator */}
                {isBonusBalloon && isGameActive && (
                  <div className="text-center mb-6 p-4 bg-casino-gold/20 border border-casino-gold rounded-lg">
                    <h3 className="text-xl font-bold casino-gold">🎈 BONUS BALLOON!</h3>
                    <p className="casino-gold">Higher ceiling + $BBC rewards!</p>
                  </div>
                )}

                {/* Game Status */}
                {isGameActive && (
                  <div className="text-center mb-6 p-4 bg-casino-dark/50 border border-casino-orange/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="casino-orange-accent text-sm">Current Multiplier</p>
                        <p className="casino-orange text-3xl font-bold">{currentMultiplier.toFixed(2)}x</p>
                      </div>
                      <div>
                        <p className="casino-orange-accent text-sm">Potential Win</p>
                        <p className="casino-orange text-3xl font-bold">{(selectedBet * currentMultiplier).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Balloon */}
                <div className="flex justify-center mb-8">
                  <motion.div
                    className={`rounded-full border-4 flex items-center justify-center text-4xl ${
                      hasPopped ? 'border-red-500 bg-red-500/20' :
                      isBonusBalloon ? 'border-casino-gold bg-casino-gold/20' :
                      'border-casino-orange bg-casino-orange/20'
                    }`}
                    style={{ 
                      width: `${balloonSize}px`, 
                      height: `${balloonSize}px`,
                      maxWidth: '300px',
                      maxHeight: '300px'
                    }}
                    animate={isGameActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isGameActive ? Infinity : 0 }}
                  >
                    {hasPopped ? "💥" : "🎈"}
                  </motion.div>
                </div>

                {/* Game Controls */}
                {!isGameActive ? (
                  <div className="text-center">
                    <Button
                      onClick={startGame}
                      disabled={playGameMutation.isPending}
                      className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                    >
                      START INFLATING ({selectedBet} coins)
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      onClick={() => cashOut()}
                      disabled={gameEnded}
                      className="bg-casino-gold text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                    >
                      CASH OUT ({(selectedBet * currentMultiplier).toFixed(2)} coins)
                    </Button>
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

            {/* Auto Cashout */}
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">Auto Cashout</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-cashout"
                      checked={autoCashout}
                      onCheckedChange={setAutoCashout}
                      disabled={isGameActive}
                    />
                    <Label htmlFor="auto-cashout" className="casino-orange-accent">
                      Enable Auto Cashout
                    </Label>
                  </div>
                  
                  {autoCashout && (
                    <div>
                      <Label className="casino-orange-accent text-sm">Cashout at:</Label>
                      <Input
                        type="number"
                        value={autoCashoutValue}
                        onChange={(e) => setAutoCashoutValue(parseFloat(e.target.value) || 2.00)}
                        min="1.01"
                        max="50.00"
                        step="0.01"
                        disabled={isGameActive}
                        className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange mt-1"
                      />
                      <p className="text-xs casino-orange-accent mt-1">
                        Auto cashout at {autoCashoutValue}x
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="casino-dark border-casino-orange/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold casino-orange mb-4">How to Play</h3>
                <div className="space-y-2 text-sm casino-orange-accent">
                  <p>• Balloon inflates with increasing multiplier</p>
                  <p>• Cash out anytime to secure winnings</p>
                  <p>• 5% chance for bonus balloons</p>
                  <p>• Higher multipliers = $BBC rewards</p>
                  <p>• Don't let it pop!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}