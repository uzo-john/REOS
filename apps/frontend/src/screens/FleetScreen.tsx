// === FleetScreen ===
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useStore } from "../store/useStore";

const MOCK_PLANTS: any[] = [];

export function FleetScreen() {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  const totalGen = MOCK_PLANTS.reduce((s, p) => s + p.todayGen, 0);
  const totalCap = MOCK_PLANTS.reduce((s, p) => s + p.capacityKwp, 0);
  const totalCo2 = MOCK_PLANTS.reduce((s, p) => s + p.co2, 0);
  const totalAlarms = MOCK_PLANTS.reduce((s, p) => s + p.alarms, 0);
  const statusColor = { OPERATIONAL:"#10B981", DEGRADED:"#F59E0B", OFFLINE:"#EF4444", MAINTENANCE:"#F97316" };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
        <Text style={{ color: accent, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>🏭 FLEET DASHBOARD</Text>
        <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>Multi-Plant Overview</Text>
        <Text style={{ color: sub, fontSize: 12 }}>{MOCK_PLANTS.length} plants • {MOCK_PLANTS.filter(p => p.status === "OPERATIONAL").length} operational</Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Capacity", v: `${totalCap} kWp`, icon: "⚡", c: "#00D4FF" },
          { label: "Today Generation", v: `${totalGen.toFixed(0)} kWh`, icon: "☀️", c: "#F59E0B" },
          { label: "CO₂ Saved", v: `${totalCo2.toFixed(0)} kg`, icon: "🌿", c: "#10B981" },
          { label: "Active Alarms", v: totalAlarms.toString(), icon: "🚨", c: totalAlarms > 0 ? "#EF4444" : "#10B981" },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, minWidth: "45%", backgroundColor: `${s.c}12`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${s.c}25`, alignItems: "center" }}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</Text>
            <Text style={{ color: s.c, fontSize: 20, fontWeight: "900" }}>{s.v}</Text>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "600", textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Plant Performance</Text>
      {MOCK_PLANTS.map(p => {
        const sc = (statusColor as any)[p.status] ?? "#64748B";
        return (
          <View key={p.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
              <View style={{ backgroundColor: `${sc}18`, borderRadius: 14, padding: 10, marginRight: 14 }}>
                <Text style={{ fontSize: 26 }}>🏭</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ flex: 1, color: text, fontSize: 15, fontWeight: "800" }}>{p.name}</Text>
                  <View style={{ backgroundColor: `${sc}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: sc, fontSize: 11, fontWeight: "700" }}>● {p.status}</Text>
                  </View>
                </View>
                <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>📍 {p.location} • {p.capacityKwp} kWp</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[["Today", `${p.todayGen} kWh`, "#F59E0B"], ["PR", `${p.pr}%`, p.pr >= 85 ? "#10B981" : "#F59E0B"], ["CO₂", `${p.co2} kg`, "#7C3AED"], ["Alarms", p.alarms.toString(), p.alarms > 0 ? "#EF4444" : "#10B981"]].map(([k,v,c]) => (
                <View key={k} style={{ flex: 1, backgroundColor: `${c}10`, borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ color: c, fontSize: 14, fontWeight: "800" }}>{v}</Text>
                  <Text style={{ color: sub, fontSize: 9, fontWeight: "600" }}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

export default FleetScreen;