import React from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, Platform, Alert } from "react-native";
import { useStore } from "../store/useStore";
import { WorkspaceCard } from "../components/WorkspaceCard";
import { LoadAssessmentCard } from "../components/LoadAssessmentCard";
import { SolarPvCard } from "../components/SolarPvCard";
import { BatterySizingCard } from "../components/BatterySizingCard";
import { InverterSizingCard } from "../components/InverterSizingCard";
import { CableSizingCard } from "../components/CableSizingCard";
import { DownloadReportButton } from "../components/DownloadReportButton";
import { AiAssistantPanel } from "../components/AiAssistantPanel";

export default function SolarDesignScreen() {
  const { 
    currentProjectId, 
    projectsList, 
    saveProject, 
    loadProject, 
    createNewProject,
    deleteProject,
    results, 
    theme 
  } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const activeText = isDark ? "#00D4FF" : "#0284C7";

  const [expandedCard, setExpandedCard] = React.useState<string | null>("load");
  const [projectNameInput, setProjectNameInput] = React.useState("");

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newProjName, setNewProjName] = React.useState("");
  const [newProjLocation, setNewProjLocation] = React.useState("Lagos, Nigeria");
  const [newProjDesc, setNewProjDesc] = React.useState("");

  const activeProject = projectsList.find(p => p.id === currentProjectId);
  const activeProjectName = activeProject?.name || (currentProjectId?.startsWith('local-') ? 'Local Sizing' : 'Temporary Sizing');

  React.useEffect(() => {
    if (activeProject) {
      setProjectNameInput(activeProject.name);
    } else {
      setProjectNameInput("");
    }
  }, [currentProjectId, activeProject?.name]);

  const getStatus = (result: any, check?: (r: any) => boolean) => {
    if (!result) return "PENDING";
    if (check) return check(result) ? "PASS" : "ERROR";
    return "PASS";
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
        <Text style={{ color: "#F59E0B", fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>☀️ SOLAR DESIGN ENGINE</Text>
        <Text style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 20, fontWeight: "900", marginBottom: 6 }}>AI-Assisted System Sizing</Text>
        <Text style={{ color: sub, fontSize: 12, lineHeight: 18 }}>Complete your load profile → solar PV → battery → inverter → cable sizing workflow. Download a professional engineering report when done.</Text>
      </View>

      {/* Projects Manager Panel */}
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: border }}>
        <Text style={{ color: text, fontSize: 15, fontWeight: "800", marginBottom: 12 }}>📁 Design Projects Manager</Text>
        
        {/* Active Project Info */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: border }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: sub, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>ACTIVE PROJECT</Text>
            <Text style={{ color: text, fontSize: 15, fontWeight: "800", marginTop: 2 }}>{activeProjectName}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={{ backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: activeText, fontSize: 11, fontWeight: "800" }}>➕ New Design</Text>
          </TouchableOpacity>
        </View>

        {/* Save/Rename Input */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          <TextInput
            placeholder="Enter project name..."
            placeholderTextColor={sub}
            value={projectNameInput}
            onChangeText={setProjectNameInput}
            style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: border, paddingHorizontal: 12, color: text, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", fontSize: 13 }}
          />
          <TouchableOpacity 
            onPress={async () => {
              if (projectNameInput.trim()) {
                await saveProject(projectNameInput.trim());
              }
            }} 
            style={{ backgroundColor: accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 12 }}>💾 Save</Text>
          </TouchableOpacity>
          {currentProjectId && (
            <TouchableOpacity 
              onPress={async () => {
                const performDelete = async () => {
                  await deleteProject(currentProjectId);
                  setProjectNameInput("");
                };
                if (Platform.OS === 'web') {
                  if (window.confirm("Are you sure you want to delete this project?")) {
                    await performDelete();
                  }
                } else {
                  Alert.alert(
                    "Delete Project",
                    "Are you sure you want to delete this project?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: performDelete }
                    ]
                  );
                }
              }} 
              style={{ backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 12, justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 12 }}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save Sizing Button */}
        {currentProjectId && (
          <TouchableOpacity 
            onPress={async () => {
              const name = projectNameInput.trim() || activeProjectName;
              await saveProject(name);
              if (Platform.OS === 'web') {
                window.alert("Project Saved: Your solar profile and sizing details have been saved successfully!");
              } else {
                Alert.alert("Project Saved", "Your solar profile and sizing details have been saved successfully!");
              }
            }}
            style={{ 
              backgroundColor: "#10B981", 
              borderRadius: 10, 
              paddingVertical: 12, 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: 14
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13 }}>💾 Save All Sizing & Profiles</Text>
          </TouchableOpacity>
        )}

        {/* Project Switcher Selector */}
        {projectsList.length > 0 && (
          <View>
            <Text style={{ color: sub, fontSize: 9, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 }}>SWITCH PROJECT:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
              {projectsList.map((p) => {
                const isCurrent = p.id === currentProjectId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => loadProject(p.id)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
                      backgroundColor: isCurrent ? (isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.08)") : "transparent",
                      borderWidth: 1, borderColor: isCurrent ? accent : border,
                    }}
                  >
                    <Text style={{ color: isCurrent ? activeText : text, fontSize: 11, fontWeight: isCurrent ? "800" : "500" }}>
                      📁 {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* AI Panel */}
      <AiAssistantPanel />
      <View style={{ height: 12 }} />

      {/* Sizing Cards */}
      <WorkspaceCard title="1. Load Assessment" icon="🔌"
        status={getStatus(results.load)}
        summaryText={results.load ? `Peak demand: ${results.load.maximumDemandW.toFixed(0)} W • Daily: ${results.load.dailyEnergyKwh.toFixed(2)} kWh` : "Define connected appliances and load profile"}
        expanded={expandedCard === "load"} onToggle={() => setExpandedCard(expandedCard === "load" ? null : "load")}>
        <LoadAssessmentCard />
      </WorkspaceCard>

      <WorkspaceCard title="2. Solar PV Design" icon="☀️"
        status={getStatus(results.solar)}
        summaryText={results.solar ? `${results.solar.requiredPvSizeKw} kWp • ${results.solar.numberOfPanels} panels` : "Calculate solar generation capacity"}
        expanded={expandedCard === "solar"} onToggle={() => setExpandedCard(expandedCard === "solar" ? null : "solar")}>
        <SolarPvCard />
      </WorkspaceCard>

      <WorkspaceCard title="3. Battery Storage" icon="🔋"
        status={getStatus(results.battery)}
        summaryText={results.battery ? `${results.battery.requiredCapacityKwh} kWh • ${results.battery.batteryQty} units` : "Size battery bank for autonomy requirements"}
        expanded={expandedCard === "battery"} onToggle={() => setExpandedCard(expandedCard === "battery" ? null : "battery")}>
        <BatterySizingCard />
      </WorkspaceCard>

      <WorkspaceCard title="4. Inverter Sizing" icon="🔌"
        status={getStatus(results.inverter)}
        summaryText={results.inverter ? `${results.inverter.recommendedInverterKw} kW recommended` : "Size inverter for continuous and surge loads"}
        expanded={expandedCard === "inverter"} onToggle={() => setExpandedCard(expandedCard === "inverter" ? null : "inverter")}>
        <InverterSizingCard />
      </WorkspaceCard>

      <WorkspaceCard title="5. Cable Coordination" icon="⚡"
        status={getStatus(results.cable, (r) => r.passesCheck)}
        summaryText={results.cable ? `Voltage drop: ${results.cable.voltageDropPercent.toFixed(2)}%` : "Verify cable sizing and voltage drop limits"}
        expanded={expandedCard === "cable"} onToggle={() => setExpandedCard(expandedCard === "cable" ? null : "cable")}>
        <CableSizingCard />
      </WorkspaceCard>

      {/* Summary & Download */}
      {results.load && results.solar && results.battery && results.inverter && (
        <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)", borderRadius: 20, padding: 20, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
          <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "700", marginBottom: 12 }}>✅ System Design Complete</Text>
          {[
            ["PV Capacity", `${results.solar.requiredPvSizeKw} kWp (${results.solar.numberOfPanels} panels)`],
            ["Battery Bank", `${results.battery.requiredCapacityKwh} kWh`],
            ["Inverter", `${results.inverter.recommendedInverterKw} kW`],
            ["Est. Annual Gen.", `${results.solar.expectedAnnualGenKwh?.toFixed(0) ?? "-"} kWh`],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: sub, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 13, fontWeight: "700" }}>{v}</Text>
            </View>
          ))}
          <View style={{ marginTop: 12 }}>
            <DownloadReportButton />
          </View>
        </View>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>

    {showCreateModal && (
      <View style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: 16
      }}>
        <View style={{
          backgroundColor: card,
          borderRadius: 24,
          width: "100%",
          maxWidth: 400,
          padding: 24,
          borderWidth: 1,
          borderColor: border,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 10
        }}>
          <Text style={{ color: text, fontSize: 18, fontWeight: "900", marginBottom: 6 }}>➕ Create New Project</Text>
          <Text style={{ color: sub, fontSize: 12, marginBottom: 20 }}>Specify your energy system design parameters to initialize the project.</Text>
          
          {/* Project Name */}
          <Text style={{ color: text, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>PROJECT NAME</Text>
          <TextInput
            placeholder="e.g., Home Solar Sizing, Office Backup"
            placeholderTextColor={sub}
            value={newProjName}
            onChangeText={setNewProjName}
            style={{
              height: 44, borderRadius: 12, borderWidth: 1, borderColor: border,
              paddingHorizontal: 12, color: text, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
              fontSize: 13, marginBottom: 16
            }}
          />

          {/* Location */}
          <Text style={{ color: text, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>LOCATION</Text>
          <TextInput
            placeholder="e.g., Lagos, Nigeria"
            placeholderTextColor={sub}
            value={newProjLocation}
            onChangeText={setNewProjLocation}
            style={{
              height: 44, borderRadius: 12, borderWidth: 1, borderColor: border,
              paddingHorizontal: 12, color: text, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
              fontSize: 13, marginBottom: 16
            }}
          />

          {/* Description */}
          <Text style={{ color: text, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            placeholder="e.g., 5kW Hybrid Inverter Sizing for home appliances"
            placeholderTextColor={sub}
            value={newProjDesc}
            onChangeText={setNewProjDesc}
            multiline
            numberOfLines={2}
            style={{
              height: 60, borderRadius: 12, borderWidth: 1, borderColor: border,
              paddingHorizontal: 12, paddingTop: 10, color: text, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
              fontSize: 13, marginBottom: 24, textAlignVertical: "top"
            }}
          />

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                setNewProjName("");
                setNewProjDesc("");
              }}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
              }}
            >
              <Text style={{ color: text, fontWeight: "700", fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={async () => {
                if (newProjName.trim()) {
                  await createNewProject(newProjName.trim(), newProjLocation.trim(), newProjDesc.trim());
                  setShowCreateModal(false);
                  setNewProjName("");
                  setNewProjDesc("");
                }
              }}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                backgroundColor: accent, justifyContent: "center", alignItems: "center"
              }}
            >
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 12 }}>Create Project</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )}
  </>
  );
}