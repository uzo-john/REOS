import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { useStore } from "../store/useStore";

type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
type MaintenanceType = "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY" | "INSPECTION" | "CALIBRATION" | "FIRMWARE_UPDATE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface MaintenanceRecord {
  id: string;
  title: string;
  description: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: Priority;
  deviceName: string;
  deviceType: string;
  scheduledAt: string;
  assignedTo: string;
  cost?: number;
  notes?: string;
}

const MOCK_RECORDS: MaintenanceRecord[] = [
  {
    id: "mnt-001",
    title: "Quarterly Solar Panel Cleaning",
    description: "Dust accumulation on panels reduces efficiency by up to 15%. Full array wash required.",
    type: "PREVENTIVE",
    status: "SCHEDULED",
    priority: "HIGH",
    deviceName: "Lekki Solar Plant – PV Array A",
    deviceType: "SOLAR_INVERTER",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "Emeka Tech Team",
    cost: 25000,
    notes: "Use non-corrosive cleaning solution only.",
  },
  {
    id: "mnt-002",
    title: "Battery BMS Firmware Update",
    description: "Critical firmware v4.2.1 update to fix SoC calibration drift observed in last 60 days.",
    type: "FIRMWARE_UPDATE",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    deviceName: "Lithium BMS Controller",
    deviceType: "BATTERY_BMS",
    scheduledAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    assignedTo: "Johnpaul Uzowuru",
    cost: 0,
    notes: "System will be offline for ~20 minutes.",
  },
  {
    id: "mnt-003",
    title: "Smart Meter Calibration",
    description: "Annual calibration of bidirectional smart meter per IEC 62053 standard.",
    type: "CALIBRATION",
    status: "COMPLETED",
    priority: "MEDIUM",
    deviceName: "Bidirectional Smart Net Meter",
    deviceType: "SMART_METER",
    scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "KEDCO Field Engineer",
    cost: 15000,
    notes: "Calibration passed. Accuracy within ±0.5%.",
  },
  {
    id: "mnt-004",
    title: "Inverter Arc Flash Inspection",
    description: "Check DC/AC busbars for arc flash risk, inspect fuses and contactors.",
    type: "INSPECTION",
    status: "OVERDUE",
    priority: "CRITICAL",
    deviceName: "Main Hybrid Inverter (5kW)",
    deviceType: "SOLAR_INVERTER",
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "Unassigned",
    cost: 8000,
  },
  {
    id: "mnt-005",
    title: "IoT Gateway Antenna Replacement",
    description: "External LoRaWAN antenna shows -94dBm signal. Replacement required.",
    type: "CORRECTIVE",
    status: "SCHEDULED",
    priority: "LOW",
    deviceName: "REOS Edge Gateway v1",
    deviceType: "IOT_GATEWAY",
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "Naija Solar Technicians",
    cost: 3500,
  },
];

const TYPE_ICON: Record<string, string> = {
  PREVENTIVE: "🛡️",
  CORRECTIVE: "🔧",
  EMERGENCY: "🚨",
  INSPECTION: "🔍",
  CALIBRATION: "⚖️",
  FIRMWARE_UPDATE: "💾",
};

const DEVICE_ICON: Record<string, string> = {
  SOLAR_INVERTER: "🔌",
  SMART_METER: "📟",
  BATTERY_BMS: "🔋",
  IOT_GATEWAY: "📡",
  WEATHER_STATION: "🌤️",
};

