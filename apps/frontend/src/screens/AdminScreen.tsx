import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useStore } from "../store/useStore";

type AdminTab = "overview" | "escrow" | "withdrawals" | "disputes" | "refunds" | "revenue" | "users";

const MOCK_OVERVIEW = {
  escrowBalance: 184500,
  platformRevenue: 47200,
  totalWallets: 312,
  dailyVolume: 89200,
  weeklyVolume: 542000,
  pendingWithdrawals: 8,
  openDisputes: 3,
  pendingRefunds: 5,
};

const MOCK_WITHDRAWALS = [
  { id: "w1", user: "Adeola Bakare", email: "adeola@solar.ng", amount: 25000, bank: "GTBank", account: "0123456789", status: "PENDING", date: "2026-07-13" },
  { id: "w2", user: "Emeka Power Co", email: "emeka@ekopower.ng", amount: 78000, bank: "Zenith Bank", account: "9876543210", status: "PENDING", date: "2026-07-12" },
  { id: "w3", user: "SunRise Hub", email: "admin@sunrise.ng", amount: 12500, bank: "Access Bank", account: "1234567890", status: "APPROVED", date: "2026-07-11" },
];

const MOCK_DISPUTES = [
  { id: "d1", buyer: "Kemi Holdings", seller: "EkoGrid Power", amount: 4100, kWh: 20, reason: "Energy not delivered to meter", status: "OPEN", date: "2026-07-13" },
  { id: "d2", buyer: "Lagos Consumer A", seller: "Adeola Solar Farm", amount: 1950, kWh: 10, reason: "Partial delivery — 6 kWh instead of 10 kWh", status: "UNDER_REVIEW", date: "2026-07-12" },
  { id: "d3", buyer: "Abuja Home 3", seller: "Community MicroGrid", amount: 1575, kWh: 7.5, reason: "Payment deducted twice", status: "OPEN", date: "2026-07-11" },
];

const MOCK_ESCROW = [
  { id: "e1", buyer: "Kemi Holdings", seller: "SunRise Hub", kWh: 12.5, gross: 2312.5, fee: 500, net: 1812.5, status: "HOLDING", date: "2026-07-14" },
  { id: "e2", buyer: "Lagos Consumer B", seller: "Adeola Solar Farm", kWh: 5, gross: 975, fee: 500, net: 475, status: "HOLDING", date: "2026-07-13" },
  { id: "e3", buyer: "FCT Resident", seller: "EkoGrid Power", kWh: 8.2, gross: 1681, fee: 500, net: 1181, status: "RELEASED", date: "2026-07-12" },
];

const MOCK_REVENUE = [
  { id: "r1", source: "TRANSACTION_FEE", amount: 500, desc: "Energy purchase by Kemi Holdings", date: "2026-07-14" },
  { id: "r2", source: "TRANSACTION_FEE", amount: 500, desc: "Energy purchase by Lagos Consumer B", date: "2026-07-13" },
  { id: "r3", source: "TRANSACTION_FEE", amount: 500, desc: "Energy purchase by FCT Resident", date: "2026-07-12" },
  { id: "r4", source: "TRANSACTION_FEE", amount: 500, desc: "Energy purchase by Abuja Home 3", date: "2026-07-11" },
];

