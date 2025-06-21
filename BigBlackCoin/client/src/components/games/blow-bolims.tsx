import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface BlowJoyBalloonProps {
  betAmount: number;
  onClose: () => void;
}

export default function BlowJoyBalloon({ betAmount, onClose }: BlowJoyBalloonProps) {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState(2.00);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [balloonSize, setBalloonSize] = useState(50);
  const [hasPopped, setHasPopped] = useState(false);
  const [isBonusBalloon, setIsBonusBalloon] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const crashPointRef = useRef<number>(1.00);

  const playGameMutation = useMutation({
    mutationFn: async (gameResult: any) => {
      const response = await apiRequest("POST", "/api/games/play", gameResult);
      return response.json();
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent-wins"] });
    },
    onError: (error: any) => {
      toast({
        title: "Game error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateCrashPoint = () => {
    // Generate crash point with house edge
    const random = Math.random();
    if (random < 0.01) return 1.00; // 1% chance of instant crash
    if (random < 0.05) return 1.00 + Math.random() * 0.50; // 4% chance of early crash
    if (random < 0.15) return 1.50 + Math.random() * 1.00; // 10% chance of medium crash
    if (random < 0.40) return 2.50 + Math.random() * 2.50; // 25% chance of high crash
    if (random < 0.70) return 5.00 + Math.random() * 10.00; // 30% chance of very high
    return 15.00 + Math.random() * 85.00; // 30% chance of extreme multipliers
  };

  const startGame = () => {
    if (!user || parseFloat(user.coinBalance) < betAmount) {
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
    setShowResult(false);
    
    // 15% chance for bonus balloon
    const isBonus = Math.random() < 0.15;
    setIsBonusBalloon(isBonus);
    
    // Generate crash point
    crashPointRef.current = generateCrashPoint();
    if (isBonus) {
      crashPointRef.current *= 1.5; // Bonus balloons have higher crash points
    }

    // Start the inflation
    intervalRef.current = setInterval(() => {
      setCurrentMultiplier(prev => {
        const newMultiplier = prev + 0.01;
        
        // Update balloon size based on multiplier
        const newSize = Math.min(300, 50 + (newMultiplier - 1) * 30);
        setBalloonSize(newSize);
        
        // Check for auto cashout
        if (autoCashout && newMultiplier >= autoCashoutValue) {
          cashOut(newMultiplier);
          return newMultiplier;
        }
        
        // Check if balloon should pop
        if (newMultiplier >= crashPointRef.current) {
          balloonPop();
          return newMultiplier;
        }
        
        return newMultiplier;
      });
    }, 100);
  };

  const cashOut = async (multiplier?: number) => {
    if (!isGameActive) return;
    
    const finalMultiplier = multiplier || currentMultiplier;
    endGame(true, finalMultiplier);
  };

  const balloonPop = () => {
    if (!isGameActive) return;
    
    setHasPopped(true);
    endGame(false, currentMultiplier);
  };

  const endGame = async (won: boolean, finalMultiplier: number) => {
    setIsGameActive(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    let winAmount = 0;
    let bbcWon = 0;
    
    if (won) {
      winAmount = betAmount * finalMultiplier;
      
      // 7% chance for BBC jackpot on any cashout
      if (Math.random() < 0.07) {
        bbcWon = betAmount * 0.05;
      }
      
      // Bonus balloon gives extra BBC
      if (isBonusBalloon) {
        bbcWon += betAmount * 0.1;
      }
    }

    const result = {
      userId: user!.id,
      gameType: "Blow it Bolims!",
      betAmount: betAmount.toString(),
      winAmount: winAmount.toFixed(2),
      bbcWon: bbcWon.toFixed(8),
      result: won 
        ? `Cashed out at ${finalMultiplier.toFixed(2)}x${isBonusBalloon ? ' (Bonus Balloon)' : ''} - Won ${winAmount.toFixed(2)} coins${bbcWon > 0 ? ` + ${bbcWon.toFixed(8)} $BBC` : ""}`
        : `Balloon popped at ${finalMultiplier.toFixed(2)}x - Lost ${betAmount} coins`,
    };

    setGameResult({ 
      won, 
      winAmount, 
      bbcWon, 
      finalMultiplier, 
      crashPoint: crashPointRef.current,
      isBonusBalloon 
    });
    setShowResult(true);
    playGameMutation.mutate(result);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-orbitron text-3xl font-bold casino-orange">Blow it Bolims!</h2>
        <Button onClick={onClose} variant="ghost" className="text-casino-orange">
          <i className="fas fa-times text-2xl"></i>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Area */}
        <div className="flex flex-col items-center">
          {/* Balloon */}
          <div className="w-80 h-80 mb-6 flex items-center justify-center relative">
            <motion.div
              className={`rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl ${
                isBonusBalloon ? 'bg-gradient-to-br from-casino-gold to-yellow-600' : 'bg-gradient-to-br from-red-500 to-pink-600'
              }`}
              style={{ width: `${balloonSize}px`, height: `${balloonSize}px` }}
              animate={hasPopped ? {
                scale: [1, 1.5, 0],
                opacity: [1, 1, 0]
              } : isGameActive ? {
                scale: [1, 1.02, 1],
              } : {}}
              transition={hasPopped ? { duration: 0.5 } : { duration: 2, repeat: Infinity }}
            >
              {hasPopped ? "💥" : isBonusBalloon ? "🎁" : "🎈"}
            </motion.div>
            
            {/* Multiplier display */}
            {isGameActive && (
              <motion.div
                className="absolute -top-16 bg-casino-dark border border-casino-orange rounded-lg px-4 py-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <p className="casino-orange font-orbitron text-2xl font-bold">
                  {currentMultiplier.toFixed(2)}x
                </p>
              </motion.div>
            )}
            
            {isBonusBalloon && !isGameActive && (
              <div className="absolute -top-8 bg-casino-gold text-casino-black rounded-full px-3 py-1 text-sm font-bold">
                BONUS BALLOON
              </div>
            )}
          </div>

          {/* Game Controls */}
          {!isGameActive ? (
            <div className="text-center space-y-4">
              <Button
                onClick={startGame}
                disabled={playGameMutation.isPending}
                className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
              >
                INFLATE BALLOON ({betAmount} coins)
              </Button>
              
              {/* Auto Cashout Settings */}
              <Card className="casino-gray border-casino-orange/20 p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-cashout"
                      checked={autoCashout}
                      onCheckedChange={setAutoCashout}
                    />
                    <Label htmlFor="auto-cashout" className="casino-orange-accent">Auto Cashout</Label>
                  </div>
                  
                  {autoCashout && (
                    <div>
                      <Label className="casino-orange-accent text-sm">Cashout at:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={autoCashoutValue}
                        onChange={(e) => setAutoCashoutValue(parseFloat(e.target.value) || 2.00)}
                        className="casino-dark border-casino-orange/30 text-white mt-1"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-center">
              <Button
                onClick={() => cashOut()}
                className="bg-casino-gold text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
              >
                CASH OUT ({(betAmount * currentMultiplier).toFixed(2)} coins)
              </Button>
              <p className="casino-orange-accent text-sm mt-2">
                Current win: {(betAmount * currentMultiplier).toFixed(2)} coins
              </p>
            </div>
          )}
        </div>

        {/* Game Info and Results */}
        <div className="space-y-6">
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Game Rules</h3>
              <ul className="space-y-2 casino-orange-accent text-sm">
                <li>• Watch the balloon inflate with increasing multiplier</li>
                <li>• Cash out before it pops to win</li>
                <li>• The longer you wait, the higher the multiplier</li>
                <li>• But the balloon can pop at any time!</li>
                <li>• 15% chance for bonus balloons (gold color)</li>
                <li>• Bonus balloons have higher pop points</li>
                <li>• 7% chance for $BBC bonus on cash out</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Your Bet</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="casino-orange-accent">Bet Amount:</span>
                  <span className="casino-orange font-rajdhani font-bold">
                    {betAmount} coins
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="casino-orange-accent">Auto Cashout:</span>
                  <span className="casino-orange font-rajdhani font-bold">
                    {autoCashout ? `${autoCashoutValue}x` : "Manual"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="casino-orange-accent">Your Balance:</span>
                  <span className="casino-orange font-rajdhani font-bold">
                    {parseFloat(user?.coinBalance || "0").toLocaleString()} coins
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Recent Multipliers</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[2.14, 1.00, 5.67, 3.42, 1.23, 8.91, 2.05, 1.76, 4.33, 1.00].map((mult, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs font-rajdhani font-bold ${
                      mult < 2 ? "bg-red-600 text-white" : 
                      mult < 5 ? "bg-casino-orange text-casino-black" :
                      "bg-green-600 text-white"
                    }`}
                  >
                    {mult.toFixed(2)}x
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {showResult && gameResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 rounded-xl border-2 ${
                  gameResult.won 
                    ? "bg-green-900/20 border-green-500" 
                    : "bg-red-900/20 border-red-500"
                }`}
              >
                <h3 className="font-orbitron text-2xl font-bold mb-2">
                  {gameResult.won ? "🎈 CASHED OUT!" : "💥 BALLOON POPPED!"}
                </h3>
                
                {gameResult.isBonusBalloon && (
                  <p className="casino-gold font-rajdhani font-bold mb-2">
                    🎁 Bonus Balloon!
                  </p>
                )}
                
                <p className="text-lg casino-orange-accent mb-2">
                  {gameResult.won 
                    ? `Cashed out at ${gameResult.finalMultiplier.toFixed(2)}x`
                    : `Popped at ${gameResult.finalMultiplier.toFixed(2)}x (crash: ${gameResult.crashPoint.toFixed(2)}x)`
                  }
                </p>
                
                {gameResult.won ? (
                  <>
                    <p className="casino-orange font-rajdhani font-bold text-xl">
                      Won: {gameResult.winAmount.toFixed(2)} coins
                    </p>
                    {gameResult.bbcWon > 0 && (
                      <p className="casino-gold font-rajdhani font-bold text-xl">
                        Bonus: {gameResult.bbcWon.toFixed(8)} $BBC tokens
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-red-400 font-rajdhani font-bold text-xl">
                    Lost: {betAmount} coins
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
