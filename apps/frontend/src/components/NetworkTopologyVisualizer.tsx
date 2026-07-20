import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useStore } from "../store/useStore";

export default function NetworkTopologyVisualizer({ plantId }: { plantId?: string }) {
  const { theme, networkTopology, fetchNetworkTopology } = useStore();

  const isDark = theme === "dark";
  const bg = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const success = "#10B981";
  const warning = "#F59E0B";

  const targetPlantId = plantId || "plant-1";

  useEffect(() => {
    fetchNetworkTopology(targetPlantId);
  }, [targetPlantId]);

  if (!networkTopology) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={accent} />
        <Text style={{ color: sub, marginTop: 8, fontSize: 12 }}>Loading Energy Network Topology...</Text>
      </View>
    );
  }

  const { plantName, plantCapacityKw, producerMeters, consumers } = networkTopology;

  return (
    <View style={{ backgroundColor: bg, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
      {/* Topology Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 24 }}>🕸️</Text>
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800" }}>Energy Network Topology</Text>
            <Text style={{ color: sub, fontSize: 11 }}>Visual binding of Plant → Producer Meter → Consumer Meters</Text>
          </View>
        </View>
        <View style={{ backgroundColor: `${success}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: success, fontSize: 11, fontWeight: "800" }}>● LIVE GRAPH</Text>
        </View>
      </View>

      {/* NODE LEVEL 1: PLANT ROOT NODE */}
      <View style={{ backgroundColor: `${accent}15`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${accent}40`, alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 28, marginBottom: 4 }}>🏭</Text>
        <Text style={{ color: text, fontSize: 15, fontWeight: "900" }}>{plantName}</Text>
        <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>Total Capacity: {plantCapacityKw} kW</Text>
      </View>

      {/* GRAPH VECTOR CONNECTOR DOWN */}
      <View style={{ alignItems: "center", marginVertical: 2 }}>
        <Text style={{ color: accent, fontSize: 16, fontWeight: "900" }}>│</Text>
        <Text style={{ color: accent, fontSize: 16, fontWeight: "900" }}>▼</Text>
      </View>

      {/* NODE LEVEL 2: PRODUCER SMART METER */}
      <View style={{ marginBottom: 10 }}>
        {producerMeters.map((pm: any) => (
          <View key={pm.id} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <View>
                <Text style={{ color: text, fontSize: 13, fontWeight: "800" }}>{pm.name}</Text>
                <Text style={{ color: sub, fontSize: 11 }}>Meter #: {pm.meterNumber} • SN: {pm.serialNumber}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: `${success}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: success, fontSize: 10, fontWeight: "700" }}>PRODUCER METER</Text>
            </View>
          </View>
        ))}
      </View>

      {/* GRAPH VECTOR CONNECTOR DOWN */}
      <View style={{ alignItems: "center", marginVertical: 2 }}>
        <Text style={{ color: accent, fontSize: 16, fontWeight: "900" }}>├───┬───┤</Text>
        <Text style={{ color: accent, fontSize: 16, fontWeight: "900" }}>▼   ▼   ▼</Text>
      </View>

      {/* NODE LEVEL 3: CONSUMER METERS BRANCH */}
      <Text style={{ color: sub, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>
        Bound Consumer Meters ({consumers.length})
      </Text>

      {consumers.length === 0 ? (
        <Text style={{ color: sub, fontSize: 12, fontStyle: "italic" }}>No consumers connected to this plant yet.</Text>
      ) : (
        consumers.map((c: any) => {
          const isConnected = c.connectionStatus === "CONNECTED";
          const statusColor = isConnected ? success : c.connectionStatus === "PENDING" ? warning : "#EF4444";

          return (
            <View key={c.connectionId} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: `${statusColor}30` }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: text, fontSize: 13, fontWeight: "800" }}>👤 {c.consumerName}</Text>
                <View style={{ backgroundColor: `${statusColor}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: statusColor, fontSize: 10, fontWeight: "800" }}>● {c.connectionStatus}</Text>
                </View>
              </View>
              <Text style={{ color: sub, fontSize: 11, marginBottom: 4 }}>
                Meter: {c.meterName} ({c.meterSerial})
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: accent, fontSize: 11, fontWeight: "700" }}>⚡ Allocation: {c.allocatedPowerKw} kW</Text>
                <Text style={{ color: sub, fontSize: 10 }}>Signal: {c.signalStrength}% {c.isVerified ? "✓ Verified" : ""}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
