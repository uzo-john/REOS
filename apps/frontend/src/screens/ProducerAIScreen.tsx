import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function ProducerAIScreen() {
  const {
    theme,
    selectedProducerPlantId,
    producerAiForecast,
    fetchProducerAiForecast
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
  const danger = "#EF4444";

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProducerPlantId) {
      fetchProducerAiForecast(selectedProducerPlantId).then(() => setLoading(false));
    }
  }, [selectedProducerPlantId]);

  if (loading && !producerAiForecast) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  const forecast = producerAiForecast || {
    timeLabels: [],
    generationForecastKw: [],
    demandForecastKw: [],
    batterySocForecastPercent: [],
    lossForecastKw: [],
    revenueForecast: { directConsumer: 0, gridExport: 0, unallocatedSurplus: 0 },
    recommendations: []
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900" }}>AI Forecasting & Optimization</Text>
        <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
          Predictive grid dispatch limits, weather-driven output simulations, and battery shelf optimizations.
        </Text>
      </View>

      {/* Revenue Projection Card */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>🔮 Projected Monthly AI Revenue</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 100 }}>
            <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>DIRECT CONSUMERS</Text>
            <Text style={{ color: success, fontSize: 16, fontWeight: "800", marginTop: 4 }}>₦{(forecast.revenueForecast.directConsumer / 1000000).toFixed(2)}M</Text>
          </View>
          <View style={{ flex: 1, minWidth: 100 }}>
            <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>GRID EXPORT</Text>
            <Text style={{ color: success, fontSize: 16, fontWeight: "800", marginTop: 4 }}>₦{(forecast.revenueForecast.gridExport / 1000).toFixed(0)}k</Text>
          </View>
          <View style={{ flex: 1, minWidth: 100 }}>
            <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>SURPLUS P2P</Text>
            <Text style={{ color: success, fontSize: 16, fontWeight: "800", marginTop: 4 }}>₦{(forecast.revenueForecast.unallocatedSurplus / 1000).toFixed(0)}k</Text>
          </View>
        </View>
      </View>

      {/* Visual Chart Comparison: Generation vs. Demand (24h bell curve simulation) */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 6 }}>📈 AI Generation vs. Demand Forecast</Text>
        <Text style={{ color: textSecondary, fontSize: 11, marginBottom: 16 }}>Simulated output load shapes over next 24 Hours</Text>

        <View style={{ height: 160, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 10 }}>
          {forecast.generationForecastKw.length > 0 ? (
            forecast.generationForecastKw.slice(0, 12).map((gen: number, idx: number) => {
              const dem = forecast.demandForecastKw[idx] || 0;
              const maxVal = Math.max(...forecast.generationForecastKw, ...forecast.demandForecastKw);
              
              const genHeightPct = maxVal > 0 ? (gen / maxVal) * 100 : 0;
              const demHeightPct = maxVal > 0 ? (dem / maxVal) * 100 : 0;
              
              const hrLabel = `${idx * 2}:00`;
              return (
                <View key={idx} style={{ alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                  <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end", height: "100%", paddingBottom: 6 }}>
                    {/* Gen bar */}
                    <View style={{ height: `${genHeightPct}%`, width: 8, backgroundColor: accent, borderRadius: 2 }} />
                    {/* Demand bar */}
                    <View style={{ height: `${demHeightPct}%`, width: 8, backgroundColor: "#00D4FF", borderRadius: 2 }} />
                  </View>
                  <Text style={{ color: textSecondary, fontSize: 8 }}>{hrLabel}</Text>
                </View>
              );
            })
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 12, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, backgroundColor: accent, borderRadius: 2 }} />
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700" }}>GENERATION (kW)</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, backgroundColor: "#00D4FF", borderRadius: 2 }} />
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700" }}>DEMAND (kW)</Text>
          </View>
        </View>
      </View>

      {/* AI Recommendation Engine Cards */}
      <View>
        <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Optimal Dispatch Recommendations</Text>
        <View style={{ gap: 12 }}>
          {forecast.recommendations.map((rec: any) => (
            <View key={rec.id} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: rec.priority === "HIGH" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", borderRadius: 6 }}>
                  <Text style={{ color: rec.priority === "HIGH" ? danger : warning, fontSize: 8, fontWeight: "800" }}>{rec.priority} PRIORITY</Text>
                </View>
                <Text style={{ color: success, fontSize: 12, fontWeight: "800" }}>+{rec.savingsImpact}</Text>
              </View>
              <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>{rec.title}</Text>
              <Text style={{ color: textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16 }}>{rec.description}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
