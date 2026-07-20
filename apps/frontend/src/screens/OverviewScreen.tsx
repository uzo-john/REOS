import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions, TextInput, ActivityIndicator, Platform, Modal } from "react-native";
import { useStore } from "../store/useStore";

import ProducerDashboardScreen from "./ProducerDashboardScreen";

const { width } = Dimensions.get("window");

// Custom currency formatter that is platform independent
const formatMoney = (value: any) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

function KPICard({ label, value, unit, icon, color, trend }: any) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { 
      toValue: 1, 
      useNativeDriver: Platform.OS !== 'web', 
      delay: 100 
    }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }], flex: 1, minWidth: (width - 48) / 2 - 6 }}>
      <View style={{
        backgroundColor: isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF",
        borderRadius: 20, padding: 18, margin: 4,
        borderWidth: 1, borderColor: `${color}30`,
        shadowColor: color, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ backgroundColor: `${color}20`, borderRadius: 10, padding: 8 }}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </View>
          {trend !== undefined && (
            <View style={{ backgroundColor: trend >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: trend >= 0 ? "#10B981" : "#EF4444", fontSize: 11, fontWeight: "700" }}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>
          {value}<Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94A3B8" : "#64748B" }}> {unit}</Text>
        </Text>
        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11, fontWeight: "600", marginTop: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

function EnergyFlowDiagram() {
  const { telemetry, theme } = useStore();
  const isDark = theme === "dark";
  const solarKw = (telemetry?.inverter?.powerKw || 0).toFixed(1);
  const battSoc = (telemetry?.battery?.socPercent || 0).toFixed(0);
  const gridKw = (telemetry?.smartMeter?.activePowerKw || 0).toFixed(1);
  const chargingState = telemetry?.battery?.chargingState ?? "STANDBY";
  const isExporting = parseFloat(gridKw) > 0;
  const loadKw = telemetry ? Math.max(0, (telemetry.inverter?.powerKw || 0) - (telemetry.smartMeter?.activePowerKw || 0)).toFixed(1) : "0.0";

  const accent = "#00D4FF";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";

  const FlowNode = ({ icon, label, value, color }: any) => (
    <View style={{ alignItems: "center", minWidth: 80 }}>
      <View style={{
        width: 60, height: 60, borderRadius: 18, backgroundColor: `${color}18`,
        alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: `${color}50`, marginBottom: 8,
      }}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </View>
      <Text style={{ color: text, fontSize: 13, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: sub, fontSize: 10, fontWeight: "600", textAlign: "center", letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );

  const FlowArrow = ({ label, active, color = accent }: any) => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
      <View style={{ height: 2, width: "100%", backgroundColor: active ? color : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), borderRadius: 1 }} />
      <Text style={{ color: active ? color : sub, fontSize: 9, fontWeight: "700", marginTop: 4, letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );

  return (
    <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
      <Text style={{ color: text, fontSize: 15, fontWeight: "800", marginBottom: 16 }}>⚡ Live Energy Flow</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <FlowNode icon="☀️" label="Solar PV" value={`${solarKw} kW`} color="#F59E0B" />
        <FlowArrow label="DC→AC" active={parseFloat(solarKw) > 0.1} color="#F59E0B" />
        <FlowNode icon="🔌" label="Inverter" value="97%" color="#7C3AED" />
        <FlowArrow label={chargingState === "CHARGING" ? "→CHG" : "DSG→"} active={true} color={chargingState === "CHARGING" ? "#10B981" : "#00D4FF"} />
        <FlowNode icon="🔋" label={`Battery ${battSoc}%`} value={chargingState === "CHARGING" ? "↑" : "↓"} color="#10B981" />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
        <View style={{ height: 2, width: 2, backgroundColor: "transparent", flex: 1 }} />
        <View style={{ alignItems: "center" }}>
          <View style={{ height: 20, width: 2, backgroundColor: isExporting ? "#10B981" : "#00D4FF", borderRadius: 1 }} />
          <FlowNode icon="🏠" label="Load" value={`${loadKw} kW`} color="#00D4FF" />
          <View style={{ height: 20, width: 2, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: 1 }} />
          <FlowNode icon="⚡" label={isExporting ? "Exporting" : "Grid Import"} value={`${Math.abs(parseFloat(gridKw))} kW`} color={isExporting ? "#10B981" : "#EF4444"} />
        </View>
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function RecentAlarmBanner({ alarm }: { alarm: any }) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const colors: Record<string, string> = { CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#F59E0B", LOW: "#3B82F6", WARNING: "#F97316" };
  const c = colors[alarm.severity] || "#64748B";
  return (
    <View style={{ backgroundColor: `${c}15`, borderLeftWidth: 3, borderLeftColor: c, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 18, marginRight: 10 }}>🚨</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c, fontWeight: "700", fontSize: 13 }}>{alarm.title}</Text>
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 11, marginTop: 2 }}>
          {alarm.severity} • {new Date(alarm.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

function OverviewScreenConsumer({ navigation }: any) {
  const { 
    telemetry, 
    theme, 
    user, 
    activeContract, 
    billingSummary, 
    fetchConsumerContract, 
    fetchConsumerBilling, 
    acceptEnergySharing,
    rechargeWallet
  } = useStore() as any;

  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const card = isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const accent = "#00D4FF";
  const success = "#10B981";
  const warning = "#F59E0B";

  const [inviteCode, setInviteCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  // Modals state
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("5000");
  const [selectedGateway, setSelectedGateway] = useState("Paystack");
  const [recharging, setRecharging] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState("");

  // KPI Detail Modal state
  const [selectedKpi, setSelectedKpi] = useState<any>(null);

  // Energy Node Modal state
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    fetchConsumerContract();
    fetchConsumerBilling();
  }, []);

  const handleLinkSupplier = async () => {
    if (!inviteCode.trim()) return;
    setLinking(true);
    setLinkError("");
    setLinkSuccess("");
    try {
      const res = await acceptEnergySharing(inviteCode.trim());
      setLinkSuccess(`Supplier linked successfully! Code: ${inviteCode.trim()}`);
      await fetchConsumerContract();
      await fetchConsumerBilling();
      setInviteCode("");
    } catch (e: any) {
      setLinkError(e.message || "Failed to link supplier.");
    } finally {
      setLinking(false);
    }
  };

  const handleTopUpSubmit = async () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) return;
    setRecharging(true);
    setTopUpSuccess("");
    try {
      await rechargeWallet(amt, selectedGateway);
      await fetchConsumerBilling();
      setTopUpSuccess(`✓ Successfully credited ₦${formatMoney(amt)} via ${selectedGateway}!`);
      setTimeout(() => {
        setShowTopUp(false);
        setTopUpSuccess("");
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setRecharging(false);
    }
  };

  const walletBalance = billingSummary?.balance || 5000;
  const tariffRate = activeContract?.tariffRate || 180;
  const billingCycle = activeContract?.billingCycle || "PREPAID";
  const supplierName = activeContract?.supplier ? `${activeContract.supplier.firstName} ${activeContract.supplier.lastName}` : "Sunshine Microgrid Supplier";
  
  // Power metrics
  const activePowerKw = telemetry?.smartMeter?.activePowerKw || 1.25;
  const dailyEnergyKwh = 8.4;
  const microgridEnergyKwh = 6.2;
  const gridEnergyKwh = 2.2;
  const todayCost = (microgridEnergyKwh * tariffRate) + (gridEnergyKwh * 225); // Supplier rate + Utility rate

  const consumerKpis = [
    { label: "Current Load", value: activePowerKw.toFixed(2), unit: "kW", icon: "🏠", color: "#00D4FF", desc: "Live power consumption being drawn by home appliances.", detail: "Voltage: 231V • Current: 5.4A • Frequency: 50.0Hz" },
    { label: "Daily Usage", value: dailyEnergyKwh.toFixed(1), unit: "kWh", icon: "📊", color: "#7C3AED", desc: "Total cumulative energy consumed today.", detail: "Peak hour: 2:00 PM – 4:00 PM (3.2 kWh)" },
    { label: "Microgrid Recv.", value: microgridEnergyKwh.toFixed(1), unit: "kWh", icon: "🔄", color: "#10B981", desc: "Clean solar energy received from linked Microgrid.", detail: "Supplier: Sunshine Microgrid Co. @ ₦180/kWh" },
    { label: "Grid Import", value: gridEnergyKwh.toFixed(1), unit: "kWh", icon: "🔌", color: "#EF4444", desc: "Energy imported from national grid during peak load.", detail: "Utility tariff: ₦225/kWh" },
    { label: "Est. Cost Today", value: "₦" + todayCost.toFixed(0), unit: "", icon: "💰", color: "#F59E0B", desc: "Calculated billing cost for today's energy consumption.", detail: "Savings vs pure grid: ₦420 saved today!" },
    { label: "Active Tariff", value: "₦" + tariffRate, unit: "/kWh", icon: "📊", color: "#10B981", desc: "Prepaid energy tariff rate agreed with solar producer.", detail: "Contract type: PREPAID • Auto-deducted from wallet" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
      {/* Welcome Header */}
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,162,194,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.15)" }}>
        <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        </Text>
        <Text style={{ color: text, fontSize: 20, fontWeight: "900" }}>
          Welcome, {user?.firstName || "Consumer"} 👋
        </Text>
        <Text style={{ color: sub, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
          Connected to Bidirectional Meter. Your load is currently drawing <Text style={{ color: accent, fontWeight: "700" }}>{activePowerKw.toFixed(2)} kW</Text>.
        </Text>
      </View>

      {/* Wallet Card */}
      <View style={{ backgroundColor: isDark ? "rgba(17,24,39,0.95)" : "rgba(0,212,255,0.06)", borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
        <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>⚡ PREPAID UTILITY WALLET</Text>
        <Text style={{ color: accent, fontSize: 32, fontWeight: "900", letterSpacing: -1 }}>₦{formatMoney(walletBalance)}</Text>
        <Text style={{ color: sub, fontSize: 11, marginTop: 4, marginBottom: 16 }}>Billing Cycle: {billingCycle}</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTopUp(true)} style={{ backgroundColor: accent, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: "#000", fontSize: 13, fontWeight: "900" }}>💳 Top Up Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Smart Meter Onboarding & Energy Supplier Link Hub */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: text, fontSize: 15, fontWeight: "800" }}>🔗 Energy Connection & Smart Meter</Text>
          <View style={{ backgroundColor: "rgba(0,212,255,0.12)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>CONSUMER PORTAL</Text>
          </View>
        </View>

        {/* Action Buttons for Consumer Registration & Plant Connection Requests */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation?.navigate?.("RegisterConsumerMeter")}
            style={{
              flex: 1,
              backgroundColor: `${accent}15`,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: `${accent}35`,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>📟</Text>
            <Text style={{ color: text, fontSize: 11, fontWeight: "800" }}>Register Smart Meter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation?.navigate?.("RegisterConsumerMeter")}
            style={{
              flex: 1,
              backgroundColor: "rgba(16,185,129,0.15)",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(16,185,129,0.35)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>🔌</Text>
            <Text style={{ color: text, fontSize: 11, fontWeight: "800" }}>Request Connection</Text>
          </TouchableOpacity>
        </View>

        {activeContract && activeContract.connectionStatus === "ACTIVE" ? (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: sub, fontSize: 13 }}>Status</Text>
              <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>● Connected</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: sub, fontSize: 13 }}>Supplier</Text>
              <Text style={{ color: text, fontSize: 13, fontWeight: "700" }}>{supplierName}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: sub, fontSize: 13 }}>Prepaid Tariff Rate</Text>
              <Text style={{ color: accent, fontSize: 13, fontWeight: "700" }}>₦{tariffRate}/kWh</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: sub, fontSize: 13 }}>Meter Link ID</Text>
              <Text style={{ color: text, fontSize: 13, fontWeight: "500" }}>{activeContract.gatewayId || "reos-bidir-001"}</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={{ color: sub, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
              Link your bidirectional smart meter with your solar supplier to activate microgrid power supply and automatic wallet billing.
            </Text>
            {linkError ? (
              <Text style={{ color: "#EF4444", fontSize: 11, marginBottom: 8 }}>⚠️ {linkError}</Text>
            ) : null}
            {linkSuccess ? (
              <Text style={{ color: success, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>✓ {linkSuccess}</Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Enter Supplier Code (e.g. REOS-1234)"
                placeholderTextColor={sub}
                value={inviteCode}
                onChangeText={setInviteCode}
                style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: border, paddingHorizontal: 12, color: text, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", fontSize: 12 }}
              />
              <TouchableOpacity 
                activeOpacity={0.75}
                disabled={linking}
                onPress={handleLinkSupplier}
                style={{ backgroundColor: accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" }}
              >
                {linking ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={{ color: "#000", fontWeight: "900", fontSize: 12 }}>Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* KPI Grid - Fully Interactive */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Usage Details (Tap for Metrics)</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
        {consumerKpis.map((k) => (
          <TouchableOpacity
            key={k.label}
            activeOpacity={0.7}
            onPress={() => setSelectedKpi(k)}
            style={{ flex: 1, minWidth: (width - 48) / 2 - 6, margin: 4 }}
          >
            <View style={{
              backgroundColor: isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF",
              borderRadius: 20, padding: 18,
              borderWidth: 1, borderColor: `${k.color}30`,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ backgroundColor: `${k.color}20`, borderRadius: 10, padding: 8 }}>
                  <Text style={{ fontSize: 20 }}>{k.icon}</Text>
                </View>
                <Text style={{ color: accent, fontSize: 10, fontWeight: "800" }}>TAP INFO ℹ️</Text>
              </View>
              <Text style={{ color: text, fontSize: 24, fontWeight: "900" }}>
                {k.value}<Text style={{ fontSize: 12, color: sub }}> {k.unit}</Text>
              </Text>
              <Text style={{ color: sub, fontSize: 11, fontWeight: "600", marginTop: 4, textTransform: "uppercase" }}>
                {k.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live Energy Flow - Interactive Nodes */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
        <Text style={{ color: text, fontSize: 15, fontWeight: "800", marginBottom: 16 }}>⚡ Bidirectional Smart Flow (Tap Nodes)</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* Supplier Node */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedNode({ name: "Microgrid Supplier", icon: "☀️", power: "6.2 kWh Delivered", desc: "Clean solar energy supplied by Sunshine Microgrid Co.", telemetry: "Tariff: ₦180/kWh • Purity: 99.8% • Frequency: 50Hz" })} style={{ alignItems: "center", minWidth: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(16,185,129,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#10B98150", marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>☀️</Text>
            </View>
            <Text style={{ color: text, fontSize: 12, fontWeight: "800" }}>Microgrid</Text>
            <Text style={{ color: sub, fontSize: 9, fontWeight: "600", textAlign: "center" }}>Supplier</Text>
          </TouchableOpacity>

          {/* Flow Arrow */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={{ height: 2, width: "100%", backgroundColor: "#10B981", borderRadius: 1 }} />
            <Text style={{ color: "#10B981", fontSize: 9, fontWeight: "700", marginTop: 4 }}>{tariffRate} ₦/kWh</Text>
          </View>

          {/* Bidirectional Meter Node */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedNode({ name: "Bidirectional Smart Meter", icon: "🔌", power: `${activePowerKw.toFixed(2)} kW Active`, desc: "REOS-IoT Net Metering Node with MQTT Telemetry", telemetry: "Serial: CNS-MTR-778899 • Ping: 12ms • Signal: 98%" })} style={{ alignItems: "center", minWidth: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(0,212,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#00D4FF50", marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>🔌</Text>
            </View>
            <Text style={{ color: text, fontSize: 12, fontWeight: "800" }}>Smart Meter</Text>
            <Text style={{ color: sub, fontSize: 9, fontWeight: "600", textAlign: "center" }}>{activePowerKw.toFixed(1)} kW</Text>
          </TouchableOpacity>

          {/* Flow Arrow */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={{ height: 2, width: "100%", backgroundColor: accent, borderRadius: 1 }} />
            <Text style={{ color: accent, fontSize: 9, fontWeight: "700", marginTop: 4 }}>Supply</Text>
          </View>

          {/* Consumer Home Node */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedNode({ name: "Home Residential Load", icon: "🏠", power: "1.25 kW Load", desc: "Active household circuit breaker & load center.", telemetry: "Voltage: 231V • Power Factor: 0.98 • Status: NORMAL" })} style={{ alignItems: "center", minWidth: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(124,58,237,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#7C3AED50", marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>🏠</Text>
            </View>
            <Text style={{ color: text, fontSize: 12, fontWeight: "800" }}>Home Load</Text>
            <Text style={{ color: sub, fontSize: 9, fontWeight: "600", textAlign: "center" }}>Consumer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Quick Actions</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation?.navigate?.("Billing")} style={{ flex: 1, backgroundColor: "rgba(0,212,255,0.1)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(0,212,255,0.25)", alignItems: "center" }}>
          <Text style={{ fontSize: 22, marginBottom: 6 }}>💰</Text>
          <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>Wallet & Billing</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation?.navigate?.("Trading")} style={{ flex: 1, backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", alignItems: "center" }}>
          <Text style={{ fontSize: 22, marginBottom: 6 }}>🔄</Text>
          <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "700" }}>P2P Energy</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation?.navigate?.("AIChat")} style={{ flex: 1, backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(124,58,237,0.25)", alignItems: "center" }}>
          <Text style={{ fontSize: 22, marginBottom: 6 }}>💬</Text>
          <Text style={{ color: "#7C3AED", fontSize: 12, fontWeight: "700" }}>AI Assistant</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Top Up Modal */}
      <Modal visible={showTopUp} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 4 }}>💳 Top Up Utility Wallet</Text>
            <Text style={{ color: sub, fontSize: 12, marginBottom: 16 }}>Select amount and payment gateway to credit your energy balance.</Text>

            {topUpSuccess ? (
              <View style={{ backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" }}>
                <Text style={{ color: success, fontWeight: "800", fontSize: 13 }}>{topUpSuccess}</Text>
              </View>
            ) : null}

            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Amount (₦)</Text>
            <TextInput
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 14, padding: 16, color: text, fontSize: 22, fontWeight: "800", borderWidth: 1, borderColor: border, marginBottom: 14 }}
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={sub}
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {["1000", "2500", "5000", "10000", "25000"].map((a) => (
                <TouchableOpacity key={a} onPress={() => setTopUpAmount(a)} style={{ backgroundColor: topUpAmount === a ? accent : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ color: topUpAmount === a ? "#000" : text, fontWeight: "800", fontSize: 12 }}>₦{formatMoney(parseInt(a))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>Select Payment Gateway</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {["Paystack", "Flutterwave", "Direct Bank"].map((gw) => (
                <TouchableOpacity key={gw} onPress={() => setSelectedGateway(gw)} style={{ flex: 1, backgroundColor: selectedGateway === gw ? `${accent}20` : (isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9"), borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: selectedGateway === gw ? accent : border }}>
                  <Text style={{ color: selectedGateway === gw ? accent : text, fontWeight: "700", fontSize: 11 }}>{gw}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setShowTopUp(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={recharging} onPress={handleTopUpSubmit} style={{ flex: 2, backgroundColor: accent, borderRadius: 12, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                {recharging && <ActivityIndicator size="small" color="#000" />}
                <Text style={{ color: "#000", fontWeight: "900", fontSize: 14 }}>Pay & Credit Balance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* KPI Info Modal */}
      <Modal visible={!!selectedKpi} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${selectedKpi?.color}20`, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>{selectedKpi?.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 18, fontWeight: "900" }}>{selectedKpi?.label}</Text>
                <Text style={{ color: selectedKpi?.color, fontSize: 22, fontWeight: "900" }}>{selectedKpi?.value} {selectedKpi?.unit}</Text>
              </View>
            </View>
            <Text style={{ color: sub, fontSize: 13, marginBottom: 10, lineHeight: 18 }}>{selectedKpi?.desc}</Text>
            <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", borderRadius: 12, padding: 12, marginBottom: 18, borderWidth: 1, borderColor: border }}>
              <Text style={{ color: text, fontSize: 11, fontWeight: "700" }}>⚡ Technical Detail:</Text>
              <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>{selectedKpi?.detail}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedKpi(null)} style={{ backgroundColor: accent, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ color: "#000", fontWeight: "800" }}>Close Metric Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Energy Node Diagnostic Modal */}
      <Modal visible={!!selectedNode} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 28 }}>{selectedNode?.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 18, fontWeight: "900" }}>{selectedNode?.name}</Text>
                <Text style={{ color: accent, fontSize: 14, fontWeight: "800" }}>{selectedNode?.power}</Text>
              </View>
            </View>
            <Text style={{ color: sub, fontSize: 12, marginBottom: 12, lineHeight: 18 }}>{selectedNode?.desc}</Text>
            <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "#E0F2FE", borderRadius: 12, padding: 12, marginBottom: 18, borderWidth: 1, borderColor: `${accent}30` }}>
              <Text style={{ color: text, fontSize: 11, fontWeight: "700" }}>📡 Telemetry Stream:</Text>
              <Text style={{ color: text, fontSize: 12, marginTop: 2, fontWeight: "600" }}>{selectedNode?.telemetry}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)} style={{ backgroundColor: accent, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ color: "#000", fontWeight: "800" }}>Close Telemetry Node</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default function OverviewScreen({ navigation }: any) {
  const { telemetry, theme, alerts, user, userRole, fetchIotData, isAuthenticated, userType } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const card = isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const accent = "#00D4FF";

  useEffect(() => {
    fetchIotData();
    const interval = setInterval(() => fetchIotData(), 3000);
    return () => clearInterval(interval);
  }, []);

  if (userType === 'CONSUMER') {
    return <OverviewScreenConsumer navigation={navigation} />;
  }

  if (userType === 'PRODUCER') {
    return <ProducerDashboardScreen navigation={navigation} />;
  }

  const solarKw = telemetry?.inverter?.powerKw ?? 0.0;
  const battSoc = telemetry?.battery?.socPercent ?? 0;
  const gridKw = telemetry?.smartMeter?.activePowerKw ?? 0.0;
  const totalExport = telemetry?.smartMeter?.lifetimeExportKwh ?? 0.0;
  const co2Saved = (totalExport * 0.43).toFixed(0);
  const activeAlarms = alerts?.filter((a: any) => !a.acknowledged) ?? [];

  const kpis = [
    { label: "Solar Output", value: solarKw.toFixed(1), unit: "kW", icon: "☀️", color: "#F59E0B", trend: 8 },
    { label: "Battery SoC", value: battSoc.toFixed(0), unit: "%", icon: "🔋", color: "#10B981", trend: 2 },
    { label: "Grid Flow", value: Math.abs(gridKw).toFixed(1), unit: "kW", icon: gridKw >= 0 ? "📤" : "📥", color: gridKw >= 0 ? "#10B981" : "#EF4444", trend: undefined },
    { label: "CO₂ Saved", value: co2Saved, unit: "kg", icon: "🌿", color: "#7C3AED", trend: 12 },
    { label: "Today Gen.", value: (solarKw * 5.5).toFixed(1), unit: "kWh", icon: "⚡", color: "#00D4FF", trend: 5 },
    { label: "Export Revenue", value: "₦" + (totalExport * 225 / 1000).toFixed(0) + "k", unit: "", icon: "💰", color: "#F59E0B", trend: 18 },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
      {/* Welcome Banner */}
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,162,194,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.15)" }}>
        <Text style={{ color: sub, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 }}>
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        </Text>
        <Text style={{ color: text, fontSize: 22, fontWeight: "900" }}>
          {isAuthenticated && user ? `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, ${user.firstName} 👋` : "REOS Energy Dashboard ⚡"}
        </Text>
        <Text style={{ color: sub, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
          Your solar system is running at <Text style={{ color: accent, fontWeight: "700" }}>94% efficiency</Text>. {activeAlarms.length > 0 ? `${activeAlarms.length} active alarm${activeAlarms.length > 1 ? "s" : ""} require attention.` : "All systems operating normally."}
        </Text>
      </View>

      {/* KPI Grid */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Live KPIs</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
        {kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </View>

      {/* Energy Flow */}
      <EnergyFlowDiagram />

      {/* Quick Actions */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Quick Actions</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Solar Design", icon: "☀️", screen: "SolarDesign", color: "#F59E0B" },
          { label: "AI Chat",      icon: "🤖", screen: "AIChat",      color: "#7C3AED" },
          { label: "Monitoring",   icon: "📡", screen: "Monitoring",  color: "#00D4FF" },
          { label: "P2P Trading",  icon: "🔄", screen: "Trading",     color: "#10B981" },
        ].map((a) => (
          <TouchableOpacity key={a.label} onPress={() => navigation.navigate(a.screen)}
            style={{ flex: 1, minWidth: (width - 48) / 2 - 4, backgroundColor: `${a.color}12`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${a.color}30`, alignItems: "center" }}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</Text>
            <Text style={{ color: a.color, fontSize: 12, fontWeight: "700" }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Alarms */}
      {activeAlarms.length > 0 && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>Active Alarms</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Alarms")}>
              <Text style={{ color: accent, fontSize: 12, fontWeight: "600" }}>View All →</Text>
            </TouchableOpacity>
          </View>
          {activeAlarms.slice(0, 3).map((a: any) => <RecentAlarmBanner key={a.id} alarm={a} />)}
        </>
      )}

      {/* System Status */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 24 }}>
        <Text style={{ color: text, fontSize: 15, fontWeight: "800", marginBottom: 14 }}>🛡️ System Status</Text>
        {[
          { label: "AI Engine",        status: "OPERATIONAL", icon: "🤖" },
          { label: "MQTT Broker",       status: "CONNECTED",   icon: "📡" },
          { label: "Database",          status: "SYNCED",      icon: "🗄️" },
          { label: "P2P Marketplace",   status: "ACTIVE",      icon: "🔄" },
          { label: "Billing Engine",    status: "RUNNING",     icon: "💰" },
          { label: "Weather API",       status: "CONNECTED",   icon: "🌤️" },
        ].map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 16, marginRight: 10 }}>{s.icon}</Text>
            <Text style={{ flex: 1, color: isDark ? "#94A3B8" : "#64748B", fontSize: 13 }}>{s.label}</Text>
            <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>● {s.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}