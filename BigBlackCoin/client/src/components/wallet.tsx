import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function WalletSection() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [convertAmount, setConvertAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [accountDetails, setAccountDetails] = useState("");

  const { data: deposits } = useQuery({
    queryKey: ["/api/user", user?.id, "deposits"],
    enabled: !!user,
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["/api/user", user?.id, "withdrawals"],
    enabled: !!user,
  });

  const convertMutation = useMutation({
    mutationFn: async ({ type, amount }: { type: string; amount: number }) => {
      const response = await apiRequest("POST", `/api/user/${user?.id}/convert`, {
        type,
        amount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setConvertAmount("");
      toast({
        title: "Conversion successful",
        description: "Your balance has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/deposits", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "deposits"] });
      setDepositAmount("");
      setPaymentMethod("");
      toast({
        title: "Deposit request submitted",
        description: "Your deposit is pending admin approval",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/withdrawals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "withdrawals"] });
      refreshUser();
      setWithdrawAmount("");
      setWithdrawMethod("");
      setAccountDetails("");
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal is being processed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConvert = (type: string) => {
    const amount = parseFloat(convertAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    convertMutation.mutate({ type, amount });
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate({
      userId: user?.id,
      amount: depositAmount,
      paymentMethod,
      receiptUrl: "mock-receipt-url",
    });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawMethod || !accountDetails) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      userId: user?.id,
      amount: withdrawAmount,
      withdrawalMethod: withdrawMethod,
      accountDetails,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Balance Overview */}
      <Card className="casino-dark border-casino-orange/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl casino-orange">Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="casino-gray rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="casino-orange-accent text-sm">Coins Balance</p>
                <p className="font-rajdhani text-3xl font-bold casino-orange">
                  {parseFloat(user?.coinBalance || "0").toLocaleString()}
                </p>
              </div>
              <i className="fas fa-coins casino-orange text-3xl"></i>
            </div>
          </div>
          <div className="casino-gray rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="casino-orange-accent text-sm">$BBC Tokens</p>
                <p className="font-rajdhani text-3xl font-bold casino-gold">
                  {parseFloat(user?.bbcBalance || "0").toFixed(8)}
                </p>
              </div>
              <i className="fas fa-gem casino-gold text-3xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Conversion */}
      <Card className="casino-dark border-casino-orange/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl casino-orange">Currency Exchange</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="casino-orange-accent">Convert Amount</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
            />
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => handleConvert("toBBC")}
              disabled={convertMutation.isPending}
              className="flex-1 bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
            >
              Coins → $BBC<br />
              <span className="text-xs">5,000 Coins = 1 $BBC</span>
            </Button>
            <Button
              onClick={() => handleConvert("toCoins")}
              disabled={convertMutation.isPending}
              className="flex-1 bg-casino-gold text-casino-black font-rajdhani font-semibold hover-glow"
            >
              $BBC → Coins<br />
              <span className="text-xs">1 $BBC = 5,000 Coins</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Section */}
      <Card className="casino-dark border-casino-orange/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl casino-orange">Deposit Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <Label className="casino-orange-accent">Amount (PHP)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
              />
            </div>
            <div>
              <Label className="casino-orange-accent">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="casino-gray border-casino-orange/30 text-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="casino-gray border-casino-orange/30">
                  <SelectItem value="GCash">GCash</SelectItem>
                  <SelectItem value="PayMaya">PayMaya</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={depositMutation.isPending}
              className="w-full bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
            >
              {depositMutation.isPending ? "Submitting..." : "Submit Deposit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Withdrawal Section */}
      <Card className="casino-dark border-casino-orange/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl casino-orange">Withdraw Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <Label className="casino-orange-accent">Amount (Coins)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange"
              />
            </div>
            <div>
              <Label className="casino-orange-accent">Withdrawal Method</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="casino-gray border-casino-orange/30 text-white">
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent className="casino-gray border-casino-orange/30">
                  <SelectItem value="GCash">GCash</SelectItem>
                  <SelectItem value="PayMaya">PayMaya</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="casino-orange-accent">Account Details</Label>
              <Textarea
                placeholder="Enter account number/details"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="casino-gray border-casino-orange/30 text-white focus:border-casino-orange h-24"
              />
            </div>
            <Button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="w-full bg-casino-orange text-casino-black font-rajdhani font-semibold hover-glow"
            >
              {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="casino-dark border-casino-orange/20 lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl casino-orange">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-rajdhani font-bold casino-orange mb-3">Recent Deposits</h4>
              <div className="space-y-2">
                {deposits?.length > 0 ? (
                  deposits.slice(0, 5).map((deposit: any) => (
                    <div key={deposit.id} className="casino-gray rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="font-rajdhani font-semibold">₱{deposit.amount}</p>
                        <p className="text-xs casino-orange-accent">{deposit.paymentMethod}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-rajdhani font-bold ${
                        deposit.status === "approved" ? "bg-green-600 text-white" :
                        deposit.status === "rejected" ? "bg-red-600 text-white" :
                        "bg-yellow-600 text-casino-black"
                      }`}>
                        {deposit.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="casino-orange-accent text-sm">No deposits yet</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-rajdhani font-bold casino-orange mb-3">Recent Withdrawals</h4>
              <div className="space-y-2">
                {withdrawals?.length > 0 ? (
                  withdrawals.slice(0, 5).map((withdrawal: any) => (
                    <div key={withdrawal.id} className="casino-gray rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="font-rajdhani font-semibold">{withdrawal.amount} Coins</p>
                        <p className="text-xs casino-orange-accent">{withdrawal.withdrawalMethod}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-rajdhani font-bold ${
                        withdrawal.status === "approved" ? "bg-green-600 text-white" :
                        withdrawal.status === "rejected" ? "bg-red-600 text-white" :
                        "bg-yellow-600 text-casino-black"
                      }`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="casino-orange-accent text-sm">No withdrawals yet</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
