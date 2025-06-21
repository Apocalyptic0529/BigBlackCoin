import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import WalletSection from "@/components/wallet";
import MiningSection from "@/components/mining";
import AdminSection from "@/components/admin";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import LuckAndRoll from "@/components/games/luck-and-roll";
import FlipJonathan from "@/components/games/flip-jonathan";
import Paldo from "@/components/games/paldo";
import IpisSipi from "@/components/games/ipis-sipi";
import BlowJoyBalloon from "@/components/games/blow-bolims";

const betAmounts = [0.25, 0.50, 1.00, 1.50, 2.00, 5.00, 10.00, 50.00, 100.00, 500.00, 1000.00];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const [activeSection, setActiveSection] = useState("games");
  const [selectedBet, setSelectedBet] = useState(1.00);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const { data: recentWins } = useQuery({
    queryKey: ["/api/games/recent-wins"],
    enabled: !!user,
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const GameModal = ({ game, onClose }: { game: string; onClose: () => void }) => {
    const renderGame = () => {
      switch (game) {
        case "luck-roll":
          return <LuckAndRoll betAmount={selectedBet} onClose={onClose} />;
        case "flip-jonathan":
          return <FlipJonathan betAmount={selectedBet} onClose={onClose} />;
        case "paldo":
          return <Paldo betAmount={selectedBet} onClose={onClose} />;
        case "ipis-sipi":
          return <IpisSipi betAmount={selectedBet} onClose={onClose} />;
        case "blow-bolims":
          return <BlowJoyBalloon betAmount={selectedBet} onClose={onClose} />;
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-casino-dark rounded-2xl p-0 max-w-4xl w-full max-h-screen overflow-hidden border border-casino-orange/30">
          {renderGame()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen casino-black text-white">
      <Navigation 
        user={user} 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        onLogout={logout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === "games" && (
          <div>
            {/* Hero Banner */}
            <div className="bg-gradient-casino rounded-2xl p-8 mb-8 border border-casino-orange/30 glow-orange">
              <div className="text-center">
                <h1 className="font-orbitron text-4xl md:text-6xl font-bold casino-orange text-glow mb-4">
                  BIGBLACKCOIN CASINO
                </h1>
                <p className="text-xl casino-orange-accent mb-6">Experience the Ultimate Crypto Gaming Platform</p>
                <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold casino-gold">
                      {systemStats?.totalBbcInCirculation || "0.847"}
                    </p>
                    <p className="casino-orange-accent">$BBC Pool</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold casino-orange">
                      {systemStats?.totalUsers || "2,847"}
                    </p>
                    <p className="casino-orange-accent">Active Players</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Betting Controls */}
            <Card className="casino-dark border-casino-orange/20 mb-8">
              <CardContent className="p-6">
                <h3 className="font-rajdhani text-xl font-bold casino-orange mb-4">Select Your Bet Amount</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                  {betAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedBet === amount ? "default" : "outline"}
                      onClick={() => setSelectedBet(amount)}
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
                <p className="casino-orange-accent text-sm mt-3">
                  Selected Bet: <span className="casino-orange font-bold">{selectedBet}</span> Coins
                </p>
              </CardContent>
            </Card>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Luck and Roll Game */}
              <Card 
                className="casino-dark border-casino-orange/20 hover-glow cursor-pointer"
                onClick={() => setActiveGame("luck-roll")}
              >
                <CardContent className="p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Casino spinning wheel" 
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-orbitron text-xl font-bold casino-orange">Luck and Roll</h3>
                    <Badge className="bg-casino-orange text-casino-black">10% JACKPOT</Badge>
                  </div>
                  <p className="casino-orange-accent text-sm mb-4">
                    Spin the 16-slice wheel of fortune! Hit the jackpot slice to win $BBC tokens!
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs casino-orange-accent">Last Win</p>
                      <p className="casino-orange font-rajdhani font-bold">8.5x</p>
                    </div>
                    <Button className="bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow">
                      <i className="fas fa-play mr-2"></i>SPIN
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Flip it Jonathan Game */}
              <Card 
                className="casino-dark border-casino-orange/20 hover-glow cursor-pointer"
                onClick={() => setActiveGame("flip-jonathan")}
              >
                <CardContent className="p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Golden coin flip" 
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-orbitron text-xl font-bold casino-orange">Flip it Jonathan!</h3>
                    <Badge className="bg-casino-orange text-casino-black">5% JACKPOT</Badge>
                  </div>
                  <p className="casino-orange-accent text-sm mb-4">
                    Heads or tails streak game! Build your multiplier but don't get greedy!
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs casino-orange-accent">Best Streak</p>
                      <p className="casino-orange font-rajdhani font-bold">7 Flips</p>
                    </div>
                    <Button className="bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow">
                      <i className="fas fa-coins mr-2"></i>FLIP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Paldo Slot Game */}
              <Card 
                className="casino-dark border-casino-orange/20 hover-glow cursor-pointer"
                onClick={() => setActiveGame("paldo")}
              >
                <CardContent className="p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1551854275-909c8b5d3d5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Slot machine reels" 
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-orbitron text-xl font-bold casino-orange">Paldo!</h3>
                    <Badge className="bg-casino-orange text-casino-black">8% JACKPOT</Badge>
                  </div>
                  <p className="casino-orange-accent text-sm mb-4">
                    5-reel, 25-payline slot with free spins, wilds, and progressive jackpot!
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs casino-orange-accent">Free Spins</p>
                      <p className="casino-orange font-rajdhani font-bold">Available</p>
                    </div>
                    <Button className="bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow">
                      <i className="fas fa-bolt mr-2"></i>SPIN
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Ipis Sipi Game */}
              <Card 
                className="casino-dark border-casino-orange/20 hover-glow cursor-pointer"
                onClick={() => setActiveGame("ipis-sipi")}
              >
                <CardContent className="p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Kitchen adventure scene" 
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-orbitron text-xl font-bold casino-orange">Ipis Sipi</h3>
                    <Badge className="bg-casino-orange text-casino-black">6% JACKPOT</Badge>
                  </div>
                  <p className="casino-orange-accent text-sm mb-4">
                    Navigate the cockroach through 9 dangerous steps. Survive for $BBC rewards!
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs casino-orange-accent">Max Multiplier</p>
                      <p className="casino-orange font-rajdhani font-bold">20.0x</p>
                    </div>
                    <Button className="bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow">
                      <i className="fas fa-forward mr-2"></i>START
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Blow it Bolims Game */}
              <Card 
                className="casino-dark border-casino-orange/20 hover-glow cursor-pointer"
                onClick={() => setActiveGame("blow-bolims")}
              >
                <CardContent className="p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Colorful party balloons" 
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-orbitron text-xl font-bold casino-orange">Blow Joy Balloon</h3>
                    <Badge className="bg-casino-orange text-casino-black">7% JACKPOT</Badge>
                  </div>
                  <p className="casino-orange-accent text-sm mb-4">
                    Watch the balloon inflate and cash out before it pops! Risk vs reward!
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs casino-orange-accent">Last Cashout</p>
                      <p className="casino-orange font-rajdhani font-bold">15.2x</p>
                    </div>
                    <Button className="bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow">
                      <i className="fas fa-play mr-2"></i>INFLATE
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* BBC Mining Feature */}
              <Card 
                className="casino-dark border-casino-gold/30 hover-glow cursor-pointer"
                onClick={() => setActiveSection("mining")}
              >
                <CardContent className="p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Underground mining tunnel" 
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-orbitron text-xl font-bold casino-gold">$BBC Mining</h3>
                    <Badge className="bg-casino-gold text-casino-black">PASSIVE</Badge>
                  </div>
                  <p className="casino-orange-accent text-sm mb-4">
                    Click to mine $BBC tokens passively! Watch your miner work underground!
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs casino-orange-accent">Mining Rate</p>
                      <p className="casino-gold font-rajdhani font-bold">0.001/hr</p>
                    </div>
                    <Button className="bg-casino-gold text-casino-black font-rajdhani font-semibold hover-glow">
                      <i className="fas fa-pickaxe mr-2"></i>MINE
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="casino-dark border-casino-orange/20">
              <CardContent className="p-6">
                <h3 className="font-rajdhani text-xl font-bold casino-orange mb-4">Recent Wins</h3>
                <div className="space-y-3">
                  {recentWins?.length > 0 ? (
                    recentWins.map((win: any, index: number) => (
                      <div key={index} className="flex justify-between items-center casino-gray rounded-lg p-3">
                        <div className="flex items-center">
                          <i className="fas fa-trophy casino-gold mr-3"></i>
                          <div>
                            <p className="font-rajdhani font-semibold">
                              {win.username.substring(0, 6)}****{win.username.slice(-2)}
                            </p>
                            <p className="text-xs casino-orange-accent">{win.gameType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {parseFloat(win.bbcWon) > 0 ? (
                            <>
                              <p className="font-rajdhani font-bold casino-gold">{win.bbcWon}</p>
                              <p className="text-xs casino-orange-accent">$BBC</p>
                            </>
                          ) : (
                            <>
                              <p className="font-rajdhani font-bold casino-orange">{win.winAmount}</p>
                              <p className="text-xs casino-orange-accent">Coins</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="casino-orange-accent">No recent wins to display</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "wallet" && <WalletSection />}
        {activeSection === "mining" && <MiningSection />}
        {activeSection === "admin" && <AdminSection />}
      </div>

      {activeGame && (
        <GameModal 
          game={activeGame} 
          onClose={() => setActiveGame(null)} 
        />
      )}
    </div>
  );
}
