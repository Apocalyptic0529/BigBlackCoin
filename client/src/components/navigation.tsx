import { Button } from "@/components/ui/button";

interface NavigationProps {
  user: any;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export default function Navigation({ user, activeSection, onSectionChange, onLogout }: NavigationProps) {
  const navItems = [
    { id: "games", label: "Games", icon: "fas fa-gamepad" },
    { id: "wallet", label: "Wallet", icon: "fas fa-wallet" },
    { id: "mining", label: "Mining", icon: "fas fa-pickaxe" },
  ];

  if (user?.isAdmin) {
    navItems.push({ id: "admin", label: "Admin", icon: "fas fa-cog" });
  }

  return (
    <nav className="casino-dark border-b border-casino-orange/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="font-orbitron text-2xl font-bold casino-orange text-glow">BigBlackCoin</h1>
              <p className="text-xs casino-orange-accent">$BBC CASINO</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  onClick={() => onSectionChange(item.id)}
                  className={`font-rajdhani font-semibold ${
                    activeSection === item.id
                      ? "bg-casino-orange text-casino-black hover-glow"
                      : "text-white hover:text-casino-orange"
                  }`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="casino-orange font-rajdhani font-semibold">
                {parseFloat(user?.coinBalance || "0").toLocaleString()}
              </p>
              <p className="text-xs casino-orange-accent">Coins</p>
            </div>
            <div className="text-right">
              <p className="casino-gold font-rajdhani font-semibold">
                {parseFloat(user?.bbcBalance || "0").toFixed(4)}
              </p>
              <p className="text-xs casino-orange-accent">$BBC</p>
            </div>
            <Button
              onClick={onLogout}
              className="bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden px-4 pb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              onClick={() => onSectionChange(item.id)}
              className={`font-rajdhani font-semibold whitespace-nowrap ${
                activeSection === item.id
                  ? "bg-casino-orange text-casino-black"
                  : "text-white hover:text-casino-orange"
              }`}
            >
              <i className={`${item.icon} mr-2`}></i>
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
