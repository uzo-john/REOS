import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { useStore } from "../store/useStore";
import NetworkTopologyVisualizer from "../components/NetworkTopologyVisualizer";

const DEVICE_TYPES = ["INVERTER", "SMART_METER", "BMS", "EDGE_GATEWAY", "WEATHER_STATION", "EV_CHARGER", "ENERGY_SENSOR"];
const PROTOCOLS = ["MQTT", "MODBUS_TCP", "MODBUS_RTU", "HTTP", "ZIGBEE", "WIFI", "ETHERNET"];
const DEVICE_ICONS: Record<string, string> = {
  INVERTER: "🔌", SMART_METER: "⚡", BMS: "🔋", EDGE_GATEWAY: "📡", WEATHER_STATION: "🌤️",
  EV_CHARGER: "🚗", ENERGY_SENSOR: "📊", NEIGHBOUR_METER: "🏘️", CHARGE_CONTROLLER: "☀️",
};

function DeviceCard({ device, onRemove, onVerify, onSelectHealth }: { device: any; onRemove: (id: string) => void; onVerify: (id: string) => void; onSelectHealth: (device: any) => void }) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const statusColor = { ONLINE: "#10B981", OFFLINE: "#EF4444", MAINTENANCE: "#F59E0B", FAULT: "#EF4444" }[device.status as string] ?? "#64748B";
  const verifColor = device.verificationStatus === "VERIFIED" ? "#10B981" : device.verificationStatus === "REJECTED" ? "#EF4444" : "#F59E0B";
  const icon = DEVICE_ICONS[device.type] ?? "📱";
  const sig = device.communicationQuality ?? 95;

  return (
    <View style={{ backgroundColor: isDark ? "rgba(17,24,39,0.95)" : "#FFF", borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: `${statusColor}18`, alignItems: "center", justifyContent: "center", marginRight: 14, borderWidth: 1, borderColor: `${statusColor}30` }}>
          <Text style={{ fontSize: 26 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
            <Text style={{ flex: 1, color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 15, fontWeight: "800" }}>{device.name}</Text>
            <View style={{ backgroundColor: `${statusColor}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>● {device.status}</Text>
            </View>
            <View style={{ backgroundColor: `${verifColor}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: verifColor, fontSize: 10, fontWeight: "800" }}>✓ {device.verificationStatus || "VERIFIED"}</Text>
            </View>
          </View>
          <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 12, marginBottom: 2 }}>{device.type?.replace(/_/g, " ")} • {device.protocol ?? "MQTT"}</Text>
          {device.firmwareVersion && <Text style={{ color: isDark ? "#4B5563" : "#CBD5E1", fontSize: 11 }}>FW: {device.firmwareVersion} • ID: {device.id?.slice(0, 8)}...</Text>}
        </View>
      </View>

      {/* Signal & Actions */}
      <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11 }}>Signal</Text>
        <View style={{ flex: 1, height: 4, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden", minWidth: 60 }}>
          <View style={{ height: "100%", width: `${sig}%`, backgroundColor: sig > 75 ? "#10B981" : sig > 40 ? "#F59E0B" : "#EF4444", borderRadius: 2 }} />
        </View>
        <Text style={{ color: sig > 75 ? "#10B981" : sig > 40 ? "#F59E0B" : "#EF4444", fontSize: 11, fontWeight: "700" }}>{sig}%</Text>

        <TouchableOpacity onPress={() => onSelectHealth(device)} style={{ backgroundColor: "rgba(0,212,255,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "#00D4FF", fontSize: 11, fontWeight: "700" }}>Health</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onVerify(device.id)} style={{ backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onRemove(device.id)} style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "700" }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DeviceManagementScreen({ navigation }: { navigation?: any }) {
  const {
    devices,
    theme,
    fetchIotData,
    registerDevice,
    removeDevice,
    verifyDevice,
    connectionRequests,
    fetchProducerConnectionRequests,
    processConnectionApproval,
    fetchDeviceHealth,
    deviceHealthDiagnostics,
  } = useStore();

  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const success = "#10B981";
  const warning = "#F59E0B";
  const danger = "#EF4444";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";

  const [activeTab, setActiveTab] = useState<"DEVICES" | "REQUESTS" | "TOPOLOGY">("DEVICES");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedHealthDevice, setSelectedHealthDevice] = useState<any>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState(DEVICE_TYPES[0]);
  const [protocol, setProtocol] = useState(PROTOCOLS[0]);
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchIotData();
    fetchProducerConnectionRequests();
  }, []);

  const onlineCount = devices.filter((d: any) => d.status === "ONLINE").length;
  const verifiedCount = devices.filter((d: any) => d.verificationStatus === "VERIFIED" || !d.verificationStatus).length;
  const pendingRequestsCount = connectionRequests.filter((r: any) => r.connectionStatus === "PENDING").length;

  const filteredDevices = filter === "ALL" ? devices : devices.filter((d: any) => d.status === filter || d.type === filter);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    await registerDevice({ name: name.trim(), type, protocol, manufacturer, model, installationLocation: location });
    setAdding(false);
    setShowAdd(false);
    setName(""); setManufacturer(""); setModel(""); setLocation("");
  };

  const handleRemove = async (id: string) => { await removeDevice(id); };
  const handleVerify = async (id: string) => { await verifyDevice(id); };

  const handleSelectHealth = async (dev: any) => {
    setSelectedHealthDevice(dev);
    await fetchDeviceHealth(dev.id);
  };

  const handleApprovalAction = async (connectionId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'DISCONNECT') => {
    await processConnectionApproval({ connectionId, action });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* 7-Step Onboarding Stepper Header */}
      <View style={{ backgroundColor: `${accent}12`, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: `${accent}30` }}>
        <Text style={{ color: text, fontSize: 13, fontWeight: "900", marginBottom: 8 }}>
          ⚡ Guided Onboarding Flow Status
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            "1. Register Device",
            "2. Verify Device",
            "3. Test Connection",
            "4. Assign Device",
            "5. Connect Producer",
            "6. Approval",
            "7. Monitoring Active",
          ].map((st, idx) => (
            <View key={st} style={{ backgroundColor: idx < 4 ? `${success}25` : `${accent}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: idx < 4 ? success : accent }}>
              <Text style={{ color: idx < 4 ? success : accent, fontSize: 10, fontWeight: "700" }}>{st}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Devices", value: devices.length, icon: "📱", color: "#00D4FF" },
          { label: "Verified", value: verifiedCount, icon: "🟢", color: "#10B981" },
          { label: "Pending Requests", value: pendingRequestsCount, icon: "🔔", color: "#F59E0B" },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: `${s.color}12`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${s.color}30`, alignItems: "center" }}>
            <Text style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</Text>
            <Text style={{ color: s.color, fontSize: 20, fontWeight: "900" }}>{s.value}</Text>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "600", textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab Switcher */}
      <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E2E8F0", borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {[
          { id: "DEVICES", title: "Device Registry" },
          { id: "REQUESTS", title: `Requests (${pendingRequestsCount})` },
          { id: "TOPOLOGY", title: "Network Topology" },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id as any)}
            style={{
              flex: 1,
              backgroundColor: activeTab === t.id ? accent : "transparent",
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: activeTab === t.id ? "#000" : text, fontWeight: "800", fontSize: 12 }}>{t.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB: DEVICE REGISTRY */}
      {activeTab === "DEVICES" && (
        <View>
          {/* Add Device Button */}
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ backgroundColor: accent, borderRadius: 16, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 14, gap: 8 }}>
            <Text style={{ fontSize: 18 }}>➕</Text>
            <Text style={{ color: "#000", fontSize: 14, fontWeight: "800" }}>Add New Device</Text>
          </TouchableOpacity>

          {/* Filter row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {["ALL", "ONLINE", "OFFLINE", "INVERTER", "SMART_METER", "BMS"].map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ backgroundColor: filter === f ? accent : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: filter === f ? "#000" : sub, fontSize: 12, fontWeight: "700" }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Device List */}
          {filteredDevices.length === 0 ? (
            <View style={{ backgroundColor: card, borderRadius: 20, padding: 40, alignItems: "center", borderWidth: 1, borderColor: border }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📡</Text>
              <Text style={{ color: text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>No Devices Found</Text>
              <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>Add your first device using the button above</Text>
            </View>
          ) : (
            filteredDevices.map((d: any) => <DeviceCard key={d.id} device={d} onRemove={handleRemove} onVerify={handleVerify} onSelectHealth={handleSelectHealth} />)
          )}
        </View>
      )}

      {/* TAB: PRODUCER CONNECTION REQUESTS */}
      {activeTab === "REQUESTS" && (
        <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border }}>
          <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 14 }}>
            Incoming Consumer Connection Requests
          </Text>

          {connectionRequests.length === 0 ? (
            <Text style={{ color: sub, fontSize: 13, textAlign: "center", paddingVertical: 20 }}>No pending connection requests from consumers.</Text>
          ) : (
            connectionRequests.map((req: any) => {
              const isPending = req.connectionStatus === "PENDING";
              const isApproved = req.connectionStatus === "CONNECTED";

              return (
                <View key={req.id} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>
                      👤 {req.consumer?.firstName} {req.consumer?.lastName}
                    </Text>
                    <View style={{ backgroundColor: isApproved ? `${success}20` : `${warning}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: isApproved ? success : warning, fontSize: 10, fontWeight: "800" }}>● {req.connectionStatus}</Text>
                    </View>
                  </View>
                  <Text style={{ color: sub, fontSize: 12, marginBottom: 4 }}>
                    Email: {req.consumer?.email} • Meter: {req.smartMeter?.device?.name || "Consumer Smart Meter"}
                  </Text>
                  <Text style={{ color: accent, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>
                    Requested Allocation: {req.allocatedPowerKw} kW
                  </Text>
                  {req.requestMessage && (
                    <Text style={{ color: text, fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
                      "{req.requestMessage}"
                    </Text>
                  )}

                  {isPending && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity onPress={() => handleApprovalAction(req.id, "APPROVE")} style={{ flex: 1, backgroundColor: success, borderRadius: 10, padding: 10, alignItems: "center" }}>
                        <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>Approve Connection</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleApprovalAction(req.id, "REJECT")} style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 10, alignItems: "center" }}>
                        <Text style={{ color: danger, fontWeight: "800", fontSize: 12 }}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* TAB: NETWORK TOPOLOGY */}
      {activeTab === "TOPOLOGY" && <NetworkTopologyVisualizer plantId="plant-1" />}

      {/* Device Health Diagnostics Modal */}
      <Modal visible={!!selectedHealthDevice} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 18, fontWeight: "900", marginBottom: 14 }}>
              📡 Device Health Diagnostics
            </Text>

            {deviceHealthDiagnostics ? (
              <View>
                <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 4 }}>{deviceHealthDiagnostics.name}</Text>
                <Text style={{ color: sub, fontSize: 12, marginBottom: 12 }}>Protocol: {deviceHealthDiagnostics.protocol} • IP: {deviceHealthDiagnostics.ipAddress}</Text>

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: `${accent}15`, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: accent, fontSize: 16, fontWeight: "900" }}>{deviceHealthDiagnostics.latencyMs} ms</Text>
                    <Text style={{ color: sub, fontSize: 10 }}>Ping Latency</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: `${success}15`, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: success, fontSize: 16, fontWeight: "900" }}>{deviceHealthDiagnostics.signalStrength}%</Text>
                    <Text style={{ color: sub, fontSize: 10 }}>Signal RSSI</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: `rgba(124,58,237,0.15)`, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: "#7C3AED", fontSize: 16, fontWeight: "900" }}>{deviceHealthDiagnostics.commFailuresCount}</Text>
                    <Text style={{ color: sub, fontSize: 10 }}>Comm Errors</Text>
                  </View>
                </View>

                <Text style={{ color: text, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>Telemetry Heartbeat Logs</Text>
                {deviceHealthDiagnostics.recentLogs?.map((l: any, i: number) => (
                  <Text key={i} style={{ color: sub, fontSize: 11, marginBottom: 2 }}>
                    • [{l.level}] {l.message}
                  </Text>
                ))}
              </View>
            ) : (
              <ActivityIndicator size="small" color={accent} />
            )}

            <TouchableOpacity onPress={() => setSelectedHealthDevice(null)} style={{ backgroundColor: accent, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 }}>
              <Text style={{ color: "#000", fontWeight: "800" }}>Close Diagnostics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Device Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 20, fontWeight: "900", marginBottom: 20 }}>🔌 Register New Device</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: "Device Name *", value: name, setter: setName, placeholder: "Main Hybrid Inverter 5kW" },
                { label: "Manufacturer", value: manufacturer, setter: setManufacturer, placeholder: "Deye, Growatt, Victron..." },
                { label: "Model", value: model, setter: setModel, placeholder: "SUN-5K-SG01HP3" },
                { label: "Installation Location", value: location, setter: setLocation, placeholder: "Roof - Block A" },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>{f.label}</Text>
                  <TextInput
                    style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }}
                    value={f.value}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor={sub}
                  />
                </View>
              ))}

              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Device Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                {DEVICE_TYPES.map((t) => (
                  <TouchableOpacity key={t} onPress={() => setType(t)} style={{ backgroundColor: type === t ? accent : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: type === t ? "#000" : sub, fontSize: 12, fontWeight: "700" }}>{DEVICE_ICONS[t] ?? "📱"} {t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} disabled={adding} style={{ flex: 2, backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                {adding && <ActivityIndicator size="small" color="#000" />}
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>Register Device</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}