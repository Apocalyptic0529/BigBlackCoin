import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface FlipJonathanProps {
  betAmount: number;
  onClose: () => void;
}

export default function FlipJonathan({ betAmount, onClose }: FlipJonathanProps) {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);
  const [lastFlip, setLastFlip] = useState<"heads" | "tails" | null>(null);
  const [currentWinnings, setCurrentWinnings] = useState(0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const multipliers = [1.5, 2.0, 3.0, 4.5, 6.0, 9.0, 13.5, 20.0, 30.0, 45.0];

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
    setCurrentStreak(0);
    setCurrentMultiplier(1);
    setCurrentWinnings(betAmount);
    setShowResult(false);
  };

  const flip = async (choice: "heads" | "tails") => {
    if (!isGameActive || isFlipping) return;

    setIsFlipping(true);
    
    // Generate random result
    const result = Math.random() < 0.5 ? "heads" : "tails";
    setLastFlip(result);

    // Wait for flip animation
    setTimeout(() => {
      setIsFlipping(false);
      
      if (result === choice) {
        // Correct guess - increase streak and multiplier
        const newStreak = currentStreak + 1;
        const newMultiplier = multipliers[Math.min(newStreak - 1, multipliers.length - 1)] || multipliers[multipliers.length - 1];
        const newWinnings = betAmount * newMultiplier;
        
        setCurrentStreak(newStreak);
        setCurrentMultiplier(newMultiplier);
        setCurrentWinnings(newWinnings);
        
        toast({
          title: "Correct!",
          description: `Streak: ${newStreak} | Multiplier: ${newMultiplier}x`,
        });
      } else {
        // Wrong guess - end game
        endGame(false);
      }
    }, 1500);
  };

  const cashOut = () => {
    if (!isGameActive) return;
    endGame(true);
  };

  const endGame = async (won: boolean) => {
    setIsGameActive(false);
    
    let winAmount = 0;
    let bbcWon = 0;
    
    if (won && currentStreak > 0) {
      winAmount = currentWinnings;
      // 5% chance for BBC jackpot
      if (Math.random() < 0.05) {
        bbcWon = betAmount * 0.03; // 0.03x of bet in BBC
      }
    }

    const result = {
      userId: user!.id,
      gameType: "Flip it Jonathan!",
      betAmount: betAmount.toString(),
      winAmount: winAmount.toFixed(2),
      bbcWon: bbcWon.toFixed(8),
      result: won 
        ? `Cashed out at ${currentStreak} streak - Won ${winAmount.toFixed(2)} coins${bbcWon > 0 ? ` + ${bbcWon.toFixed(8)} $BBC` : ""}`
        : `Lost at ${currentStreak} streak - Lost ${betAmount} coins`,
    };

    setGameResult({ won, winAmount, bbcWon, streak: currentStreak });
    setShowResult(true);
    playGameMutation.mutate(result);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-orbitron text-3xl font-bold casino-orange">Flip it Jonathan!</h2>
        <Button onClick={onClose} variant="ghost" className="text-casino-orange">
          <i className="fas fa-times text-2xl"></i>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Area */}
        <div className="flex flex-col items-center">
          {/* Coin */}
          <div className="w-64 h-64 mb-6 flex items-center justify-center">
            <motion.div
              className="w-48 h-48 rounded-full bg-gradient-to-br from-casino-gold to-yellow-600 border-4 border-casino-orange flex items-center justify-center text-casino-black font-orbitron text-2xl font-bold shadow-2xl"
              animate={isFlipping ? { 
                rotateY: [0, 180, 360, 540, 720],
                scale: [1, 1.1, 1, 1.1, 1]
              } : {}}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              {lastFlip ? (lastFlip === "heads" ? "H" : "T") : "?"}
            </motion.div>
          </div>

          {/* Game Controls */}
          {!isGameActive ? (
            <Button
              onClick={startGame}
              disabled={playGameMutation.isPending}
              className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
            >
              START GAME ({betAmount} coins)
            </Button>
          ) : (
            <div className="space-y-4 w-full max-w-md">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => flip("heads")}
                  disabled={isFlipping}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-rajdhani font-bold hover:bg-blue-700 transition-all"
                >
                  HEADS
                </Button>
                <Button
                  onClick={() => flip("tails")}
                  disabled={isFlipping}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-rajdhani font-bold hover:bg-red-700 transition-all"
                >
                  TAILS
                </Button>
              </div>
              
              {currentStreak > 0 && (
                <Button
                  onClick={cashOut}
                  disabled={isFlipping}
                  className="w-full bg-casino-gold text-casino-black px-6 py-3 rounded-lg font-rajdhani font-bold hover-glow"
                >
                  CASH OUT ({currentWinnings.toFixed(2)} coins)
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Game Info and Results */}
        <div className="space-y-6">
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Game Rules</h3>
              <ul className="space-y-2 casino-orange-accent text-sm">
                <li>• Choose heads or tails correctly to continue</li>
                <li>• Each correct guess increases your multiplier</li>
                <li>• One wrong guess ends the game - lose everything</li>
                <li>• Cash out anytime to secure your winnings</li>
                <li>• 5% chance to win $BBC tokens on cash out</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Current Game</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="casino-orange-accent">Streak:</span>
                  <span className="casino-orange font-rajdhani font-bold text-xl">
                    {currentStreak}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="casino-orange-accent">Multiplier:</span>
                  <span className="casino-orange font-rajdhani font-bold text-xl">
                    {currentMultiplier}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="casino-orange-accent">Potential Win:</span>
                  <span className="casino-orange font-rajdhani font-bold text-xl">
                    {currentWinnings.toFixed(2)} coins
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multiplier Path */}
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Multiplier Path</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {multipliers.slice(0, 10).map((mult, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs font-rajdhani font-bold ${
                      index + 1 === currentStreak
                        ? "bg-casino-orange text-casino-black"
                        : index + 1 < currentStreak
                        ? "bg-green-600 text-white"
                        : "casino-dark text-casino-orange-accent"
                    }`}
                  >
                    {index + 1}: {mult}x
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
                  {gameResult.won ? "🎉 CASHED OUT!" : "💥 GAME OVER!"}
                </h3>
                <p className="text-lg casino-orange-accent mb-2">
                  Final streak: <span className="font-bold">{gameResult.streak}</span>
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
