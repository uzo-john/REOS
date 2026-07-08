import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { useStore } from "../store/useStore";

const MOCK_OFFERS = [
  { id: "o1", sellerId: "u1", sellerName: "Adeola Solar Farm", sellerLocation: "Lekki, Lagos", availableKwh: 12.5, pricePerKwh: 195, status: "OPEN", offerType: "SELL", createdAt: new Date().toISOString() },
  { id: "o2", sellerId: "u2", sellerName: "EkoGrid Power", sellerLocation: "Victoria Island", availableKwh: 8.2, pricePerKwh: 205, status: "OPEN", offerType: "SELL", createdAt: new Date().toISOString() },
  { id: "o3", sellerId: "u3", sellerName: "SunRise Hub", sellerLocation: "Ajah, Lagos", availableKwh: 20.0, pricePerKwh: 185, status: "OPEN", offerType: "SELL", createdAt: new Date().toISOString() },
  { id: "o4", sellerId: "u4", sellerName: "Community MicroGrid", sellerLocation: "Abuja, FCT", availableKwh: 5.0, pricePerKwh: 210, status: "OPEN", offerType: "SELL", createdAt: new Date().toISOString() },
];

const MOCK_TRADES = [
  { id: "t1", type: "SOLD", kWh: 4.5, pricePerKwh: 195, total: 877.5, buyer: "Kemi Holdings", date: "2026-07-07", status: "SETTLED" },
  { id: "t2", type: "BOUGHT", kWh: 2.1, pricePerKwh: 185, total: 388.5, seller: "SunRise Hub", date: "2026-07-06", status: "SETTLED" },
  { id: "t3", type: "SOLD", kWh: 6.8, pricePerKwh: 200, total: 1360, buyer: "Lagos Grid Co", date: "2026-07-05", status: "SETTLED" },
];

