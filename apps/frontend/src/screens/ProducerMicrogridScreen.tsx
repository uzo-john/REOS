import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function ProducerMicrogridScreen() {
  const {
    theme,
    selectedProducerPlantId,
    producerAnalytics,
    producerConnections,
    fetchProducerAnalytics,
    fetchConnections
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProducerPlantId) {
      Promise.all([
        fetchProducerAnalytics(selectedProducerPlantId),
        fetchConnections(selectedProducerPlantId)
      ]).then(() => setLoading(false));

      const interval = setInterval(() => {
        fetchProducerAnalytics(selectedProducerPlantId);
        fetchConnections(selectedProducerPlantId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedProducerPlantId]);

  if (loading && !producerAnalytics) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  const analytics = producerAnalytics || {
    liveGenerationKw: 0,
    liveLoadKw: 0,
    gridExportKw: 0,
    batterySocPercent: 0,
    batteryVoltage: 0,
    powerQuality: { voltageV: 0, frequencyHz: 0, powerFactor: 0 },
    efficiencyPct: 0,
    lossesKw: 0,
    faultsCount: 0
  };

  const consumers = producerConnections || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900" }}>Microgrid Management</Text>
        <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
          Real-time energy flow path visualization, voltage drop control, and load balance nodes.
        </Text>
      </View>

      {/* Live Energy Flow Visualization Diagram (Pure Layout with animations and visual cues) */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 20, marginBottom: 16, alignItems: "center" }}>
        <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Live Energy Flow Path Diagram</Text>

        <View style={{ width: "100%", height: 180, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 10 }}>
          {/* Node 1: Plant Source */}
          <View style={{ alignItems: "center", width: 68 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 2, borderColor: accent, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
              <Text style={{ fontSize: 20 }}>🏭</Text>
            </View>
            <Text style={{ color: textPrimary, fontSize: 10, fontWeight: "800", textAlign: "center" }}>Solar Farm</Text>
            <Text style={{ color: accent, fontSize: 9, fontWeight: "700", marginTop: 2 }}>{analytics.liveGenerationKw.toFixed(1)} kW</Text>
          </View>

          {/* Connectors & Center battery */}
          <View style={{ flex: 1, height: 60, justifyContent: "center", alignItems: "center", position: "relative" }}>
            <View style={{ height: 2, width: "100%", backgroundColor: border, position: "absolute" }} />
            
            {/* Center Battery storage block */}
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: cardBg, borderWidth: 1.5, borderColor: border, alignItems: "center", justifyContent: "center", zIndex: 2 }}>
              <Text style={{ fontSize: 18 }}>🔋</Text>
              <Text style={{ color: success, fontSize: 9, fontWeight: "800", marginTop: 2 }}>{analytics.batterySocPercent}%</Text>
            </View>
          </View>

          {/* Node 2: Consumer Loads */}
          <View style={{ alignItems: "center", width: 68 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,212,255,0.12)", borderWidth: 2, borderColor: "#00D4FF", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
              <Text style={{ fontSize: 20 }}>🏠</Text>
            </View>
            <Text style={{ color: textPrimary, fontSize: 10, fontWeight: "800", textAlign: "center" }}>Local Loads</Text>
            <Text style={{ color: "#00D4FF", fontSize: 9, fontWeight: "700", marginTop: 2 }}>{analytics.liveLoadKw.toFixed(1)} kW</Text>
          </View>

          {/* Connector to grid */}
          <View style={{ flex: 1, height: 60, justifyContent: "center", alignItems: "center", position: "relative" }}>
            <View style={{ height: 2, width: "100%", backgroundColor: border, position: "absolute" }} />
          </View>

          {/* Node 3: Utility Grid */}
          <View style={{ alignItems: "center", width: 68 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(16,185,129,0.12)", borderWidth: 2, borderColor: success, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
              <Text style={{ fontSize: 20 }}>🔌</Text>
            </View>
            <Text style={{ color: textPrimary, fontSize: 10, fontWeight: "800", textAlign: "center" }}>Grid Net</Text>
            <Text style={{ color: success, fontSize: 9, fontWeight: "700", marginTop: 2 }}>{analytics.gridExportKw.toFixed(1)} kW</Text>
          </View>
        </View>

        {/* Real-time Status banner */}
        <View style={{ width: "100%", borderTopWidth: 1, borderTopColor: border, paddingTop: 14, flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: textSecondary, fontSize: 8, fontWeight: "700" }}>NETWORK LOSSES</Text>
            <Text style={{ color: warning, fontSize: 12, fontWeight: "800", marginTop: 2 }}>{analytics.lossesKw.toFixed(1)} kW (4.0%)</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: textSecondary, fontSize: 8, fontWeight: "700" }}>STATUS</Text>
            <Text style={{ color: success, fontSize: 12, fontWeight: "800", marginTop: 2 }}>BALANCED NODES</Text>
          </View>
        </View>
      </View>

      {/* Network parameters table */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>⚡ Node Voltage & Load Balancing</Text>
        
        <View style={{ gap: 12 }}>
          {/* Voltage Line 1 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>Busbar Phase A Voltage</Text>
              <Text style={{ color: textSecondary, fontSize: 9, marginTop: 1 }}>Kano Substation Bus 1</Text>
            </View>
            <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>231.2 V</Text>
          </View>

          {/* Voltage Line 2 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: border, paddingTop: 10 }}>
            <View>
              <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>Busbar Phase B Voltage</Text>
              <Text style={{ color: textSecondary, fontSize: 9, marginTop: 1 }}>Kano Substation Bus 1</Text>
            </View>
            <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>230.8 V</Text>
          </View>

          {/* Voltage Line 3 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: border, paddingTop: 10 }}>
            <View>
              <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>Busbar Phase C Voltage</Text>
              <Text style={{ color: textSecondary, fontSize: 9, marginTop: 1 }}>Kano Substation Bus 1</Text>
            </View>
            <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>230.5 V</Text>
          </View>

          {/* Current Line */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: border, paddingTop: 10 }}>
            <View>
              <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>Total Current Flow</Text>
              <Text style={{ color: textSecondary, fontSize: 9, marginTop: 1 }}>Aggregate active currents</Text>
            </View>
            <Text style={{ color: accent, fontSize: 13, fontWeight: "800" }}>1,880.4 A</Text>
          </View>
        </View>
      </View>

      {/* Connected Nodes List */}
      <View>
        <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Connected Microgrid Nodes ({consumers.length})</Text>
        <View style={{ gap: 10 }}>
          {consumers.map((c: any) => (
            <View key={c.id} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>{c.consumer?.firstName} {c.consumer?.lastName}</Text>
                <Text style={{ color: textSecondary, fontSize: 10, marginTop: 2 }}>Meter: {c.smartMeterId || "N/A"} • status: {c.connectionStatus}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#00D4FF", fontSize: 12, fontWeight: "800" }}>{c.actualPowerKw.toFixed(1)} kW</Text>
                <Text style={{ color: textSecondary, fontSize: 8, marginTop: 2 }}>{((c.actualPowerKw / analytics.liveGenerationKw) * 100).toFixed(0)}% LOAD SHARE</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
