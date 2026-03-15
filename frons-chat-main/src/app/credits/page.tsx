"use client";

import { useState, useEffect } from "react";
import {
  Coins, CreditCard, Wallet, QrCode, ArrowRight,
  History, TrendingUp, Gift, Loader2, CheckCircle
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
  bonus?: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pack_100", credits: 100, price: 0.99 },
  { id: "pack_500", credits: 500, price: 3.99, popular: true },
  { id: "pack_1500", credits: 1500, price: 9.99, bonus: "Save 25%" },
  { id: "pack_5000", credits: 5000, price: 29.99, bonus: "Save 40%" },
  { id: "pack_20000", credits: 20000, price: 99.99, bonus: "Best value" },
];

const PAYMENT_METHODS = [
  { id: "stripe", label: "Card / Google Pay / Apple Pay", icon: CreditCard, description: "Visa, Mastercard, bank transfer" },
  { id: "xendit", label: "QRIS / E-Wallet (Indonesia)", icon: QrCode, description: "QRIS, GoPay, OVO, DANA, ShopeePay" },
  { id: "usdc", label: "USDC on Solana", icon: Wallet, description: "Direct crypto payment (~$0.001 fee)" },
];

interface CreditBalance {
  balance: number;
  lifetime_purchased: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

interface CreditTransaction {
  id: string;
  amount: number;
  tx_type: string;
  created_at: string;
  balance_after: number;
  payment_provider?: string;
}

export default function CreditsPage() {
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("pack_500");
  const [selectedPayment, setSelectedPayment] = useState<string>("stripe");
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [activeTab, setActiveTab] = useState<"buy" | "history">("buy");

  useEffect(() => {
    if (!activeWallet) return;
    loadBalance();
    loadTransactions();
  }, [activeWallet]);

  async function loadBalance() {
    const { data } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", activeWallet)
      .single();
    if (data) setBalance(data);
    setIsLoading(false);
  }

  async function loadTransactions() {
    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", activeWallet)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
  }

  async function handlePurchase() {
    if (!activeWallet || !selectedPackage) return;
    setIsPurchasing(true);

    const pkg = CREDIT_PACKAGES.find((p) => p.id === selectedPackage);
    if (!pkg) return;

    try {
      const endpoint = `/api/payments/${selectedPayment}-checkout`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: activeWallet,
          package_id: selectedPackage,
          credits: pkg.credits,
          amount: pkg.price,
          promo_code: promoCode || undefined,
        }),
      });

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.treasury_address) {
        // USDC flow - show transfer instructions
        alert(`Send ${pkg.price} USDC to: ${data.treasury_address}`);
      }
    } catch (err) {
      console.error("Purchase failed:", err);
    }
    setIsPurchasing(false);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-16 h-16 text-[#FB7720] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#2C337A] mb-2">Credits</h1>
          <p className="text-gray-500 mb-6">Connect your wallet to manage credits</p>
          <button onClick={login} className="bg-[#2C337A] text-white px-8 py-3 rounded-xl font-semibold">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#2C337A] to-[#1e2456] rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Credit Balance</p>
              <h1 className="text-5xl font-bold tracking-tight">
                {isLoading ? "..." : (balance?.balance || 0).toLocaleString()}
              </h1>
              <p className="text-white/60 text-sm mt-2">
                1 credit = $0.01 USD · AI chat: 3-10 credits/question
              </p>
            </div>
            <Coins className="w-16 h-16 text-[#FB7720]" />
          </div>
          {balance && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-white/50 text-xs">Purchased</p>
                <p className="text-lg font-semibold">{balance.lifetime_purchased.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Earned</p>
                <p className="text-lg font-semibold">{balance.lifetime_earned.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Spent</p>
                <p className="text-lg font-semibold">{balance.lifetime_spent.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("buy")}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === "buy"
                ? "bg-[#2C337A] text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            Buy Credits
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-[#2C337A] text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            <History className="w-4 h-4" />
            Transaction History
          </button>
        </div>

        {activeTab === "buy" ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Package Selection */}
            <div>
              <h2 className="text-lg font-bold text-[#2C337A] mb-4">Select Package</h2>
              <div className="space-y-3">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition text-left ${
                      selectedPackage === pkg.id
                        ? "border-[#2C337A] bg-[#E5E0FE]/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2C337A]">
                          {pkg.credits.toLocaleString()} credits
                        </span>
                        {pkg.popular && (
                          <span className="bg-[#FB7720] text-white text-xs px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      {pkg.bonus && (
                        <span className="text-xs text-green-600">{pkg.bonus}</span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-[#2C337A]">
                      ${pkg.price}
                    </span>
                  </button>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]"
                  />
                  <button className="px-4 py-2.5 bg-[#E5E0FE] text-[#2C337A] rounded-xl text-sm font-semibold">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-lg font-bold text-[#2C337A] mb-4">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                        selectedPayment === method.id
                          ? "border-[#2C337A] bg-[#E5E0FE]/30"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-6 h-6 text-[#2C337A]" />
                      <div>
                        <p className="font-semibold text-sm text-[#2C337A]">
                          {method.label}
                        </p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="mt-6 w-full bg-[#FB7720] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#e56a1a] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Purchase Credits
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Transaction History */
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Balance After</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          tx.amount > 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          {tx.tx_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-semibold ${
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {tx.balance_after}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
