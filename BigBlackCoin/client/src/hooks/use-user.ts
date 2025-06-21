import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  coinBalance: string;
  bbcBalance: string;
  isAdmin: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Refresh user data from server
        refreshUser(userData.id);
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const refreshUser = async (userId?: number) => {
    if (!user && !userId) return;
    
    try {
      const response = await apiRequest("GET", `/api/user/${userId || user!.id}`);
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    refreshUser: () => refreshUser(),
  };
}
