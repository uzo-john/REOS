import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { useStore } from "../store/useStore";

const DEVICE_TYPES = ["INVERTER","SMART_METER","BMS","EDGE_GATEWAY","WEATHER_STATION","EV_CHARGER","ENERGY_SENSOR"];
const PROTOCOLS = ["MQTT","MODBUS_TCP","MODBUS_RTU","HTTP","ZIGBEE","WIFI","ETHERNET"];
const DEVICE_ICONS: Record<string, string> = {
  INVERTER:"🔌", SMART_METER:"⚡", BMS:"🔋", EDGE_GATEWAY:"📡", WEATHER_STATION:"🌤️",
  EV_CHARGER:"🚗", ENERGY_SENSOR:"📊", NEIGHBOUR_METER:"🏘️", CHARGE_CONTROLLER:"☀️",
};

function DeviceCard({ device, onRemove }: { device: any; onRemove: (id: string) => void }) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const statusColor = { ONLINE:"#10B981", OFFLINE:"#EF4444", MAINTENANCE:"#F59E0B", FAULT:"#EF4444" }[device.status as string] ?? "#64748B";
  const icon = DEVICE_ICONS[device.type] ?? "📱";
  const sig = device.communicationQuality ?? 95;
  return (
    <View style={{ backgroundColor: isDark ? "rgba(17,24,39,0.95)" : "#FFF", borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: `${statusColor}18`, alignItems: "center", justifyContent: "center", marginRight: 14, borderWidth: 1, borderColor: `${statusColor}30` }}>
          <Text style={{ fontSize: 26 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ flex: 1, color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 15, fontWeight: "800" }}>{device.name}</Text>
            <View style={{ backgroundColor: `${statusColor}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>● {device.status}</Text>
            </View>
          </View>
          <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 12, marginBottom: 2 }}>{device.type?.replace(/_/g, " ")} • {device.protocol ?? "MQTT"}</Text>
          {device.firmwareVersion && <Text style={{ color: isDark ? "#4B5563" : "#CBD5E1", fontSize: 11 }}>FW: {device.firmwareVersion} • ID: {device.id?.slice(0, 8)}...</Text>}
        </View>
      </View>
      {/* Signal bar */}
      <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11 }}>Signal</Text>
        <View style={{ flex: 1, height: 4, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${sig}%`, backgroundColor: sig > 75 ? "#10B981" : sig > 40 ? "#F59E0B" : "#EF4444", borderRadius: 2 }} />
        </View>
        <Text style={{ color: sig > 75 ? "#10B981" : sig > 40 ? "#F59E0B" : "#EF4444", fontSize: 11, fontWeight: "700" }}>{sig}%</Text>
        <TouchableOpacity onPress={() => onRemove(device.id)} style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "700" }}>Remove</Text>
        </TouchableOpacity>
      </View>
      {device.lastCommTime && (
        <Text style={{ color: isDark ? "#374151" : "#E2E8F0", fontSize: 10, marginTop: 8 }}>
          Last comm: {new Date(device.lastCommTime).toLocaleString()}
        </Text>
      )}
    </View>
  );
}

export default function DeviceManagementScreen() {
  const { devices, theme, fetchIotData, registerDevice, removeDevice } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(DEVICE_TYPES[0]);
  const [protocol, setProtocol] = useState(PROTOCOLS[0]);
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchIotData(); }, []);

  const onlineCount = devices.filter((d: any) => d.status === "ONLINE").length;
  const offlineCount = devices.filter((d: any) => d.status !== "ONLINE").length;

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Devices", value: devices.length, icon: "📱", color: "#00D4FF" },
          { label: "Online", value: onlineCount, icon: "🟢", color: "#10B981" },
          { label: "Offline/Fault", value: offlineCount, icon: "🔴", color: "#EF4444" },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: `${s.color}12`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${s.color}30`, alignItems: "center" }}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</Text>
            <Text style={{ color: s.color, fontSize: 22, fontWeight: "900" }}>{s.value}</Text>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "600", textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Add Device Button */}
      <TouchableOpacity onPress={() => setShowAdd(true)} style={{ backgroundColor: accent, borderRadius: 16, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 16, gap: 8 }}>
        <Text style={{ fontSize: 20 }}>➕</Text>
        <Text style={{ color: "#000", fontSize: 15, fontWeight: "800" }}>Add New Device</Text>
      </TouchableOpacity>

      {/* Filter row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        {["ALL", "ONLINE", "OFFLINE", "INVERTER", "SMART_METER", "BMS"].map(f => (
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
          <Text style={{ color: sub, fontSize: 13, textAlign: "center" }}>Add your first device using the button above to start monitoring</Text>
        </View>
      ) : (
        filteredDevices.map((d: any) => <DeviceCard key={d.id} device={d} onRemove={handleRemove} />)
      )}

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
              ].map(f => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }}
                    value={f.value} onChangeText={f.setter} placeholder={f.placeholder} placeholderTextColor={sub} />
                </View>
              ))}
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Device Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                {DEVICE_TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => setType(t)} style={{ backgroundColor: type === t ? accent : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: type === t ? "#000" : sub, fontSize: 12, fontWeight: "700" }}>{DEVICE_ICONS[t] ?? "📱"} {t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Protocol</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
                {PROTOCOLS.map(p => (
                  <TouchableOpacity key={p} onPress={() => setProtocol(p)} style={{ backgroundColor: protocol === p ? "#7C3AED" : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: protocol === p ? "#FFF" : sub, fontSize: 12, fontWeight: "700" }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12 }}>
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