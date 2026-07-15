import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Dimensions,
} from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

type PlantStatus = "OPERATIONAL" | "DEGRADED" | "OFFLINE" | "MAINTENANCE";

interface Plant {
  id: string;
  name: string;
  location: string;
  capacityKwp: number;
  batteryKwh: number;
  status: PlantStatus;
  todayGen: number;
  todayLoad: number;
  todayExport: number;
  pr: number;
  soc: number;        // battery state of charge %
  alarms: number;
  co2: number;
  lastUpdate: string;
  devices: number;
  inverterTemp: number;
  gridVoltage: number;
  powerFactor: number;
}

const MOCK_PLANTS: Plant[] = [
  {
    id: "p1", name: "Lekki Solar Plant", location: "Lekki, Lagos",
    capacityKwp: 50, batteryKwh: 100, status: "OPERATIONAL",
    todayGen: 245.8, todayLoad: 138.2, todayExport: 107.6,
    pr: 94, soc: 82, alarms: 0, co2: 105.7,
    lastUpdate: new Date(Date.now() - 2 * 60000).toISOString(),
    devices: 12, inverterTemp: 41.2, gridVoltage: 231.4, powerFactor: 0.98,
  },
  {
    id: "p2", name: "Victoria Island Hub", location: "VI, Lagos",
    capacityKwp: 35, batteryKwh: 60, status: "OPERATIONAL",
    todayGen: 162.3, todayLoad: 95.1, todayExport: 67.2,
    pr: 91, soc: 65, alarms: 1, co2: 69.8,
    lastUpdate: new Date(Date.now() - 5 * 60000).toISOString(),
    devices: 8, inverterTemp: 38.6, gridVoltage: 229.7, powerFactor: 0.97,
  },
  {
    id: "p3", name: "Abuja Office Array", location: "Maitama, FCT",
    capacityKwp: 20, batteryKwh: 40, status: "DEGRADED",
    todayGen: 65.4, todayLoad: 58.8, todayExport: 6.6,
    pr: 74, soc: 23, alarms: 3, co2: 28.1,
    lastUpdate: new Date(Date.now() - 18 * 60000).toISOString(),
    devices: 6, inverterTemp: 52.8, gridVoltage: 218.3, powerFactor: 0.91,
  },
  {
    id: "p4", name: "Port Harcourt Grid", location: "GRA Phase 2, PH",
    capacityKwp: 100, batteryKwh: 200, status: "OPERATIONAL",
    todayGen: 482.1, todayLoad: 274.5, todayExport: 207.6,
    pr: 96, soc: 88, alarms: 0, co2: 207.3,
    lastUpdate: new Date(Date.now() - 1 * 60000).toISOString(),
    devices: 22, inverterTemp: 39.4, gridVoltage: 233.1, powerFactor: 0.99,
  },
  {
    id: "p5", name: "Enugu North Micro-Grid", location: "GRA, Enugu",
    capacityKwp: 15, batteryKwh: 30, status: "MAINTENANCE",
    todayGen: 0, todayLoad: 0, todayExport: 0,
    pr: 0, soc: 45, alarms: 2, co2: 0,
    lastUpdate: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    devices: 5, inverterTemp: 0, gridVoltage: 0, powerFactor: 0,
  },
];

const STATUS_COLOR: Record<PlantStatus, string> = {
  OPERATIONAL: "#10B981",
  DEGRADED:    "#F59E0B",
  OFFLINE:     "#EF4444",
  MAINTENANCE: "#8B5CF6",
};

const STATUS_ICON: Record<PlantStatus, string> = {
  OPERATIONAL: "✅",
  DEGRADED:    "⚠️",
  OFFLINE:     "🔴",
  MAINTENANCE: "🔧",
};

function SoCBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${Math.max(pct, 0)}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

