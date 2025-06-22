import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSection() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(user?.isAdmin || false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: pendingDeposits } = useQuery({
    queryKey: ["/api/admin/pending-deposits"],
    enabled: isAuthenticated,
  });

  const approveDepositMutation = useMutation({
    mutationFn: async (depositId: number) => {
      const response = await apiRequest("POST", `/api/admin/deposits/${depositId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Deposit approved",
        description: "User balance has been updated",
      });
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async (depositId: number) => {
      const response = await apiRequest("POST", `/api/admin/deposits/${depositId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      toast({
        title: "Deposit rejected",
        description: "Deposit has been rejected",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/ban`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User banned",
        description: "User has been banned from the platform",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/unban`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User unbanned",
        description: "User has been unbanned",
      });
    },
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === "admin" && loginData.password === "admin1234") {
      setIsAuthenticated(true);
      toast({
        title: "Admin access granted",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Access denied",
        description: "Invalid admin credentials",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="casino-dark border-casino-orange/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl casino-orange text-center">
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label className="casino-orange-accent">Username</Label>
                <Input
                  type="text"
                  placeholder="admin"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                />
              </div>
              <div>
                <Label className="casino-orange-accent">Password</Label>
                <Input
                  type="password"
                  placeholder="admin1234"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
              >
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-orbitron text-3xl font-bold casino-orange mb-4">Admin Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="casino-dark border-casino-orange/20">
            <CardContent className="p-6 text-center">
              <i className="fas fa-users casino-orange text-3xl mb-2"></i>
              <p className="text-2xl font-bold casino-orange">
                {systemStats?.totalUsers || "0"}
              </p>
              <p className="casino-orange-accent text-sm">Total Users</p>
            </CardContent>
          </Card>
          <Card className="casino-dark border-casino-orange/20">
            <CardContent className="p-6 text-center">
              <i className="fas fa-coins casino-gold text-3xl mb-2"></i>
              <p className="text-2xl font-bold casino-gold">
                ₱{parseFloat(systemStats?.totalDeposits || "0").toLocaleString()}
              </p>
              <p className="casino-orange-accent text-sm">Total Deposits</p>
            </CardContent>
          </Card>
          <Card className="casino-dark border-casino-orange/20">
            <CardContent className="p-6 text-center">
              <i className="fas fa-chart-line casino-orange text-3xl mb-2"></i>
              <p className="text-2xl font-bold casino-orange">
                {systemStats?.activeGames || "0"}
              </p>
              <p className="casino-orange-accent text-sm">Active Games</p>
            </CardContent>
          </Card>
          <Card className="casino-dark border-casino-orange/20">
            <CardContent className="p-6 text-center">
              <i className="fas fa-gem casino-gold text-3xl mb-2"></i>
              <p className="text-2xl font-bold casino-gold">
                {parseFloat(systemStats?.totalBbcInCirculation || "0").toFixed(2)}
              </p>
              <p className="casino-orange-accent text-sm">$BBC in Circulation</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <Card className="casino-dark border-casino-orange/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl casino-orange">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allUsers?.length > 0 ? (
                allUsers.map((user: any) => (
                  <div key={user.id} className="flex justify-between items-center casino-gray rounded-lg p-3">
                    <div>
                      <p className="font-rajdhani font-semibold">{user.username}</p>
                      <p className="text-xs casino-orange-accent">
                        Balance: {user.coinBalance} coins, {user.bbcBalance} $BBC
                      </p>
                      {user.isBanned && (
                        <Badge variant="destructive" className="text-xs">BANNED</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {user.isBanned ? (
                        <Button
                          onClick={() => unbanUserMutation.mutate(user.id)}
                          disabled={unbanUserMutation.isPending}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-rajdhani font-semibold"
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          onClick={() => banUserMutation.mutate(user.id)}
                          disabled={banUserMutation.isPending}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-rajdhani font-semibold"
                        >
                          Ban
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="casino-orange-accent text-center py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deposit Approvals */}
        <Card className="casino-dark border-casino-orange/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl casino-orange">Pending Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDeposits?.length > 0 ? (
                pendingDeposits.map((deposit: any) => (
                  <div key={deposit.id} className="casino-gray rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-rajdhani font-semibold">{deposit.username}</p>
                        <p className="casino-orange font-bold">₱{deposit.amount}</p>
                      </div>
                      <Badge className="bg-yellow-600 text-casino-black">PENDING</Badge>
                    </div>
                    <p className="text-xs casino-orange-accent mb-2">
                      {deposit.paymentMethod} - Receipt uploaded
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => approveDepositMutation.mutate(deposit.id)}
                        disabled={approveDepositMutation.isPending}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs font-rajdhani font-semibold"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectDepositMutation.mutate(deposit.id)}
                        disabled={rejectDepositMutation.isPending}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs font-rajdhani font-semibold"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="casino-orange-accent text-center py-4">No pending deposits</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
