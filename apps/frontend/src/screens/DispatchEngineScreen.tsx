import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, Switch, Platform } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

export default function DispatchEngineScreen() {
  const {
    theme,
    selectedProducerPlantId,
    userRole,
    dermsOverview,
    dermsRules,
    dermsCurtailments,
    dermsConstraints,
    dermsSafetyLogs,
    dermsControlLogs,
    fetchDermsOverview,
    fetchDermsRules,
    setDermsRules,
    triggerDermsOverride,
    fetchDermsCurtailments,
    fetchDermsConstraints,
    fetchDermsSafetyLogs,
    fetchDermsControlLogs,
    fetchProducerPlants,
    producerPlants,
  } = useStore() as any;

  const isDark = theme === "dark";
  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const accent = "#8B5CF6"; // Purple DERMS theme
  const success = "#10B981";
  const warning = "#F59E0B";
  const danger = "#EF4444";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PLANT_OP"); // PLANT_OP, UTILITY, MICROGRID, ADMIN
  
  // Rule form states
  const [maxExportPower, setMaxExportPower] = useState("500");
  const [batteryMinSoc, setBatteryMinSoc] = useState("20");
  const [batteryReserveSoc, setBatteryReserveSoc] = useState("50");
  const [gridExportAllowed, setGridExportAllowed] = useState(true);
  const [gridImportAllowed, setGridImportAllowed] = useState(true);
  const [priorities, setPriorities] = useState(["CRITICAL", "CONSUMERS", "BATTERY", "GRID", "CURTAIL"]);

  // Override command states
  const [overridePower, setOverridePower] = useState("");
  const [targetDevice, setTargetDevice] = useState("INVERTER_01");
  const [safetyBypassChecked, setSafetyBypassChecked] = useState(false);

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || activeTab === "ADMIN";

  const loadData = useCallback(async () => {
    let plantId = selectedProducerPlantId;
    if (!plantId) {
      try {
        await fetchProducerPlants();
        const state = useStore.getState() as any;
        if (state.selectedProducerPlantId) {
          plantId = state.selectedProducerPlantId;
        } else if (state.producerPlants && state.producerPlants.length > 0) {
          plantId = state.producerPlants[0].id;
        }
      } catch (e) {
        console.warn("Failed to fetch producer plants", e);
      }
    }

    if (plantId) {
      try {
        await Promise.all([
          fetchDermsOverview(plantId),
          fetchDermsRules(plantId),
          fetchDermsCurtailments(plantId),
          fetchDermsConstraints(plantId),
          fetchDermsSafetyLogs(plantId),
          fetchDermsControlLogs(plantId)
        ]);
      } catch (e) {
        console.warn("Failed to fetch DERMS data", e);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [selectedProducerPlantId, fetchProducerPlants, fetchDermsOverview, fetchDermsRules, fetchDermsCurtailments, fetchDermsConstraints, fetchDermsSafetyLogs, fetchDermsControlLogs]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      const plantId = selectedProducerPlantId || (producerPlants && producerPlants[0]?.id);
      if (plantId) {
        fetchDermsOverview(plantId);
        fetchDermsSafetyLogs(plantId);
        fetchDermsControlLogs(plantId);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedProducerPlantId, producerPlants]);

  // Load configuration variables from state rules
  useEffect(() => {
    if (dermsRules) {
      setMaxExportPower(String(dermsRules.maxExportPowerKw ?? 500));
      setBatteryMinSoc(String(dermsRules.batteryMinSoc ?? 20));
      setBatteryReserveSoc(String(dermsRules.batteryReserveSoc ?? 50));
      setGridExportAllowed(dermsRules.gridExportAllowed !== false);
      setGridImportAllowed(dermsRules.gridImportAllowed !== false);
      if (dermsRules.priorityOrder) {
        setPriorities(Array.isArray(dermsRules.priorityOrder) ? dermsRules.priorityOrder : JSON.parse(dermsRules.priorityOrder));
      }
    }
  }, [dermsRules]);

  const handleSaveRules = async () => {
    if (!selectedProducerPlantId) return;
    const payload = {
      plantId: selectedProducerPlantId,
      maxExportPowerKw: parseFloat(maxExportPower),
      maxDailyExportKwh: 5000,
      batteryMinSoc: parseFloat(batteryMinSoc),
      batteryReserveSoc: parseFloat(batteryReserveSoc),
      gridExportAllowed,
      gridImportAllowed,
      priorityOrder: priorities
    };
    setLoading(true);
    try {
      await setDermsRules(payload);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOverride = async (type: string, details: any) => {
    if (!selectedProducerPlantId) return;
    const payload = {
      plantId: selectedProducerPlantId,
      commandType: type,
      targetDevice,
      parameters: typeof details === 'string' ? details : JSON.stringify(details)
    };

    try {
      await triggerDermsOverride(payload);
      await loadData();
      setOverridePower("");
    } catch (e: any) {
      alert(e.message || "Command failed verification interlocks.");
    }
  };

  const handlePriorityMove = (index: number, direction: 'UP' | 'DOWN') => {
    const list = [...priorities];
    if (direction === 'UP' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'DOWN' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setPriorities(list);
  };

  if (loading && !dermsOverview) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: textSecondary, marginTop: 12, fontSize: 13 }}>Connecting to DERMS Dispatch Core...</Text>
      </View>
    );
  }

  const overview = dermsOverview || {
    liveGenerationKw: 0,
    liveLoadKw: 0,
    batterySocPercent: 0,
    batteryKw: 0,
    gridKw: 0,
    curtailedKw: 0,
    curtailmentStatus: "INACTIVE"
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* PERSPECTIVE SELECTOR TABS */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Operational Perspective Selector</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            { id: "PLANT_OP", name: "Plant Operator", icon: "🏭" },
            { id: "UTILITY", name: "Utility / Grid Co", icon: "🔌" },
            { id: "MICROGRID", name: "Microgrid Operator", icon: "👥" },
            { id: "ADMIN", name: "System Administrator", icon: "🏛️" }
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: isSel ? accent : cardBg,
                  borderWidth: 1,
                  borderColor: isSel ? "transparent" : border,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center"
                }}
              >
                <Text style={{ marginRight: 6, fontSize: 13 }}>{tab.icon}</Text>
                <Text style={{ color: isSel ? "#FFF" : textPrimary, fontWeight: "700", fontSize: 12 }}>{tab.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Perspective Info Header */}
      <View style={{ backgroundColor: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.05)", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.12)" }}>
        <Text style={{ color: accent, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
          {activeTab === "PLANT_OP" && "GEN PLANT MONITOR"}
          {activeTab === "UTILITY" && "UTILITY EXPORT & COMPLIANCE GATEWAY"}
          {activeTab === "MICROGRID" && "MICROGRID STABILIZER CONTROLLER"}
          {activeTab === "ADMIN" && "ROOT DERMS ADMINISTRATOR AUTHORITY"}
        </Text>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginTop: 4 }}>
          {activeTab === "PLANT_OP" && "Evaluating active energy yields, storage capacities, and local demands."}
          {activeTab === "UTILITY" && "Utility export compliance rules and dynamic export caps are active."}
          {activeTab === "MICROGRID" && "Isolating feeders, prioritizing consumer loads, and allocating capacity."}
          {activeTab === "ADMIN" && "Full administrative override verified. Safety limits bypass mode active."}
        </Text>
      </View>

      {/* Live Telemetry Node Indicators */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Solar Array", val: overview.liveGenerationKw.toFixed(1) + " kW", sub: "Yield", color: warning },
          { label: "Battery Bank", val: overview.batterySocPercent + "%", sub: overview.batteryKw > 0 ? "Charging" : "Discharging", color: success },
          { label: "Consumer Load", val: overview.liveLoadKw.toFixed(1) + " kW", sub: "Load", color: "#00D4FF" },
          { label: "Grid Power Injection", val: Math.abs(overview.gridKw).toFixed(1) + " kW", sub: overview.gridKw > 0 ? "Exporting" : "Importing", color: accent },
          { label: "Curtailment Status", val: overview.curtailedKw > 1.0 ? `${overview.curtailedKw.toFixed(1)} kW` : "INACTIVE", sub: "Inverter Limit", color: danger }
        ].map((t, idx) => (
          <View key={idx} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 12, flex: 1, minWidth: 100 }}>
            <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>{t.label}</Text>
            <Text style={{ color: t.color, fontSize: 16, fontWeight: "900", marginTop: 6 }}>{t.val}</Text>
            <Text style={{ color: textSecondary, fontSize: 8, marginTop: 2 }}>{t.sub}</Text>
          </View>
        ))}
      </View>

      {/* GRID EXPORT & COMPLIANCE RULES CONFIGURATOR */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>⚙️ Configuration Parameters & Safety Rule Engine</Text>

        <View style={{ gap: 12 }}>
          {/* Max Export Power */}
          <View>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>MAX GRID EXPORT CAP (kW)</Text>
            <TextInput
              value={maxExportPower}
              onChangeText={setMaxExportPower}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }}
            />
          </View>

          {/* Min SOC and Reserve SOC */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>BATTERY MIN SOC (%)</Text>
              <TextInput
                value={batteryMinSoc}
                onChangeText={setBatteryMinSoc}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>BATTERY RESERVE SOC (%)</Text>
              <TextInput
                value={batteryReserveSoc}
                onChangeText={setBatteryReserveSoc}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }}
              />
            </View>
          </View>

          {/* Grid Swtiches */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: border, paddingTop: 12 }}>
            <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>Export Power to National Grid</Text>
            <Switch value={gridExportAllowed} onValueChange={setGridExportAllowed} thumbColor={gridExportAllowed ? success : border} />
          </View>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: border, paddingTop: 12 }}>
            <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700" }}>Import Power from Utility Grid</Text>
            <Switch value={gridImportAllowed} onValueChange={setGridImportAllowed} thumbColor={gridImportAllowed ? success : border} />
          </View>

          {/* DRAG-AND-DROP SIMULATED PRIORITY ORDER */}
          <View style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 12 }}>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 8 }}>ENERGY ALLOCATION PRIORITIES</Text>
            <View style={{ gap: 6 }}>
              {priorities.map((item, idx) => (
                <View key={item} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderWidth: 1, borderColor: border, borderRadius: 8, padding: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: textPrimary, fontSize: 11, fontWeight: "700" }}>
                    {idx + 1}. {item === 'CRITICAL' ? 'Critical Load Priorities' : item === 'CONSUMERS' ? 'General Consumers' : item === 'BATTERY' ? 'Battery Bank Charge' : item === 'GRID' ? 'National Grid Export' : 'Inverter Output Curtailment'}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <TouchableOpacity onPress={() => handlePriorityMove(idx, 'UP')} style={{ paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: border, borderRadius: 4 }}>
                      <Text style={{ color: textSecondary, fontSize: 9 }}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handlePriorityMove(idx, 'DOWN')} style={{ paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: border, borderRadius: 4 }}>
                      <Text style={{ color: textSecondary, fontSize: 9 }}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity onPress={handleSaveRules} style={{ backgroundColor: accent, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>💾 Save & Apply Rule Matrix</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* EMERGENCY MANUAL OVERRIDES CONTROLLERS */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 6 }}>🚨 DERMS Emergency Override Panel</Text>
        <Text style={{ color: textSecondary, fontSize: 11, marginBottom: 14 }}>Manually command grid limits or isolate inverters.</Text>

        <View style={{ gap: 10 }}>
          {/* Target device selector */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
            {["INVERTER_01", "BMS_BANK_01", "GRID_BAY_A"].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setTargetDevice(d)}
                style={{
                  flex: 1,
                  backgroundColor: targetDevice === d ? accent : "transparent",
                  borderWidth: 1,
                  borderColor: targetDevice === d ? "transparent" : border,
                  paddingVertical: 8,
                  borderRadius: 8,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: targetDevice === d ? "#FFF" : textSecondary, fontSize: 9, fontWeight: "700" }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Admin safety bypass toggle */}
          {isAdmin && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(239,68,68,0.06)", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.12)" }}>
              <Text style={{ color: danger, fontSize: 11, fontWeight: "700" }}>🚨 ADMIN BYPASS: Ignore Safety Interlocks</Text>
              <Switch value={safetyBypassChecked} onValueChange={setSafetyBypassChecked} thumbColor={safetyBypassChecked ? danger : border} />
            </View>
          )}

          {/* 3 Buttons */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleSendOverride("CURTAIL_INVERTER", { curtailKw: 250 })}
              style={{ flex: 1, backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: warning, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: warning, fontSize: 11, fontWeight: "700" }}>⚡ Force Curtail</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSendOverride("SET_BATTERY_CHARGE", { discharge: true, targetSoc: 15 })}
              style={{ flex: 1, backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 1, borderColor: accent, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: accent, fontSize: 11, fontWeight: "700" }}>🔋 Force Discharge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSendOverride("TRIGGER_SHUTDOWN", {})}
              style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: danger, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: danger, fontSize: 11, fontWeight: "700" }}>🛑 Plant E-Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* SAFETY INTERLOCK EVENT AUDIT LOGS */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>🛡️ Safety Interlock Warnings & Blocks</Text>
        <ScrollView style={{ maxHeight: 150, backgroundColor: isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.02)", borderRadius: 10, padding: 10 }}>
          {dermsSafetyLogs.length > 0 ? (
            dermsSafetyLogs.map((log: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 8, borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: danger, fontSize: 9, fontWeight: "800" }}>{log.category || "SAFETY"}</Text>
                  <Text style={{ color: textSecondary, fontSize: 8 }}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={{ color: textPrimary, fontSize: 11, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.message}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: textSecondary, fontSize: 11, textAlign: "center", paddingVertical: 12 }}>No safety log notifications</Text>
          )}
        </ScrollView>
      </View>

      {/* CONTROL ACTIONS COMMAND HISTORY */}
      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 16 }}>
        <Text style={{ color: textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>📜 Control Commands Audit Logs</Text>
        <View style={{ gap: 10 }}>
          {dermsControlLogs.slice(0, 5).map((cmd: any) => (
            <View key={cmd.id} style={{ borderLeftWidth: 2, borderLeftColor: cmd.status === "EXECUTED" ? success : danger, paddingLeft: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: textPrimary, fontSize: 11, fontWeight: "700" }}>{cmd.commandType} on {cmd.targetDevice}</Text>
                <Text style={{ color: cmd.status === "EXECUTED" ? success : danger, fontSize: 9, fontWeight: "850" }}>{cmd.status}</Text>
              </View>
              {cmd.failureReason && <Text style={{ color: danger, fontSize: 10, marginTop: 2 }}>Reason: {cmd.failureReason}</Text>}
              <Text style={{ color: textSecondary, fontSize: 9, marginTop: 2 }}>{new Date(cmd.timestamp).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
