import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { DownloadReportButton } from './DownloadReportButton';

const COMPLIANCE_CHECKS = [
  {
    id: 'cable',
    label: 'Voltage Drop (IEC 60364)',
    getStatus: (results: any) => {
      if (!results.cable) return 'PENDING';
      return results.cable.passesCheck ? 'PASS' : 'FAIL';
    },
    getDetail: (results: any, inputs: any) =>
      results.cable
        ? `${results.cable.voltageDropPercent.toFixed(2)}% drop on ${inputs.areaMm2}mm² × ${inputs.lengthMeters}m cable (limit: 3.0%)`
        : 'Run calculation to check',
  },
  {
    id: 'inverter',
    label: 'Inverter Safety Margin (≥ 1.25×)',
    getStatus: (results: any) => {
      if (!results.inverter) return 'PENDING';
      return results.inverter.safetyMarginUsed >= 1.25 ? 'PASS' : 'FAIL';
    },
    getDetail: (results: any) =>
      results.inverter
        ? `Safety factor: ×${results.inverter.safetyMarginUsed.toFixed(2)} — ${results.inverter.recommendedInverterKw} kW rating`
        : 'Run calculation to check',
  },
  {
    id: 'battery',
    label: 'Battery DoD (≤ 80%)',
    getStatus: (results: any, inputs: any) => {
      if (!results.battery) return 'PENDING';
      return inputs.dod <= 0.8 ? 'PASS' : 'WARN';
    },
    getDetail: (results: any, inputs: any) =>
      results.battery
        ? `DoD set to ${(inputs.dod * 100).toFixed(0)}% — ${results.battery.batteryQty} × 200Ah batteries`
        : 'Run calculation to check',
  },
  {
    id: 'pv',
    label: 'PV Oversizing Check (≤ 130%)',
    getStatus: (results: any) => {
      if (!results.solar || !results.load) return 'PENDING';
      const ratio = results.solar.expectedAnnualGenKwh / (results.load.annualEnergyKwh || 1);
      return ratio <= 1.3 ? 'PASS' : 'WARN';
    },
    getDetail: (results: any) => {
      if (!results.solar || !results.load) return 'Run calculation to check';
      const ratio = results.solar.expectedAnnualGenKwh / (results.load.annualEnergyKwh || 1);
      return `Generation / Load ratio: ${(ratio * 100).toFixed(0)}% (${results.solar.expectedAnnualGenKwh.toFixed(0)} kWh gen vs ${results.load.annualEnergyKwh.toFixed(0)} kWh demand)`;
    },
  },
];

const APPLIANCE_LABELS = [
  { icon: '💡', label: 'LED Lights', powerW: 15 },
  { icon: '🌀', label: 'Ceiling Fans', powerW: 80 },
  { icon: '📺', label: 'TV / Laptops', powerW: 150 },
  { icon: '🍳', label: 'Microwave / Kettle', powerW: 1000 },
];

