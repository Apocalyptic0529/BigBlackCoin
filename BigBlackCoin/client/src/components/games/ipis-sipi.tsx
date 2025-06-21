import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface IpisSipiProps {
  betAmount: number;
  onClose: () => void;
}

const steps = [
  { step: 1, multiplier: 1.2, hazard: "🥾", description: "Avoid the shoe" },
  { step: 2, multiplier: 1.5, hazard: "🥫", description: "Dodge the can" },
  { step: 3, multiplier: 2.0, hazard: "💨", description: "Escape the spray" },
  { step: 4, multiplier: 3.0, hazard: "🔨", description: "Duck the hammer" },
  { step: 5, multiplier: 4.5, hazard: "🧽", description: "Slip past the sponge" },
  { step: 6, multiplier: 7.0, hazard: "🔥", description: "Avoid the flames" },
  { step: 7, multiplier: 10.0, hazard: "⚡", description: "Dodge the zapper" },
  { step: 8, multiplier: 15.0, hazard: "🕷️", description: "Escape the spider" },
  { step: 9, multiplier: 20.0, hazard: "🏠", description: "Reach safety!" },
];

export default function IpisSipi({ betAmount, onClose }: IpisSipiProps) {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [currentWinnings, setCurrentWinnings] = useState(0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [roachPosition, setRoachPosition] = useState(0);

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
    setCurrentStep(0);
    setCurrentWinnings(betAmount);
    setShowResult(false);
    setRoachPosition(0);
  };

  const takeStep = async () => {
    if (!isGameActive || isMoving) return;

    setIsMoving(true);
    setRoachPosition(currentStep + 1);

    // Animate the roach movement
    setTimeout(() => {
      // Calculate survival chance (decreases with each step)
      const survivalChance = Math.max(0.4, 0.9 - (currentStep * 0.06));
      const survived = Math.random() < survivalChance;

      if (survived) {
        const newStep = currentStep + 1;
        const newMultiplier = steps[newStep - 1]?.multiplier || 20.0;
        const newWinnings = betAmount * newMultiplier;
        
        setCurrentStep(newStep);
        setCurrentWinnings(newWinnings);
        setIsMoving(false);

        if (newStep === 9) {
          // Reached the end!
          endGame(true, true);
        } else {
          toast({
            title: "Safe!",
            description: `Step ${newStep}/9 - Multiplier: ${newMultiplier}x`,
          });
        }
      } else {
        // Hit a hazard
        endGame(false, false);
      }
    }, 1000);
  };

  const cashOut = () => {
    if (!isGameActive || currentStep === 0) return;
    endGame(true, false);
  };

  const endGame = async (won: boolean, completedGame: boolean) => {
    setIsGameActive(false);
    setIsMoving(false);
    
    let winAmount = 0;
    let bbcWon = 0;
    
    if (won && currentStep > 0) {
      winAmount = currentWinnings;
      
      // 6% chance for BBC jackpot
      if (Math.random() < 0.06) {
        bbcWon = betAmount * 0.04;
      }
      
      // Special bonus for completing the game
      if (completedGame) {
        bbcWon += betAmount * 0.2; // 0.2x of bet in BBC for completion
      }
    }

    const result = {
      userId: user!.id,
      gameType: "Ipis Sipi",
      betAmount: betAmount.toString(),
      winAmount: winAmount.toFixed(2),
      bbcWon: bbcWon.toFixed(8),
      result: won 
        ? `${completedGame ? 'Completed all steps' : `Cashed out at step ${currentStep}`} - Won ${winAmount.toFixed(2)} coins${bbcWon > 0 ? ` + ${bbcWon.toFixed(8)} $BBC` : ""}`
        : `Caught at step ${currentStep + 1} - Lost ${betAmount} coins`,
    };

    setGameResult({ won, winAmount, bbcWon, step: currentStep, completed: completedGame });
    setShowResult(true);
    playGameMutation.mutate(result);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-orbitron text-3xl font-bold casino-orange">Ipis Sipi</h2>
        <Button onClick={onClose} variant="ghost" className="text-casino-orange">
          <i className="fas fa-times text-2xl"></i>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Path */}
        <div className="space-y-6">
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Kitchen Adventure</h3>
              
              {/* Game Path */}
              <div className="relative">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      className={`relative p-3 rounded-lg border-2 text-center ${
                        index + 1 === currentStep 
                          ? "bg-casino-orange border-casino-orange text-casino-black" 
                          : index + 1 < currentStep
                          ? "bg-green-600 border-green-500 text-white"
                          : "casino-dark border-casino-orange/30 text-casino-orange-accent"
                      }`}
                      animate={index + 1 === roachPosition ? { scale: [1, 1.1, 1] } : {}}
                    >
                      <div className="text-2xl mb-1">{step.hazard}</div>
                      <div className="text-xs font-rajdhani font-bold">
                        Step {step.step}
                      </div>
                      <div className="text-xs">
                        {step.multiplier}x
                      </div>
                      
                      {/* Roach indicator */}
                      {index + 1 === roachPosition && (
                        <motion.div
                          className="absolute -top-2 -right-2 text-2xl"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🪳
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Start position */}
                <div className="text-center mb-4">
                  <motion.div 
                    className="inline-block text-4xl"
                    animate={roachPosition === 0 ? { x: [0, 5, -5, 0] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {roachPosition === 0 && "🪳"}
                  </motion.div>
                  <p className="casino-orange-accent text-sm">Starting Position</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              {!isGameActive ? (
                <div className="text-center">
                  <Button
                    onClick={startGame}
                    disabled={playGameMutation.isPending}
                    className="bg-casino-orange text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow"
                  >
                    START ADVENTURE ({betAmount} coins)
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="casino-orange-accent mb-2">
                      Current Step: {currentStep}/9
                    </p>
                    <p className="casino-orange font-rajdhani font-bold text-xl mb-4">
                      Potential Win: {currentWinnings.toFixed(2)} coins
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={takeStep}
                      disabled={isMoving}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-rajdhani font-bold hover:bg-red-700 transition-all"
                    >
                      {isMoving ? "MOVING..." : `TAKE STEP ${currentStep + 1}`}
                    </Button>
                    
                    {currentStep > 0 && (
                      <Button
                        onClick={cashOut}
                        disabled={isMoving}
                        className="bg-casino-gold text-casino-black px-6 py-3 rounded-lg font-rajdhani font-bold hover-glow"
                      >
                        CASH OUT ({currentWinnings.toFixed(2)} coins)
                      </Button>
                    )}
                  </div>
                  
                  {currentStep < 9 && (
                    <div className="text-center">
                      <p className="casino-orange-accent text-sm">
                        Next: {steps[currentStep]?.description}
                      </p>
                      <p className="casino-orange text-sm">
                        Survival chance: {Math.max(40, 90 - (currentStep * 6))}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Game Info and Results */}
        <div className="space-y-6">
          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Game Rules</h3>
              <ul className="space-y-2 casino-orange-accent text-sm">
                <li>• Navigate through 9 dangerous kitchen steps</li>
                <li>• Each step increases your multiplier</li>
                <li>• Survival chance decreases with each step</li>
                <li>• Cash out anytime to secure winnings</li>
                <li>• Survive to step 9 for bonus $BBC tokens</li>
                <li>• 6% chance for $BBC bonus on any cash out</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="casino-gray border-casino-orange/20">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl casino-orange mb-4">Multiplier Path</h3>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded ${
                      index + 1 === currentStep
                        ? "bg-casino-orange text-casino-black"
                        : index + 1 < currentStep
                        ? "bg-green-600 text-white"
                        : "casino-dark text-casino-orange-accent"
                    }`}
                  >
                    <span className="text-sm">Step {step.step}: {step.hazard}</span>
                    <span className="font-rajdhani font-bold">{step.multiplier}x</span>
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
                  {gameResult.completed ? "🏆 ADVENTURE COMPLETE!" : gameResult.won ? "🪳 ESCAPED!" : "💥 CAUGHT!"}
                </h3>
                <p className="text-lg casino-orange-accent mb-2">
                  {gameResult.won ? `Survived to step ${gameResult.step}` : `Caught at step ${gameResult.step + 1}`}
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
                    {gameResult.completed && (
                      <p className="casino-gold text-sm mt-2">
                        🎉 Completion bonus included!
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
