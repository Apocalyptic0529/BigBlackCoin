import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface LuckAndRollProps {
  betAmount: number;
  onClose: () => void;
}

const wheelSegments = [
  { type: "bankrupt", label: "BANKRUPT", multiplier: 0, color: "bg-red-600" },
  { type: "multiplier", label: "1.1x", multiplier: 1.1, color: "bg-blue-600" },
  { type: "bankrupt", label: "BANKRUPT", multiplier: 0, color: "bg-red-600" },
  { type: "multiplier", label: "1.3x", multiplier: 1.3, color: "bg-green-600" },
  { type: "bankrupt", label: "BANKRUPT", multiplier: 0, color: "bg-red-600" },
  { type: "multiplier", label: "1.5x", multiplier: 1.5, color: "bg-green-600" },
  { type: "jackpot", label: "JACKPOT", multiplier: 0, color: "bg-casino-gold" },
  { type: "multiplier", label: "1.8x", multiplier: 1.8, color: "bg-green-600" },
  { type: "bankrupt", label: "BANKRUPT", multiplier: 0, color: "bg-red-600" },
  { type: "multiplier", label: "2.0x", multiplier: 2.0, color: "bg-green-600" },
  { type: "bankrupt", label: "BANKRUPT", multiplier: 0, color: "bg-red-600" },
  { type: "multiplier", label: "4.0x", multiplier: 4.0, color: "bg-purple-600" },
  { type: "bankrupt", label: "BANKRUPT", multiplier: 0, color: "bg-red-600" },
  { type: "multiplier", label: "5.0x", multiplier: 5.0, color: "bg-purple-600" },
  { type: "multiplier", label: "8.0x", multiplier: 8.0, color: "bg-purple-600" },
  { type: "multiplier", label: "10.0x", multiplier: 10.0, color: "bg-purple-600" },
];

