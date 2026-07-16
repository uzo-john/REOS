import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function ProducerBillingScreen() {
  const {
    theme,
    selectedProducerPlantId,
    producerBillingSettlements,
    fetchProducerBillingSettlements
  } = useStore() as any;

  const isDark = theme === "dark";
  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const accent = "#8B5CF6";
  const success = "#10B981";
  const warning = "#F59E0B";

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProducerPlantId) {
      fetchProducerBillingSettlements(selectedProducerPlantId).then(() => setLoading(false));
    }
  }, [selectedProducerPlantId]);

  if (loading && !producerBillingSettlements) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  const billing = producerBillingSettlements || {
    outstandingPayments: 0,
    totalBillingRevenue: 0,
    escrowLockedBalance: 0,
    walletBalance: 0,
    gridExportRevenue: 0,
    settlementReports: [],
    transactions: []
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900" }}>Billing & Financial Settlements</Text>
        <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
          Wallet balances, escrow transaction logs, grid export revenue checks, and monthly settlement statements.
        </Text>
      </View>

      {/* Wallet and Escrow Card */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: border, paddingRight: 12 }}>
          <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>PRODUCER WALLET</Text>
          <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900", marginTop: 4 }}>₦{billing.walletBalance.toLocaleString()}</Text>
          <Text style={{ color: textSecondary, fontSize: 10, marginTop: 4 }}>Available balance</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 8 }}>
          <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>ESCROW HELD ACCOUNT</Text>
          <Text style={{ color: warning, fontSize: 18, fontWeight: "900", marginTop: 4 }}>₦{billing.escrowLockedBalance.toLocaleString()}</Text>
          <Text style={{ color: textSecondary, fontSize: 10, marginTop: 4 }}>Locked consumer deposits</Text>
        </View>
      </View>

      {/* KPI stats */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {/* Stat 1 */}
        <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 14, width: (width - 42) / 2 }}>
          <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>OUTSTANDING BILLS</Text>
          <Text style={{ color: warning, fontSize: 15, fontWeight: "800", marginTop: 4 }}>₦{billing.outstandingPayments.toLocaleString()}</Text>
        </View>
        {/* Stat 2 */}
        <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 14, width: (width - 42) / 2 }}>
          <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>TOTAL ENERGY SOLD</Text>
          <Text style={{ color: success, fontSize: 15, fontWeight: "800", marginTop: 4 }}>₦{billing.totalBillingRevenue.toLocaleString()}</Text>
        </View>
      </View>

      {/* Settlement reports */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>🏛️ Monthly Settlement Reports</Text>
        
        <View style={{ gap: 12 }}>
          {billing.settlementReports.map((rep: any, idx: number) => (
            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: border, paddingTop: idx > 0 ? 10 : 0 }}>
              <View>
                <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>{rep.month}</Text>
                <Text style={{ color: textSecondary, fontSize: 9, marginTop: 1 }}>{rep.energySoldMwh} MWh sold</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "800" }}>₦{rep.revenue.toLocaleString()}</Text>
                <Text style={{ color: success, fontSize: 8, fontWeight: "700", marginTop: 2 }}>{rep.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Transactions list */}
      <View>
        <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Recent Settlement Transactions</Text>
        <View style={{ gap: 10 }}>
          {billing.transactions.map((tx: any) => (
            <View key={tx.id} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "800" }}>{tx.consumerName}</Text>
                <Text style={{ color: textSecondary, fontSize: 9, marginTop: 2 }}>Sold: {tx.energySoldKwh} kWh • {new Date(tx.date).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: tx.status === "PAID" ? success : warning, fontSize: 12, fontWeight: "800" }}>₦{tx.amount.toLocaleString()}</Text>
                <Text style={{ color: textSecondary, fontSize: 8, marginTop: 2 }}>{tx.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
