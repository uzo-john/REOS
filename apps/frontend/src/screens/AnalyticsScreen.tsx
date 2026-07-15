import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useStore } from "../store/useStore";

const { width } = Dimensions.get("window");

// ── Simulated 7-day hourly generation data (kWh per hour, hours 6-18 typical solar)
const generate7DayData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const base = 18 + Math.sin(i * 0.8) * 4;
    const variation = (Math.random() * 6 - 3);
    const gen = Math.max(5, base + variation);
    const load = gen * (0.55 + Math.random() * 0.25);
    const export_ = Math.max(0, gen - load);
    return {
      day,
      generation: parseFloat(gen.toFixed(1)),
      load: parseFloat(load.toFixed(1)),
      export: parseFloat(export_.toFixed(1)),
      revenue: parseFloat((export_ * 225 / 1000).toFixed(0)),
    };
  });
};

const WEEKLY_DATA = generate7DayData();

// Simulated 30-day monthly data
const MONTHLY_TOTALS = {
  totalGenKwh: 482.6,
  totalExportKwh: 124.8,
  totalLoadKwh: 357.8,
  totalRevenueNgn: 28080,
  co2SavedKg: 207.5,
  peakGenKw: 4.8,
  avgDailyKwh: 16.1,
  systemEfficiency: 94.2,
  pr: 91.5,              // Performance Ratio
  capacityFactor: 22.1,
};

// Hourly generation profile (24h average)
const HOURLY_GEN = [
  0, 0, 0, 0, 0, 0,
  0.2, 0.8, 1.5, 2.6, 3.4, 3.9,
  4.1, 4.2, 3.8, 3.1, 2.2, 1.2,
  0.4, 0.1, 0, 0, 0, 0,
];
const MAX_HOURLY = Math.max(...HOURLY_GEN);

// Mini bar chart component
function BarChart({ data, color, maxVal }: { data: number[]; color: string; maxVal: number }) {
  const barW = (width - 48 - (data.length - 1) * 4) / data.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 60, gap: 4 }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            width: barW,
            height: Math.max(2, (v / maxVal) * 56),
            backgroundColor: color,
            borderRadius: 3,
            opacity: 0.85,
          }}
        />
      ))}
    </View>
  );
}

