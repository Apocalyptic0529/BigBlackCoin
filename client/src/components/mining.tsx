import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function MiningSection() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: miningStats } = useQuery({
    queryKey: ["/api/user", user?.id, "mining-stats"],
    enabled: !!user,
  });

  const mineMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/mining/mine", {
        userId: user?.id,
        clicks: 1,
      });
      return response.json();
    },
    onSuccess: (data) => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "mining-stats"] });
      toast({
        title: "Mining successful!",
        description: `You mined ${parseFloat(data.bbcMined).toFixed(8)} $BBC tokens`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Mining failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMining = () => {
    setIsAnimating(true);
    mineMutation.mutate();
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <Card className="casino-dark border-casino-gold/30 glow-orange-strong">
      <CardHeader className="text-center">
        <CardTitle className="font-orbitron text-4xl casino-gold text-glow mb-4">
          $BBC Mining Operation
        </CardTitle>
        <p className="casino-orange-accent text-lg">Click to mine $BBC tokens passively underground!</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mining Animation Area */}
          <Card className="casino-gray border-casino-gold/20">
            <CardContent className="p-6">
              <img 
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
                alt="Underground mining operation" 
                className="w-full h-64 object-cover rounded-lg mb-4" 
              />
              <div className="text-center">
                <motion.div
                  animate={isAnimating ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    onClick={handleMining}
                    disabled={mineMutation.isPending || isAnimating}
                    className="bg-casino-gold text-casino-black px-8 py-4 rounded-xl font-rajdhani text-xl font-bold hover-glow mb-4 transform hover:scale-105 transition-all"
                  >
                    <motion.i 
                      className="fas fa-pickaxe mr-3"
                      animate={isAnimating ? { rotate: [0, -30, 30, 0] } : {}}
                      transition={{ duration: 0.5, repeat: isAnimating ? 2 : 0 }}
                    />
                    {mineMutation.isPending ? "MINING..." : "MINE $BBC"}
                  </Button>
                </motion.div>
                <p className="casino-gold font-rajdhani font-semibold">
                  {mineMutation.isPending ? "Mining in progress..." : "Click to mine tokens!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mining Stats */}
          <div className="space-y-6">
            <Card className="casino-gray border-casino-gold/20">
              <CardHeader>
                <CardTitle className="font-orbitron text-xl casino-gold">Mining Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="casino-gold text-2xl font-bold">
                      {miningStats?.totalMined || "0.00000000"}
                    </p>
                    <p className="casino-orange-accent text-sm">Total $BBC Mined</p>
                  </div>
                  <div className="text-center">
                    <p className="casino-orange text-2xl font-bold">
                      {miningStats?.totalClicks || "0"}
                    </p>
                    <p className="casino-orange-accent text-sm">Total Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="casino-gold text-2xl font-bold">
                      {((miningStats?.totalClicks || 0) * 0.00001).toFixed(8)}
                    </p>
                    <p className="casino-orange-accent text-sm">$BBC/Hour Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="casino-orange text-2xl font-bold">
                      {Math.min(87 + (miningStats?.totalClicks || 0) * 0.1, 100).toFixed(0)}%
                    </p>
                    <p className="casino-orange-accent text-sm">Mining Efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="casino-gray border-casino-gold/20">
              <CardHeader>
                <CardTitle className="font-orbitron text-xl casino-gold">Upgrade Mining</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center casino-dark rounded-lg p-3">
                  <div>
                    <p className="font-rajdhani font-semibold text-white">Better Pickaxe</p>
                    <p className="text-xs casino-orange-accent">+50% mining speed</p>
                  </div>
                  <Button 
                    disabled
                    className="bg-casino-gold text-casino-black px-4 py-2 rounded-lg font-rajdhani font-semibold text-sm opacity-50"
                  >
                    500 Coins
                  </Button>
                </div>
                <div className="flex justify-between items-center casino-dark rounded-lg p-3">
                  <div>
                    <p className="font-rajdhani font-semibold text-white">Auto-Miner</p>
                    <p className="text-xs casino-orange-accent">Passive mining</p>
                  </div>
                  <Button 
                    disabled
                    className="bg-casino-gold text-casino-black px-4 py-2 rounded-lg font-rajdhani font-semibold text-sm opacity-50"
                  >
                    2000 Coins
                  </Button>
                </div>
                <p className="text-xs casino-orange-accent text-center mt-4">
                  Upgrades coming soon in future updates!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
