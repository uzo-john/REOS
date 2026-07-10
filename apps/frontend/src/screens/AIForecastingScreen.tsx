// AIForecastingScreen
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useStore } from "../store/useStore";
import { fetchSolarForecast, fetchLoadForecast, fetchAIInsights, generateMockSolarForecast, generateMockLoadForecast, generateMockInsights } from "../services/aiService";

function BarChart({ data, color, label, unit }: { data: number[]; color: string; label: string; unit: string }) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const max = Math.max(...data, 0.1);
  return (
    <View>
      <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 3 }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ width: "100%", height: (v / max) * 72, backgroundColor: `${color}${v > 0 ? "CC" : "30"}`, borderRadius: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            {i % 4 === 0 && <Text style={{ color: isDark ? "#4B5563" : "#CBD5E1", fontSize: 7, marginTop: 2 }}>{i}h</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

function WeekChart({ data, color, label, unit }: { data: number[]; color: string; label: string; unit: string }) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const max = Math.max(...data, 0.1);
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 70, gap: 6 }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: color, fontSize: 9, fontWeight: "700", marginBottom: 2 }}>{v.toFixed(0)}</Text>
            <View style={{ width: "100%", height: (v / max) * 56, backgroundColor: `${color}CC`, borderRadius: 6 }} />
            <Text style={{ color: isDark ? "#4B5563" : "#CBD5E1", fontSize: 9, marginTop: 3 }}>{days[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AIForecastingScreen() {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const [solar, setSolar] = useState<any>(generateMockSolarForecast());
  const [load, setLoad] = useState<any>(generateMockLoadForecast());
  const [insights, setInsights] = useState<any[]>(generateMockInsights());
  const [tab, setTab] = useState<"solar"|"load">("solar");

  useEffect(() => {
    fetchSolarForecast().then(setSolar);
    fetchLoadForecast().then(setLoad);
    fetchAIInsights().then(setInsights);
  }, []);

  const impactColor = { HIGH:"#EF4444", MEDIUM:"#F59E0B", LOW:"#10B981" };
  const insightIcon = { SAVING:"💰", ANOMALY:"⚠️", MAINTENANCE:"🔧", OPTIMIZATION:"⚡", FORECAST:"🔮" };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(124,58,237,0.2)" }}>
        <Text style={{ color: "#7C3AED", fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>🤖 AI FORECASTING ENGINE</Text>
        <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>7-Day Energy Forecast</Text>
        <Text style={{ color: sub, fontSize: 12, lineHeight: 18 }}>ML-powered predictions using weather data, historical patterns, and real-time telemetry. Confidence: {solar?.confidence ?? 87}%</Text>
      </View>

      {/* Tab Switch */}
      <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {(["solar", "load"] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, backgroundColor: tab === t ? (t === "solar" ? "#F59E0B" : "#00D4FF") : "transparent", borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: tab === t ? "#000" : sub, fontWeight: "700", fontSize: 13 }}>
              {t === "solar" ? "☀️ Solar Gen." : "🏠 Load Demand"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Charts */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
        {tab === "solar" && solar ? (
          <>
            <BarChart data={solar.hourly} color="#F59E0B" label="24h Solar Generation Forecast (kWh)" unit="kWh" />
            <WeekChart data={solar.daily} color="#F59E0B" label="7-Day Generation Forecast (kWh)" unit="kWh" />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              {[["Peak Hour", "11:00–13:00"], ["Today Total", `${solar.daily[0]?.toFixed(1)} kWh`], ["Model", solar.modelUsed ?? "REOS-v2"]].map(([k,v]) => (
                <View key={k} style={{ flex: 1, backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 12, padding: 12, alignItems: "center" }}>
                  <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "800" }}>{v}</Text>
                  <Text style={{ color: sub, fontSize: 10, marginTop: 2 }}>{k}</Text>
                </View>
              ))}
            </View>
          </>
        ) : load ? (
          <>
            <BarChart data={load.hourly} color="#00D4FF" label="24h Load Demand Forecast (kWh)" unit="kWh" />
            <WeekChart data={load.daily} color="#00D4FF" label="7-Day Load Forecast (kWh)" unit="kWh" />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              {[["Peak Window", "18:00–21:00"], ["Today Total", `${load.daily[0]?.toFixed(1)} kWh`], ["Confidence", `${load.confidence ?? 91}%`]].map(([k,v]) => (
                <View key={k} style={{ flex: 1, backgroundColor: "rgba(0,212,255,0.1)", borderRadius: 12, padding: 12, alignItems: "center" }}>
                  <Text style={{ color: "#00D4FF", fontSize: 13, fontWeight: "800" }}>{v}</Text>
                  <Text style={{ color: sub, fontSize: 10, marginTop: 2 }}>{k}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={{ alignItems: "center", padding: 30 }}><Text style={{ color: sub }}>Loading forecast data...</Text></View>
        )}
      </View>

      {/* AI Insights */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>🤖 AI Insights & Recommendations</Text>
      {insights.map(ins => (
        <View key={ins.id} style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: `${(impactColor as any)[ins.impact] ?? "#64748B"}30`, borderLeftWidth: 4, borderLeftColor: (impactColor as any)[ins.impact] ?? "#64748B" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>{(insightIcon as any)[ins.type] ?? "💡"}</Text>
            <Text style={{ flex: 1, color: text, fontSize: 14, fontWeight: "800" }}>{ins.title}</Text>
            <View style={{ backgroundColor: `${(impactColor as any)[ins.impact] ?? "#64748B"}20`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: (impactColor as any)[ins.impact] ?? "#64748B", fontSize: 10, fontWeight: "700" }}>{ins.impact}</Text>
            </View>
          </View>
          <Text style={{ color: sub, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>{ins.description}</Text>
          {ins.savings && (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 10, padding: 10 }}>
              <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "800" }}>💰 Potential Saving: ₦{ins.savings.toLocaleString()}/month</Text>
            </View>
          )}
        </View>
      ))}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

export default AIForecastingScreen;