export default function MaintenanceScreen() {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const bg     = isDark ? "#050810" : "#F1F5F9";
  const card   = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text   = isDark ? "#F1F5F9" : "#0F172A";
  const sub    = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  const [records, setRecords] = useState<MaintenanceRecord[]>(MOCK_RECORDS);
  const [filter, setFilter] = useState<"ALL" | MaintenanceStatus>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDevice, setNewDevice] = useState("");

  const statusColor: Record<MaintenanceStatus, string> = {
    SCHEDULED:   "#3B82F6",
    IN_PROGRESS: "#F59E0B",
    COMPLETED:   "#10B981",
    OVERDUE:     "#EF4444",
    CANCELLED:   "#94A3B8",
  };

  const priorityColor: Record<Priority, string> = {
    LOW:      "#94A3B8",
    MEDIUM:   "#3B82F6",
    HIGH:     "#F59E0B",
    CRITICAL: "#EF4444",
  };

  const filtered = filter === "ALL" ? records : records.filter(r => r.status === filter);

  const countsByStatus = {
    SCHEDULED:   records.filter(r => r.status === "SCHEDULED").length,
    IN_PROGRESS: records.filter(r => r.status === "IN_PROGRESS").length,
    COMPLETED:   records.filter(r => r.status === "COMPLETED").length,
    OVERDUE:     records.filter(r => r.status === "OVERDUE").length,
  };

  const totalBudget = records.reduce((s, r) => s + (r.cost || 0), 0);

  const markComplete = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: "COMPLETED" } : r));
    setShowDetail(false);
  };

  const markInProgress = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: "IN_PROGRESS" } : r));
  };

  const addNewTask = () => {
    if (!newTitle.trim()) return;
    const newRecord: MaintenanceRecord = {
      id: `mnt-${Date.now()}`,
      title: newTitle.trim(),
      description: "New maintenance task — add details.",
      type: "PREVENTIVE",
      status: "SCHEDULED",
      priority: "MEDIUM",
      deviceName: newDevice.trim() || "Unspecified Device",
      deviceType: "GENERIC",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Unassigned",
    };
    setRecords(prev => [newRecord, ...prev]);
    setNewTitle("");
    setNewDevice("");
    setShowNewModal(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (Math.abs(diffDays) === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    return `In ${diffDays}d`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: accent, fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 }}>🔧 MAINTENANCE HUB</Text>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900" }}>Work Order Tracker</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 4 }}>
              {records.filter(r => r.status !== "COMPLETED").length} open tasks • ₦{totalBudget.toLocaleString()} total budget
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowNewModal(true)}
            style={{ backgroundColor: accent, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 13 }}>+ New Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Summary */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {([
          ["SCHEDULED",   countsByStatus.SCHEDULED,   "📋", "#3B82F6"],
          ["IN_PROGRESS", countsByStatus.IN_PROGRESS, "🔄", "#F59E0B"],
          ["OVERDUE",     countsByStatus.OVERDUE,     "⚠️", "#EF4444"],
          ["COMPLETED",   countsByStatus.COMPLETED,   "✅", "#10B981"],
        ] as [string, number, string, string][]).map(([label, count, icon, color]) => (
          <View key={label} style={{ flex: 1, minWidth: "45%", backgroundColor: `${color}12`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${color}25`, alignItems: "center" }}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
            <Text style={{ color, fontSize: 22, fontWeight: "900" }}>{count}</Text>
            <Text style={{ color: sub, fontSize: 9, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" }}>{label.replace("_", " ")}</Text>
          </View>
        ))}
      </View>

      {/* Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
          {(["ALL", "SCHEDULED", "IN_PROGRESS", "OVERDUE", "COMPLETED"] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                backgroundColor: filter === f ? (f === "ALL" ? accent : (statusColor as any)[f] || accent) : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderWidth: 1,
                borderColor: filter === f ? (statusColor as any)[f] || accent : border,
              }}
            >
              <Text style={{ color: filter === f ? (f === "ALL" ? "#000" : "#fff") : sub, fontWeight: "700", fontSize: 11 }}>
                {f.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Work Orders */}
      {filtered.length === 0 && (
        <View style={{ backgroundColor: card, borderRadius: 20, padding: 40, alignItems: "center", borderWidth: 1, borderColor: border }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>No Tasks Found</Text>
          <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>No maintenance tasks match the selected filter.</Text>
        </View>
      )}

      {filtered.map(rec => {
        const sc = statusColor[rec.status];
        const pc = priorityColor[rec.priority];
        const isOverdue = rec.status === "OVERDUE";
        return (
          <TouchableOpacity
            key={rec.id}
            onPress={() => { setSelectedRecord(rec); setShowDetail(true); }}
            style={{
              backgroundColor: card,
              borderRadius: 18,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderLeftWidth: 4,
              borderColor: border,
              borderLeftColor: isOverdue ? "#EF4444" : sc,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
              <View style={{ backgroundColor: `${sc}18`, borderRadius: 12, padding: 10, marginRight: 12 }}>
                <Text style={{ fontSize: 22 }}>{TYPE_ICON[rec.type] || "🔧"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 2 }}>{rec.title}</Text>
                <Text style={{ color: sub, fontSize: 11 }} numberOfLines={1}>{rec.description}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <View style={{ backgroundColor: `${sc}18`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: sc, fontSize: 10, fontWeight: "700" }}>{rec.status.replace("_", " ")}</Text>
                </View>
                <View style={{ backgroundColor: `${pc}18`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: pc, fontSize: 10, fontWeight: "700" }}>{rec.priority}</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={{ color: sub, fontSize: 11 }}>{DEVICE_ICON[rec.deviceType] || "🔌"} {rec.deviceName}</Text>
              <Text style={{ color: sub, fontSize: 11 }}>•</Text>
              <Text style={{ color: isOverdue ? "#EF4444" : sub, fontSize: 11, fontWeight: isOverdue ? "700" : "400" }}>
                🕐 {formatDate(rec.scheduledAt)}
              </Text>
              {rec.cost !== undefined && rec.cost > 0 && (
                <>
                  <Text style={{ color: sub, fontSize: 11 }}>•</Text>
                  <Text style={{ color: sub, fontSize: 11 }}>₦{rec.cost.toLocaleString()}</Text>
                </>
              )}
            </View>

            {/* Quick action buttons for non-completed */}
            {rec.status !== "COMPLETED" && rec.status !== "CANCELLED" && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {rec.status === "SCHEDULED" || rec.status === "OVERDUE" ? (
                  <TouchableOpacity
                    onPress={() => markInProgress(rec.id)}
                    style={{ flex: 1, backgroundColor: "rgba(245,158,11,0.12)", borderRadius: 10, padding: 9, alignItems: "center", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)" }}
                  >
                    <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 12 }}>▶ Start Work</Text>
                  </TouchableOpacity>
                ) : null}
                {rec.status === "IN_PROGRESS" && (
                  <TouchableOpacity
                    onPress={() => markComplete(rec.id)}
                    style={{ flex: 2, backgroundColor: "#10B981", borderRadius: 10, padding: 9, alignItems: "center" }}
                  >
                    <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>✓ Mark Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 32 }} />

      {/* Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "80%" }}>
            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <View style={{ backgroundColor: `${statusColor[selectedRecord.status]}18`, borderRadius: 14, padding: 12 }}>
                    <Text style={{ fontSize: 32 }}>{TYPE_ICON[selectedRecord.type] || "🔧"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: text, fontSize: 17, fontWeight: "900" }}>{selectedRecord.title}</Text>
                    <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>{selectedRecord.type.replace("_", " ")}</Text>
                  </View>
                </View>

                <Text style={{ color: sub, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>{selectedRecord.description}</Text>

                {[
                  ["Device",      `${DEVICE_ICON[selectedRecord.deviceType] || "🔌"} ${selectedRecord.deviceName}`],
                  ["Status",      selectedRecord.status.replace("_", " ")],
                  ["Priority",    selectedRecord.priority],
                  ["Scheduled",   new Date(selectedRecord.scheduledAt).toLocaleString()],
                  ["Assigned To", selectedRecord.assignedTo],
                  ...(selectedRecord.cost !== undefined ? [["Est. Cost",   `₦${selectedRecord.cost.toLocaleString()}`]] : []),
                ].map(([label, value]) => (
                  <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                    <Text style={{ color: sub, fontSize: 13 }}>{label}</Text>
                    <Text style={{ color: text, fontSize: 13, fontWeight: "600", maxWidth: "55%", textAlign: "right" }}>{value}</Text>
                  </View>
                ))}

                {selectedRecord.notes && (
                  <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 12, padding: 14, marginTop: 14 }}>
                    <Text style={{ color: accent, fontWeight: "700", fontSize: 12, marginBottom: 6 }}>📝 Notes</Text>
                    <Text style={{ color: sub, fontSize: 13, lineHeight: 18 }}>{selectedRecord.notes}</Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                  {selectedRecord.status !== "COMPLETED" && selectedRecord.status !== "CANCELLED" && (
                    <TouchableOpacity
                      onPress={() => markComplete(selectedRecord.id)}
                      style={{ flex: 1, backgroundColor: "#10B981", borderRadius: 14, padding: 14, alignItems: "center" }}
                    >
                      <Text style={{ color: "#000", fontWeight: "800" }}>✓ Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => { setShowDetail(false); setSelectedRecord(null); }}
                    style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 14, alignItems: "center" }}
                  >
                    <Text style={{ color: sub, fontWeight: "700" }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* New Task Modal */}
      <Modal visible={showNewModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#111827" : "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ color: text, fontSize: 18, fontWeight: "900", marginBottom: 4 }}>🔧 New Maintenance Task</Text>
            <Text style={{ color: sub, fontSize: 13, marginBottom: 20 }}>Create a new work order for the system</Text>

            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Task Title *</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Inverter efficiency check"
              placeholderTextColor={sub}
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: 12, padding: 14, color: text, fontSize: 14, marginBottom: 14, borderWidth: 1, borderColor: border }}
            />

            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Device / Asset</Text>
            <TextInput
              value={newDevice}
              onChangeText={setNewDevice}
              placeholder="e.g. Main Hybrid Inverter (5kW)"
              placeholderTextColor={sub}
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: 12, padding: 14, color: text, fontSize: 14, marginBottom: 20, borderWidth: 1, borderColor: border }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={addNewTask}
                style={{ flex: 1, backgroundColor: accent, borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#000", fontWeight: "900" }}>Create Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowNewModal(false); setNewTitle(""); setNewDevice(""); }}
                style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}