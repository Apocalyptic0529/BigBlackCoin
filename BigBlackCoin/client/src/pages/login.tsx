import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });

      const userData = await response.json();
      login(userData);
      setLocation("/");
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.username}`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await apiRequest("POST", "/api/auth/register", {
        username,
        password,
      });

      // Auto-login after registration
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });

      const userData = await response.json();
      login(userData);
      setLocation("/");
      
      toast({
        title: "Welcome to BigBlackCoin!",
        description: `Account created for ${userData.username}`,
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Username already exists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen casino-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-4xl font-bold casino-orange text-glow mb-2">
            BigBlackCoin
          </h1>
          <p className="casino-orange-accent">Premium eCasino Platform</p>
        </div>

        <Card className="casino-dark border-casino-orange/30 glow-orange">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl casino-orange text-center">
              Access Your Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 casino-gray">
                <TabsTrigger value="login" className="casino-orange-accent">Login</TabsTrigger>
                <TabsTrigger value="register" className="casino-orange-accent">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="mb-4 p-3 bg-casino-dark/50 border border-casino-orange/20 rounded-lg">
                  <p className="text-sm casino-orange-accent mb-2">Demo Accounts:</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="casino-orange-accent">Admin:</span>
                      <span className="casino-orange">admin / admin1234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="casino-orange-accent">Player:</span>
                      <span className="casino-orange">player1 / password123</span>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-username" className="casino-orange-accent">Username</Label>
                    <Input
                      id="login-username"
                      name="username"
                      type="text"
                      required
                      className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                      placeholder="Enter username (try: player1)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="casino-orange-accent">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      required
                      className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                      placeholder="Enter password (try: password123)"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
                
                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      (form.querySelector('[name="username"]') as HTMLInputElement).value = 'player1';
                      (form.querySelector('[name="password"]') as HTMLInputElement).value = 'password123';
                      form.requestSubmit();
                    }}
                    variant="outline"
                    className="w-full casino-gray border-casino-orange/30 text-casino-orange hover:bg-casino-orange hover:text-casino-black"
                  >
                    Quick Login: Player Demo
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      (form.querySelector('[name="username"]') as HTMLInputElement).value = 'admin';
                      (form.querySelector('[name="password"]') as HTMLInputElement).value = 'admin1234';
                      form.requestSubmit();
                    }}
                    variant="outline"
                    className="w-full casino-gray border-casino-orange/30 text-casino-orange hover:bg-casino-orange hover:text-casino-black"
                  >
                    Quick Login: Admin Demo
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-username" className="casino-orange-accent">Username</Label>
                    <Input
                      id="register-username"
                      name="username"
                      type="text"
                      required
                      className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                      placeholder="Choose a username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password" className="casino-orange-accent">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      required
                      className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                      placeholder="Choose a password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="casino-orange-accent">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                      placeholder="Confirm your password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
