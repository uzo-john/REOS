import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { GridExportWizard } from './GridExportWizard';
import { DownloadReportButton } from './DownloadReportButton';
import { IotControlCenter } from './IotControlCenter';
import { EnergyTradingHub } from './EnergyTradingHub';
import { EnergyGoalOptimizer } from './EnergyGoalOptimizer';

// ─── Currency config ─────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Naira', defaultTariff: 225, defaultCapex: 2500000 },
  { code: 'USD', symbol: '$', name: 'USD', defaultTariff: 0.14, defaultCapex: 2500 },
  { code: 'GBP', symbol: '£', name: 'GBP', defaultTariff: 0.28, defaultCapex: 2000 },
  { code: 'EUR', symbol: '€', name: 'EUR', defaultTariff: 0.25, defaultCapex: 2200 },
  { code: 'ZAR', symbol: 'R', name: 'Rand', defaultTariff: 2.5, defaultCapex: 45000 },
  { code: 'KES', symbol: 'KSh', name: 'Shilling', defaultTariff: 25, defaultCapex: 330000 },
  { code: 'GHS', symbol: '₵', name: 'Cedi', defaultTariff: 1.5, defaultCapex: 35000 },
] as const;

const APPLIANCE_LABELS = [
  { icon: '💡', label: 'LED Lights', sub: '15W each' },
  { icon: '🌀', label: 'Ceiling Fans', sub: '80W each' },
  { icon: '📺', label: 'TV / Laptops', sub: '150W each' },
  { icon: '🍳', label: 'Microwave / Kettle', sub: '1000W each' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number, sym: string) => {
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}k`;
  return `${sym}${n.toFixed(2)}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const CustomerDashboard: React.FC = () => {
  const { 
    theme, inputs, results, updateInputs, runAllCalculations,
    gridExportStatus, accumulatedCredits, telemetry 
  } = useStore();
  const C = Colors[theme];

  const [dashTab, setDashTab] = useState<'MY_SYSTEM' | 'TRADING'>('MY_SYSTEM');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferKwh, setTransferKwh] = useState('');
  const [tariffInput, setTariffInput] = useState(String(inputs.gridTariffRate));
  const [capexInput, setCapexInput] = useState(String(inputs.capexBudget));
  const [isWizardVisible, setIsWizardVisible] = useState(false);

  const currency = CURRENCIES.find(c => c.code === inputs.currency) || CURRENCIES[0];

  const handleCurrencyChange = (code: typeof inputs.currency) => {
    const cfg = CURRENCIES.find(c => c.code === code)!;
    updateInputs({ currency: code, gridTariffRate: cfg.defaultTariff, capexBudget: cfg.defaultCapex });
    setTariffInput(String(cfg.defaultTariff));
    setCapexInput(String(cfg.defaultCapex));
  };

  const handleQtyChange = (idx: number, delta: number) => {
    const updated = inputs.appliances.map((a, i) =>
      i === idx ? { ...a, quantity: Math.max(0, a.quantity + delta) } : a
    );
    updateInputs({ appliances: updated });
  };

  // ── Derived metrics ────────────────────────────────────────────────────────
  const dailyGenKwh = results.solar ? results.solar.expectedAnnualGenKwh / 365 : 0;
  const dailyUseKwh = results.load ? results.load.dailyEnergyKwh : 0;
  const dailySurplusKwh = Math.max(0, dailyGenKwh - dailyUseKwh);
  const monthlySurplusKwh = dailySurplusKwh * 30;
  const selfSufficiency = dailyGenKwh > 0 ? Math.min(100, (dailyUseKwh / dailyGenKwh) * 100) : 0;
  const batteryBackupHrs = results.battery && dailyUseKwh > 0
    ? (results.battery.requiredCapacityKwh / (dailyUseKwh / 24)).toFixed(1)
    : '--';

  const tariff = parseFloat(tariffInput) || 0;
  const capex = parseFloat(capexInput) || 0;

  const monthlyGridBill = dailyUseKwh * 30 * tariff;
  const monthlyImportBill = Math.max(0, dailyUseKwh - dailyGenKwh) * 30 * tariff;
  const monthlySurplusRevenue = monthlySurplusKwh * tariff;
  const monthlyBenefit = (monthlyGridBill - monthlyImportBill) + monthlySurplusRevenue;
  const paybackYears = monthlyBenefit > 0 ? (capex / (monthlyBenefit * 12)).toFixed(1) : '--';
  const savings25yr = monthlyBenefit > 0 ? (monthlyBenefit * 12 * 25) - capex : 0;

  const transferKwhNum = parseFloat(transferKwh) || 0;
  const transferValue = transferKwhNum * tariff;

  const s = StyleSheet.create({
    page: { paddingBottom: 40 },
    // Section
    section: {
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionTitle: { color: C.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: Spacing.sm },
    sectionSub: { color: C.textSecondary, fontSize: 12, marginBottom: Spacing.sm },
    // Currency pills
    currencyRow: { flexDirection: 'row', flexWrap: 'wrap' },
    pill: {
      paddingVertical: 5, paddingHorizontal: 10,
      borderRadius: BorderRadius.full,
      borderWidth: 1.5, borderColor: C.border,
      marginRight: Spacing.xs, marginBottom: Spacing.xs,
    },
    pillActive: { backgroundColor: C.primary, borderColor: C.primary },
    pillText: { color: C.textSecondary, fontSize: 12, fontWeight: '600' },
    pillTextActive: { color: '#fff' },
    // Appliance row
    appRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    appIcon: { fontSize: 20, marginRight: Spacing.xs },
    appLabel: { color: C.textPrimary, fontWeight: '600', fontSize: 14 },
    appSub: { color: C.textSecondary, fontSize: 11 },
    qtyRow: { flexDirection: 'row', alignItems: 'center' },
    qtyBtn: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    },
    qtyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, lineHeight: 20 },
    qtyNum: { color: C.textPrimary, fontWeight: '700', fontSize: 15, marginHorizontal: Spacing.sm, minWidth: 24, textAlign: 'center' },
    // CTA button
    ctaBtn: {
      backgroundColor: C.primary, borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm, alignItems: 'center',
      marginTop: Spacing.sm,
    },
    ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    // Metric cards
    metricsRow: { flexDirection: 'row', flexWrap: 'wrap' },
    metricCard: {
      width: '48%', backgroundColor: C.surface,
      borderRadius: BorderRadius.sm, padding: Spacing.sm,
      marginBottom: Spacing.xs, borderWidth: 1, borderColor: C.border,
    },
    metricOdd: { marginRight: '4%' },
    metricValue: { color: C.primary, fontWeight: '800', fontSize: 22 },
    metricLabel: { color: C.textSecondary, fontSize: 11, marginTop: 2 },
    metricIcon: { fontSize: 18, marginBottom: 4 },
    // Surplus cards
    surplusGrid: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
    surplusCard: {
      flex: 1, borderRadius: BorderRadius.md,
      padding: Spacing.md, borderWidth: 1.5,
    },
    surplusTitle: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
    surplusValue: { fontWeight: '800', fontSize: 26 },
    surplusUnit: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    actionBtn: {
      marginTop: Spacing.sm, paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm, alignItems: 'center',
    },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    // Input row
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: Spacing.xs,
    },
    inputLabel: { color: C.textSecondary, fontSize: 13, flex: 1 },
    inputBox: {
      backgroundColor: C.divider, borderRadius: BorderRadius.xs,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: Spacing.sm, paddingVertical: 6,
      color: C.textPrimary, fontSize: 14, fontWeight: '600',
      width: 130, textAlign: 'right',
    },
    // Savings breakdown
    savRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    savLabel: { color: C.textSecondary, fontSize: 13 },
    savValue: { color: C.textPrimary, fontSize: 13, fontWeight: '600' },
    savTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.xs },
    savTotalLabel: { color: C.textPrimary, fontWeight: '700', fontSize: 14 },
    savTotalValue: { color: C.success, fontWeight: '800', fontSize: 15 },
    // Transfer section
    transferBox: {
      backgroundColor: C.infoLight, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, marginTop: Spacing.sm,
      borderWidth: 1, borderColor: C.info,
    },
    transferTitle: { color: C.info, fontWeight: '700', fontSize: 13, marginBottom: Spacing.xs },
    transferHint: { color: C.textSecondary, fontSize: 11 },
    // System summary
    summaryItem: {
      flexDirection: 'row', alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    summaryDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.success, marginTop: 5, marginRight: Spacing.xs,
    },
    summaryText: { color: C.textPrimary, fontSize: 13, lineHeight: 18, flex: 1 },
  });

  const hasResults = !!results.load;

  const tabBarStyle = StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      borderRadius: BorderRadius.md,
      padding: 4,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    tab: {
      flex: 1, paddingVertical: Spacing.sm,
      alignItems: 'center', borderRadius: BorderRadius.sm,
    },
    tabActive: { backgroundColor: C.primary },
    tabText: { color: C.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 2 },
    tabTextActive: { color: '#fff' },
  });

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>

      {/* ── Main Dashboard Tab Bar ──────────────────────────────────────── */}
      <View style={tabBarStyle.bar}>
        {([
          { key: 'MY_SYSTEM', emoji: '🏠', label: 'My System' },
          { key: 'TRADING',   emoji: '⚡', label: 'Energy Trading Hub' },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[tabBarStyle.tab, dashTab === t.key && tabBarStyle.tabActive]}
            onPress={() => setDashTab(t.key)}
          >
            <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
            <Text style={[tabBarStyle.tabText, dashTab === t.key && tabBarStyle.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Energy Trading Hub Tab ──────────────────────────────────────── */}
      {dashTab === 'TRADING' && <EnergyTradingHub />}

      {/* ── My System Tab ──────────────────────────────────────────────── */}
      {dashTab === 'MY_SYSTEM' && <>

      {/* ── Currency Selector ────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>💱 Currency & Energy Tariff</Text>
        <Text style={s.sectionSub}>Choose your local currency — tariff rates auto-update</Text>
        <View style={s.currencyRow}>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={[s.pill, inputs.currency === c.code && s.pillActive]}
              onPress={() => handleCurrencyChange(c.code as any)}
            >
              <Text style={[s.pillText, inputs.currency === c.code && s.pillTextActive]}>
                {c.symbol} {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Editable tariff rate */}
        <View style={[s.inputRow, { marginTop: Spacing.sm }]}>
          <Text style={s.inputLabel}>Grid tariff rate ({currency.symbol}/kWh)</Text>
          <TextInput
            style={s.inputBox}
            value={tariffInput}
            onChangeText={v => { setTariffInput(v); updateInputs({ gridTariffRate: parseFloat(v) || 0 }); }}
            keyboardType="decimal-pad"
            placeholderTextColor={C.placeholder}
          />
        </View>
        <View style={s.inputRow}>
          <Text style={s.inputLabel}>System cost / investment ({currency.symbol})</Text>
          <TextInput
            style={s.inputBox}
            value={capexInput}
            onChangeText={v => { setCapexInput(v); updateInputs({ capexBudget: parseFloat(v) || 0 }); }}
            keyboardType="decimal-pad"
            placeholderTextColor={C.placeholder}
          />
        </View>
      </View>

      {/* ── My Appliances ────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🏠 My Home Appliances</Text>
        <Text style={s.sectionSub}>Set how many of each appliance you use daily</Text>

        {inputs.appliances.map((app, idx) => {
          const info = APPLIANCE_LABELS[idx];
          return (
            <View key={idx} style={s.appRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={s.appIcon}>{info?.icon}</Text>
                <View>
                  <Text style={s.appLabel}>{info?.label || `Appliance ${idx + 1}`}</Text>
                  <Text style={s.appSub}>{info?.sub} · {app.hoursOn.filter(h => h > 0).length}h/day</Text>
                </View>
              </View>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => handleQtyChange(idx, -1)}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{app.quantity}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => handleQtyChange(idx, 1)}>
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={s.ctaBtn} onPress={runAllCalculations}>
          <Text style={s.ctaBtnText}>⚡ Calculate My Solar System</Text>
        </TouchableOpacity>
      </View>

      {/* ── Energy Overview ──────────────────────────────────────────────── */}
      {hasResults && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>📊 My Energy Overview</Text>
          <View style={s.metricsRow}>
            {[
              { icon: '☀️', value: `${dailyGenKwh.toFixed(1)} kWh`, label: 'Daily Solar Generation' },
              { icon: '🏠', value: `${dailyUseKwh.toFixed(1)} kWh`, label: 'Daily Consumption' },
              { icon: '⚡', value: `${selfSufficiency.toFixed(0)}%`, label: 'Self-Sufficiency' },
              { icon: '🔋', value: `${batteryBackupHrs} hrs`, label: 'Battery Backup' },
            ].map((m, i) => (
              <View key={i} style={[s.metricCard, i % 2 === 0 && s.metricOdd]}>
                <Text style={s.metricIcon}>{m.icon}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Surplus Power Manager ────────────────────────────────────────── */}
      {hasResults && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚡ Surplus Power Manager</Text>
          <Text style={s.sectionSub}>
            Your system generates {dailySurplusKwh.toFixed(2)} kWh of extra energy daily —
            here's what you can do with it
          </Text>

          <View style={s.surplusGrid}>
            {/* Sell to Grid */}
            <View style={[s.surplusCard, { borderColor: C.success, backgroundColor: C.successLight }]}>
              <Text style={[s.surplusTitle, { color: C.success }]}>🔌 Sell to Grid</Text>
              {gridExportStatus === 'ACTIVE' ? (
                <>
                  <Text style={[s.surplusValue, { color: C.success, fontSize: 20 }]}>
                    {currency.symbol}{accumulatedCredits.toFixed(2)}
                  </Text>
                  <Text style={[s.surplusUnit, { color: C.success }]}>earned credits</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: Spacing.xs }}>
                    Status: Export Active ●
                  </Text>
                  {telemetry && (
                    <View style={{ marginVertical: 4, padding: 6, backgroundColor: C.surface, borderRadius: BorderRadius.xs, borderWidth: 1, borderColor: C.border }}>
                      <Text style={{ color: C.textPrimary, fontSize: 10, fontWeight: '700' }}>⚡ Grid Telemetry:</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 2 }}>Export Power: {telemetry.smartMeter.activePowerKw.toFixed(2)} kW</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 9 }}>Line Voltage: {telemetry.smartMeter.voltageV.toFixed(1)} V</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 9 }}>Frequency: {telemetry.smartMeter.frequencyHz.toFixed(1)} Hz</Text>
                      <Text style={{ color: telemetry.inverter.gridSynchronized ? C.success : C.error, fontSize: 9, fontWeight: '700', marginTop: 2 }}>
                        {telemetry.inverter.gridSynchronized ? 'Grid Synced ✓' : 'Grid Out-of-Sync ⚠️'}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={[s.actionBtn, { backgroundColor: C.success }]}
                    onPress={() => setIsWizardVisible(true)}
                  >
                    <Text style={s.actionBtnText}>Manage Grid Export →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[s.surplusValue, { color: C.success }]}>{fmt(monthlySurplusRevenue, currency.symbol)}</Text>
                  <Text style={[s.surplusUnit, { color: C.success }]}>estimated / month</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: Spacing.xs }}>
                    {monthlySurplusKwh.toFixed(1)} kWh surplus × {currency.symbol}{tariff}/kWh
                  </Text>
                  <TouchableOpacity 
                    style={[s.actionBtn, { backgroundColor: C.success }]}
                    onPress={() => setIsWizardVisible(true)}
                  >
                    <Text style={s.actionBtnText}>Connect Grid Export →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Transfer to Neighbor */}
            <View style={[s.surplusCard, { borderColor: C.info, backgroundColor: C.infoLight }]}>
              <Text style={[s.surplusTitle, { color: C.info }]}>🤝 Neighbor Transfer</Text>
              <Text style={[s.surplusValue, { color: C.info }]}>{fmt(transferValue, currency.symbol)}</Text>
              <Text style={[s.surplusUnit, { color: C.info }]}>credit value</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: Spacing.xs }}>
                {transferKwhNum.toFixed(1)} kWh × {currency.symbol}{tariff}/kWh
              </Text>
              {telemetry && (
                <View style={{ marginVertical: 4, padding: 6, backgroundColor: C.surface, borderRadius: BorderRadius.xs, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ color: C.textPrimary, fontSize: 10, fontWeight: '700' }}>🤝 Neighbor Feed:</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 2 }}>Transfer Rate: {telemetry.neighbourTrading.instantaneousPowerKw.toFixed(2)} kW</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 9 }}>Line Voltage: {telemetry.neighbourTrading.voltageV.toFixed(1)} V</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 9 }}>Delivered: {telemetry.neighbourTrading.energyDeliveredKwh.toFixed(2)} kWh</Text>
                  <Text style={{ color: C.info, fontSize: 9, fontWeight: '700', marginTop: 2 }}>
                    Connected: {telemetry.neighbourTrading.connectedNeighboursCount} active links
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.info }]}
                onPress={() => setShowTransfer(!showTransfer)}
              >
                <Text style={s.actionBtnText}>Set Transfer Amount →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showTransfer && (
            <View style={s.transferBox}>
              <Text style={s.transferTitle}>🤝 Monthly Neighbor Transfer</Text>
              <View style={s.inputRow}>
                <Text style={s.inputLabel}>kWh to transfer per month</Text>
                <TextInput
                  style={s.inputBox}
                  value={transferKwh}
                  onChangeText={setTransferKwh}
                  keyboardType="decimal-pad"
                  placeholder={`max ${monthlySurplusKwh.toFixed(0)}`}
                  placeholderTextColor={C.placeholder}
                />
              </View>
              <Text style={s.transferHint}>
                Available monthly surplus: {monthlySurplusKwh.toFixed(1)} kWh ·
                Transfer credit value: {fmt(transferValue, currency.symbol)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Cost & Savings Calculator ────────────────────────────────────── */}
      {hasResults && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>💰 My Monthly Savings Breakdown</Text>

          <View style={s.savRow}>
            <Text style={s.savLabel}>Without solar (grid only)</Text>
            <Text style={[s.savValue, { color: C.error }]}>{fmt(monthlyGridBill, currency.symbol)}/mo</Text>
          </View>
          <View style={s.savRow}>
            <Text style={s.savLabel}>Grid import with solar</Text>
            <Text style={s.savValue}>{fmt(monthlyImportBill, currency.symbol)}/mo</Text>
          </View>
          <View style={s.savRow}>
            <Text style={s.savLabel}>Grid export revenue</Text>
            <Text style={[s.savValue, { color: C.success }]}>+ {fmt(monthlySurplusRevenue, currency.symbol)}/mo</Text>
          </View>
          <View style={[s.savTotal, { marginTop: Spacing.xs }]}>
            <Text style={s.savTotalLabel}>Net monthly benefit</Text>
            <Text style={s.savTotalValue}>{fmt(monthlyBenefit, currency.symbol)}/mo</Text>
          </View>

          {/* Payback + 25-year */}
          <View style={{ flexDirection: 'row', marginTop: Spacing.md }}>
            <View style={{ flex: 1, alignItems: 'center', padding: Spacing.sm, backgroundColor: C.divider, borderRadius: BorderRadius.sm, marginRight: Spacing.xs }}>
              <Text style={{ color: C.secondary, fontWeight: '800', fontSize: 24 }}>{paybackYears}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11, textAlign: 'center' }}>Years to pay back</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', padding: Spacing.sm, backgroundColor: C.divider, borderRadius: BorderRadius.sm }}>
              <Text style={{ color: C.success, fontWeight: '800', fontSize: 20 }}>{fmt(Math.max(0, savings25yr), currency.symbol)}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11, textAlign: 'center' }}>25-Year net savings</Text>
            </View>
          </View>
        </View>
      )}

      {hasResults && (
        <EnergyGoalOptimizer />
      )}

      {/* ── My System Summary ─────────────────────────────────────────────── */}
      {hasResults && results.solar && results.battery && results.inverter && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🌿 My System at a Glance</Text>
          {[
            `You have ${results.solar.numberOfPanels} solar panels (${results.solar.requiredPvSizeKw} kWp) generating approximately ${dailyGenKwh.toFixed(1)} kWh per day.`,
            `Your battery bank stores ${results.battery.requiredCapacityKwh} kWh, providing ${batteryBackupHrs} hours of backup power if the sun is not shining.`,
            `Your ${results.inverter.recommendedInverterKw} kW inverter handles your peak load and startup surges safely.`,
            `At ${currency.symbol}${tariff}/kWh, you save about ${fmt(monthlyBenefit, currency.symbol)} every month compared to using the grid only.`,
          ].map((text, i) => (
            <View key={i} style={s.summaryItem}>
              <View style={s.summaryDot} />
              <Text style={s.summaryText}>{text}</Text>
            </View>
          ))}
        </View>
      )}

      {hasResults && (
        <IotControlCenter />
      )}

      {!hasResults && (
        <View style={{ alignItems: 'center', padding: Spacing.xxl }}>
          <Text style={{ fontSize: 48 }}>☀️</Text>
          <Text style={{ color: C.textPrimary, fontWeight: '700', fontSize: 18, marginTop: Spacing.sm }}>
            Set Your Appliances Above
          </Text>
          <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', marginTop: Spacing.xs }}>
            Adjust how many appliances you have and tap "Calculate My Solar System" to see your personalised energy plan.
          </Text>
        </View>
      )}
      <GridExportWizard visible={isWizardVisible} onClose={() => setIsWizardVisible(false)} />

      {hasResults && (
        <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.sm }}>
          <DownloadReportButton />
        </View>
      )}
      </> /* end MY_SYSTEM tab */}

    </ScrollView>
  );
};
