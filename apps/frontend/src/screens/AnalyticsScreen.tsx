import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useStore } from "../store/useStore";

export default function AlarmScreen() {
  const { alerts, theme, acknowledgeAlert, fetchIotData } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchIotData(); const iv = setInterval(fetchIotData, 5000); return () => clearInterval(iv); }, []);

  const sevColor: Record<string, string> = { CRITICAL:"#EF4444", HIGH:"#F97316", MEDIUM:"#F59E0B", LOW:"#3B82F6", WARNING:"#F97316", INFO:"#64748B" };
  const sevIcon: Record<string, string> = { CRITICAL:"🔴", HIGH:"🟠", MEDIUM:"🟡", LOW:"🔵", WARNING:"🟠", INFO:"⚪" };

  const allAlerts = [...(alerts ?? []),
    { id: "mock-1", code: "BATTERY_TEMP", title: "Battery Temperature High", severity: "HIGH", acknowledged: false, timestamp: new Date(Date.now()-300000).toISOString(), recommendedAction: "Check battery cooling. Ensure ventilation is not blocked.", status: "ACTIVE" },
    { id: "mock-2", code: "MPPT_DERATING", title: "MPPT Derating Active", severity: "MEDIUM", acknowledged: true, timestamp: new Date(Date.now()-1800000).toISOString(), recommendedAction: "Panel temperature exceeds optimal range. Performance will recover by afternoon.", status: "ACKNOWLEDGED" },
    { id: "mock-3", code: "LOW_PF", title: "Low Power Factor Detected", severity: "LOW", acknowledged: false, timestamp: new Date(Date.now()-3600000).toISOString(), recommendedAction: "PF < 0.95. Consider adding PF correction capacitor bank.", status: "ACTIVE" },
  ];

  const filtered = filter === "ALL" ? allAlerts : filter === "ACTIVE" ? allAlerts.filter(a => !a.acknowledged) : allAlerts.filter(a => a.acknowledged);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Summary */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Active", v: allAlerts.filter(a => !a.acknowledged).length, c: "#EF4444" },
          { label: "Acknowledged", v: allAlerts.filter(a => a.acknowledged).length, c: "#F59E0B" },
          { label: "Total", v: allAlerts.length, c: "#00D4FF" },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: `${s.c}12`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${s.c}25`, alignItems: "center" }}>
            <Text style={{ color: s.c, fontSize: 24, fontWeight: "900" }}>{s.v}</Text>
            <Text style={{ color: sub, fontSize: 11, fontWeight: "600" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter */}
      <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {["ALL","ACTIVE","ACKNOWLEDGED"].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ flex: 1, backgroundColor: filter === f ? "#EF4444" : "transparent", borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: filter === f ? "#FFF" : sub, fontWeight: "700", fontSize: 12 }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={{ backgroundColor: card, borderRadius: 20, padding: 40, alignItems: "center", borderWidth: 1, borderColor: border }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>No Alarms Found</Text>
          <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>All systems operating within normal parameters.</Text>
        </View>
      ) : (
        filtered.map((alarm: any) => {
          const sc = sevColor[alarm.severity] ?? "#64748B";
          return (
            <View key={alarm.id} style={{ backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderLeftWidth: 4, borderColor: border, borderLeftColor: sc, opacity: alarm.acknowledged ? 0.6 : 1 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{sevIcon[alarm.severity] ?? "⚪"}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ flex: 1, color: text, fontSize: 14, fontWeight: "800" }}>{alarm.title}</Text>
                    <View style={{ backgroundColor: `${sc}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: sc, fontSize: 11, fontWeight: "700" }}>{alarm.severity}</Text>
                    </View>
                  </View>
                  <Text style={{ color: sub, fontSize: 11 }}>{alarm.code} • {new Date(alarm.timestamp).toLocaleString()}</Text>
                </View>
              </View>
              {alarm.recommendedAction && (
                <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: sub, fontSize: 12 }}>💡 <Text style={{ fontWeight: "600" }}>Recommended:</Text> {alarm.recommendedAction}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 10 }}>
                {!alarm.acknowledged && (
                  <TouchableOpacity onPress={() => acknowledgeAlert(alarm.id)} style={{ flex: 1, backgroundColor: "#F59E0B", borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: "#000", fontWeight: "700", fontSize: 13 }}>✓ Acknowledge</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1, backgroundColor: alarm.acknowledged ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
                  <Text style={{ color: "#10B981", fontWeight: "700", fontSize: 13 }}>{alarm.acknowledged ? "✅ Acknowledged" : "🔧 Investigate"}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}