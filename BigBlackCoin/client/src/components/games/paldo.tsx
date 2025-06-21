import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface PaldoProps {
  betAmount: number;
  onClose: () => void;
}

const symbols = ["🂡", "🂱", "🃁", "🃑", "🂢", "🂲", "🃂", "🃒", "🂫", "🂻", "🃋", "🃛", "🂭", "🂽", "🃍", "🃝", "🂮", "🂾", "🃎", "🃞"];
const wildSymbol = "🃏";
const scatterSymbol = "💎";

export default function Paldo({ betAmount, onClose }: PaldoProps) {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[][]>(
    Array(5).fill(null).map(() => Array(3).fill(symbols[0]))
  );
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [freeSpins, setFreeSpins] = useState(0);
  const [inFreeSpins, setInFreeSpins] = useState(false);

  const spinMutation = useMutation({
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

  const generateReels = () => {
    return Array(5).fill(null).map(() => {
      return Array(3).fill(null).map(() => {
        const rand = Math.random();
        if (rand < 0.02) return scatterSymbol; // 2% scatter
        if (rand < 0.05) return wildSymbol; // 3% wild
        return symbols[Math.floor(Math.random() * symbols.length)];
      });
    });
  };

  const checkWins = (reels: string[][]) => {
    let winAmount = 0;
    let scatterCount = 0;
    let hasWin = false;

    // Count scatters
    reels.forEach(reel => {
      reel.forEach(symbol => {
        if (symbol === scatterSymbol) scatterCount++;
      });
    });

    // Check paylines (simplified - just horizontal lines)
    for (let row = 0; row < 3; row++) {
      const line = reels.map(reel => reel[row]);
      const winInfo = checkPayline(line);
      if (winInfo.win) {
        winAmount += winInfo.payout * betAmount;
        hasWin = true;
      }
    }

    // Scatter bonus
    if (scatterCount >= 3) {
      const freeSpinsAwarded = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 20;
      return { winAmount, scatterCount, freeSpinsAwarded, hasWin: true };
    }

    return { winAmount, scatterCount, freeSpinsAwarded: 0, hasWin };
  };

  const checkPayline = (line: string[]) => {
    // Replace wilds with the most common symbol (simplified)
    const nonWilds = line.filter(s => s !== wildSymbol);
    if (nonWilds.length === 0) {
      // All wilds
      return { win: true, payout: 5.0 };
    }

    const mostCommon = nonWilds.reduce((a, b, i, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

    const effectiveLine = line.map(s => s === wildSymbol ? mostCommon : s);
    const matches = effectiveLine.filter(s => s === mostCommon).length;

    if (matches >= 3) {
      const payouts = { 3: 0.5, 4: 2.0, 5: 10.0 };
      return { win: true, payout: payouts[matches as keyof typeof payouts] || 0 };
    }

    return { win: false, payout: 0 };
  };

  const handleSpin = async () => {
    if (!inFreeSpins && (!user || parseFloat(user.coinBalance) < betAmount)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough coins to place this bet",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    setShowResult(false);

    // Animate reels spinning
    const newReels = generateReels();
    setReels(newReels);

    setTimeout(() => {
      setIsSpinning(false);
      
      const winInfo = checkWins(newReels);
      let winAmount = winInfo.winAmount;
      let bbcWon = 0;

      // Free spins trigger
      if (winInfo.freeSpinsAwarded > 0) {
        setFreeSpins(prev => prev + winInfo.freeSpinsAwarded);
        if (!inFreeSpins) {
          setInFreeSpins(true);
        }
      }

      // Use free spin
      if (inFreeSpins && freeSpins > 0) {
        setFreeSpins(prev => prev - 1);
        if (freeSpins - 1 === 0) {
          setInFreeSpins(false);
        }
      }

      // 8% chance for BBC jackpot on any win
      if (winInfo.hasWin && Math.random() < 0.08) {
        bbcWon = betAmount * 0.08;
      }

      // Progressive jackpot check (5 scatters on max bet)
      if (winInfo.scatterCount === 5 && betAmount >= 100) {
        bbcWon += 1.0; // Big BBC jackpot
        winAmount += betAmount * 50; // Huge coin win
      }

      const gameResult = {
        userId: user!.id,
        gameType: "Paldo!",
        betAmount: inFreeSpins ? "0.00" : betAmount.toString(),
        winAmount: winAmount.toFixed(2),
        bbcWon: bbcWon.toFixed(8),
        result: `${winInfo.hasWin ? 'Win' : 'No win'} - ${winInfo.scatterCount} scatters${winInfo.freeSpinsAwarded > 0 ? `, ${winInfo.freeSpinsAwarded} free spins` : ''}${bbcWon > 0 ? `, $BBC bonus` : ''}`,
      };

      setResult({ 
        ...winInfo, 
        winAmount, 
        bbcWon, 
        gameResult,
        usedFreeSpin: inFreeSpins && freeSpins > 0
      });
      setShowResult(true);
      
      if (!inFreeSpins || (inFreeSpins && winAmount > 0)) {
        spinMutation.mutate(gameResult);
      }
    }, 2000);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-orbitron text-3xl font-bold casino-orange">Paldo!</h2>
        <Button onClick={onClose} variant="ghost" className="text-casino-orange">
          <i className="fas fa-times text-2xl"></i>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slot Machine */}
        <div className="lg:col-span-2">
          <Card className="casino-gray border-casino-orange/20 p-6">
            <div className="bg-casino-dark rounded-lg p-4 mb-6">
              {/* Reels */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {reels.map((reel, reelIndex) => (
                  <div key={reelIndex} className="space-y-2">
                    {reel.map((symbol, symbolIndex) => (
                      <motion.div
                        key={`${reelIndex}-${symbolIndex}`}
                        className="w-16 h-16 bg-white rounded border-2 border-casino-orange flex items-center justify-center text-2xl"
                        animate={isSpinning ? {
                          y: [-20, 0, 20, 0],
                          opacity: [1, 0.5, 1]
                        } : {}}
                        transition={{ 
                          duration: 0.3, 
                          delay: reelIndex * 0.1,
                          repeat: isSpinning ? Infinity : 0
                        }}
                      >
                        {symbol}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Spin Button */}
              <div className="text-center">
                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || spinMutation.isPending}
                  className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                >
                  {isSpinning ? "SPINNING..." : inFreeSpins ? `FREE SPIN (${freeSpins} left)` : `SPIN (${betAmount} coins)`}
                </Button>
              </div>
            </div>

            {/* Paylines indicator */}
            <div className="text-center">
              <p className="casino-orange-accent text-sm">25 Paylines Active</p>
              {inFreeSpins && (
                <p className="casino-gold font-rajdhani font-bold">
                  FREE SPINS MODE - {freeSpins} spins remaining
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Game Info */}
        <div className="space-y-6">
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Game Features</h3>
              <ul className="space-y-2 casino-orange-accent text-sm">
                <li>• 🃏 Wilds substitute for any symbol</li>
                <li>• 💎 3+ Scatters = Free Spins</li>
                <li>• 3 Scatters = 10 Free Spins</li>
                <li>• 4 Scatters = 15 Free Spins</li>
                <li>• 5 Scatters = 20 Free Spins</li>
                <li>• 5 Scatters + Max Bet = Progressive Jackpot</li>
                <li>• 8% chance for $BBC bonus on wins</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Paytable</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>3 of a kind:</span>
                  <span className="casino-orange">0.5x</span>
                </div>
                <div className="flex justify-between">
                  <span>4 of a kind:</span>
                  <span className="casino-orange">2.0x</span>
                </div>
                <div className="flex justify-between">
                  <span>5 of a kind:</span>
                  <span className="casino-orange">10.0x</span>
                </div>
                <div className="flex justify-between">
                  <span>5 Wilds:</span>
                  <span className="casino-gold">50.0x</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 rounded-xl border-2 ${
                  result.hasWin 
                    ? "bg-green-900/20 border-green-500" 
                    : "bg-casino-gray/20 border-casino-orange/30"
                }`}
              >
                <h3 className="font-orbitron text-2xl font-bold mb-2">
                  {result.hasWin ? "🎰 WIN!" : "🎰 SPIN COMPLETE"}
                </h3>
                
                {result.scatterCount > 0 && (
                  <p className="casino-gold font-rajdhani font-bold mb-2">
                    {result.scatterCount} Scatters found!
                  </p>
                )}
                
                {result.freeSpinsAwarded > 0 && (
                  <p className="casino-gold font-rajdhani font-bold mb-2">
                    🎁 {result.freeSpinsAwarded} Free Spins Awarded!
                  </p>
                )}
                
                {result.winAmount > 0 && (
                  <p className="casino-orange font-rajdhani font-bold text-xl">
                    Won: {result.winAmount.toFixed(2)} coins
                  </p>
                )}
                
                {result.bbcWon > 0 && (
                  <p className="casino-gold font-rajdhani font-bold text-xl">
                    Bonus: {result.bbcWon.toFixed(8)} $BBC tokens
                  </p>
                )}
                
                {!result.hasWin && !result.usedFreeSpin && (
                  <p className="casino-orange-accent">
                    Better luck next spin!
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
