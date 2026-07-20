import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

import ProducerSetupWizardScreen from "./ProducerSetupWizardScreen";

export default function ProducerPlantsScreen({ navigation }: { navigation?: any }) {
  const {
    theme,
    producerPlants,
    fetchProducerPlants,
    registerProducerPlant,
    updateProducerPlant
  } = useStore() as any;

  const isDark = theme === "dark";
  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const accent = "#8B5CF6";
  const success = "#10B981";

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showWizardInline, setShowWizardInline] = useState(false);
  const [editingPlant, setEditingPlant] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState("Solar");
  const [installedCapacity, setInstalledCapacity] = useState("");
  const [availableCapacity, setAvailableCapacity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [gridStatus, setGridStatus] = useState("CONNECTED");
  const [utilityDetails, setUtilityDetails] = useState("");
  const [operatingStatus, setOperatingStatus] = useState("OPERATIONAL");
  const [ownerInfo, setOwnerInfo] = useState("");

  useEffect(() => {
    fetchProducerPlants().then(() => setLoading(false));
  }, []);

  const openRegisterModal = () => {
    setEditingPlant(null);
    setName("");
    setType("Solar");
    setInstalledCapacity("");
    setAvailableCapacity("");
    setLatitude("");
    setLongitude("");
    setAddress("");
    setCity("");
    setGridStatus("CONNECTED");
    setUtilityDetails("");
    setOperatingStatus("OPERATIONAL");
    setOwnerInfo("");
    setModalVisible(true);
  };

  const openEditModal = (plant: any) => {
    setEditingPlant(plant);
    setName(plant.name || "");
    setType(plant.type || "Solar");
    setInstalledCapacity(plant.installedCapacityKw ? String(plant.installedCapacityKw) : "");
    setAvailableCapacity(plant.availableCapacityKw ? String(plant.availableCapacityKw) : "");
    setLatitude(plant.latitude ? String(plant.latitude) : "");
    setLongitude(plant.longitude ? String(plant.longitude) : "");
    setAddress(plant.address || "");
    setCity(plant.city || "");
    setGridStatus(plant.gridConnectionStatus || "CONNECTED");
    setUtilityDetails(plant.utilityDetails || "");
    setOperatingStatus(plant.operatingStatus || "OPERATIONAL");
    setOwnerInfo(plant.ownerInfo || "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const payload = {
      name: name.trim(),
      type,
      installedCapacityKw: parseFloat(installedCapacity) || 0,
      availableCapacityKw: parseFloat(availableCapacity) || 0,
      latitude: parseFloat(latitude) || undefined,
      longitude: parseFloat(longitude) || undefined,
      address,
      city,
      gridConnectionStatus: gridStatus,
      utilityDetails,
      operatingStatus,
      ownerInfo,
    };

    try {
      if (editingPlant) {
        await updateProducerPlant(editingPlant.id, payload);
      } else {
        await registerProducerPlant(payload);
      }
      setModalVisible(false);
    } catch (e) {
      console.error("Save plant failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && producerPlants.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Plant Producer Setup & Hardware Onboarding Banner */}
        <View style={{ backgroundColor: `${accent}15`, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: `${accent}30` }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: textPrimary, fontSize: 15, fontWeight: "900" }}>🏭 Plant Producer Onboarding Hub</Text>
            <View style={{ backgroundColor: `${accent}25`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>PLANT PRODUCER</Text>
            </View>
          </View>
          <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 14 }}>
            Configure power plant facilities, register inverters, master smart meters, BMS batteries, and IoT edge gateways.
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setShowWizardInline(!showWizardInline);
                if (navigation?.navigate) navigation.navigate("ProducerSetupWizard");
              }}
              style={{
                flex: 1,
                backgroundColor: accent,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14 }}>🏭</Text>
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}>
                {showWizardInline ? "Close Wizard" : "Run 7-Step Setup Wizard"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openRegisterModal}
              style={{
                backgroundColor: "rgba(16,185,129,0.18)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(16,185,129,0.30)",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14 }}>➕</Text>
              <Text style={{ color: success, fontSize: 11, fontWeight: "800" }}>Register Facility</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Producer Setup Wizard when toggled */}
        {showWizardInline && (
          <View style={{ marginBottom: 20 }}>
            <ProducerSetupWizardScreen />
          </View>
        )}

        {/* Header Block */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "900" }}>Registered Commercial Power Plants</Text>
            <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>Overview of verified generation facilities and connected grid assets.</Text>
          </View>
        </View>

        {/* List of Registered Plants */}
        <View style={{ gap: 12 }}>
          {producerPlants.map((plant: any) => (
            <View key={plant.id} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <View>
                  <Text style={{ color: textPrimary, fontSize: 15, fontWeight: "800" }}>{plant.name}</Text>
                  <Text style={{ color: textSecondary, fontSize: 10, marginTop: 2 }}>ID: {plant.id}</Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: plant.operatingStatus === "OPERATIONAL" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 6 }}>
                  <Text style={{ color: plant.operatingStatus === "OPERATIONAL" ? success : "#EF4444", fontSize: 9, fontWeight: "700" }}>
                    {plant.operatingStatus}
                  </Text>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: border, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>TYPE</Text>
                  <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>{plant.type}</Text>
                </View>
                <View>
                  <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>INSTALLED CAPACITY</Text>
                  <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>{plant.installedCapacityKw} kW</Text>
                </View>
                <View>
                  <Text style={{ color: textSecondary, fontSize: 9, fontWeight: "700" }}>GRID STATUS</Text>
                  <Text style={{ color: textPrimary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>{plant.gridConnectionStatus}</Text>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: textSecondary, fontSize: 11, flex: 1, marginRight: 8 }} numberOfLines={1}>
                  📍 {plant.address ? `${plant.address}, ` : ""}{plant.city || "Kano"}
                </Text>
                <TouchableOpacity onPress={() => openEditModal(plant)} style={{ borderWidth: 1, borderColor: accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>Edit Specs</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Register/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 20, maxHeight: "90%" }}>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "900", marginBottom: 16 }}>
              {editingPlant ? "Edit Plant Specifications" : "Register Generating Plant"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>PLANT NAME</Text>
                  <TextInput value={name} onChangeText={setName} placeholder="Kano Industrial Solar Grid" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                </View>

                <View>
                  <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>PLANT TYPE</Text>
                  <TextInput value={type} onChangeText={setType} placeholder="Solar, Wind, Hydro, Hybrid, Diesel, Gas, Battery Storage" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>INSTALLED CAPACITY (kW)</Text>
                    <TextInput value={installedCapacity} onChangeText={setInstalledCapacity} keyboardType="numeric" placeholder="2500" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>AVAILABLE CAPACITY (kW)</Text>
                    <TextInput value={availableCapacity} onChangeText={setAvailableCapacity} keyboardType="numeric" placeholder="1800" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>LATITUDE</Text>
                    <TextInput value={latitude} onChangeText={setLatitude} keyboardType="numeric" placeholder="12.0022" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>LONGITUDE</Text>
                    <TextInput value={longitude} onChangeText={setLongitude} keyboardType="numeric" placeholder="8.5919" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                  </View>
                </View>

                <View>
                  <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>ADDRESS</Text>
                  <TextInput value={address} onChangeText={setAddress} placeholder="Sharada Industrial Estate" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                </View>

                <View>
                  <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>GRID CONNECTION STATUS</Text>
                  <TextInput value={gridStatus} onChangeText={setGridStatus} placeholder="CONNECTED, DISCONNECTED" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                </View>

                <View>
                  <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>UTILITY DETAILS</Text>
                  <TextInput value={utilityDetails} onChangeText={setUtilityDetails} placeholder="TCN Kano Transmission Substation (132kV Line)" placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                </View>

                <View>
                  <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>OWNER INFORMATION</Text>
                  <TextInput value={ownerInfo} onChangeText={setOwnerInfo} placeholder="Kano Clean Energy Consortium Ltd." placeholderTextColor="#64748B" style={{ borderWidth: 1, borderColor: border, color: textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontSize: 13 }} />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, borderWidth: 1, borderColor: border, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: textPrimary, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 1, backgroundColor: accent, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Save Asset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
