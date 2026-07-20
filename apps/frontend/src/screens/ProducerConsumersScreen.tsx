import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function ProducerConsumersScreen() {
  const {
    theme,
    selectedProducerPlantId,
    producerConnections,
    fetchConnections,
    disconnectConsumer,
    reconnectConsumer
  } = useStore() as any;

  const isDark = theme === "dark";
  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const accent = "#8B5CF6";
  const success = "#10B981";
  const danger = "#EF4444";

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProducerPlantId) {
      fetchConnections(selectedProducerPlantId).then(() => setLoading(false));
      const interval = setInterval(() => {
        fetchConnections(selectedProducerPlantId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedProducerPlantId]);

  const handleToggleConnection = async (conn: any) => {
    try {
      if (conn.connectionStatus === "CONNECTED") {
        await disconnectConsumer(conn.id);
      } else {
        await reconnectConsumer(conn.id);
      }
    } catch (e) {
      console.error("Toggle connection failed:", e);
    }
  };

  if (loading && producerConnections.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header Block */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900" }}>Multi-Consumer Management</Text>
          <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
            Monitor smart meters, load allocations, real-time consumption and connection status.
          </Text>
        </View>

        {/* Consumer list */}
        <View style={{ gap: 12 }}>
          {producerConnections.map((conn: any) => {
            const isConnected = conn.connectionStatus === "CONNECTED";
            return (
              <View key={conn.id} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View>
                    <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800" }}>
                      {conn.consumer?.firstName} {conn.consumer?.lastName}
                    </Text>
                    <Text style={{ color: textSecondary, fontSize: 10, marginTop: 1 }}>{conn.consumer?.email}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: isConnected ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 6 }}>
                    <Text style={{ color: isConnected ? success : danger, fontSize: 9, fontWeight: "700" }}>
                      {conn.connectionStatus}
                    </Text>
                  </View>
                </View>

                {/* Sub grid */}
                <View style={{ borderTopWidth: 1, borderTopColor: border, paddingVertical: 10, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  <View style={{ width: (width - 64) / 2 }}>
                    <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>METER NUMBER</Text>
                    <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>📟 {conn.smartMeterId || "N/A"}</Text>
                  </View>
                  <View style={{ width: (width - 64) / 2 }}>
                    <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>FEEDER</Text>
                    <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>🔌 Feeder A (Zone 1)</Text>
                  </View>
                  <View style={{ width: (width - 64) / 2 }}>
                    <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>ALLOCATED CAPACITY</Text>
                    <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>{conn.allocatedPowerKw} kW</Text>
                  </View>
                  <View style={{ width: (width - 64) / 2 }}>
                    <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>ACTUAL LOAD</Text>
                    <Text style={{ color: isConnected ? "#F59E0B" : textSecondary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>
                      {isConnected ? `${conn.actualPowerKw.toFixed(1)} kW` : "0.0 kW"}
                    </Text>
                  </View>
                </View>

                {/* Allocation balance bar */}
                <View style={{ borderTopWidth: 1, borderTopColor: border, paddingVertical: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700" }}>REMAINING ENERGY ALLOCATION</Text>
                    <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>{conn.remainingAllocationKwh.toFixed(1)} kWh</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${Math.min(100, (conn.remainingAllocationKwh / 5000) * 100)}%`, backgroundColor: accent, borderRadius: 3 }} />
                  </View>
                </View>

                {/* Grid controls */}
                <View style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 12, flexDirection: "row", justifyContent: "flex-end" }}>
                  <TouchableOpacity
                    onPress={() => handleToggleConnection(conn)}
                    style={{
                      backgroundColor: isConnected ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                      borderWidth: 1,
                      borderColor: isConnected ? danger : success,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 10
                    }}
                  >
                    <Text style={{ color: isConnected ? danger : success, fontSize: 11, fontWeight: "700" }}>
                      {isConnected ? "🔴 Disconnect Load" : "🟢 Connect Load"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
