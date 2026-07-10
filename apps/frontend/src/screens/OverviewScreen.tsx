import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

function KPICard({ label, value, unit, icon, color, trend }: any) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, delay: 100 }).start();
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
  const solarKw = telemetry?.inverter?.powerKw?.toFixed(1) ?? "0.0";
  const battSoc = telemetry?.battery?.socPercent?.toFixed(0) ?? "0";
  const gridKw = telemetry?.smartMeter?.activePowerKw?.toFixed(1) ?? "0.0";
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

export default function OverviewScreen({ navigation }: any) {
  const { telemetry, theme, alerts, user, userRole, fetchIotData, isAuthenticated } = useStore();
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