export default function AdminScreen() {
  const { theme, setUserType, userType, user } = useStore() as any;
  const isDark = theme === "dark";
  const bg = isDark ? "#030509" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.98)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const green = "#10B981";
  const gold = "#F59E0B";
  const red = "#EF4444";
  const purple = "#8B5CF6";

  const [tab, setTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");

  const handleApproveWithdrawal = (wd: any) => {
    Alert.alert(
      "Approve Withdrawal",
      `Release ₦${wd.amount.toLocaleString()} to ${wd.user} via ${wd.bank}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", style: "default", onPress: () => { Alert.alert("✅ Approved", "Withdrawal approved and processing."); setSelectedWithdrawal(null); } },
      ]
    );
  };

  const handleRejectWithdrawal = (wd: any) => {
    Alert.alert(
      "Reject Withdrawal",
      `Reject and return ₦${wd.amount.toLocaleString()} to ${wd.user}'s wallet?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reject", style: "destructive", onPress: () => { Alert.alert("❌ Rejected", "Withdrawal rejected, funds returned."); setSelectedWithdrawal(null); } },
      ]
    );
  };

  const handleResolveDispute = (resolution: string, dispute: any) => {
    const msg = resolution === "BUYER"
      ? `Full refund of ₦${dispute.amount} to ${dispute.buyer}`
      : `Release ₦${dispute.amount} to ${dispute.seller}`;
    Alert.alert("Resolve Dispute", msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => { Alert.alert("⚖️ Resolved", `Dispute resolved in favour of ${resolution === "BUYER" ? "buyer" : "seller"}.`); setSelectedDispute(null); } },
    ]);
  };

  const StatCard = ({ label, value, icon, color, sub: subLabel }: any) => (
    <View style={{ flex: 1, backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${color}25`, minWidth: 140 }}>
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
      <Text style={{ color, fontSize: 20, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: text, fontSize: 12, fontWeight: "600", marginTop: 2 }}>{label}</Text>
      {subLabel && <Text style={{ color: sub, fontSize: 10, marginTop: 2 }}>{subLabel}</Text>}
    </View>
  );

  const statusColor = (s: string) =>
    s === "HOLDING" ? gold : s === "RELEASED" || s === "COMPLETED" || s === "APPROVED" ? green : s === "OPEN" || s === "PENDING" ? accent : s === "UNDER_REVIEW" ? purple : red;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,162,194,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <View style={{ backgroundColor: "rgba(0,212,255,0.15)", borderRadius: 12, padding: 10 }}>
            <Text style={{ fontSize: 24 }}>🏛️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: accent, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 }}>ADMIN FINANCE CENTRE</Text>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900" }}>Platform Dashboard</Text>
          </View>
        </View>
        <Text style={{ color: sub, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>Monitor escrow balances, approve withdrawals, resolve disputes, and track platform revenue in real time.</Text>

        {/* View As Switcher */}
        <View style={{ borderTopWidth: 1, borderTopColor: "rgba(0,212,255,0.15)", paddingTop: 14 }}>
          <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10 }}>PREVIEW APP AS</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["ADMIN", "PROSUMER", "CONSUMER"] as const).map(role => {
              const icons: Record<string, string> = { ADMIN: "🏛️", PROSUMER: "☀️", CONSUMER: "🏠" };
              const colors: Record<string, string> = { ADMIN: accent, PROSUMER: green, CONSUMER: gold };
              const isActive = userType === role;
              return (
                <TouchableOpacity
                  key={role}
                  onPress={() => { setUserType(role); }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isActive ? colors[role] : border,
                    backgroundColor: isActive ? `${colors[role]}20` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{icons[role]}</Text>
                  <Text style={{ color: isActive ? colors[role] : sub, fontSize: 12, fontWeight: "700" }}>{role}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {userType !== 'ADMIN' && (
            <Text style={{ color: gold, fontSize: 11, marginTop: 10, textAlign: "center" }}>
              ⚠️ You are previewing as {userType} — navigate to see that experience
            </Text>
          )}
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8, paddingRight: 16 }}>
          {([
            ["overview", "📊 Overview"],
            ["escrow", "🔒 Escrow"],
            ["withdrawals", "🏦 Withdrawals"],
            ["disputes", "⚖️ Disputes"],
            ["refunds", "💸 Refunds"],
            ["revenue", "💰 Revenue"],
          ] as [AdminTab, string][]).map(([t, label]) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                backgroundColor: tab === t ? accent : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
                borderWidth: 1, borderColor: tab === t ? accent : border,
              }}
            >
              <Text style={{ color: tab === t ? "#000" : sub, fontWeight: "700", fontSize: 12 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <StatCard label="Escrow Held" value={`₦${MOCK_OVERVIEW.escrowBalance.toLocaleString()}`} icon="🔒" color={gold} subLabel="Active positions" />
            <StatCard label="Platform Revenue" value={`₦${MOCK_OVERVIEW.platformRevenue.toLocaleString()}`} icon="💰" color={green} subLabel="All-time fees" />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <StatCard label="Daily Volume" value={`₦${MOCK_OVERVIEW.dailyVolume.toLocaleString()}`} icon="📈" color={accent} subLabel="Today" />
            <StatCard label="Weekly Volume" value={`₦${MOCK_OVERVIEW.weeklyVolume.toLocaleString()}`} icon="📊" color={purple} subLabel="Last 7 days" />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <StatCard label="Pending Withdrawals" value={String(MOCK_OVERVIEW.pendingWithdrawals)} icon="🏦" color={gold} subLabel="Awaiting approval" />
            <StatCard label="Open Disputes" value={String(MOCK_OVERVIEW.openDisputes)} icon="⚖️" color={red} subLabel="Need attention" />
            <StatCard label="Pending Refunds" value={String(MOCK_OVERVIEW.pendingRefunds)} icon="💸" color={accent} subLabel="Under review" />
          </View>

          {/* Alert banner */}
          {MOCK_OVERVIEW.openDisputes > 0 && (
            <TouchableOpacity onPress={() => setTab("disputes")} style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
              <Text style={{ fontSize: 24 }}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: red, fontWeight: "700", fontSize: 14 }}>{MOCK_OVERVIEW.openDisputes} Disputes Need Attention</Text>
                <Text style={{ color: sub, fontSize: 12 }}>Tap to review and resolve</Text>
              </View>
              <Text style={{ color: red, fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          )}
          {MOCK_OVERVIEW.pendingWithdrawals > 0 && (
            <TouchableOpacity onPress={() => setTab("withdrawals")} style={{ backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
              <Text style={{ fontSize: 24 }}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: gold, fontWeight: "700", fontSize: 14 }}>{MOCK_OVERVIEW.pendingWithdrawals} Withdrawals Pending</Text>
                <Text style={{ color: sub, fontSize: 12 }}>Tap to approve or reject</Text>
              </View>
              <Text style={{ color: gold, fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          )}

          {/* Platform fee summary */}
          <View style={{ backgroundColor: card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 15, fontWeight: "700", marginBottom: 14 }}>💰 Fee Policy Overview</Text>
            {[
              ["Energy Purchase Fee", "₦500 flat", "Per transaction", green],
              ["Withdrawal Fee", "Free", "No charges", accent],
              ["Escrow Hold Fee", "₦0", "Included in purchase fee", sub],
            ].map(([name, amount, desc, color]) => (
              <View key={name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                <View>
                  <Text style={{ color: text, fontSize: 13, fontWeight: "600" }}>{name}</Text>
                  <Text style={{ color: sub, fontSize: 11 }}>{desc}</Text>
                </View>
                <Text style={{ color, fontSize: 14, fontWeight: "800" }}>{amount}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── ESCROW ── */}
      {tab === "escrow" && (
        <>
          <View style={{ backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
            <Text style={{ color: gold, fontSize: 14, fontWeight: "700" }}>🔒 Escrow Balance: ₦{MOCK_OVERVIEW.escrowBalance.toLocaleString()}</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 4 }}>These funds belong to consumers — not the platform. Release only after smart meter verification.</Text>
          </View>
          {MOCK_ESCROW.map(item => (
            <View key={item.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: "700" }}>⚡ {item.kWh} kWh</Text>
                <View style={{ backgroundColor: `${statusColor(item.status)}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: statusColor(item.status), fontSize: 11, fontWeight: "700" }}>{item.status}</Text>
                </View>
              </View>
              <Text style={{ color: sub, fontSize: 12 }}>Buyer: <Text style={{ color: text, fontWeight: "600" }}>{item.buyer}</Text></Text>
              <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Seller: <Text style={{ color: text, fontWeight: "600" }}>{item.seller}</Text></Text>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: border }}>
                <View>
                  <Text style={{ color: sub, fontSize: 10 }}>GROSS</Text>
                  <Text style={{ color: text, fontWeight: "700" }}>₦{item.gross.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={{ color: sub, fontSize: 10 }}>FEE</Text>
                  <Text style={{ color: red, fontWeight: "700" }}>₦{item.fee}</Text>
                </View>
                <View>
                  <Text style={{ color: sub, fontSize: 10 }}>TO SELLER</Text>
                  <Text style={{ color: green, fontWeight: "700" }}>₦{item.net.toLocaleString()}</Text>
                </View>
              </View>
              {item.status === "HOLDING" && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
                    <Text style={{ color: red, fontWeight: "700", fontSize: 12 }}>↩ Refund</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 2, backgroundColor: green, borderRadius: 10, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>✅ Release to Seller</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* ── WITHDRAWALS ── */}
      {tab === "withdrawals" && (
        <>
          <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>Pending Withdrawals ({MOCK_WITHDRAWALS.filter(w => w.status === "PENDING").length})</Text>
          {MOCK_WITHDRAWALS.map(wd => (
            <View key={wd.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: wd.status === "PENDING" ? "rgba(245,158,11,0.3)" : border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <View>
                  <Text style={{ color: text, fontSize: 15, fontWeight: "800" }}>{wd.user}</Text>
                  <Text style={{ color: sub, fontSize: 12 }}>{wd.email}</Text>
                </View>
                <View style={{ backgroundColor: `${statusColor(wd.status)}18`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
                  <Text style={{ color: statusColor(wd.status), fontSize: 11, fontWeight: "700" }}>{wd.status}</Text>
                </View>
              </View>
              <Text style={{ color: gold, fontSize: 22, fontWeight: "900", marginBottom: 6 }}>₦{wd.amount.toLocaleString()}</Text>
              <Text style={{ color: sub, fontSize: 12 }}>Bank: {wd.bank} • Acc: {wd.account}</Text>
              <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>Requested: {wd.date}</Text>
              {wd.status === "PENDING" && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity onPress={() => handleRejectWithdrawal(wd)} style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
                    <Text style={{ color: red, fontWeight: "700" }}>✕ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleApproveWithdrawal(wd)} style={{ flex: 2, backgroundColor: green, borderRadius: 12, padding: 12, alignItems: "center" }}>
                    <Text style={{ color: "#000", fontWeight: "800" }}>✓ Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* ── DISPUTES ── */}
      {tab === "disputes" && (
        <>
          <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>Open Disputes ({MOCK_DISPUTES.length})</Text>
          {MOCK_DISPUTES.map(d => (
            <View key={d.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ color: red, fontSize: 13, fontWeight: "700" }}>⚖️ Dispute #{d.id.toUpperCase()}</Text>
                <View style={{ backgroundColor: `${statusColor(d.status)}18`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: statusColor(d.status), fontSize: 11, fontWeight: "700" }}>{d.status}</Text>
                </View>
              </View>
              <Text style={{ color: sub, fontSize: 12 }}>Buyer: <Text style={{ color: text, fontWeight: "600" }}>{d.buyer}</Text></Text>
              <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Seller: <Text style={{ color: text, fontWeight: "600" }}>{d.seller}</Text></Text>
              <View style={{ backgroundColor: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)", borderRadius: 10, padding: 10, marginTop: 10, marginBottom: 10 }}>
                <Text style={{ color: sub, fontSize: 12, fontStyle: "italic" }}>"{d.reason}"</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View>
                  <Text style={{ color: sub, fontSize: 10 }}>AMOUNT IN DISPUTE</Text>
                  <Text style={{ color: red, fontWeight: "800", fontSize: 16 }}>₦{d.amount.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={{ color: sub, fontSize: 10 }}>ENERGY</Text>
                  <Text style={{ color: text, fontWeight: "700" }}>{d.kWh} kWh</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                <TouchableOpacity onPress={() => handleResolveDispute("BUYER", d)} style={{ flex: 1, backgroundColor: "rgba(0,212,255,0.1)", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
                  <Text style={{ color: accent, fontWeight: "700", fontSize: 11 }}>↩ Refund Buyer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleResolveDispute("SELLER", d)} style={{ flex: 1, backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
                  <Text style={{ color: green, fontWeight: "700", fontSize: 11 }}>✓ Pay Seller</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* ── REFUNDS ── */}
      {tab === "refunds" && (
        <View style={{ backgroundColor: card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: border, alignItems: "center" }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💸</Text>
          <Text style={{ color: text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>No Pending Refunds</Text>
          <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>Refund requests will appear here when consumers request them via the trading screen.</Text>
        </View>
      )}

      {/* ── REVENUE ── */}
      {tab === "revenue" && (
        <>
          <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)", borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
            <View>
              <Text style={{ color: sub, fontSize: 11, fontWeight: "600" }}>TOTAL PLATFORM REVENUE</Text>
              <Text style={{ color: green, fontSize: 28, fontWeight: "900" }}>₦{MOCK_OVERVIEW.platformRevenue.toLocaleString()}</Text>
            </View>
            <View style={{ backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 14, padding: 12 }}>
              <Text style={{ color: green, fontSize: 13, fontWeight: "700" }}>₦500/tx</Text>
              <Text style={{ color: sub, fontSize: 10 }}>Flat fee</Text>
            </View>
          </View>
          <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Recent Fee Collections</Text>
          {MOCK_REVENUE.map(r => (
            <View key={r.id} style={{ backgroundColor: card, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center" }}>
              <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10, padding: 10, marginRight: 14 }}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 13, fontWeight: "600" }}>{r.desc}</Text>
                <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>{r.source.replace(/_/g, " ")} • {r.date}</Text>
              </View>
              <Text style={{ color: green, fontSize: 16, fontWeight: "900" }}>+₦{r.amount}</Text>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