export default function LuckAndRoll({ betAmount, onClose }: LuckAndRollProps) {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

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

  const handleSpin = async () => {
    if (!user || parseFloat(user.coinBalance) < betAmount) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough coins to place this bet",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    
    // Generate random result
    const randomIndex = Math.floor(Math.random() * wheelSegments.length);
    const segment = wheelSegments[randomIndex];
    
    // Calculate rotation (each segment is 22.5 degrees)
    const segmentAngle = 360 / wheelSegments.length;
    const targetRotation = rotation + 1440 + (randomIndex * segmentAngle); // 4 full rotations + target
    setRotation(targetRotation);

    // Calculate winnings
    let winAmount = 0;
    let bbcWon = 0;
    
    if (segment.type === "multiplier") {
      winAmount = betAmount * segment.multiplier;
    } else if (segment.type === "jackpot") {
      bbcWon = betAmount * 0.05; // 0.05x of bet in BBC
      // 10% chance for additional BBC jackpot
      if (Math.random() < 0.1) {
        bbcWon += 0.1; // Additional jackpot
      }
    }

    const gameResult = {
      userId: user.id,
      gameType: "Luck and Roll",
      betAmount: betAmount.toString(),
      winAmount: winAmount.toFixed(2),
      bbcWon: bbcWon.toFixed(8),
      result: `${segment.label} - ${segment.type === "multiplier" ? `Won ${winAmount.toFixed(2)} coins` : segment.type === "jackpot" ? `Won ${bbcWon.toFixed(8)} $BBC` : "Lost bet"}`,
    };

    setResult({ segment, winAmount, bbcWon, gameResult });

    // Wait for spin animation to complete
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      spinMutation.mutate(gameResult);
    }, 3000);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-orbitron text-3xl font-bold casino-orange">Luck and Roll</h2>
        <Button onClick={onClose} variant="ghost" className="text-casino-orange">
          <i className="fas fa-times text-2xl"></i>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wheel */}
        <div className="flex flex-col items-center">
          <div className="relative w-80 h-80 mb-6">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-casino-orange"></div>
            </div>
            
            {/* Wheel */}
            <motion.div
              className="w-full h-full rounded-full border-4 border-casino-orange relative overflow-hidden"
              animate={{ rotate: rotation }}
              transition={{ duration: 3, ease: "easeOut" }}
            >
              {wheelSegments.map((segment, index) => {
                const angle = (360 / wheelSegments.length) * index;
                const nextAngle = (360 / wheelSegments.length) * (index + 1);
                
                return (
                  <div
                    key={index}
                    className={`absolute w-full h-full ${segment.color}`}
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + Math.cos((angle - 90) * Math.PI / 180) * 50}% ${50 + Math.sin((angle - 90) * Math.PI / 180) * 50}%, ${50 + Math.cos((nextAngle - 90) * Math.PI / 180) * 50}% ${50 + Math.sin((nextAngle - 90) * Math.PI / 180) * 50}%)`,
                    }}
                  >
                    <div
                      className="absolute text-white text-xs font-bold transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${50 + Math.cos((angle + nextAngle - 180) / 2 * Math.PI / 180) * 30}%`,
                        top: `${50 + Math.sin((angle + nextAngle - 180) / 2 * Math.PI / 180) * 30}%`,
                        transform: `translate(-50%, -50%) rotate(${(angle + nextAngle) / 2}deg)`,
                      }}
                    >
                      {segment.label}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <Button
            onClick={handleSpin}
            disabled={isSpinning || spinMutation.isPending}
            className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
          >
            {isSpinning ? "SPINNING..." : `SPIN (${betAmount} coins)`}
          </Button>
        </div>

        {/* Game Info and Results */}
        <div className="space-y-6">
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Game Rules</h3>
              <ul className="space-y-2 casino-orange-accent text-sm">
                <li>• 6 Bankrupt slices - lose your bet</li>
                <li>• 9 Multiplier slices - win coins based on multiplier</li>
                <li>• 1 Jackpot slice - win 0.05x of bet in $BBC tokens</li>
                <li>• 10% chance to win additional $BBC jackpot</li>
              </ul>
            </CardContent>
          </Card>

          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 rounded-xl border-2 ${
                  result.segment.type === "bankrupt" 
                    ? "bg-red-900/20 border-red-500" 
                    : result.segment.type === "jackpot"
                    ? "bg-casino-gold/20 border-casino-gold"
                    : "bg-green-900/20 border-green-500"
                }`}
              >
                <h3 className="font-orbitron text-2xl font-bold mb-2">
                  {result.segment.type === "bankrupt" && "💥 BANKRUPT!"}
                  {result.segment.type === "multiplier" && "🎉 WIN!"}
                  {result.segment.type === "jackpot" && "💎 JACKPOT!"}
                </h3>
                <p className="text-lg casino-orange-accent mb-2">
                  You landed on: <span className="font-bold">{result.segment.label}</span>
                </p>
                {result.winAmount > 0 && (
                  <p className="casino-orange font-rajdhani font-bold text-xl">
                    Won: {result.winAmount.toFixed(2)} coins
                  </p>
                )}
                {result.bbcWon > 0 && (
                  <p className="casino-gold font-rajdhani font-bold text-xl">
                    Won: {result.bbcWon.toFixed(8)} $BBC tokens
                  </p>
                )}
                {result.segment.type === "bankrupt" && (
                  <p className="text-red-400 font-rajdhani font-bold text-xl">
                    Lost: {betAmount} coins
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Your Bet</h3>
              <div className="flex justify-between items-center">
                <span className="casino-orange-accent">Bet Amount:</span>
                <span className="casino-orange font-rajdhani font-bold text-xl">
                  {betAmount} coins
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="casino-orange-accent">Your Balance:</span>
                <span className="casino-orange font-rajdhani font-bold">
                  {parseFloat(user?.coinBalance || "0").toLocaleString()} coins
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
