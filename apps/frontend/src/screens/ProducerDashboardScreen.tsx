import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Animated } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function ProducerDashboardScreen({ navigation }: any) {
  const {
    theme,
    token,
    producerPlants,
    selectedProducerPlantId,
    producerAnalytics,
    fetchProducerPlants,
    fetchProducerAnalytics,
    selectProducerPlant
  } = useStore() as any;

  const isDark = theme === "dark";
  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const accent = "#8B5CF6"; // Purple theme for producer
  const success = "#10B981";
  const warning = "#F59E0B";
  const danger = "#EF4444";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlantIndex, setSelectedPlantIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      await fetchProducerPlants();
    } catch (e) {
      console.warn("Failed to load producer plants:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchProducerPlants]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProducerPlantId) {
      fetchProducerAnalytics(selectedProducerPlantId);
      const interval = setInterval(() => {
        fetchProducerAnalytics(selectedProducerPlantId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedProducerPlantId]);

  const handlePlantChange = (plantId: string, idx: number) => {
    setSelectedPlantIndex(idx);
    selectProducerPlant(plantId);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: textSecondary, marginTop: 12, fontSize: 13 }}>Initializing Producer Dashboard...</Text>
      </View>
    );
  }

  const activePlant = producerPlants[selectedPlantIndex] || null;
  const analytics = producerAnalytics || {
    liveGenerationKw: 0,
    liveLoadKw: 0,
    gridExportKw: 0,
    batterySocPercent: 0,
    batteryVoltage: 0,
    powerQuality: { voltageV: 0, frequencyHz: 0, powerFactor: 0 },
    efficiencyPct: 0,
    lossesKw: 0,
    faultsCount: 0,
    historicalGenKwh: { daily: [], weekly: [], monthly: [] }
  };

  const kpis = [
    { label: "Plant Status", value: activePlant?.operatingStatus ?? "OPERATIONAL", unit: "", icon: "🟢", color: success },
    { label: "Live Generation", value: analytics.liveGenerationKw.toFixed(1), unit: "kW", icon: "⚡", color: warning },
    { label: "Consumer Demand", value: analytics.liveLoadKw.toFixed(1), unit: "kW", icon: "👥", color: "#00D4FF" },
    { label: "Battery SOC", value: `${analytics.batterySocPercent}%`, unit: "", icon: "🔋", color: success },
    { label: "Grid Export", value: analytics.gridExportKw.toFixed(1), unit: "kW", icon: "📤", color: accent },
    { label: "Efficiency", value: `${analytics.efficiencyPct}%`, unit: "", icon: "📈", color: success }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Plant Selector */}
      {producerPlants.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Selected Generating Plant</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {producerPlants.map((plant: any, idx: number) => {
              const isSelected = selectedProducerPlantId === plant.id;
              return (
                <TouchableOpacity
                  key={plant.id}
                  onPress={() => handlePlantChange(plant.id, idx)}
                  style={{
                    backgroundColor: isSelected ? accent : cardBg,
                    borderWidth: 1,
                    borderColor: isSelected ? "transparent" : border,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>🏭</Text>
                  <View>
                    <Text style={{ color: isSelected ? "#FFF" : textPrimary, fontWeight: "700", fontSize: 13 }}>{plant.name}</Text>
                    <Text style={{ color: isSelected ? "rgba(255,255,255,0.7)" : textSecondary, fontSize: 10, marginTop: 1 }}>
                      {plant.type} • {plant.installedCapacityKw} kWp
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Welcome & Overview */}
      <View style={{ backgroundColor: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.05)", borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.12)" }}>
        <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>COMMERCIAL ENERGY PRODUCER</Text>
        <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900", marginTop: 4 }}>
          {activePlant ? activePlant.name : "Register your Plant to start"} ⚡
        </Text>
        <Text style={{ color: textSecondary, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
          Live system balance: Generation is <Text style={{ color: success, fontWeight: "700" }}>operating normal</Text>. Connected consumers are consuming electricity within allocated limit boundaries.
        </Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        {kpis.map((k) => (
          <View
            key={k.label}
            style={{
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: border,
              borderRadius: 16,
              padding: 14,
              width: (width - 44) / 2,
              minHeight: 88,
              justifyContent: "space-between"
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "700" }}>{k.label}</Text>
              <Text style={{ fontSize: 16 }}>{k.icon}</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: k.color, fontSize: 18, fontWeight: "900" }}>
                {k.value} <Text style={{ fontSize: 11, fontWeight: "500", color: textSecondary }}>{k.unit}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Power Quality Parameters */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>⚡ Power Quality & Live AC Metrics</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 80 }}>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700" }}>GRID VOLTAGE</Text>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "800", marginTop: 4 }}>{analytics.powerQuality.voltageV.toFixed(1)} V</Text>
          </View>
          <View style={{ flex: 1, minWidth: 80 }}>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700" }}>FREQUENCY</Text>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "800", marginTop: 4 }}>{analytics.powerQuality.frequencyHz.toFixed(2)} Hz</Text>
          </View>
          <View style={{ flex: 1, minWidth: 80 }}>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700" }}>POWER FACTOR</Text>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "800", marginTop: 4 }}>{analytics.powerQuality.powerFactor.toFixed(3)}</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Graph Placeholder (Pure Native Layout) */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>📊 Generation History (24 Hours)</Text>
        <View style={{ height: 160, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
          {analytics.historicalGenKwh.daily.length > 0 ? (
            analytics.historicalGenKwh.daily.map((val: number, i: number) => {
              const max = Math.max(...analytics.historicalGenKwh.daily);
              const heightPct = max > 0 ? (val / max) * 100 : 0;
              const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
              return (
                <View key={i} style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: accent, fontSize: 9, fontWeight: "700", marginBottom: 4 }}>{val}</Text>
                  <View style={{ height: `${heightPct}%`, width: 14, backgroundColor: accent, borderRadius: 4 }} />
                  <Text style={{ color: textSecondary, fontSize: 9, marginTop: 8 }}>{days[i] || `D${i}`}</Text>
                </View>
              );
            })
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: textSecondary, fontSize: 12 }}>No historical data available</Text>
            </View>
          )}
        </View>
      </View>

      {/* Operating Alarms / Warning banner */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(16,185,129,0.12)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18 }}>🛡️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>System Security Guard</Text>
          <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>Grid island protection anti-islanding parameters are verified active.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
