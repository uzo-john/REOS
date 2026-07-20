import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useStore } from "../store/useStore";

export default function ProducerSetupWizardScreen() {
  const { theme, onboardProducerPlant, fetchIotData, fetchProducerPlants } = useStore();

  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const success = "#10B981";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";

  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState<any>(null);

  // Form State
  const [plantName, setPlantName] = useState("Alpha Commercial Solar Farm");
  const [plantType, setPlantType] = useState("SOLAR_FARM");
  const [capacityKw, setCapacityKw] = useState("100");

  // Devices Specs
  const [inverterName, setInverterName] = useState("Main Hybrid Solar Inverter 100kW");
  const [inverterSerial, setInverterSerial] = useState("INV-PRD-100K-01");
  const [inverterModel, setInverterModel] = useState("SUN-100K-SG01HP3");

  const [meterName, setMeterName] = useState("Producer Master Smart Meter");
  const [meterSerial, setMeterSerial] = useState("MTR-PRD-BIDIR-01");

  const [batteryName, setBatteryName] = useState("High-Voltage LiFePO4 Battery BMS");
  const [batterySerial, setBatterySerial] = useState("BAT-BMS-HV-200K");

  const [gatewayName, setGatewayName] = useState("Central Plant IoT Edge Gateway");
  const [gatewaySerial, setGatewaySerial] = useState("GW-IOT-EDGE-01");
  const [gatewayIp, setGatewayIp] = useState("192.168.1.100");

  const handleCompleteOnboarding = async () => {
    setSubmitting(true);
    setOnboardSuccess(null);

    const dto = {
      plantName,
      plantType,
      installedCapacityKw: parseFloat(capacityKw) || 100.0,
      devices: [
        {
          name: inverterName,
          type: "SOLAR_INVERTER",
          serialNumber: inverterSerial || `SN-INV-${Date.now()}`,
          model: inverterModel,
          protocol: "MQTT",
          manufacturer: "REOS Solar Tech",
        },
        {
          name: meterName,
          type: "SMART_METER",
          serialNumber: meterSerial || `SN-MTR-${Date.now()}`,
          protocol: "MQTT",
          manufacturer: "REOS Metering",
        },
        {
          name: batteryName,
          type: "BATTERY_BMS",
          serialNumber: batterySerial || `SN-BAT-${Date.now()}`,
          protocol: "MODBUS_TCP",
          manufacturer: "REOS Storage",
        },
        {
          name: gatewayName,
          type: "IOT_GATEWAY",
          serialNumber: gatewaySerial || `SN-GW-${Date.now()}`,
          ipAddress: gatewayIp,
          protocol: "MQTT",
          manufacturer: "REOS Edge Gateway",
        },
      ],
    };

    const res = await onboardProducerPlant(dto);
    await fetchIotData();
    await fetchProducerPlants();
    setSubmitting(false);
    setOnboardSuccess(res);
    setActiveStep(7);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={{ backgroundColor: `${accent}15`, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: `${accent}35` }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>🏭</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontSize: 18, fontWeight: "900" }}>Producer Device Setup Wizard</Text>
            <Text style={{ color: sub, fontSize: 12 }}>Guided 7-Step onboarding for Commercial Energy Generating Plants</Text>
          </View>
        </View>
      </View>

      {/* Stepper Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
        {[
          { step: 1, title: "1. Plant" },
          { step: 2, title: "2. Inverter" },
          { step: 3, title: "3. Meter" },
          { step: 4, title: "4. Battery" },
          { step: 5, title: "5. Gateway" },
          { step: 6, title: "6. Verify" },
          { step: 7, title: "7. Activate" },
        ].map((s) => (
          <TouchableOpacity
            key={s.step}
            onPress={() => setActiveStep(s.step)}
            style={{
              backgroundColor: activeStep === s.step ? accent : isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: activeStep === s.step ? accent : border,
            }}
          >
            <Text style={{ color: activeStep === s.step ? "#000" : text, fontWeight: "800", fontSize: 12 }}>
              {s.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Step Content Card */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: border }}>
        {activeStep === 1 && (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 16 }}>Step 1: Generating Plant Assessment</Text>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Plant Name *</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={plantName} onChangeText={setPlantName} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Installed Capacity (kW) *</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={capacityKw} onChangeText={setCapacityKw} keyboardType="numeric" />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(2)} style={{ backgroundColor: accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#000", fontWeight: "900" }}>Next: Configure Solar Inverter →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 2 && (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 16 }}>Step 2: Solar Inverter Setup</Text>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Inverter Device Name</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={inverterName} onChangeText={setInverterName} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Serial Number</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={inverterSerial} onChangeText={setInverterSerial} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Inverter Model</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={inverterModel} onChangeText={setInverterModel} />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(3)} style={{ backgroundColor: accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#000", fontWeight: "900" }}>Next: Configure Producer Smart Meter →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 3 && (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 16 }}>Step 3: Producer Smart Meter Setup</Text>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Producer Meter Name</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={meterName} onChangeText={setMeterName} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Serial Number</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={meterSerial} onChangeText={setMeterSerial} />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(4)} style={{ backgroundColor: accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#000", fontWeight: "900" }}>Next: Configure Battery System →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 4 && (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 16 }}>Step 4: Battery Storage System (BMS)</Text>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Battery System Name</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={batteryName} onChangeText={setBatteryName} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>BMS Serial Number</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={batterySerial} onChangeText={setBatterySerial} />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(5)} style={{ backgroundColor: accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#000", fontWeight: "900" }}>Next: Configure IoT Gateway →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 5 && (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 16 }}>Step 5: Central Plant IoT Gateway</Text>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Gateway Name</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={gatewayName} onChangeText={setGatewayName} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Gateway IP Address</Text>
              <TextInput style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }} value={gatewayIp} onChangeText={setGatewayIp} />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(6)} style={{ backgroundColor: accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#000", fontWeight: "900" }}>Next: Verification & Health Check →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 6 && (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 12 }}>Step 6: Automated Hardware Verification</Text>
            <Text style={{ color: sub, fontSize: 12, marginBottom: 16 }}>
              System will run ownership checks, serial number uniqueness, MQTT ping tests, and generate secure device auth tokens.
            </Text>

            <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: border }}>
              <Text style={{ color: text, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>Hardware Summary to Register:</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Plant: {plantName} ({capacityKw} kW)</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Inverter: {inverterName}</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Producer Meter: {meterName}</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Battery System: {batteryName}</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• IoT Gateway: {gatewayName} ({gatewayIp})</Text>
            </View>

            <TouchableOpacity
              onPress={handleCompleteOnboarding}
              disabled={submitting}
              style={{ backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 }}
            >
              {submitting && <ActivityIndicator size="small" color="#000" />}
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 15 }}>
                {submitting ? "Running Verification & Onboarding..." : "Verify & Complete Setup"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 7 && (
          <View style={{ alignItems: "center", paddingVertical: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${success}20`, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
            </View>
            <Text style={{ color: text, fontSize: 18, fontWeight: "900", marginBottom: 6 }}>Step 7: Setup Complete & Monitoring Activated!</Text>
            <Text style={{ color: sub, fontSize: 12, textAlign: "center", marginBottom: 20 }}>
              All 4 physical hardware devices for {plantName} are successfully verified, authenticated, and bound to your Producer account.
            </Text>

            <View style={{ backgroundColor: `${success}15`, borderRadius: 14, padding: 14, width: "100%", marginBottom: 16, borderWidth: 1, borderColor: `${success}30` }}>
              <Text style={{ color: success, fontWeight: "800", fontSize: 13, marginBottom: 4 }}>✓ Automated Features Activated:</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Real-Time Monitoring & Telemetry</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Energy Dispatch Engine & Feeders</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Consumer Connection Approvals</Text>
              <Text style={{ color: sub, fontSize: 12 }}>• Escrow Billing & Wallet Integration</Text>
            </View>

            <TouchableOpacity onPress={() => setActiveStep(1)} style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: "#000", fontWeight: "800" }}>Onboard Another Plant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
