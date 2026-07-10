import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { useStore } from "../store/useStore";

const GATEWAYS = ["Paystack", "Flutterwave", "Interswitch", "Bank Transfer"];

export default function BillingScreen() {
  const { theme, billingSummary, fetchConsumerBilling, rechargeWallet, payOutstandingInvoice } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";
  const [showRecharge, setShowRecharge] = useState(false);
  const [amount, setAmount] = useState("5000");
  const [gateway, setGateway] = useState(GATEWAYS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchConsumerBilling(); }, []);

  const balance = billingSummary?.balance ?? 0;
  const outstanding = billingSummary?.outstandingBalance ?? 0;
  const lastPayment = billingSummary?.lastPayment ?? 0;
  const cycle = billingSummary?.billingCycle ?? "PREPAID";
  const invoices = billingSummary?.invoices ?? [];
  const txns = billingSummary?.transactions ?? [];

  const handleRecharge = async () => {
    setLoading(true);
    try { await rechargeWallet(parseFloat(amount), gateway); } catch {}
    setLoading(false); setShowRecharge(false);
  };

  const statusColor: Record<string, string> = { PAID:"#10B981", UNPAID:"#EF4444", OVERDUE:"#F97316" };
  const txnIcon: Record<string, string> = { PREPAID_PURCHASE:"💳", BILL_PAYMENT:"🧾", CREDIT_TRANSFER:"💸", TRADE_SETTLEMENT:"🔄" };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Wallet Card */}
      <View style={{ backgroundColor: isDark ? "rgba(17,24,39,0.95)" : "rgba(0,212,255,0.06)", borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)", shadowColor: "#00D4FF", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
        <Text style={{ color: sub, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 }}>⚡ ENERGY WALLET • {cycle}</Text>
        <Text style={{ color: balance > 500 ? accent : "#EF4444", fontSize: 36, fontWeight: "900", letterSpacing: -1 }}>₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text>
        <Text style={{ color: sub, fontSize: 12, marginTop: 4, marginBottom: 20 }}>Available balance • Last topped up: ₦{lastPayment.toLocaleString()}</Text>
        {outstanding > 0 && (
          <View style={{ backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}>
            <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "700" }}>⚠️ Outstanding: ₦{outstanding.toLocaleString()} due</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={() => setShowRecharge(true)} style={{ flex: 1, backgroundColor: accent, borderRadius: 14, padding: 14, alignItems: "center" }}>
            <Text style={{ color: "#000", fontSize: 14, fontWeight: "800" }}>💳 Top Up</Text>
          </TouchableOpacity>
          {outstanding > 0 && (
            <TouchableOpacity onPress={() => payOutstandingInvoice(invoices.find((i:any) => i.status === "UNPAID")?.id ?? "", gateway)} style={{ flex: 1, backgroundColor: "#EF4444", borderRadius: 14, padding: 14, alignItems: "center" }}>
              <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "800" }}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Usage Stats */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "This Month", value: "₦" + (invoices.reduce((s: number, i: any) => i.status === "PAID" ? s + i.amount : s, 0) / 1000).toFixed(1) + "k", icon: "📅", color: "#7C3AED" },
          { label: "Energy Used", value: (invoices.reduce((s: number, i: any) => s + (i.energyReceivedKwh ?? 0), 0)).toFixed(0) + " kWh", icon: "⚡", color: "#F59E0B" },
          { label: "Tariff Rate", value: "₦225/kWh", icon: "📊", color: "#10B981" },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: `${s.color}12`, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: `${s.color}25`, alignItems: "center" }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</Text>
            <Text style={{ color: s.color, fontSize: 14, fontWeight: "900" }}>{s.value}</Text>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "600", textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Invoices */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>🧾 Invoices</Text>
      {invoices.map((inv: any) => (
        <View key={inv.id} style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center" }}>
          <View style={{ backgroundColor: `${statusColor[inv.status] ?? "#64748B"}15`, borderRadius: 12, padding: 10, marginRight: 14 }}>
            <Text style={{ fontSize: 22 }}>🧾</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "700" }}>₦{inv.amount.toLocaleString()}</Text>
            <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>{inv.energyReceivedKwh} kWh • {new Date(inv.billingPeriodStart).toLocaleDateString("en-NG", { month: "short" })} cycle</Text>
            <Text style={{ color: sub, fontSize: 10, marginTop: 2 }}>Due: {new Date(inv.dueDate).toLocaleDateString()}</Text>
          </View>
          <View style={{ backgroundColor: `${statusColor[inv.status] ?? "#64748B"}15`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: statusColor[inv.status] ?? "#64748B", fontSize: 12, fontWeight: "800" }}>{inv.status}</Text>
          </View>
        </View>
      ))}

      {/* Transactions */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 8, marginBottom: 10, textTransform: "uppercase" }}>💳 Transaction History</Text>
      {txns.map((tx: any) => (
        <View key={tx.id} style={{ backgroundColor: card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 22, marginRight: 12 }}>{txnIcon[tx.type] ?? "💳"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontSize: 13, fontWeight: "700" }}>{tx.type.replace(/_/g, " ")}</Text>
            <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>{tx.paymentGateway} • {new Date(tx.createdAt).toLocaleString()}</Text>
          </View>
          <View>
            <Text style={{ color: "#10B981", fontSize: 15, fontWeight: "900", textAlign: "right" }}>₦{tx.amount.toLocaleString()}</Text>
            <Text style={{ color: "#10B981", fontSize: 10, textAlign: "right", marginTop: 2 }}>{tx.status}</Text>
          </View>
        </View>
      ))}

      {/* Recharge Modal */}
      <Modal visible={showRecharge} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 20 }}>💳 Top Up Energy Wallet</Text>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Amount (₦)</Text>
            <TextInput style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 20, fontWeight: "800", borderWidth: 1, borderColor: border, marginBottom: 16 }}
              value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="5000" placeholderTextColor={sub} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {["1000","2500","5000","10000"].map(a => (
                <TouchableOpacity key={a} onPress={() => setAmount(a)} style={{ backgroundColor: amount === a ? accent : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text style={{ color: amount === a ? "#000" : sub, fontWeight: "700" }}>₦{parseInt(a).toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>Payment Gateway</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
              {GATEWAYS.map(g => (
                <TouchableOpacity key={g} onPress={() => setGateway(g)} style={{ backgroundColor: gateway === g ? "#7C3AED" : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ color: gateway === g ? "#FFF" : sub, fontWeight: "700" }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setShowRecharge(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRecharge} disabled={loading} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                {loading && <ActivityIndicator size="small" color="#000" />}
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>Pay ₦{parseInt(amount || "0").toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}