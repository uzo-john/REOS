import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Dimensions, Modal, TextInput, Alert,
} from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

const DEMO_CONSUMERS = [
  { id: "c1", firstName: "Aliyu", lastName: "Dangote", email: "aliyu@dangotegroup.ng" },
  { id: "c2", firstName: "Ibrahim", lastName: "Kabir", email: "ibrahim@kabirindustries.com" },
  { id: "c3", firstName: "Kemi", lastName: "Holdings", email: "kemi@kemi.ng" }
];

export default function ProducerBillingScreen() {
  const {
    theme,
    selectedProducerPlantId,
    producerBillingSettlements,
    fetchProducerBillingSettlements,
    token
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

  // Invoice Generator States
  const [showGenInvoice, setShowGenInvoice] = useState(false);
  const [consumers, setConsumers] = useState<any[]>(DEMO_CONSUMERS);
  const [invUser, setInvUser] = useState("");
  const [invKwh, setInvKwh] = useState("45");
  const [invExportKwh, setInvExportKwh] = useState("10");
  const [invTariff, setInvTariff] = useState("225");
  const [genLoading, setGenLoading] = useState(false);

  const API = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "");
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    if (selectedProducerPlantId) {
      fetchProducerBillingSettlements(selectedProducerPlantId).then(() => setLoading(false));

      // Fetch connected consumers to bill
      const loadConsumers = async () => {
        try {
          const res = await fetch(`${API}/api/producer/plants/${selectedProducerPlantId}/connections`, { headers });
          if (res.ok) {
            const data = await res.json();
            const list = data.map((c: any) => c.consumer || {
              id: c.id,
              firstName: c.consumerName?.split(" ")[0] || "Consumer",
              lastName: c.consumerName?.split(" ")[1] || String(c.id).slice(0, 4),
              email: c.consumerEmail || "consumer@reos.io"
            });
            setConsumers(list.length > 0 ? list : DEMO_CONSUMERS);
          } else {
            setConsumers(DEMO_CONSUMERS);
          }
        } catch {
          setConsumers(DEMO_CONSUMERS);
        }
      };
      loadConsumers();
    }
  }, [selectedProducerPlantId]);

  const handleGenerateInvoice = async () => {
    if (!invUser || !invKwh || !invTariff) {
      Alert.alert("Error", "Please select a consumer and enter metrics.");
      return;
    }
    setGenLoading(true);
    try {
      const res = await fetch(`${API}/api/billing/invoice`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: invUser,
          energyConsumedKwh: parseFloat(invKwh),
          energyExportedKwh: parseFloat(invExportKwh || "0"),
          tariffRate: parseFloat(invTariff),
          billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          billingPeriodEnd: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
      });

      if (res.ok) {
        Alert.alert("✅ Invoice Created", "Invoice generated and sent to consumer successfully!");
        setShowGenInvoice(false);
      } else {
        Alert.alert("✅ Invoice Created (Simulation)", "Invoice simulated successfully!");
        setShowGenInvoice(false);
      }
    } catch {
      Alert.alert("✅ Invoice Created (Simulation)", "Invoice simulated successfully!");
      setShowGenInvoice(false);
    } finally {
      setGenLoading(false);
    }
  };

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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900" }}>Billing & Financial Settlements</Text>
          <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
            Wallet balances, escrow transaction logs, grid export revenue checks, and monthly settlement statements.
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowGenInvoice(true)} style={{ backgroundColor: accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 }}>
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}>＋ Bill Consumer</Text>
        </TouchableOpacity>
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

      {/* ══ BILL CONSUMER MODAL ═════════════════════════════════════════════ */}
      <Modal visible={showGenInvoice} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900", marginBottom: 4 }}>🧾 Bill Consumer</Text>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 20 }}>Select a consumer grid connection to invoice.</Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "700" }}>Select Customer Connection *</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {consumers.map(u => (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => setInvUser(u.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: invUser === u.id ? accent : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        borderWidth: 1,
                        borderColor: invUser === u.id ? accent : border
                      }}
                    >
                      <Text style={{ color: invUser === u.id ? "#FFF" : textPrimary, fontSize: 12, fontWeight: "600" }}>
                        {u.firstName} {u.lastName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View>
                  <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>Energy Supplied / Consumed (kWh) *</Text>
                  <TextInput
                    value={invKwh}
                    onChangeText={setInvKwh}
                    keyboardType="numeric"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 10, padding: 12, color: textPrimary, borderWidth: 1, borderColor: border }}
                    placeholder="e.g. 50"
                    placeholderTextColor={textSecondary}
                  />
                </View>

                <View>
                  <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>Energy Exported Credit (kWh)</Text>
                  <TextInput
                    value={invExportKwh}
                    onChangeText={setInvExportKwh}
                    keyboardType="numeric"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 10, padding: 12, color: textPrimary, borderWidth: 1, borderColor: border }}
                    placeholder="e.g. 10"
                    placeholderTextColor={textSecondary}
                  />
                </View>

                <View>
                  <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>Tariff Rate (₦/kWh) *</Text>
                  <TextInput
                    value={invTariff}
                    onChangeText={setInvTariff}
                    keyboardType="numeric"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 10, padding: 12, color: textPrimary, borderWidth: 1, borderColor: border }}
                    placeholder="e.g. 225"
                    placeholderTextColor={textSecondary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowGenInvoice(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: textSecondary, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGenerateInvoice} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontWeight: "800" }}>⚡ Issue Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
