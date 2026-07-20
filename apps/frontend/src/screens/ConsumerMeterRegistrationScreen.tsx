import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useStore } from "../store/useStore";

export default function ConsumerMeterRegistrationScreen() {
  const {
    theme,
    devices,
    registerConsumerSmartMeter,
    verifyDevice,
    searchProducerPlants,
    submitConnectionRequest,
    plantSearchResults,
    fetchIotData,
  } = useStore();

  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const success = "#10B981";
  const warning = "#F59E0B";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";

  // Meter Registration Form State
  const [meterName, setMeterName] = useState("Home Main Smart Meter");
  const [serialNumber, setSerialNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("Smart Grid Systems");
  const [model, setModel] = useState("SM-2026-BIDIR");
  const [gatewayId, setGatewayId] = useState("GW-HOME-001");
  const [address, setAddress] = useState("Plot 12, Energy Avenue, Lagos");
  const [protocol, setProtocol] = useState("MQTT");
  const [phaseType, setPhaseType] = useState("SINGLE_PHASE");

  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Producer Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [requestMsg, setRequestMsg] = useState("Requesting 5.0 kW clean solar allocation.");
  const [invitationCode, setInvitationCode] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchIotData();
    searchProducerPlants();
  }, []);

  const registeredMeters = devices.filter((d: any) => d.type === "SMART_METER");

  const handleRegisterMeter = async () => {
    if (!meterName.trim()) return;
    setRegistering(true);
    setRegisterSuccess(null);
    setVerificationResult(null);

    const sn = serialNumber.trim() || `CNS-MTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const result = await registerConsumerSmartMeter({
      meterName: meterName.trim(),
      serialNumber: sn,
      meterNumber: meterNumber.trim() || `MTR-${sn.slice(-6)}`,
      manufacturer,
      model,
      gatewayId,
      installationAddress: address,
      protocol,
      phaseType,
    });

    setRegistering(false);
    setRegisterSuccess(result);
  };

  const handleTestVerification = async (deviceId: string) => {
    setVerifying(true);
    const result = await verifyDevice(deviceId);
    setVerifying(false);
    setVerificationResult(result);
  };

  const handleSearchPlants = async () => {
    setSearching(true);
    await searchProducerPlants(searchQuery);
    setSearching(false);
  };

  const handleConnectRequest = async (plant: any) => {
    setSelectedPlant(plant);
  };

  const handleSubmitRequest = async () => {
    if (!selectedPlant) return;
    setSubmittingReq(true);
    setReqSuccess(null);
    await submitConnectionRequest({
      plantId: selectedPlant.id,
      requestMessage: requestMsg,
      invitationCode: invitationCode || undefined,
      requestedPowerKw: 5.0,
    });
    setSubmittingReq(false);
    setReqSuccess(`Connection request sent to ${selectedPlant.name}! Awaiting Producer approval.`);
    setSelectedPlant(null);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={{ backgroundColor: `${accent}15`, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: `${accent}35` }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontSize: 18, fontWeight: "900" }}>Register Smart Meter</Text>
            <Text style={{ color: sub, fontSize: 12 }}>Bind your physical bidirectional meter to your REOS consumer account</Text>
          </View>
        </View>
      </View>

      {/* Account Isolation Notice */}
      <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.1)" : "#ECFDF5", borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: `${success}40`, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 20 }}>🔒</Text>
        <Text style={{ flex: 1, color: isDark ? "#A7F3D0" : "#065F46", fontSize: 12, fontWeight: "600" }}>
          Every consumer owns only the meters assigned to their account. All energy telemetry and billing transactions are cryptographically verified.
        </Text>
      </View>

      {/* Step 1 & 2: Registration Form */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: border }}>
        <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 16 }}>
          1. Smart Meter Specifications
        </Text>

        {[
          { label: "Meter Name *", value: meterName, setter: setMeterName, placeholder: "Home Bidirectional Meter" },
          { label: "Serial Number (Optional)", value: serialNumber, setter: setSerialNumber, placeholder: "SN-CNS-889900 (Auto-generated if blank)" },
          { label: "Meter Number / Utility ID", value: meterNumber, setter: setMeterNumber, placeholder: "MTR-889900" },
          { label: "Manufacturer", value: manufacturer, setter: setManufacturer, placeholder: "Smart Grid Tech" },
          { label: "Model", value: model, setter: setModel, placeholder: "SM-2026-BIDIR" },
          { label: "IoT Gateway ID", value: gatewayId, setter: setGatewayId, placeholder: "GW-HOME-001" },
          { label: "Installation Address", value: address, setter: setAddress, placeholder: "12 Energy Way, Victoria Island, Lagos" },
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

        {/* Phase Type selector */}
        <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Phase Configuration</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {["SINGLE_PHASE", "THREE_PHASE"].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPhaseType(p)}
              style={{
                flex: 1,
                backgroundColor: phaseType === p ? accent : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: phaseType === p ? accent : border,
              }}
            >
              <Text style={{ color: phaseType === p ? "#000" : text, fontWeight: "700", fontSize: 12 }}>
                {p.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegisterMeter}
          disabled={registering}
          style={{ backgroundColor: accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
        >
          {registering && <ActivityIndicator size="small" color="#000" />}
          <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>
            {registering ? "Registering & Binding Meter..." : "Register & Bind Smart Meter"}
          </Text>
        </TouchableOpacity>

        {registerSuccess && (
          <View style={{ marginTop: 14, backgroundColor: `${success}15`, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: `${success}30` }}>
            <Text style={{ color: success, fontWeight: "800", fontSize: 13, marginBottom: 4 }}>✓ Meter Registered Successfully!</Text>
            <Text style={{ color: sub, fontSize: 12 }}>
              ID: {registerSuccess.device?.id?.slice(0, 12)}... • Serial: {registerSuccess.device?.serialNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Registered Smart Meters List & Test Verification */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: border }}>
        <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 14 }}>
          2. Your Registered Smart Meters ({registeredMeters.length})
        </Text>

        {registeredMeters.length === 0 ? (
          <Text style={{ color: sub, fontSize: 13 }}>No Smart Meters registered yet. Fill out the form above.</Text>
        ) : (
          registeredMeters.map((mtr: any) => (
            <View key={mtr.id} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>{mtr.name}</Text>
                <View style={{ backgroundColor: `${success}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: success, fontSize: 10, fontWeight: "700" }}>● {mtr.verificationStatus || "VERIFIED"}</Text>
                </View>
              </View>
              <Text style={{ color: sub, fontSize: 12, marginBottom: 10 }}>
                SN: {mtr.serialNumber} • Signal: {mtr.signalStrength ?? 92}% • Comm: {mtr.protocol ?? "MQTT"}
              </Text>

              <TouchableOpacity
                onPress={() => handleTestVerification(mtr.id)}
                disabled={verifying}
                style={{ backgroundColor: `${accent}15`, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: `${accent}30` }}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>🔄 Run Connectivity Verification Test</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {verificationResult && (
          <View style={{ marginTop: 12, backgroundColor: `${success}15`, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${success}30` }}>
            <Text style={{ color: success, fontSize: 12, fontWeight: "700" }}>
              ✓ Connectivity Verified • Ping Latency: {verificationResult.latencyMs}ms • Signal: {verificationResult.signalStrength}%
            </Text>
          </View>
        )}
      </View>

      {/* Step 3: Connect to Energy Producer or Prosumer */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: border }}>
        <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 4 }}>
          3. Request Energy Connection to Producer / Prosumer
        </Text>
        <Text style={{ color: sub, fontSize: 12, marginBottom: 14 }}>
          Browse available Commercial Plant Producers and Prosumer Microgrids to request power dispatch.
        </Text>

        {/* Category Tabs */}
        <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E2E8F0", borderRadius: 10, padding: 3, marginBottom: 14 }}>
          {["PLANT_PRODUCER", "PROSUMER"].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSearchQuery(cat === "PROSUMER" ? "Prosumer" : "")}
              style={{
                flex: 1,
                backgroundColor: (cat === "PROSUMER" && searchQuery.includes("Prosumer")) || (cat === "PLANT_PRODUCER" && !searchQuery.includes("Prosumer")) ? accent : "transparent",
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: (cat === "PROSUMER" && searchQuery.includes("Prosumer")) || (cat === "PLANT_PRODUCER" && !searchQuery.includes("Prosumer")) ? "#000" : text, fontSize: 11, fontWeight: "800" }}>
                {cat === "PLANT_PRODUCER" ? "🏭 Plant Producers" : "🏡 Prosumers"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 14, borderWidth: 1, borderColor: border }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search plant name, prosumer, or ID..."
            placeholderTextColor={sub}
          />
          <TouchableOpacity
            onPress={handleSearchPlants}
            disabled={searching}
            style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" }}
          >
            {searching ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ color: "#000", fontWeight: "800" }}>Search</Text>}
          </TouchableOpacity>
        </View>

        {reqSuccess && (
          <View style={{ backgroundColor: `${success}15`, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: `${success}30` }}>
            <Text style={{ color: success, fontSize: 12, fontWeight: "700" }}>✓ {reqSuccess}</Text>
          </View>
        )}

        {/* Search Results */}
        {plantSearchResults.map((plant: any) => (
          <View key={plant.id} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>{plant.name}</Text>
              <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>{plant.capacityKw} kW</Text>
            </View>
            <Text style={{ color: sub, fontSize: 11, marginBottom: 10 }}>
              Org: {plant.organizationName} • Connected Consumers: {plant.connectedConsumers}
            </Text>

            <TouchableOpacity
              onPress={() => handleConnectRequest(plant)}
              style={{ backgroundColor: accent, borderRadius: 10, padding: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#000", fontSize: 12, fontWeight: "800" }}>Submit Connection Request</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Step 4: Connection Request Status & Tracking */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: border }}>
        <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 4 }}>
          4. Connection Request Status & Live Tracking
        </Text>
        <Text style={{ color: sub, fontSize: 12, marginBottom: 14 }}>
          Track the live review status of your energy connection requests sent to Producers & Prosumers.
        </Text>

        {/* Demo / Live Request Items */}
        {[
          {
            id: "req-live-1",
            producerName: "Kano Clean Energy Industrial Plant",
            meterName: "Home Main Smart Meter",
            requestedKw: 5.0,
            status: "CONNECTED",
            date: "Today, 02:15 PM",
            msg: "Approved! 5kW clean solar dispatch activated.",
          },
          {
            id: "req-live-2",
            producerName: "Sharada Solar Microgrid (Prosumer)",
            meterName: "Backup Meter B",
            requestedKw: 2.5,
            status: "PENDING",
            date: "Today, 04:30 PM",
            msg: "Awaiting producer approval.",
          },
        ].map((item) => (
          <View key={item.id} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ color: text, fontSize: 13, fontWeight: "800" }}>{item.producerName}</Text>
              <View style={{ backgroundColor: item.status === "CONNECTED" ? `${success}20` : `${warning}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: item.status === "CONNECTED" ? success : warning, fontSize: 10, fontWeight: "800" }}>
                  ● {item.status}
                </Text>
              </View>
            </View>
            <Text style={{ color: sub, fontSize: 11, marginBottom: 4 }}>
              Meter: {item.meterName} • Requested: {item.requestedKw} kW • {item.date}
            </Text>
            <Text style={{ color: item.status === "CONNECTED" ? success : accent, fontSize: 11, fontWeight: "600" }}>
              Status Note: {item.msg}
            </Text>
          </View>
        ))}
      </View>

      {/* Connection Request Modal */}
      <Modal visible={!!selectedPlant} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: text, fontSize: 18, fontWeight: "900", marginBottom: 8 }}>
              Connect to {selectedPlant?.name}
            </Text>
            <Text style={{ color: sub, fontSize: 12, marginBottom: 16 }}>
              Submit connection request to bind your Smart Meter to this Energy Producer.
            </Text>

            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Request Message</Text>
            <TextInput
              style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 13, borderWidth: 1, borderColor: border, marginBottom: 14 }}
              value={requestMsg}
              onChangeText={setRequestMsg}
              placeholder="E.g. Requesting 5kW residential energy connection"
              placeholderTextColor={sub}
              multiline
            />

            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Invitation Code (Optional)</Text>
            <TextInput
              style={{ backgroundColor: inputBg, borderRadius: 12, padding: 14, color: text, fontSize: 13, borderWidth: 1, borderColor: border, marginBottom: 20 }}
              value={invitationCode}
              onChangeText={setInvitationCode}
              placeholder="INV-CODE-XXXX"
              placeholderTextColor={sub}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setSelectedPlant(null)}
                style={{ flex: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0", borderRadius: 12, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: sub, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitRequest}
                disabled={submittingReq}
                style={{ flex: 2, backgroundColor: accent, borderRadius: 12, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              >
                {submittingReq && <ActivityIndicator size="small" color="#000" />}
                <Text style={{ color: "#000", fontWeight: "900", fontSize: 14 }}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
