import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useStore } from "../store/useStore";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

// ─── Mock market data until live API connected ───────────────────────────────
const MOCK_OFFERS = [
  { id: "o1", sellerId: "u1", sellerName: "Adeola Solar Farm", sellerLocation: "Lekki, Lagos", availableKwh: 12.5, pricePerKwh: 195, status: "OPEN" },
  { id: "o2", sellerId: "u2", sellerName: "EkoGrid Power", sellerLocation: "Victoria Island", availableKwh: 8.2, pricePerKwh: 205, status: "OPEN" },
  { id: "o3", sellerId: "u3", sellerName: "SunRise Hub", sellerLocation: "Ajah, Lagos", availableKwh: 20.0, pricePerKwh: 185, status: "OPEN" },
  { id: "o4", sellerId: "u4", sellerName: "Community MicroGrid", sellerLocation: "Abuja, FCT", availableKwh: 5.0, pricePerKwh: 210, status: "OPEN" },
];

const PLATFORM_FEE = 500; // ₦500 flat fee

type Tab = "market" | "history" | "wallet" | "escrow";

export default function TradingScreen() {
  const { theme, token, telemetry } = useStore() as any;
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#10B981";
  const gold = "#F59E0B";
  const red = "#EF4444";
  const blue = "#00D4FF";

  const [tab, setTab] = useState<Tab>("market");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(7492.5);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [escrowItems, setEscrowItems] = useState<any[]>([]);

  // Modals
  const [showOffer, setShowOffer] = useState(false);
  const [offerKwh, setOfferKwh] = useState("5");
  const [offerPrice, setOfferPrice] = useState("195");
  const [matchingOffer, setMatchingOffer] = useState<any>(null);
  const [buyKwh, setBuyKwh] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("5000");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("3000");
  const [withdrawBank, setWithdrawBank] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");

  const surplus = (telemetry?.neighbourTrading?.availableExportCapacityKw ?? 1.8) * 5;

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const handleBuyEnergy = async () => {
    if (!matchingOffer) return;
    const kwhNum = parseFloat(buyKwh || String(matchingOffer.availableKwh));
    const energyCost = kwhNum * matchingOffer.pricePerKwh;
    const total = energyCost + PLATFORM_FEE;

    if (total > walletBalance) {
      Alert.alert("Insufficient Balance", `You need ₦${total.toLocaleString()} but only have ₦${walletBalance.toLocaleString()}.\n\nPlease top up your wallet first.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wallets/buy-energy`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId: matchingOffer.id, energyKwh: kwhNum }),
      });

      if (res.ok) {
        const data = await res.json();
        setWalletBalance(prev => prev - total);
        setLockedBalance(prev => prev + energyCost);
        setEscrowItems(prev => [...prev, {
          id: data.escrow?.id || `esc_${Date.now()}`,
          seller: matchingOffer.sellerName,
          kWh: kwhNum,
          amount: energyCost,
          fee: PLATFORM_FEE,
          total,
          status: "HOLDING",
          date: new Date().toISOString(),
        }]);
        Alert.alert("✅ Funds in Escrow", `₦${total.toLocaleString()} deducted.\n• Energy cost: ₦${energyCost.toLocaleString()}\n• Platform fee: ₦${PLATFORM_FEE}\n\nFunds held in escrow until smart meter confirms delivery.`);
      } else {
        const err = await res.json();
        Alert.alert("Purchase Failed", err.message || "Something went wrong");
      }
    } catch {
      // Offline demo mode
      const escrow = {
        id: `esc_${Date.now()}`,
        seller: matchingOffer.sellerName,
        kWh: kwhNum,
        amount: energyCost,
        fee: PLATFORM_FEE,
        total,
        status: "HOLDING",
        date: new Date().toISOString(),
      };
      setWalletBalance(prev => prev - total);
      setLockedBalance(prev => prev + energyCost);
      setEscrowItems(prev => [...prev, escrow]);
      Alert.alert("⚡ Purchase Queued (Offline)", `Escrow of ₦${total.toLocaleString()} recorded locally.`);
    } finally {
      setLoading(false);
      setMatchingOffer(null);
      setBuyKwh("");
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 100) {
      Alert.alert("Invalid Amount", "Minimum top-up is ₦100");
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000)); // simulate payment gateway
      setWalletBalance(prev => prev + amount);
      setShowTopUp(false);
      Alert.alert("✅ Wallet Funded", `₦${amount.toLocaleString()} added to your Energy Wallet`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawBank || !withdrawAccount) {
      Alert.alert("Missing Details", "Please enter your bank name and account number");
      return;
    }
    if (amount > walletBalance - lockedBalance) {
      Alert.alert("Insufficient Funds", "You cannot withdraw locked escrow funds");
      return;
    }
    Alert.alert("✅ Withdrawal Submitted", `₦${amount.toLocaleString()} withdrawal request submitted.\n\nBank: ${withdrawBank}\nAccount: ${withdrawAccount}\n\nProcessing time: 1-3 business days`);
    setShowWithdraw(false);
  };

  const MOCK_HISTORY = [
    { id: "t1", type: "SOLD", kWh: 4.5, pricePerKwh: 195, total: 877.5, party: "Kemi Holdings", date: "2026-07-07", status: "SETTLED" },
    { id: "t2", type: "BOUGHT", kWh: 2.1, pricePerKwh: 185, total: 388.5, party: "SunRise Hub", date: "2026-07-06", status: "SETTLED" },
    { id: "t3", type: "SOLD", kWh: 6.8, pricePerKwh: 200, total: 1360, party: "Lagos Grid Co", date: "2026-07-05", status: "SETTLED" },
    { id: "t4", type: "FEE", kWh: 0, pricePerKwh: 0, total: 500, party: "Platform", date: "2026-07-06", status: "COMPLETED" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={accent} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
        <Text style={{ color: accent, fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>🔄 P2P ENERGY TRADING</Text>
        <Text style={{ color: text, fontSize: 22, fontWeight: "900", marginBottom: 6 }}>Energy Marketplace</Text>
        <Text style={{ color: sub, fontSize: 12, lineHeight: 18 }}>Escrow-protected energy trades. Smart meter verified. ₦500 platform fee per transaction.</Text>
      </View>

      {/* Wallet Summary Strip */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: border }}>
        <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 }}>ENERGY WALLET</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
          <View style={{ flex: 1, backgroundColor: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "600" }}>AVAILABLE</Text>
            <Text style={{ color: accent, fontSize: 20, fontWeight: "900", marginTop: 4 }}>₦{(walletBalance - lockedBalance).toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "600" }}>IN ESCROW</Text>
            <Text style={{ color: gold, fontSize: 20, fontWeight: "900", marginTop: 4 }}>₦{lockedBalance.toLocaleString()}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={() => setShowTopUp(true)} style={{ flex: 1, backgroundColor: accent, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>＋ Fund Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowWithdraw(true)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>🏦 Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {(["market", "history", "escrow", "wallet"] as Tab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, backgroundColor: tab === t ? accent : "transparent", borderRadius: 10, padding: 9, alignItems: "center" }}>
            <Text style={{ color: tab === t ? "#000" : sub, fontWeight: "700", fontSize: 11 }}>
              {t === "market" ? "🏪 Market" : t === "history" ? "📋 History" : t === "escrow" ? "🔒 Escrow" : "💰 Wallet"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── MARKET TAB ── */}
      {tab === "market" && (
        <>
          <TouchableOpacity onPress={() => setShowOffer(true)} style={{ backgroundColor: accent, borderRadius: 16, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 16, gap: 8 }}>
            <Text style={{ fontSize: 18 }}>📤</Text>
            <Text style={{ color: "#000", fontSize: 15, fontWeight: "800" }}>List Your Surplus Energy</Text>
          </TouchableOpacity>
          <View style={{ backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", borderRadius: 14, padding: 12, marginBottom: 16, flexDirection: "row", gap: 8, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
            <Text style={{ color: sub, fontSize: 12, flex: 1, lineHeight: 18 }}>
              All purchases are <Text style={{ color: gold, fontWeight: "700" }}>escrow-protected</Text>. Funds only release after smart meter confirms delivery. Platform fee: <Text style={{ color: gold, fontWeight: "700" }}>₦500/transaction</Text>.
            </Text>
          </View>
          <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Active Offers ({MOCK_OFFERS.length})</Text>
          {MOCK_OFFERS.map(offer => {
            const totalCost = offer.availableKwh * offer.pricePerKwh + PLATFORM_FEE;
            return (
              <View key={offer.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: text, fontSize: 15, fontWeight: "800", marginBottom: 2 }}>{offer.sellerName}</Text>
                    <Text style={{ color: sub, fontSize: 12 }}>📍 {offer.sellerLocation}</Text>
                  </View>
                  <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10, padding: 8, alignItems: "center" }}>
                    <Text style={{ color: accent, fontSize: 18, fontWeight: "900" }}>₦{offer.pricePerKwh}</Text>
                    <Text style={{ color: sub, fontSize: 10 }}>/kWh</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: text, fontSize: 16, fontWeight: "700" }}>{offer.availableKwh} kWh</Text>
                    <Text style={{ color: sub, fontSize: 11 }}>Energy: ₦{(offer.availableKwh * offer.pricePerKwh).toLocaleString()} + ₦500 fee</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setMatchingOffer(offer); setBuyKwh(String(offer.availableKwh)); }}
                    style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }}
                  >
                    <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>Buy Energy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <>
          <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Trade History</Text>
          {MOCK_HISTORY.map(trade => (
            <View key={trade.id} style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center" }}>
              <View style={{
                backgroundColor: trade.type === "SOLD" ? "rgba(16,185,129,0.12)" : trade.type === "FEE" ? "rgba(239,68,68,0.10)" : "rgba(0,212,255,0.12)",
                borderRadius: 12, padding: 10, marginRight: 14,
              }}>
                <Text style={{ fontSize: 20 }}>{trade.type === "SOLD" ? "📤" : trade.type === "FEE" ? "💸" : "📥"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: "700" }}>
                  {trade.type === "SOLD" ? `Sold to ${trade.party}` : trade.type === "FEE" ? "Platform Fee" : `Bought from ${trade.party}`}
                </Text>
                <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>
                  {trade.kWh > 0 ? `${trade.kWh} kWh @ ₦${trade.pricePerKwh}/kWh • ` : ""}{trade.date}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: trade.type === "SOLD" ? accent : trade.type === "FEE" ? red : text, fontSize: 15, fontWeight: "900" }}>
                  {trade.type === "SOLD" ? "+" : "-"}₦{trade.total.toLocaleString()}
                </Text>
                <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                  <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>{trade.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {/* ── ESCROW TAB ── */}
      {tab === "escrow" && (
        <>
          <View style={{ backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
            <Text style={{ color: gold, fontSize: 13, fontWeight: "700", marginBottom: 4 }}>🔒 Escrow Protection</Text>
            <Text style={{ color: sub, fontSize: 12, lineHeight: 18 }}>
              Funds in escrow are <Text style={{ color: gold, fontWeight: "700" }}>completely protected</Text>. They will only be released to the seller after your smart meter confirms delivery. If delivery fails, you receive a full refund.
            </Text>
          </View>
          {escrowItems.length === 0 ? (
            <View style={{ backgroundColor: card, borderRadius: 18, padding: 32, alignItems: "center", borderWidth: 1, borderColor: border }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
              <Text style={{ color: text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>No Active Escrow</Text>
              <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>When you buy energy, the funds will appear here until delivery is confirmed.</Text>
            </View>
          ) : (
            escrowItems.map(item => (
              <View key={item.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ color: text, fontSize: 15, fontWeight: "800" }}>⚡ {item.kWh} kWh</Text>
                  <View style={{ backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: gold, fontSize: 11, fontWeight: "700" }}>🔒 {item.status}</Text>
                  </View>
                </View>
                <Text style={{ color: sub, fontSize: 12, marginBottom: 4 }}>From: {item.seller}</Text>
                <Text style={{ color: sub, fontSize: 12, marginBottom: 12 }}>{new Date(item.date).toLocaleDateString()}</Text>
                <View style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 12, gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: sub, fontSize: 12 }}>Energy Cost</Text>
                    <Text style={{ color: text, fontSize: 12, fontWeight: "600" }}>₦{item.amount.toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: sub, fontSize: 12 }}>Platform Fee</Text>
                    <Text style={{ color: red, fontSize: 12, fontWeight: "600" }}>₦{item.fee.toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: sub, fontSize: 13, fontWeight: "700" }}>Total Held</Text>
                    <Text style={{ color: gold, fontSize: 15, fontWeight: "900" }}>₦{item.total.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
                    <Text style={{ color: red, fontWeight: "700", fontSize: 12 }}>⚖️ Dispute</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 2, backgroundColor: accent, borderRadius: 10, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>✅ Confirm Delivery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* ── WALLET DETAIL TAB ── */}
      {tab === "wallet" && (
        <>
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: border, alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💰</Text>
            <Text style={{ color: text, fontSize: 30, fontWeight: "900" }}>₦{walletBalance.toLocaleString()}</Text>
            <Text style={{ color: sub, fontSize: 13, marginTop: 4, marginBottom: 20 }}>Total Energy Wallet Balance</Text>
            <View style={{ width: "100%", gap: 10 }}>
              {[
                ["Available Balance", `₦${(walletBalance - lockedBalance).toLocaleString()}`, accent],
                ["In Escrow (Locked)", `₦${lockedBalance.toLocaleString()}`, gold],
                ["Total Earned (All Time)", "₦28,640", blue],
                ["Total Spent", "₦8,750", red],
              ].map(([k, v, c]) => (
                <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", padding: 14, backgroundColor: `${c}10`, borderRadius: 14, borderWidth: 1, borderColor: `${c}25` }}>
                  <Text style={{ color: sub, fontSize: 13 }}>{k}</Text>
                  <Text style={{ color: c, fontSize: 14, fontWeight: "800" }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.15)" }}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "700", marginBottom: 12 }}>ℹ️ PLATFORM FEE POLICY</Text>
            <Text style={{ color: sub, fontSize: 12, lineHeight: 18 }}>A flat <Text style={{ color: text, fontWeight: "700" }}>₦500 platform fee</Text> is charged per energy purchase transaction. This fee:</Text>
            <View style={{ marginTop: 8, gap: 4 }}>
              {["• Covers transaction processing and escrow management", "• Funds platform security and smart meter verification", "• Is non-refundable even if energy delivery fails", "• Is deducted from the buyer at time of purchase"].map(l => (
                <Text key={l} style={{ color: sub, fontSize: 12, lineHeight: 18 }}>{l}</Text>
              ))}
            </View>
          </View>
        </>
      )}

      {/* ── TOP UP MODAL ── */}
      <Modal visible={showTopUp} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 20 }}>＋ Fund Your Wallet</Text>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Amount (₦)</Text>
            <TextInput
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 20, fontWeight: "700", borderWidth: 1, borderColor: border, marginBottom: 14 }}
              value={topUpAmount} onChangeText={setTopUpAmount} keyboardType="numeric" placeholder="5000" placeholderTextColor={sub}
            />
            {["2,000", "5,000", "10,000", "20,000"].map(amt => (
              <TouchableOpacity key={amt} onPress={() => setTopUpAmount(amt.replace(",", ""))} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 14, alignSelf: "flex-start" }}>
                <Text style={{ color: accent, fontWeight: "700" }}>₦{amt}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setShowTopUp(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTopUp} disabled={loading} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center" }}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>Fund via Paystack</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── WITHDRAWAL MODAL ── */}
      <Modal visible={showWithdraw} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 4 }}>🏦 Request Withdrawal</Text>
            <Text style={{ color: sub, fontSize: 12, marginBottom: 20 }}>Available: ₦{(walletBalance - lockedBalance).toLocaleString()}</Text>
            {[
              ["Amount (₦)", withdrawAmount, setWithdrawAmount, "numeric", "3000"],
              ["Bank Name", withdrawBank, setWithdrawBank, "default", "GTBank"],
              ["Account Number", withdrawAccount, setWithdrawAccount, "numeric", "0123456789"],
            ].map(([label, val, setter, kbType, ph]) => (
              <View key={label as string} style={{ marginBottom: 12 }}>
                <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>{label as string}</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 12, padding: 14, color: text, fontSize: 15, borderWidth: 1, borderColor: border }}
                  value={val as string} onChangeText={setter as any} keyboardType={kbType as any} placeholder={ph as string} placeholderTextColor={sub}
                />
              </View>
            ))}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setShowWithdraw(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWithdraw} style={{ flex: 2, backgroundColor: gold, borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── LIST OFFER MODAL ── */}
      <Modal visible={showOffer} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 20 }}>📤 List Surplus Energy</Text>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Surplus Energy (kWh)</Text>
            <TextInput style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: border, marginBottom: 14 }}
              value={offerKwh} onChangeText={setOfferKwh} keyboardType="numeric" placeholder="5.0" placeholderTextColor={sub} />
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Price per kWh (₦)</Text>
            <TextInput style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: border, marginBottom: 8 }}
              value={offerPrice} onChangeText={setOfferPrice} keyboardType="numeric" placeholder="195" placeholderTextColor={sub} />
            <Text style={{ color: accent, fontSize: 13, marginBottom: 20, fontWeight: "600" }}>
              Est. revenue after ₦500 fee: ₦{Math.max(0, parseFloat(offerKwh || "0") * parseFloat(offerPrice || "0") - PLATFORM_FEE).toLocaleString()}
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setShowOffer(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowOffer(false); Alert.alert("✅ Listed!", `${offerKwh} kWh listed at ₦${offerPrice}/kWh`); }} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>List on Marketplace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── BUY CONFIRM MODAL ── */}
      <Modal visible={!!matchingOffer} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>📥 Confirm Purchase</Text>
            {matchingOffer && (
              <>
                <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Quantity (kWh)</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 12, padding: 12, color: text, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: border, marginBottom: 14 }}
                  value={buyKwh} onChangeText={setBuyKwh} keyboardType="numeric"
                  placeholder={String(matchingOffer.availableKwh)} placeholderTextColor={sub}
                />
                <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 14, padding: 14, marginBottom: 16, gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: sub, fontSize: 13 }}>From</Text>
                    <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>{matchingOffer.sellerName}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: sub, fontSize: 13 }}>Energy Cost</Text>
                    <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>₦{((parseFloat(buyKwh) || matchingOffer.availableKwh) * matchingOffer.pricePerKwh).toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: sub, fontSize: 13 }}>Platform Fee</Text>
                    <Text style={{ color: red, fontWeight: "700", fontSize: 13 }}>₦{PLATFORM_FEE}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: text, fontSize: 14, fontWeight: "700" }}>Total Charge</Text>
                    <Text style={{ color: accent, fontWeight: "900", fontSize: 18 }}>
                      ₦{(((parseFloat(buyKwh) || matchingOffer.availableKwh) * matchingOffer.pricePerKwh) + PLATFORM_FEE).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: sub, fontSize: 11, lineHeight: 17, marginBottom: 18, backgroundColor: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
                  🔒 Funds will be held in <Text style={{ color: gold, fontWeight: "700" }}>escrow</Text> until smart meter confirms delivery. Platform fee (₦500) is non-refundable.
                </Text>
              </>
            )}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => { setMatchingOffer(null); setBuyKwh(""); }} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBuyEnergy} disabled={loading} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 14, alignItems: "center" }}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={{ color: "#000", fontWeight: "800" }}>Confirm & Pay into Escrow</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}