function PrRing({ value, color }: { value: number; color: string }) {
  // Simple text-based indicator
  const grade = value >= 90 ? "A" : value >= 80 ? "B" : value >= 70 ? "C" : "D";
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: color, alignItems: "center", justifyContent: "center", backgroundColor: `${color}12` }}>
        <Text style={{ color, fontWeight: "900", fontSize: 14 }}>{grade}</Text>
      </View>
      <Text style={{ color, fontSize: 10, fontWeight: "700", marginTop: 2 }}>{value}%</Text>
      <Text style={{ color: "#94A3B8", fontSize: 9 }}>PR</Text>
    </View>
  );
}

function timeSince(isoStr: string) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 60000;
  if (diff < 1) return "Just now";
  if (diff < 60) return `${Math.round(diff)}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}

export default function FleetScreen() {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const bg     = isDark ? "#050810" : "#F1F5F9";
  const card   = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text   = isDark ? "#F1F5F9" : "#0F172A";
  const sub    = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  const [plants, setPlants] = useState<Plant[]>(MOCK_PLANTS);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | PlantStatus>("ALL");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate live telemetry refresh
    setTimeout(() => {
      setPlants(prev => prev.map(p => p.status === "OPERATIONAL" ? {
        ...p,
        todayGen: parseFloat((p.todayGen + Math.random() * 2).toFixed(1)),
        soc: Math.min(100, p.soc + Math.round(Math.random() * 3 - 1)),
        lastUpdate: new Date().toISOString(),
      } : p));
      setRefreshing(false);
    }, 1200);
  }, []);

  // Aggregate stats
  const operational = plants.filter(p => p.status === "OPERATIONAL");
  const totalGen    = plants.reduce((s, p) => s + p.todayGen, 0);
  const totalCap    = plants.reduce((s, p) => s + p.capacityKwp, 0);
  const totalCo2    = plants.reduce((s, p) => s + p.co2, 0);
  const totalAlarms = plants.reduce((s, p) => s + p.alarms, 0);
  const totalExp    = plants.reduce((s, p) => s + p.todayExport, 0);
  const avgPr       = operational.length > 0
    ? (operational.reduce((s, p) => s + p.pr, 0) / operational.length).toFixed(0)
    : "—";

  const filtered = statusFilter === "ALL" ? plants : plants.filter(p => p.status === statusFilter);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} colors={[accent]} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
        <Text style={{ color: accent, fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 }}>🏭 FLEET DASHBOARD</Text>
        <Text style={{ color: text, fontSize: 20, fontWeight: "900" }}>Multi-Plant Overview</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
          <Text style={{ color: sub, fontSize: 12 }}>
            <Text style={{ color: "#10B981", fontWeight: "700" }}>{operational.length}</Text>/{plants.length} operational
          </Text>
          <Text style={{ color: sub, fontSize: 12 }}>
            Avg PR: <Text style={{ color: accent, fontWeight: "700" }}>{avgPr}%</Text>
          </Text>
          <Text style={{ color: sub, fontSize: 12 }}>
            Alarms: <Text style={{ color: totalAlarms > 0 ? "#EF4444" : "#10B981", fontWeight: "700" }}>{totalAlarms}</Text>
          </Text>
        </View>
        <Text style={{ color: sub, fontSize: 11, marginTop: 4 }}>Pull down to refresh live telemetry</Text>
      </View>

      {/* Fleet KPI Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {([
          ["Total Capacity",   `${totalCap} kWp`,           "⚡", accent],
          ["Today's Gen.",     `${totalGen.toFixed(0)} kWh`, "☀️", "#F59E0B"],
          ["Grid Export",      `${totalExp.toFixed(0)} kWh`, "🔌", "#10B981"],
          ["CO₂ Avoided",     `${totalCo2.toFixed(0)} kg`,  "🌿", "#7C3AED"],
          ["Active Alarms",    String(totalAlarms),          "🚨", totalAlarms > 0 ? "#EF4444" : "#10B981"],
          ["Avg Efficiency",   `${avgPr}%`,                  "📊", "#10B981"],
        ] as [string, string, string, string][]).map(([label, value, icon, color]) => (
          <View key={label} style={{ flex: 1, minWidth: "30%", backgroundColor: `${color}12`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${color}25`, alignItems: "center" }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
            <Text style={{ color, fontSize: 15, fontWeight: "900", textAlign: "center" }}>{value}</Text>
            <Text style={{ color: sub, fontSize: 9, fontWeight: "600", textAlign: "center", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
          {(["ALL", "OPERATIONAL", "DEGRADED", "OFFLINE", "MAINTENANCE"] as const).map(f => {
            const count = f === "ALL" ? plants.length : plants.filter(p => p.status === f).length;
            const color = f === "ALL" ? accent : STATUS_COLOR[f as PlantStatus];
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setStatusFilter(f)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  backgroundColor: statusFilter === f ? color : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
                  borderWidth: 1, borderColor: statusFilter === f ? color : border,
                }}
              >
                <Text style={{ color: statusFilter === f ? (f === "ALL" ? "#000" : "#fff") : sub, fontWeight: "700", fontSize: 11 }}>
                  {f.replace("_", " ")}
                </Text>
                <View style={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 8, minWidth: 18, paddingHorizontal: 4, alignItems: "center" }}>
                  <Text style={{ color: statusFilter === f ? "#fff" : sub, fontSize: 9, fontWeight: "800" }}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Plant Cards */}
      {filtered.map(plant => {
        const sc = STATUS_COLOR[plant.status];
        const socColor = plant.soc >= 60 ? "#10B981" : plant.soc >= 30 ? "#F59E0B" : "#EF4444";
        return (
          <TouchableOpacity
            key={plant.id}
            onPress={() => { setSelectedPlant(plant); setShowDetail(true); }}
            style={{
              backgroundColor: card,
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: plant.status !== "OPERATIONAL" ? `${sc}40` : border,
            }}
          >
            {/* Plant Header */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
              <View style={{ backgroundColor: `${sc}15`, borderRadius: 14, padding: 12, marginRight: 12 }}>
                <Text style={{ fontSize: 26 }}>🏭</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                  <Text style={{ flex: 1, color: text, fontSize: 15, fontWeight: "800" }}>{plant.name}</Text>
                  <View style={{ backgroundColor: `${sc}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: sc, fontSize: 11, fontWeight: "700" }}>
                      {STATUS_ICON[plant.status]} {plant.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: sub, fontSize: 12 }}>📍 {plant.location}</Text>
                <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>
                  {plant.capacityKwp} kWp • {plant.batteryKwh} kWh • {plant.devices} devices
                </Text>
              </View>
            </View>

            {/* Generation Metrics */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {([
                ["Today", `${plant.todayGen} kWh`, "#F59E0B"],
                ["Consumed", `${plant.todayLoad} kWh`, accent],
                ["Exported", `${plant.todayExport} kWh`, "#10B981"],
                ["PR",       plant.status === "MAINTENANCE" ? "N/A" : `${plant.pr}%`, sc],
              ] as [string, string, string][]).map(([label, value, color]) => (
                <View key={label} style={{ flex: 1, backgroundColor: `${color}10`, borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ color, fontSize: 12, fontWeight: "800" }}>{value}</Text>
                  <Text style={{ color: sub, fontSize: 9, fontWeight: "600", marginTop: 2 }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Battery SoC */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                <Text style={{ color: sub, fontSize: 11, fontWeight: "600" }}>🔋 Battery SoC</Text>
                <Text style={{ color: socColor, fontSize: 11, fontWeight: "700" }}>{plant.soc}%</Text>
              </View>
              <SoCBar pct={plant.soc} color={socColor} />
            </View>

            {/* Footer */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: sub, fontSize: 10 }}>
                Updated {timeSince(plant.lastUpdate)}
              </Text>
              {plant.alarms > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10 }}>🚨</Text>
                  <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "700" }}>{plant.alarms} alarm{plant.alarms > 1 ? "s" : ""}</Text>
                </View>
              )}
              <Text style={{ color: sub, fontSize: 10 }}>Tap for details →</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {filtered.length === 0 && (
        <View style={{ backgroundColor: card, borderRadius: 20, padding: 40, alignItems: "center", borderWidth: 1, borderColor: border }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🏭</Text>
          <Text style={{ color: text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>No Plants Found</Text>
          <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>No plants match the selected status filter.</Text>
        </View>
      )}

      <View style={{ height: 32 }} />

      {/* Plant Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "85%" }}>
            {selectedPlant && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <View style={{ backgroundColor: `${STATUS_COLOR[selectedPlant.status]}15`, borderRadius: 16, padding: 14 }}>
                    <Text style={{ fontSize: 30 }}>🏭</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: text, fontSize: 17, fontWeight: "900" }}>{selectedPlant.name}</Text>
                    <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>📍 {selectedPlant.location}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <View style={{ backgroundColor: `${STATUS_COLOR[selectedPlant.status]}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: STATUS_COLOR[selectedPlant.status], fontSize: 10, fontWeight: "700" }}>
                          {STATUS_ICON[selectedPlant.status]} {selectedPlant.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* System Specs */}
                <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>System Specifications</Text>
                <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  {[
                    ["PV Capacity",    `${selectedPlant.capacityKwp} kWp`],
                    ["Battery Size",   `${selectedPlant.batteryKwh} kWh`],
                    ["Total Devices",  String(selectedPlant.devices)],
                    ["Grid Voltage",   selectedPlant.gridVoltage > 0 ? `${selectedPlant.gridVoltage} V` : "Offline"],
                    ["Inverter Temp",  selectedPlant.inverterTemp > 0 ? `${selectedPlant.inverterTemp}°C` : "Offline"],
                    ["Power Factor",   selectedPlant.powerFactor > 0 ? String(selectedPlant.powerFactor) : "Offline"],
                    ["Last Update",    timeSince(selectedPlant.lastUpdate)],
                  ].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
                      <Text style={{ color: sub, fontSize: 12 }}>{label}</Text>
                      <Text style={{ color: text, fontSize: 12, fontWeight: "600" }}>{value}</Text>
                    </View>
                  ))}
                </View>

                {/* Today's Performance */}
                <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Today's Performance</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {([
                    ["Generation",  `${selectedPlant.todayGen} kWh`, "#F59E0B"],
                    ["Consumed",    `${selectedPlant.todayLoad} kWh`, accent],
                    ["Grid Export", `${selectedPlant.todayExport} kWh`, "#10B981"],
                    ["Perf. Ratio", selectedPlant.status === "MAINTENANCE" ? "N/A" : `${selectedPlant.pr}%`, STATUS_COLOR[selectedPlant.status]],
                    ["CO₂ Saved",  `${selectedPlant.co2} kg`, "#7C3AED"],
                    ["Battery SoC", `${selectedPlant.soc}%`, selectedPlant.soc >= 60 ? "#10B981" : selectedPlant.soc >= 30 ? "#F59E0B" : "#EF4444"],
                  ] as [string, string, string][]).map(([label, value, color]) => (
                    <View key={label} style={{ flex: 1, minWidth: "30%", backgroundColor: `${color}12`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${color}25`, alignItems: "center" }}>
                      <Text style={{ color, fontSize: 16, fontWeight: "900", textAlign: "center" }}>{value}</Text>
                      <Text style={{ color: sub, fontSize: 9, fontWeight: "600", marginTop: 3, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
                    </View>
                  ))}
                </View>

                {selectedPlant.alarms > 0 && (
                  <View style={{ backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
                    <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>🚨 {selectedPlant.alarms} Active Alarm{selectedPlant.alarms > 1 ? "s" : ""}</Text>
                    <Text style={{ color: sub, fontSize: 12, marginTop: 6 }}>Open the Alarm Center to review and acknowledge all active alerts for this plant.</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => { setShowDetail(false); setSelectedPlant(null); }}
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 14, alignItems: "center" }}
                >
                  <Text style={{ color: sub, fontWeight: "700" }}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}