export default function TradingScreen() {
  const { theme, telemetry, inputs } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#10B981";
  const [tab, setTab] = useState<"market"|"history"|"wallet">("market");
  const [showOffer, setShowOffer] = useState(false);
  const [offerKwh, setOfferKwh] = useState("5");
  const [offerPrice, setOfferPrice] = useState("195");
  const [matchingOffer, setMatchingOffer] = useState<any>(null);

  const walletBalance = 7492.5;
  const totalEarned = 28640;
  const totalSpent = 8250;

  const surplus = (telemetry?.neighbourTrading?.availableExportCapacityKw ?? 1.8) * 5;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
        <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>🔄 P2P ENERGY TRADING</Text>
        <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>Energy Marketplace</Text>
        <Text style={{ color: sub, fontSize: 12, lineHeight: 18 }}>Trade surplus solar energy with verified neighbors. Smart meter-verified settlements. Grid acts as transport network.</Text>
      </View>

      {/* Wallet Strip */}
      <View style={{ backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: sub, fontSize: 11, fontWeight: "600" }}>ENERGY WALLET</Text>
          <Text style={{ color: accent, fontSize: 28, fontWeight: "900" }}>₦{walletBalance.toLocaleString()}</Text>
          <Text style={{ color: sub, fontSize: 11, marginTop: 4 }}>↑ Earned: ₦{totalEarned.toLocaleString()} • ↓ Spent: ₦{totalSpent.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
          <View style={{ backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" }}>
            <Text style={{ color: accent, fontSize: 13, fontWeight: "700" }}>Surplus: {surplus.toFixed(1)} kWh</Text>
            <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>Available to trade</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {(["market", "history", "wallet"] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, backgroundColor: tab === t ? accent : "transparent", borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: tab === t ? "#000" : sub, fontWeight: "700", fontSize: 12 }}>
              {t === "market" ? "🏪 Market" : t === "history" ? "📋 History" : "💰 Wallet"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "market" && (
        <>
          <TouchableOpacity onPress={() => setShowOffer(true)} style={{ backgroundColor: accent, borderRadius: 16, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 16, gap: 8 }}>
            <Text style={{ fontSize: 20 }}>📤</Text>
            <Text style={{ color: "#000", fontSize: 15, fontWeight: "800" }}>List Your Surplus Energy</Text>
          </TouchableOpacity>
          <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Active Offers</Text>
          {MOCK_OFFERS.map(offer => (
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
                  <Text style={{ color: sub, fontSize: 11 }}>Total: ₦{(offer.availableKwh * offer.pricePerKwh).toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={() => setMatchingOffer(offer)} style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                  <Text style={{ color: "#000", fontWeight: "800", fontSize: 14 }}>Buy Energy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {tab === "history" && (
        <>
          <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Trade History</Text>
          {MOCK_TRADES.map(trade => (
            <View key={trade.id} style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center" }}>
              <View style={{ backgroundColor: trade.type === "SOLD" ? "rgba(16,185,129,0.12)" : "rgba(0,212,255,0.12)", borderRadius: 12, padding: 10, marginRight: 14 }}>
                <Text style={{ fontSize: 22 }}>{trade.type === "SOLD" ? "📤" : "📥"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: "700" }}>{trade.type === "SOLD" ? `Sold to ${trade.buyer}` : `Bought from ${trade.seller}`}</Text>
                <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>{trade.kWh} kWh @ ₦{trade.pricePerKwh}/kWh • {trade.date}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: trade.type === "SOLD" ? "#10B981" : "#EF4444", fontSize: 15, fontWeight: "900" }}>
                  {trade.type === "SOLD" ? "+" : "-"}₦{trade.total.toLocaleString()}
                </Text>
                <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                  <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "700" }}>{trade.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {tab === "wallet" && (
        <View style={{ backgroundColor: card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: border, alignItems: "center" }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💰</Text>
          <Text style={{ color: text, fontSize: 28, fontWeight: "900" }}>₦{walletBalance.toLocaleString()}</Text>
          <Text style={{ color: sub, fontSize: 14, marginTop: 4, marginBottom: 20 }}>Energy Wallet Balance</Text>
          <View style={{ width: "100%", gap: 12 }}>
            {[["Total Earned", `₦${totalEarned.toLocaleString()}`, "#10B981"], ["Total Spent", `₦${totalSpent.toLocaleString()}`, "#EF4444"], ["Net Revenue", `₦${(totalEarned - totalSpent).toLocaleString()}`, "#00D4FF"]].map(([k,v,c]) => (
              <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", padding: 14, backgroundColor: `${c}10`, borderRadius: 14, borderWidth: 1, borderColor: `${c}25` }}>
                <Text style={{ color: sub, fontSize: 13 }}>{k}</Text>
                <Text style={{ color: c, fontSize: 15, fontWeight: "800" }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* List Offer Modal */}
      <Modal visible={showOffer} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 20 }}>📤 List Surplus Energy</Text>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Available to sell (kWh)</Text>
            <TextInput style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: border, marginBottom: 14 }}
              value={offerKwh} onChangeText={setOfferKwh} keyboardType="numeric" placeholder="5.0" placeholderTextColor={sub} />
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Price per kWh (₦)</Text>
            <TextInput style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: border, marginBottom: 8 }}
              value={offerPrice} onChangeText={setOfferPrice} keyboardType="numeric" placeholder="195" placeholderTextColor={sub} />
            <Text style={{ color: accent, fontSize: 13, marginBottom: 20, fontWeight: "600" }}>
              Estimated revenue: ₦{(parseFloat(offerKwh || "0") * parseFloat(offerPrice || "0")).toLocaleString()}
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setShowOffer(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowOffer(false)} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>List on Marketplace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Buy Confirm Modal */}
      <Modal visible={!!matchingOffer} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>📥 Confirm Purchase</Text>
            {matchingOffer && <>
              <Text style={{ color: sub, fontSize: 13, marginBottom: 6 }}>From: <Text style={{ color: text, fontWeight: "700" }}>{matchingOffer.sellerName}</Text></Text>
              <Text style={{ color: sub, fontSize: 13, marginBottom: 6 }}>Quantity: <Text style={{ color: accent, fontWeight: "700" }}>{matchingOffer.availableKwh} kWh</Text></Text>
              <Text style={{ color: sub, fontSize: 13, marginBottom: 20 }}>Total: <Text style={{ color: accent, fontWeight: "800", fontSize: 18 }}>₦{(matchingOffer.availableKwh * matchingOffer.pricePerKwh).toLocaleString()}</Text></Text>
              <Text style={{ color: sub, fontSize: 12, lineHeight: 18, marginBottom: 20, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 12, padding: 12 }}>
                ⚡ Energy will be delivered via the public grid. Smart meter readings will verify delivery. Settlement processed automatically.
              </Text>
            </>}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setMatchingOffer(null)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMatchingOffer(null)} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "800" }}>Confirm Purchase</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}