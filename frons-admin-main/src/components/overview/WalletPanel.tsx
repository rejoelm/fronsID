import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircleIcon } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import {
  type WalletBalances,
  type TokenBalance,
} from "@/hooks/useWalletBalances";

interface WalletPanelProps {
  walletBalances: WalletBalances;
}

export function WalletPanel({ walletBalances }: WalletPanelProps) {
  console.log("🎨 WalletPanel rendering with balances:", walletBalances);

  return (
    <Card className="bg-white border border-gray-100">
      <CardHeader className="pb-3 lg:pb-4">
        <CardTitle className="text-sm lg:text-lg font-medium">Wallet Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 lg:space-y-3">
          {walletBalances.isLoading ? (
            <Loading variant="inline" text="Loading balances..." size="sm" />
          ) : walletBalances.error ? (
            <div className="text-center py-3 lg:py-4">
              <AlertCircleIcon className="h-5 w-5 lg:h-6 lg:w-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs lg:text-sm text-red-600">{walletBalances.error}</p>
            </div>
          ) : (
            <>
              {/* Token Balances */}
              {walletBalances.tokens.map((token: TokenBalance) => (
                <div
                  key={token.symbol}
                  className={`flex items-center justify-between p-2 lg:p-3 rounded-lg ${
                    token.symbol === "FRONS"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-medium text-xs lg:text-sm ${
                        token.symbol === "FRONS" ? "text-primary" : ""
                      }`}
                    >
                      {token.symbol}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold text-xs lg:text-sm ${
                        token.symbol === "FRONS" ? "text-primary" : ""
                      }`}
                    >
                      {token.uiAmount.toLocaleString(undefined, {
                        maximumFractionDigits: token.symbol === "USDCF" ? 2 : 4,
                      })}
                    </span>
                    {token.symbol === "USDCF" && (
                      <p className="text-xs text-muted-foreground">
                        ${token.uiAmount.toFixed(2)} USD
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
