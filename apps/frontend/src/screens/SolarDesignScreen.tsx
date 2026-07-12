import React from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
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

  const activeProject = projectsList.find(p => p.id === currentProjectId);
  const activeProjectName = activeProject?.name || (currentProjectId?.startsWith('local-') ? 'Local Sizing' : 'Temporary Sizing');

  const getStatus = (result: any, check?: (r: any) => boolean) => {
    if (!result) return "PENDING";
    if (check) return check(result) ? "PASS" : "ERROR";
    return "PASS";
  };

  return (
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
          <TouchableOpacity onPress={() => { createNewProject(); setProjectNameInput(""); }} style={{ backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: activeText, fontSize: 11, fontWeight: "800" }}>➕ New Design</Text>
          </TouchableOpacity>
        </View>

        {/* Save/Rename Input */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
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
        </View>

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
  );
}