// Simple stacked row bar
function StackedBar({ gen, load, export_: exp }: { gen: number; load: number; export_: number }) {
  const total = gen;
  const w = width - 80;
  return (
    <View style={{ height: 8, width: w, borderRadius: 4, flexDirection: "row", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" }}>
      <View style={{ width: (load / total) * w, backgroundColor: "#00D4FF", borderRadius: 4 }} />
      <View style={{ width: (exp / total) * w, backgroundColor: "#10B981", borderRadius: 4 }} />
    </View>
  );
}

type Period = "7D" | "30D" | "3M";

export default function AnalyticsScreen() {
  const { theme, telemetry, results } = useStore();
  const isDark = theme === "dark";
  const bg     = isDark ? "#050810" : "#F1F5F9";
  const card   = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text   = isDark ? "#F1F5F9" : "#0F172A";
  const sub    = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  const [period, setPeriod] = useState<Period>("7D");
  const [tab, setTab] = useState<"generation" | "financial" | "system">("generation");

  const totalGen  = WEEKLY_DATA.reduce((s, d) => s + d.generation, 0).toFixed(1);
  const totalLoad = WEEKLY_DATA.reduce((s, d) => s + d.load, 0).toFixed(1);
  const totalExp  = WEEKLY_DATA.reduce((s, d) => s + d.export, 0).toFixed(1);
  const totalRev  = WEEKLY_DATA.reduce((s, d) => s + d.revenue, 0).toFixed(0);

  const maxGen = Math.max(...WEEKLY_DATA.map(d => d.generation));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
        <Text style={{ color: accent, fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 }}>📊 ENERGY ANALYTICS</Text>
        <Text style={{ color: text, fontSize: 20, fontWeight: "900" }}>Performance Dashboard</Text>
        <Text style={{ color: sub, fontSize: 12, marginTop: 4 }}>
          Site efficiency: <Text style={{ color: "#10B981", fontWeight: "700" }}>{MONTHLY_TOTALS.systemEfficiency}%</Text> • PR: {MONTHLY_TOTALS.pr}% • CF: {MONTHLY_TOTALS.capacityFactor}%
        </Text>
      </View>

      {/* Period Selector */}
      <View style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {(["7D", "30D", "3M"] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={{ flex: 1, backgroundColor: period === p ? accent : "transparent", borderRadius: 10, padding: 10, alignItems: "center" }}
          >
            <Text style={{ color: period === p ? "#000" : sub, fontWeight: "700", fontSize: 13 }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
          {([
            ["generation", "⚡ Generation"],
            ["financial",  "💰 Financial"],
            ["system",     "🛡️ System"],
          ] as const).map(([t, label]) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                backgroundColor: tab === t ? accent : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: tab === t ? accent : border,
              }}
            >
              <Text style={{ color: tab === t ? "#000" : sub, fontWeight: "700", fontSize: 12 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── GENERATION TAB ── */}
      {tab === "generation" && (
        <>
          {/* Summary KPIs */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {([
              ["Total Gen.",  `${totalGen} kWh`, "#F59E0B"],
              ["Consumed",   `${totalLoad} kWh`, "#00D4FF"],
              ["Exported",   `${totalExp} kWh`,  "#10B981"],
            ] as [string, string, string][]).map(([label, value, color]) => (
              <View key={label} style={{ flex: 1, minWidth: "30%", backgroundColor: `${color}12`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${color}25`, alignItems: "center" }}>
                <Text style={{ color, fontSize: 18, fontWeight: "900" }}>{value}</Text>
                <Text style={{ color: sub, fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Daily Generation Chart */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>☀️ Daily Generation (kWh)</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4 }}>
              {WEEKLY_DATA.map((d, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <View style={{ width: "100%", height: Math.max(2, (d.generation / maxGen) * 68), backgroundColor: "#F59E0B", borderRadius: 4, marginBottom: 4 }} />
                  <Text style={{ color: sub, fontSize: 9, fontWeight: "600" }}>{d.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Daily Breakdown Table */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>📋 Day-by-Day Breakdown</Text>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              {["Day", "Gen", "Load", "Export"].map(h => (
                <Text key={h} style={{ flex: 1, color: sub, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</Text>
              ))}
            </View>
            {WEEKLY_DATA.map((d, i) => (
              <View key={d.day} style={{ flexDirection: "row", paddingVertical: 10, borderBottomWidth: i < WEEKLY_DATA.length - 1 ? 1 : 0, borderBottomColor: border }}>
                <Text style={{ flex: 1, color: text, fontSize: 13, fontWeight: "600" }}>{d.day}</Text>
                <Text style={{ flex: 1, color: "#F59E0B", fontSize: 13, fontWeight: "700" }}>{d.generation}</Text>
                <Text style={{ flex: 1, color: accent, fontSize: 13, fontWeight: "700" }}>{d.load}</Text>
                <Text style={{ flex: 1, color: "#10B981", fontSize: 13, fontWeight: "700" }}>{d.export}</Text>
              </View>
            ))}
          </View>

          {/* Hourly Generation Profile */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 4 }}>🕐 Typical Daily Generation Profile</Text>
            <Text style={{ color: sub, fontSize: 11, marginBottom: 14 }}>Average hour-by-hour output (kW)</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: 60, gap: 2 }}>
              {HOURLY_GEN.map((v, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: "100%",
                      height: Math.max(1, (v / MAX_HOURLY) * 52),
                      backgroundColor: v > 3.5 ? "#F59E0B" : v > 1.5 ? "#F97316" : v > 0.3 ? "#FBBF24" : "#94A3B8",
                      borderRadius: 3,
                    }}
                  />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              {["0h", "6h", "12h", "18h", "23h"].map(t => (
                <Text key={t} style={{ color: sub, fontSize: 9 }}>{t}</Text>
              ))}
            </View>
          </View>
        </>
      )}

      {/* ── FINANCIAL TAB ── */}
      {tab === "financial" && (
        <>
          {/* Revenue Summary */}
          <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)", borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" }}>
            <Text style={{ color: sub, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>7-DAY EXPORT REVENUE</Text>
            <Text style={{ color: "#10B981", fontSize: 32, fontWeight: "900" }}>₦{parseInt(totalRev).toLocaleString()}</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 4 }}>@ ₦225/kWh grid tariff • {totalExp} kWh exported</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {([
              ["Monthly Rev.",    `₦${MONTHLY_TOTALS.totalRevenueNgn.toLocaleString()}`, "#10B981"],
              ["Saved (Bills)",   "₦12,400",   "#F59E0B"],
              ["CO₂ Credits",    `${MONTHLY_TOTALS.co2SavedKg} kg`, "#7C3AED"],
            ] as [string, string, string][]).map(([label, value, color]) => (
              <View key={label} style={{ flex: 1, minWidth: "30%", backgroundColor: `${color}12`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${color}25`, alignItems: "center" }}>
                <Text style={{ color, fontSize: 15, fontWeight: "900", textAlign: "center" }}>{value}</Text>
                <Text style={{ color: sub, fontSize: 9, fontWeight: "600", marginTop: 2, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Daily Revenue Chart */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>💰 Daily Export Revenue (₦)</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4 }}>
              {WEEKLY_DATA.map((d, i) => {
                const maxRev = Math.max(...WEEKLY_DATA.map(x => x.revenue));
                return (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: "#10B981", fontSize: 8, marginBottom: 2, fontWeight: "700" }}>
                      {d.revenue > 0 ? d.revenue : ""}
                    </Text>
                    <View style={{ width: "100%", height: Math.max(2, (d.revenue / Math.max(maxRev, 1)) * 56), backgroundColor: "#10B981", borderRadius: 4, marginBottom: 4 }} />
                    <Text style={{ color: sub, fontSize: 9, fontWeight: "600" }}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 25-Year ROI Projection */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>📈 25-Year ROI Projection</Text>
            {[
              ["System CAPEX",           "₦2,800,000", sub],
              ["Annual Export Revenue",  "₦338,000",   "#10B981"],
              ["Annual Grid Bill Saved", "₦148,800",   "#F59E0B"],
              ["Total Annual Savings",   "₦486,800",   accent],
              ["Payback Period",         "5.75 years",  accent],
              ["25-Year Net Savings",    "₦9,370,000", "#10B981"],
              ["25-Year ROI",            "+334%",       "#10B981"],
            ].map(([label, value, color]) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                <Text style={{ color: sub, fontSize: 13 }}>{label}</Text>
                <Text style={{ color, fontSize: 13, fontWeight: "800" }}>{value}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── SYSTEM TAB ── */}
      {tab === "system" && (
        <>
          {/* System Health KPIs */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {([
              ["Performance Ratio",   `${MONTHLY_TOTALS.pr}%`,            "#10B981", "PR is the ratio of actual to theoretical output"],
              ["Capacity Factor",     `${MONTHLY_TOTALS.capacityFactor}%`, "#F59E0B", "% of max possible generation achieved"],
              ["System Efficiency",   `${MONTHLY_TOTALS.systemEfficiency}%`, accent,  "Overall DC-AC conversion efficiency"],
              ["Peak Generation",     `${MONTHLY_TOTALS.peakGenKw} kW`,   "#7C3AED", "Maximum instantaneous output recorded"],
            ] as [string, string, string, string][]).map(([label, value, color, desc]) => (
              <View key={label} style={{ flex: 1, minWidth: "45%", backgroundColor: `${color}12`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${color}25` }}>
                <Text style={{ color, fontSize: 22, fontWeight: "900" }}>{value}</Text>
                <Text style={{ color: text, fontSize: 11, fontWeight: "700", marginTop: 4 }}>{label}</Text>
                <Text style={{ color: sub, fontSize: 9, marginTop: 4, lineHeight: 13 }}>{desc}</Text>
              </View>
            ))}
          </View>

          {/* Cumulative Data */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>📊 Monthly Summary</Text>
            {[
              ["Total Generation",   `${MONTHLY_TOTALS.totalGenKwh} kWh`,   "#F59E0B"],
              ["Self-Consumed",      `${MONTHLY_TOTALS.totalLoadKwh} kWh`,   accent],
              ["Grid Export",        `${MONTHLY_TOTALS.totalExportKwh} kWh`, "#10B981"],
              ["Avg Daily Output",   `${MONTHLY_TOTALS.avgDailyKwh} kWh`,    sub],
              ["CO₂ Avoided",        `${MONTHLY_TOTALS.co2SavedKg} kg`,      "#7C3AED"],
            ].map(([label, value, color]) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                <Text style={{ color: sub, fontSize: 13 }}>{label}</Text>
                <Text style={{ color, fontSize: 13, fontWeight: "800" }}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Energy Balance Bars */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 4 }}>⚡ Weekly Energy Balance</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: accent }} /><Text style={{ color: sub, fontSize: 10 }}>Load</Text></View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#10B981" }} /><Text style={{ color: sub, fontSize: 10 }}>Export</Text></View>
            </View>
            {WEEKLY_DATA.map(d => (
              <View key={d.day} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                  <Text style={{ color: sub, fontSize: 11, fontWeight: "600" }}>{d.day}</Text>
                  <Text style={{ color: sub, fontSize: 11 }}>{d.generation} kWh gen</Text>
                </View>
                <StackedBar gen={d.generation} load={d.load} export_={d.export} />
              </View>
            ))}
          </View>

          {/* Compliance & Standards */}
          <View style={{ backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 14 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800", marginBottom: 14 }}>🛡️ Compliance & Standards</Text>
            {[
              ["IEC 60364 Cable Compliance",    "PASS",       "#10B981"],
              ["IEC 61727 Grid Interface",      "PASS",       "#10B981"],
              ["Anti-Islanding Protection",     "ACTIVE",     "#10B981"],
              ["Harmonic THD (Voltage)",        "1.8% < 5%",  "#10B981"],
              ["Voltage Imbalance",             "0.4% < 2%",  "#10B981"],
              ["Power Factor",                  "0.98",       "#F59E0B"],
              ["Grid Voltage",                  "228–234 V",  "#F59E0B"],
            ].map(([label, status, color]) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                <Text style={{ color: sub, fontSize: 12, flex: 1 }}>{label}</Text>
                <View style={{ backgroundColor: `${color}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color, fontSize: 11, fontWeight: "700" }}>● {status}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}