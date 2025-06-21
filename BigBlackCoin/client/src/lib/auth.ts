import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  coinBalance: string;
  bbcBalance: string;
  isAdmin: boolean;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await apiRequest("POST", "/api/auth/register", credentials);
    return response.json();
  },

  async getCurrentUser(userId: number): Promise<User> {
    const response = await apiRequest("GET", `/api/user/${userId}`);
    return response.json();
  },

  logout() {
    localStorage.removeItem("user");
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  },

  storeUser(user: User) {
    localStorage.setItem("user", JSON.stringify(user));
  },
};