export const InstallerDashboard: React.FC = () => {
  const { theme, inputs, results, updateInputs, runAllCalculations } = useStore();
  const C = Colors[theme];
  const [expandBom, setExpandBom] = useState(true);

  const handleQtyChange = (idx: number, delta: number) => {
    const updated = inputs.appliances.map((a, i) =>
      i === idx ? { ...a, quantity: Math.max(0, a.quantity + delta) } : a
    );
    updateInputs({ appliances: updated });
  };

  const handlePshChange = (delta: number) => {
    updateInputs({ peakSunHours: parseFloat(Math.max(1, inputs.peakSunHours + delta).toFixed(1)) });
  };

  const handleLengthChange = (delta: number) => {
    updateInputs({ lengthMeters: Math.max(1, inputs.lengthMeters + delta) });
  };

  const handleAutonomyChange = (delta: number) => {
    updateInputs({ autonomyDays: parseFloat(Math.max(0.5, inputs.autonomyDays + delta).toFixed(1)) });
  };

  const toggleVoltage = () => {
    const next = inputs.batteryVoltage === 12 ? 24 : inputs.batteryVoltage === 24 ? 48 : 12;
    updateInputs({ batteryVoltage: next });
  };

  const hasResults = !!results.load;

  const s = StyleSheet.create({
    page: { paddingBottom: 40 },
    section: {
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    sectionTitle: { color: C.textPrimary, fontWeight: '700', fontSize: 15 },
    sectionSub: { color: C.textSecondary, fontSize: 12, marginBottom: Spacing.sm },
    // Row controls
    controlRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    rowLeft: { flex: 1 },
    rowLabel: { color: C.textPrimary, fontSize: 13, fontWeight: '500' },
    rowSub: { color: C.textSecondary, fontSize: 11 },
    stepper: { flexDirection: 'row', alignItems: 'center' },
    stepBtn: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    },
    stepBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 18 },
    stepVal: { color: C.textPrimary, fontWeight: '700', fontSize: 14, marginHorizontal: Spacing.sm, minWidth: 40, textAlign: 'center' },
    voltageBtn: {
      paddingVertical: 4, paddingHorizontal: 12,
      backgroundColor: C.primary, borderRadius: BorderRadius.xs,
    },
    voltageBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    // CTA
    ctaBtn: {
      backgroundColor: C.secondary, borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm,
    },
    ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    // BOM table
    bomHeader: {
      flexDirection: 'row', paddingVertical: Spacing.xs,
      borderBottomWidth: 2, borderBottomColor: C.border,
      marginBottom: Spacing.xs,
    },
    bomHeaderCell: { color: C.textSecondary, fontSize: 11, fontWeight: '700', flex: 1 },
    bomRow: {
      flexDirection: 'row', paddingVertical: Spacing.xs,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    bomCell: { color: C.textPrimary, fontSize: 13, flex: 1 },
    bomCellBold: { fontWeight: '700', color: C.primary },
    // Compliance
    compRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    badge: {
      paddingVertical: 3, paddingHorizontal: 8,
      borderRadius: BorderRadius.full,
      minWidth: 56, alignItems: 'center',
      marginRight: Spacing.sm,
    },
    badgeText: { fontSize: 11, fontWeight: '800' },
    compLabel: { color: C.textPrimary, fontWeight: '600', fontSize: 13, flex: 1 },
    compDetail: { color: C.textSecondary, fontSize: 11, flex: 1, marginTop: 2 },
    // Site info pills
    sitePills: { flexDirection: 'row', flexWrap: 'wrap' },
    sitePill: {
      backgroundColor: C.divider, borderRadius: BorderRadius.sm,
      paddingVertical: 4, paddingHorizontal: Spacing.sm,
      marginRight: Spacing.xs, marginBottom: Spacing.xs,
    },
    sitePillLabel: { color: C.textSecondary, fontSize: 10, fontWeight: '600' },
    sitePillValue: { color: C.textPrimary, fontSize: 13, fontWeight: '700' },
  });

  const getBadgeStyle = (status: string) => {
    if (status === 'PASS') return { bg: C.successLight, text: C.success };
    if (status === 'FAIL') return { bg: C.errorLight, text: C.error };
    if (status === 'WARN') return { bg: C.warningLight, text: C.warning };
    return { bg: C.divider, text: C.textSecondary };
  };

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>

      {/* ── Site Configuration Summary ──────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📍 Site Configuration</Text>
        <Text style={[s.sectionSub, { marginTop: 4 }]}>Quick reference — adjust below</Text>
        <View style={s.sitePills}>
          {[
            { label: 'SYSTEM VOLTAGE', value: `${inputs.batteryVoltage}V DC` },
            { label: 'PEAK SUN HOURS', value: `${inputs.peakSunHours} hrs/day` },
            { label: 'AUTONOMY', value: `${inputs.autonomyDays} day(s)` },
            { label: 'CABLE RUN', value: `${inputs.lengthMeters}m × ${inputs.areaMm2}mm²` },
            { label: 'PANEL RATING', value: `${inputs.panelRatingW}W` },
          ].map((p, i) => (
            <View key={i} style={s.sitePill}>
              <Text style={s.sitePillLabel}>{p.label}</Text>
              <Text style={s.sitePillValue}>{p.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Load Inventory ──────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🔌 Connected Load Inventory</Text>

        {inputs.appliances.map((app, idx) => {
          const info = APPLIANCE_LABELS[idx];
          return (
            <View key={idx} style={s.controlRow}>
              <View style={s.rowLeft}>
                <Text style={s.rowLabel}>{info?.icon} {info?.label} ({info?.powerW}W)</Text>
                <Text style={s.rowSub}>{app.hoursOn.filter(h => h > 0).length}h/day · subtotal: {(info?.powerW || 0) * app.quantity}W</Text>
              </View>
              <View style={s.stepper}>
                <TouchableOpacity style={s.stepBtn} onPress={() => handleQtyChange(idx, -1)}>
                  <Text style={s.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.stepVal}>{app.quantity} units</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => handleQtyChange(idx, 1)}>
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── System Parameters ───────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>⚙️ System Parameters</Text>

        <View style={s.controlRow}>
          <View style={s.rowLeft}>
            <Text style={s.rowLabel}>Peak Sun Hours</Text>
            <Text style={s.rowSub}>Location-based solar irradiance</Text>
          </View>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={() => handlePshChange(-0.2)}>
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.stepVal}>{inputs.peakSunHours} h</Text>
            <TouchableOpacity style={s.stepBtn} onPress={() => handlePshChange(0.2)}>
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.controlRow}>
          <View style={s.rowLeft}>
            <Text style={s.rowLabel}>Autonomy Period</Text>
            <Text style={s.rowSub}>Days of backup without solar</Text>
          </View>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={() => handleAutonomyChange(-0.5)}>
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.stepVal}>{inputs.autonomyDays} day</Text>
            <TouchableOpacity style={s.stepBtn} onPress={() => handleAutonomyChange(0.5)}>
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.controlRow}>
          <View style={s.rowLeft}>
            <Text style={s.rowLabel}>System Bus Voltage</Text>
            <Text style={s.rowSub}>DC voltage for battery/inverter</Text>
          </View>
          <TouchableOpacity style={s.voltageBtn} onPress={toggleVoltage}>
            <Text style={s.voltageBtnText}>{inputs.batteryVoltage}V →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.controlRow}>
          <View style={s.rowLeft}>
            <Text style={s.rowLabel}>Cable Run (One-Way)</Text>
            <Text style={s.rowSub}>Distance from array to load centre</Text>
          </View>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={() => handleLengthChange(-5)}>
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.stepVal}>{inputs.lengthMeters}m</Text>
            <TouchableOpacity style={s.stepBtn} onPress={() => handleLengthChange(5)}>
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.ctaBtn} onPress={runAllCalculations}>
          <Text style={s.ctaBtnText}>🛠️ Run Full Site Assessment</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bill of Materials ───────────────────────────────────────────── */}
      {hasResults && results.solar && results.battery && results.inverter && results.cable && (
        <View style={s.section}>
          <TouchableOpacity
            style={s.sectionHeader}
            onPress={() => setExpandBom(!expandBom)}
          >
            <Text style={s.sectionTitle}>📋 Bill of Materials</Text>
            <Text style={{ color: C.textSecondary, fontSize: 18 }}>{expandBom ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {expandBom && (
            <>
              <View style={s.bomHeader}>
                <Text style={[s.bomHeaderCell, { flex: 2 }]}>ITEM</Text>
                <Text style={s.bomHeaderCell}>QTY</Text>
                <Text style={s.bomHeaderCell}>SPEC</Text>
              </View>

              {[
                {
                  item: '☀️ Solar PV Module',
                  qty: `${results.solar.numberOfPanels}×`,
                  spec: `${inputs.panelRatingW}W Monocrystalline`,
                },
                {
                  item: '🔋 Battery Unit',
                  qty: `${results.battery.batteryQty}×`,
                  spec: `12V 200Ah LFP`,
                },
                {
                  item: '🔌 Hybrid Inverter',
                  qty: '1×',
                  spec: `${results.inverter.recommendedInverterKw} kW Pure Sine`,
                },
                {
                  item: '⚡ DC Cable (Cu)',
                  qty: `${inputs.lengthMeters * 2}m`,
                  spec: `${inputs.areaMm2}mm² copper`,
                },
                {
                  item: '🔧 Charge Controller',
                  qty: '1×',
                  spec: `MPPT ${(results.solar.requiredPvSizeKw * 1000 / inputs.batteryVoltage).toFixed(0)}A`,
                },
                {
                  item: '🛡️ DC Isolator',
                  qty: '2×',
                  spec: `${inputs.batteryVoltage}V rated`,
                },
                {
                  item: '⚡ AC Circuit Breaker',
                  qty: '1×',
                  spec: `${(results.inverter.recommendedInverterKw * 1000 / 230 * 1.25).toFixed(0)}A MCB`,
                },
              ].map((row, i) => (
                <View key={i} style={s.bomRow}>
                  <Text style={[s.bomCell, { flex: 2 }]}>{row.item}</Text>
                  <Text style={[s.bomCell, s.bomCellBold]}>{row.qty}</Text>
                  <Text style={s.bomCell}>{row.spec}</Text>
                </View>
              ))}

              <View style={[s.bomRow, { borderBottomWidth: 0, marginTop: Spacing.xs }]}>
                <Text style={[s.bomCell, { flex: 2, fontWeight: '700', color: C.textPrimary }]}>Total PV Array</Text>
                <Text style={[s.bomCell, s.bomCellBold]}>{results.solar.requiredPvSizeKw} kWp</Text>
                <Text style={s.bomCell}>{results.solar.expectedAnnualGenKwh.toFixed(0)} kWh/yr</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* ── Compliance Checks ───────────────────────────────────────────── */}
      {hasResults && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>✅ Installation Compliance</Text>
          <Text style={s.sectionSub}>IEC/NEC standard checks — must all pass before commissioning</Text>

          {COMPLIANCE_CHECKS.map((check) => {
            const status = check.getStatus(results, inputs);
            const detail = check.getDetail(results, inputs);
            const badge = getBadgeStyle(status);

            return (
              <View key={check.id} style={s.compRow}>
                <View style={[s.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.badgeText, { color: badge.text }]}>{status}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.compLabel}>{check.label}</Text>
                  <Text style={s.compDetail}>{detail}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── System Performance Summary ─────────────────────────────────── */}
      {hasResults && results.solar && results.battery && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>📈 Performance Summary</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Connected Load', value: `${results.load?.connectedLoadW || 0} W` },
              { label: 'Peak Design Demand', value: `${results.load?.maximumDemandW.toFixed(0) || 0} W` },
              { label: 'Daily Energy', value: `${results.load?.dailyEnergyKwh.toFixed(2) || 0} kWh` },
              { label: 'Annual Generation', value: `${results.solar.expectedAnnualGenKwh.toFixed(0)} kWh` },
              { label: 'Battery Capacity', value: `${results.battery.requiredCapacityKwh} kWh` },
              { label: 'Voltage Drop', value: results.cable ? `${results.cable.voltageDropPercent.toFixed(2)}%` : '--' },
            ].map((item, i) => (
              <View key={i} style={{
                width: '48%',
                backgroundColor: C.divider,
                borderRadius: BorderRadius.sm,
                padding: Spacing.sm,
                marginBottom: Spacing.xs,
                marginRight: i % 2 === 0 ? '4%' : 0,
              }}>
                <Text style={{ color: C.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                  {item.label.toUpperCase()}
                </Text>
                <Text style={{ color: C.primary, fontWeight: '800', fontSize: 16 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!hasResults && (
        <View style={{ alignItems: 'center', padding: Spacing.xxl }}>
          <Text style={{ fontSize: 48 }}>🛠️</Text>
          <Text style={{ color: C.textPrimary, fontWeight: '700', fontSize: 18, marginTop: Spacing.sm }}>
            Configure & Assess
          </Text>
          <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', marginTop: Spacing.xs }}>
            Enter the site load inventory and system parameters above, then tap "Run Full Site Assessment" to generate the BOM and compliance report.
          </Text>
        </View>
      )}
      <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.sm }}>
        <DownloadReportButton />
      </View>
    </ScrollView>
  );
};
