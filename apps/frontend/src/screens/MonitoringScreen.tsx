import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

function TelemetryGauge({ label, value, unit, max, color, icon }: any) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const pct = Math.min(100, (value / max) * 100);
  const bar = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  return (
    <View style={{ backgroundColor: isDark ? "rgba(17,24,39,0.95)" : "#FFF", borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>{icon}</Text>
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 12, fontWeight: "600", flex: 1 }}>{label}</Text>
        <Text style={{ color: color, fontSize: 20, fontWeight: "900" }}>{typeof value === "number" ? value.toFixed(2) : value}</Text>
        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11, marginLeft: 4 }}>{unit}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: bar, borderRadius: 3, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
      <Text style={{ color: isDark ? "#4B5563" : "#CBD5E1", fontSize: 10, marginTop: 4, textAlign: "right" }}>{pct.toFixed(0)}% of {max}{unit}</Text>
    </View>
  );
}

function DeviceRow({ device }: { device: any }) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const statusColor = { ONLINE: "#10B981", OFFLINE: "#EF4444", MAINTENANCE: "#F59E0B" }[device.status as string] ?? "#64748B";
  const sig = device.communicationQuality ?? device.signalStrength ?? 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "rgba(17,24,39,0.9)" : "#FFF", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
      <View style={{ backgroundColor: `${statusColor}20`, borderRadius: 10, padding: 8, marginRight: 12 }}>
        <Text style={{ fontSize: 20 }}>{device.type === "INVERTER" ? "🔌" : device.type === "SMART_METER" ? "⚡" : device.type === "BMS" ? "🔋" : device.type === "WEATHER_STATION" ? "🌤️" : "📡"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 13, fontWeight: "700" }}>{device.name}</Text>
        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11, marginTop: 2 }}>Signal: {sig}% • {device.protocol ?? "MQTT"}</Text>
      </View>
      <View>
        <View style={{ backgroundColor: `${statusColor}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-end", marginBottom: 4 }}>
          <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>● {device.status}</Text>
        </View>
        <Text style={{ color: isDark ? "#4B5563" : "#CBD5E1", fontSize: 10, textAlign: "right" }}>FW: {device.firmwareVersion ?? "v1.0"}</Text>
      </View>
    </View>
  );
}

export default function MonitoringScreen() {
  const { telemetry, devices, theme, fetchIotData } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const card = isDark ? "rgba(17,24,39,0.9)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    fetchIotData();
    const iv = setInterval(fetchIotData, 2500);
    return () => clearInterval(iv);
  }, []);

  const inv = telemetry?.inverter;
  const sm = telemetry?.smartMeter;
  const bat = telemetry?.battery;
  const wx = telemetry?.weather;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Live Badge */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 8 }} />
        <Text style={{ color: "#10B981", fontWeight: "700", fontSize: 12 }}>LIVE TELEMETRY</Text>
        <Text style={{ color: sub, fontSize: 11, marginLeft: "auto" }}>Updates every 2.5s • {new Date(telemetry?.timestamp ?? Date.now()).toLocaleTimeString()}</Text>
      </View>

      {/* Inverter */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>☀️ Inverter / PV</Text>
      {inv && <>
        <TelemetryGauge label="AC Output Power" value={inv.powerKw} unit="kW" max={5} color="#F59E0B" icon="⚡" />
        <TelemetryGauge label="Grid Voltage" value={inv.voltageV} unit="V" max={260} color="#00D4FF" icon="🔌" />
        <TelemetryGauge label="Efficiency" value={inv.efficiencyPercent} unit="%" max={100} color="#7C3AED" icon="📊" />
        <TelemetryGauge label="Frequency" value={inv.frequencyHz} unit="Hz" max={52} color="#10B981" icon="〰️" />
      </>}

      {/* Smart Meter */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 8, marginBottom: 10, textTransform: "uppercase" }}>⚡ Smart Meter</Text>
      {sm && <>
        <TelemetryGauge label="Grid Power Flow" value={Math.abs(sm.activePowerKw)} unit="kW" max={5} color={sm.activePowerKw >= 0 ? "#10B981" : "#EF4444"} icon={sm.activePowerKw >= 0 ? "📤" : "📥"} />
        <TelemetryGauge label="Power Factor" value={sm.powerFactor} unit="" max={1} color="#3B82F6" icon="📐" />
        <TelemetryGauge label="THD (Harmonics)" value={sm.harmonicsThdPercent} unit="%" max={5} color="#F97316" icon="〰️" />
        <TelemetryGauge label="Voltage Imbalance" value={sm.voltageImbalancePercent} unit="%" max={5} color="#EF4444" icon="⚠️" />
      </>}

      {/* Battery */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 8, marginBottom: 10, textTransform: "uppercase" }}>🔋 Battery / BMS</Text>
      {bat && <>
        <TelemetryGauge label="State of Charge" value={bat.socPercent} unit="%" max={100} color="#10B981" icon="🔋" />
        <TelemetryGauge label="Battery Voltage" value={bat.voltageV} unit="V" max={60} color="#00D4FF" icon="⚡" />
        <TelemetryGauge label="Temperature" value={bat.temperatureC} unit="°C" max={60} color="#F97316" icon="🌡️" />
        <TelemetryGauge label="Health (SoH)" value={bat.healthPercent} unit="%" max={100} color="#7C3AED" icon="❤️" />
      </>}

      {/* Weather */}
      {wx && (
        <>
          <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 8, marginBottom: 10, textTransform: "uppercase" }}>🌤️ Weather Station</Text>
          <TelemetryGauge label="Solar Irradiance" value={wx.solarIrradianceWm2} unit="W/m²" max={1200} color="#F59E0B" icon="☀️" />
          <TelemetryGauge label="Ambient Temp" value={wx.ambientTempC} unit="°C" max={50} color="#F97316" icon="🌡️" />
          <TelemetryGauge label="Wind Speed" value={wx.windSpeedMs} unit="m/s" max={20} color="#3B82F6" icon="💨" />
        </>
      )}

      {/* Devices */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 8, marginBottom: 10, textTransform: "uppercase" }}>📡 Connected Devices</Text>
      {devices.map((d: any) => <DeviceRow key={d.id} device={d} />)}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}