import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function ProducerDispatchScreen() {
  const {
    theme,
    selectedProducerPlantId,
    producerAllocations,
    producerDispatches,
    producerDispatchLogs,
    allocateEnergy,
    dispatchEnergy,
    pauseDispatch,
    resumeDispatch,
    fetchAllocations,
    fetchDispatches,
    fetchDispatchLogs
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

  // Form Fields
  const [targetType, setTargetType] = useState("FEEDER"); // FEEDER, CONSUMER, GRID
  const [targetId, setTargetId] = useState("");
  const [allocatedKw, setAllocatedKw] = useState("");
  const [priority, setPriority] = useState("1");
  const [allocationType, setAllocationType] = useState("MANUAL"); // MANUAL, AUTO, TIME

  useEffect(() => {
    if (selectedProducerPlantId) {
      Promise.all([
        fetchAllocations(selectedProducerPlantId),
        fetchDispatches(selectedProducerPlantId),
        fetchDispatchLogs(selectedProducerPlantId)
      ]).then(() => setLoading(false));
    }
  }, [selectedProducerPlantId]);

  const handleAllocate = async () => {
    if (!targetId || !allocatedKw || !selectedProducerPlantId) return;

    const payload = {
      plantId: selectedProducerPlantId,
      targetType,
      targetId,
      allocatedKw: parseFloat(allocatedKw),
      priority: parseInt(priority) || 1,
      allocationType
    };

    setLoading(true);
    try {
      await allocateEnergy(payload);
      // Automatically create a matching active dispatch
      await dispatchEnergy({
        plantId: selectedProducerPlantId,
        targetType,
        targetId,
        allocatedKw: parseFloat(allocatedKw)
      });
      // Refresh
      await fetchAllocations(selectedProducerPlantId);
      await fetchDispatches(selectedProducerPlantId);
      await fetchDispatchLogs(selectedProducerPlantId);
      setTargetId("");
      setAllocatedKw("");
    } catch (e) {
      console.error("Allocation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDispatch = async (dispatch: any) => {
    setLoading(true);
    try {
      if (dispatch.status === "ACTIVE") {
        await pauseDispatch(dispatch.id);
      } else {
        await resumeDispatch(dispatch.id);
      }
      await fetchDispatches(selectedProducerPlantId);
      await fetchDispatchLogs(selectedProducerPlantId);
    } catch (e) {
      console.error("Toggle dispatch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && producerAllocations.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Page Title */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 18, fontWeight: "900" }}>Energy Dispatch Controller</Text>
        <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
          Dispatch generated power dynamically. Restrict, schedule, and balance load targets.
        </Text>
      </View>

      {/* Allocation configuration form */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>⚙️ Configure Dispatch Target</Text>
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700", marginBottom: 6 }}>TARGET TYPE</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["FEEDER", "CONSUMER", "GRID"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTargetType(t)}
                  style={{
                    flex: 1,
                    backgroundColor: targetType === t ? accent : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                    borderWidth: 1,
                    borderColor: targetType === t ? "transparent" : border,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: targetType === t ? "#FFF" : textSecondary, fontSize: 11, fontWeight: "700" }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700", marginBottom: 6 }}>TARGET NAME OR ID</Text>
            <TextInput
              value={targetId}
              onChangeText={setTargetId}
              placeholder={targetType === "FEEDER" ? "e.g. Sharada Feeder A" : targetType === "GRID" ? "e.g. NATIONAL-GRID" : "e.g. user-consumer-1"}
              placeholderTextColor="#64748B"
              style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700", marginBottom: 6 }}>MAX CAPACITY LIMIT (kW)</Text>
              <TextInput
                value={allocatedKw}
                onChangeText={setAllocatedKw}
                keyboardType="numeric"
                placeholder="750"
                placeholderTextColor="#64748B"
                style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700", marginBottom: 6 }}>PRIORITY RATING</Text>
              <TextInput
                value={priority}
                onChangeText={setPriority}
                keyboardType="numeric"
                placeholder="1 (Highest)"
                placeholderTextColor="#64748B"
                style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }}
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleAllocate} style={{ backgroundColor: accent, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>🚀 Allocate & Dispatch Load</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Dispatches */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Active Dispatches</Text>
        <View style={{ gap: 10 }}>
          {producerDispatches.map((disp: any) => {
            const isActive = disp.status === "ACTIVE";
            return (
              <View key={disp.id} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "800" }}>{disp.targetId}</Text>
                  <Text style={{ color: textSecondary, fontSize: 10, marginTop: 2 }}>
                    Limit: {disp.allocatedKw} kW • Load: {isActive ? `${disp.dispatchedKw} kW` : "0 kW"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleDispatch(disp)}
                  style={{
                    backgroundColor: isActive ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                    borderWidth: 1,
                    borderColor: isActive ? danger : success,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: isActive ? danger : success, fontSize: 10, fontWeight: "700" }}>
                    {isActive ? "⏸️ Pause" : "▶️ Resume"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Dispatch History Audit Logs */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>📜 Dispatch Operation Logs</Text>
        <View style={{ gap: 12 }}>
          {producerDispatchLogs.slice(0, 5).map((log: any) => (
            <View key={log.id} style={{ borderLeftWidth: 2, borderLeftColor: log.action === "PAUSE" ? danger : success, paddingLeft: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>{log.details}</Text>
                <Text style={{ color: textSecondary, fontSize: 9 }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={{ color: textSecondary, fontSize: 10, marginTop: 2 }}>
                Operator: {log.operator?.firstName} {log.operator?.lastName || ""}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
