/**
 * PlantOperatorDashboard.tsx
 *
 * Workspace for mini solar grid / power plant operators.
 * Does NOT require a household load profile.
 * Uses IoT telemetry + plant configuration to compute smart distribution.
 */
import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { PlantConfig } from '@reos/types';
import { generatePlantReportPdf } from '../store/pdfGenerator';

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Naira', tariff: 225 },
  { code: 'USD', symbol: '$', name: 'USD', tariff: 0.14 },
  { code: 'GBP', symbol: '£', name: 'GBP', tariff: 0.28 },
  { code: 'EUR', symbol: '€', name: 'EUR', tariff: 0.25 },
  { code: 'ZAR', symbol: 'R', name: 'Rand', tariff: 2.5 },
  { code: 'KES', symbol: 'KSh', name: 'Shilling', tariff: 25 },
  { code: 'GHS', symbol: '₵', name: 'Cedi', tariff: 1.5 },
] as const;

const fmt = (n: number, sym: string) => {
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${sym}${(n / 1_000).toFixed(1)}k`;
  return `${sym}${n.toFixed(2)}`;
};

const DEFAULT_CONFIG: PlantConfig = {
  plantName: '',
  plantCapacityKwp: 0,
  numberOfInverters: 0,
  gridConnectionType: 'HYBRID',
  numberOfNeighborSubscribers: 0,
  batteryReservePercent: 0,
  neighborMaxShareKw: 0,
  gridExportCapPercent: 0,
  gridExportAllowed: true,
  tariffPerKwh: 0,
  currency: 'NGN',
};

export const PlantOperatorDashboard: React.FC = () => {
  const { theme, telemetry, alerts, gridExportEnabled, toggleGridExport, toggleNeighbourTransfer, neighbourTransferEnabled } = useStore();
  const C = Colors[theme];

  const [config, setConfig] = useState<PlantConfig>(DEFAULT_CONFIG);
  const [configured, setConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'DISTRIBUTE' | 'REVENUE'>('MONITOR');

  const currency = CURRENCIES.find(c => c.code === config.currency) || CURRENCIES[0];

  // ── Distribution Engine ─────────────────────────────────────────────────────
  const distribution = useMemo(() => {
    const plantOutputKw  = telemetry?.inverter?.powerKw ?? (config.plantCapacityKwp * 0.75);
    const batterySoc     = telemetry?.battery?.socPercent ?? 80;
    const isCharging     = batterySoc < config.batteryReservePercent + 20;
    
    // Priority 1: charge battery if below reserve + 20%
    const batteryChargeKw = isCharging ? Math.min(plantOutputKw * 0.3, 5) : 0;
    const afterBattery    = Math.max(0, plantOutputKw - batteryChargeKw);

    // Priority 2: supply neighbors (cap per subscriber × count)
    const maxNeighborKw   = config.neighborMaxShareKw * config.numberOfNeighborSubscribers;
    const neighborKw      = Math.min(afterBattery, maxNeighborKw);
    const afterNeighbors  = Math.max(0, afterBattery - neighborKw);

    // Priority 3: remaining goes to grid (subject to connection type and settings)
    const canExportToGrid = config.gridConnectionType !== 'ISLAND' && config.gridExportAllowed && gridExportEnabled;
    const exportCap       = plantOutputKw * (config.gridExportCapPercent / 100);
    const gridExportKw    = canExportToGrid ? Math.min(afterNeighbors, exportCap) : 0;

    // Revenue calculations (hourly projected to monthly)
    const hoursPerMonth   = 4.5 * 30; // average peak sun hours × days
    const neighborRevenue = neighborKw * hoursPerMonth * config.tariffPerKwh;
    const gridRevenue     = gridExportKw * hoursPerMonth * config.tariffPerKwh;
    const totalRevenue    = neighborRevenue + gridRevenue;

    return {
      plantOutputKw,
      batterySoc,
      batteryChargeKw,
      neighborKw,
      gridExportKw,
      neighborRevenue,
      gridRevenue,
      totalRevenue,
      isCharging,
    };
  }, [telemetry, config]);

  const s = StyleSheet.create({
    container: { flex: 1 },
    section: {
      backgroundColor: C.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 4 },
    sectionSub: { color: C.textSecondary, fontSize: 11, marginBottom: Spacing.sm },

    // Tab bar
    tabBar: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      borderRadius: BorderRadius.md,
      padding: 4,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    tab: {
      flex: 1, paddingVertical: Spacing.xs,
      alignItems: 'center', borderRadius: BorderRadius.sm,
    },
    tabActive: { backgroundColor: C.primary },
    tabText: { color: C.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2 },
    tabTextActive: { color: '#fff' },

    // Config form
    label: { color: C.textSecondary, fontSize: 11, marginTop: Spacing.sm, marginBottom: 2 },
    input: {
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      borderRadius: BorderRadius.xs,
      padding: 8, color: C.textPrimary, fontSize: 13,
    },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
    pill: {
      paddingVertical: 5, paddingHorizontal: 10,
      borderRadius: BorderRadius.full,
      borderWidth: 1, borderColor: C.border,
      backgroundColor: C.divider,
    },
    pillActive: { backgroundColor: C.primary, borderColor: C.primary },
    pillText: { color: C.textSecondary, fontSize: 10, fontWeight: '700' },
    pillTextActive: { color: '#fff' },

    // Monitor gauges
    gaugeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    gauge: {
      flex: 1, minWidth: '45%',
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      alignItems: 'center', marginBottom: Spacing.xs,
    },
    gaugeVal: { color: C.primary, fontSize: 20, fontWeight: '900', marginTop: 4 },
    gaugeLbl: { color: C.textSecondary, fontSize: 9, marginTop: 2, textAlign: 'center' },

    // Distribution bars
    distRow: {
      marginBottom: Spacing.sm,
    },
    distLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    distLabelText: { color: C.textPrimary, fontSize: 12, fontWeight: '700' },
    distValue: { color: C.textSecondary, fontSize: 11 },
    barBg: { height: 12, backgroundColor: C.divider, borderRadius: 6, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 6 },

    // Revenue cards
    revGrid: { flexDirection: 'row', gap: Spacing.xs },
    revCard: {
      flex: 1,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm, alignItems: 'center',
    },
    revVal: { fontSize: 18, fontWeight: '900', marginTop: 4 },
    revLbl: { color: C.textSecondary, fontSize: 9, marginTop: 2, textAlign: 'center' },

    // Controls
    switchRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: Spacing.xs,
      borderTopWidth: 1, borderTopColor: C.border, marginTop: Spacing.xs,
    },
    switchLabel: { color: C.textPrimary, fontSize: 13, fontWeight: '600' },
    switchSub: { color: C.textSecondary, fontSize: 10, marginTop: 1 },

    btn: {
      borderRadius: BorderRadius.sm, paddingVertical: 12,
      alignItems: 'center', marginTop: Spacing.md,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    alertCard: {
      padding: Spacing.sm, borderRadius: BorderRadius.sm,
      borderWidth: 1, marginBottom: 4,
    },
  });

  // ── CONFIGURATION SCREEN ────────────────────────────────────────────────────
  if (!configured) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[s.section, { borderColor: C.primary, borderWidth: 2 }]}>
          <Text style={s.sectionTitle}>🌱 Plant Operator Setup</Text>
          <Text style={s.sectionSub}>
            Configure your solar plant or mini-grid below. No household load profile needed —
            REOS will use live IoT telemetry to manage energy distribution automatically.
          </Text>
        </View>

        {/* Plant Details */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { fontSize: 13 }]}>🏭 Plant Details</Text>

          <Text style={s.label}>Plant / Operator Name</Text>
          <TextInput
            style={s.input}
            value={config.plantName}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, plantName: v }))}
            placeholder="e.g. Sunshine Community Grid"
            placeholderTextColor={C.placeholder}
          />

          <Text style={s.label}>Plant Capacity (kWp)</Text>
          <TextInput
            style={s.input}
            value={config.plantCapacityKwp === 0 ? '' : String(config.plantCapacityKwp)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, plantCapacityKwp: parseFloat(v) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 50"
            placeholderTextColor={C.placeholder}
          />

          <Text style={s.label}>Number of Inverters</Text>
          <TextInput
            style={s.input}
            value={config.numberOfInverters === 0 ? '' : String(config.numberOfInverters)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, numberOfInverters: parseInt(v) || 0 }))}
            keyboardType="number-pad"
            placeholder="e.g. 4"
            placeholderTextColor={C.placeholder}
          />

          <Text style={s.label}>Grid Connection Type</Text>
          <View style={s.pillRow}>
            {(['GRID_TIED', 'HYBRID', 'ISLAND'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.pill, config.gridConnectionType === t && s.pillActive]}
                onPress={() => setConfig((p: PlantConfig) => ({ ...p, gridConnectionType: t }))}
              >
                <Text style={[s.pillText, config.gridConnectionType === t && s.pillTextActive]}>
                  {t === 'GRID_TIED' ? '⚡ Grid-Tied' : t === 'HYBRID' ? '🔋 Hybrid' : '🏝️ Island / Off-Grid'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Distribution Rules */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { fontSize: 13 }]}>📐 Distribution Rules</Text>

          <Text style={s.label}>Number of Neighbor Subscribers</Text>
          <TextInput
            style={s.input}
            value={config.numberOfNeighborSubscribers === 0 ? '' : String(config.numberOfNeighborSubscribers)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, numberOfNeighborSubscribers: parseInt(v) || 0 }))}
            keyboardType="number-pad"
            placeholder="e.g. 8"
            placeholderTextColor={C.placeholder}
          />

          <Text style={s.label}>Max Power per Subscriber (kW)</Text>
          <TextInput
            style={s.input}
            value={config.neighborMaxShareKw === 0 ? '' : String(config.neighborMaxShareKw)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, neighborMaxShareKw: parseFloat(v) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 2.0"
            placeholderTextColor={C.placeholder}
          />

          <Text style={s.label}>Min Battery Reserve Before Exporting (%)</Text>
          <TextInput
            style={s.input}
            value={config.batteryReservePercent === 0 ? '' : String(config.batteryReservePercent)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, batteryReservePercent: parseFloat(v) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 20"
            placeholderTextColor={C.placeholder}
          />

          <Text style={s.label}>Grid Export Cap (% of total output)</Text>
          <TextInput
            style={s.input}
            value={config.gridExportCapPercent === 0 ? '' : String(config.gridExportCapPercent)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, gridExportCapPercent: parseFloat(v) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 60"
            placeholderTextColor={C.placeholder}
          />

          <View style={[s.switchRow, { marginTop: Spacing.sm }]}>
            <View>
              <Text style={s.switchLabel}>Utility Grid Export Allowed</Text>
              <Text style={s.switchSub}>Allow sending surplus plant power to the utility grid</Text>
            </View>
            <Switch
              value={config.gridExportAllowed}
              onValueChange={v => setConfig((p: PlantConfig) => ({ ...p, gridExportAllowed: v }))}
              trackColor={{ false: C.border, true: C.success }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Tariff & Currency */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { fontSize: 13 }]}>💰 Tariff & Currency</Text>

          <Text style={s.label}>Currency</Text>
          <View style={s.pillRow}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[s.pill, config.currency === c.code && s.pillActive]}
                onPress={() => setConfig((p: PlantConfig) => ({ ...p, currency: c.code, tariffPerKwh: c.tariff }))}
              >
                <Text style={[s.pillText, config.currency === c.code && s.pillTextActive]}>
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Tariff Rate ({currency.symbol}/kWh)</Text>
          <TextInput
            style={s.input}
            value={config.tariffPerKwh === 0 ? '' : String(config.tariffPerKwh)}
            onChangeText={v => setConfig((p: PlantConfig) => ({ ...p, tariffPerKwh: parseFloat(v) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 225"
            placeholderTextColor={C.placeholder}
          />
        </View>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.primary }]}
          onPress={() => setConfigured(true)}
        >
          <Text style={s.btnText}>🚀 Launch Plant Dashboard →</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    );
  }

  // ── MAIN PLANT DASHBOARD ────────────────────────────────────────────────────
  const totalOut = distribution.plantOutputKw;
  const battPct  = totalOut > 0 ? (distribution.batteryChargeKw / totalOut) * 100 : 0;
  const nbrPct   = totalOut > 0 ? (distribution.neighborKw / totalOut) * 100 : 0;
  const gridPct  = totalOut > 0 ? (distribution.gridExportKw / totalOut) * 100 : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Plant identity bar */}
      <View style={[s.section, { backgroundColor: C.primary, borderColor: C.primary }]}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>🌱 {config.plantName}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>
          {config.plantCapacityKwp} kWp · {config.gridConnectionType} ·{' '}
          {config.numberOfInverters} inverters · {config.numberOfNeighborSubscribers} subscribers
        </Text>
        <TouchableOpacity
          style={{ marginTop: 6, alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8 }}
          onPress={() => setConfigured(false)}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✏️ Edit Config</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {([
          { key: 'MONITOR',   emoji: '📊', label: 'Live Monitor' },
          { key: 'DISTRIBUTE',emoji: '⚡', label: 'Distribution' },
          { key: 'REVENUE',   emoji: '💰', label: 'Revenue' },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, activeTab === t.key && s.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Operations PDF Generation Button */}
      <TouchableOpacity 
        style={[s.btn, { backgroundColor: C.primary, marginTop: -4, marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
        onPress={() => generatePlantReportPdf(config.plantName, config, distribution, telemetry, alerts)}
      >
        <Text style={{ fontSize: 16 }}>📄</Text>
        <Text style={s.btnText}>Export Operations PDF Report</Text>
      </TouchableOpacity>

      {/* ── MONITOR TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'MONITOR' && (
        <View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>📊 Live Generation Monitor</Text>
            <Text style={s.sectionSub}>Real-time data from IoT field devices</Text>
            <View style={s.gaugeGrid}>
              <View style={s.gauge}>
                <Text style={{ fontSize: 24 }}>☀️</Text>
                <Text style={s.gaugeVal}>{distribution.plantOutputKw.toFixed(2)} kW</Text>
                <Text style={s.gaugeLbl}>Plant Output</Text>
              </View>
              <View style={s.gauge}>
                <Text style={{ fontSize: 24 }}>🌦️</Text>
                <Text style={s.gaugeVal}>{telemetry?.weather?.solarIrradianceWm2 ?? 780} W/m²</Text>
                <Text style={s.gaugeLbl}>Solar Irradiance</Text>
              </View>
              <View style={s.gauge}>
                <Text style={{ fontSize: 24 }}>🔋</Text>
                <Text style={[s.gaugeVal, { color: distribution.batterySoc > 50 ? C.success : C.warning }]}>
                  {distribution.batterySoc.toFixed(1)}%
                </Text>
                <Text style={s.gaugeLbl}>Battery SoC</Text>
              </View>
              <View style={s.gauge}>
                <Text style={{ fontSize: 24 }}>⚡</Text>
                <Text style={s.gaugeVal}>{(telemetry?.smartMeter?.voltageV ?? 230).toFixed(1)} V</Text>
                <Text style={s.gaugeLbl}>Grid Voltage</Text>
              </View>
              <View style={s.gauge}>
                <Text style={{ fontSize: 24 }}>〰️</Text>
                <Text style={s.gaugeVal}>{(telemetry?.smartMeter?.frequencyHz ?? 50).toFixed(2)} Hz</Text>
                <Text style={s.gaugeLbl}>Grid Frequency</Text>
              </View>
              <View style={s.gauge}>
                <Text style={{ fontSize: 24 }}>{telemetry?.inverter?.gridSynchronized ? '✅' : '⚠️'}</Text>
                <Text style={[s.gaugeVal, { fontSize: 12 }]}>
                  {telemetry?.inverter?.gridSynchronized ? 'SYNCED' : 'OUT OF SYNC'}
                </Text>
                <Text style={s.gaugeLbl}>Inverter Sync</Text>
              </View>
            </View>
          </View>

          {/* Active Alerts */}
          {alerts.filter(a => !a.acknowledged).length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: C.error, fontSize: 13 }]}>
                ⚠️ Active Fault Alarms ({alerts.filter(a => !a.acknowledged).length})
              </Text>
              {alerts.filter(a => !a.acknowledged).map(a => (
                <View
                  key={a.id}
                  style={[s.alertCard, {
                    backgroundColor: a.severity === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                    borderColor: a.severity === 'CRITICAL' ? '#FCA5A5' : '#FDE68A',
                  }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: a.severity === 'CRITICAL' ? '#991B1B' : '#92400E' }}>
                    {a.severity === 'CRITICAL' ? '🔴' : '🟡'} {a.title}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{a.recommendedAction}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── DISTRIBUTION TAB ─────────────────────────────────────────────── */}
      {activeTab === 'DISTRIBUTE' && (
        <View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚡ Smart Distribution Engine</Text>
            <Text style={s.sectionSub}>
              Auto-calculated priority: Battery → Neighbors → Grid
            </Text>

            {/* Battery charging bar */}
            <View style={s.distRow}>
              <View style={s.distLabel}>
                <Text style={s.distLabelText}>🔋 Battery Charging</Text>
                <Text style={s.distValue}>{distribution.batteryChargeKw.toFixed(2)} kW ({battPct.toFixed(0)}%)</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${Math.min(battPct, 100)}%`, backgroundColor: C.warning }]} />
              </View>
              <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 2 }}>
                {distribution.isCharging ? `Charging until ${config.batteryReservePercent + 20}% SoC` : 'Battery at reserve, not charging'}
              </Text>
            </View>

            {/* Neighbors bar */}
            <View style={s.distRow}>
              <View style={s.distLabel}>
                <Text style={s.distLabelText}>🏘️ Neighbor Network</Text>
                <Text style={s.distValue}>{distribution.neighborKw.toFixed(2)} kW ({nbrPct.toFixed(0)}%)</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${Math.min(nbrPct, 100)}%`, backgroundColor: C.info }]} />
              </View>
              <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 2 }}>
                {config.numberOfNeighborSubscribers} subscribers × {config.neighborMaxShareKw} kW max each
              </Text>
            </View>

            {/* Grid export bar */}
            <View style={s.distRow}>
              <View style={s.distLabel}>
                <Text style={s.distLabelText}>⚡ Grid Export</Text>
                <Text style={s.distValue}>{distribution.gridExportKw.toFixed(2)} kW ({gridPct.toFixed(0)}%)</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${Math.min(gridPct, 100)}%`, backgroundColor: C.success }]} />
              </View>
              <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 2 }}>
                {config.gridConnectionType === 'ISLAND'
                  ? '⚠️ Connection Type: Off-Grid (Island Mode). Grid Export is disabled.'
                  : !config.gridExportAllowed
                    ? '⚠️ Setup Configuration: Grid Export disallowed.'
                    : !gridExportEnabled
                      ? '⏸️ Control Switched Off (Grid Export switch is disabled).'
                      : `Capped at ${config.gridExportCapPercent}% of total output`
                }
              </Text>
            </View>
          </View>

          {/* Control toggles */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { fontSize: 13 }]}>🎛️ Distribution Controls</Text>

            <View style={s.switchRow}>
              <View>
                <Text style={s.switchLabel}>Grid Export</Text>
                <Text style={s.switchSub}>Sell surplus to the utility grid</Text>
              </View>
              <Switch
                value={gridExportEnabled}
                onValueChange={toggleGridExport}
                trackColor={{ false: C.border, true: C.success }}
                thumbColor="#fff"
              />
            </View>

            <View style={s.switchRow}>
              <View>
                <Text style={s.switchLabel}>Neighbor Sharing</Text>
                <Text style={s.switchSub}>Open P2P link to {config.numberOfNeighborSubscribers} subscribers</Text>
              </View>
              <Switch
                value={neighbourTransferEnabled}
                onValueChange={toggleNeighbourTransfer}
                trackColor={{ false: C.border, true: C.info }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      )}

      {/* ── REVENUE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'REVENUE' && (
        <View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>💰 Revenue & Settlement</Text>
            <Text style={s.sectionSub}>Projected monthly earnings at {currency.symbol}{config.tariffPerKwh}/kWh</Text>

            <View style={s.revGrid}>
              <View style={s.revCard}>
                <Text style={{ fontSize: 24 }}>🏘️</Text>
                <Text style={[s.revVal, { color: C.info }]}>{fmt(distribution.neighborRevenue, currency.symbol)}</Text>
                <Text style={s.revLbl}>Neighbor Billing / Month</Text>
              </View>
              <View style={s.revCard}>
                <Text style={{ fontSize: 24 }}>⚡</Text>
                <Text style={[s.revVal, { color: C.success }]}>{fmt(distribution.gridRevenue, currency.symbol)}</Text>
                <Text style={s.revLbl}>Grid Export Revenue / Month</Text>
              </View>
            </View>

            <View style={[s.revCard, { marginTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={{ color: C.textSecondary, fontSize: 13, fontWeight: '700' }}>💎 Total Monthly Revenue</Text>
              <Text style={{ color: C.primary, fontSize: 22, fontWeight: '900' }}>{fmt(distribution.totalRevenue, currency.symbol)}</Text>
            </View>

            <View style={{ marginTop: Spacing.md }}>
              <View style={[s.revCard, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }]}>
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>Annual Projection</Text>
                <Text style={{ color: C.success, fontWeight: '700', fontSize: 13 }}>{fmt(distribution.totalRevenue * 12, currency.symbol)}</Text>
              </View>
              <View style={[s.revCard, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }]}>
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>Per Subscriber / Month</Text>
                <Text style={{ color: C.info, fontWeight: '700', fontSize: 13 }}>
                  {config.numberOfNeighborSubscribers > 0
                    ? fmt(distribution.neighborRevenue / config.numberOfNeighborSubscribers, currency.symbol)
                    : `${currency.symbol}0.00`}
                </Text>
              </View>
              <View style={[s.revCard, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>Effective Plant Utilisation</Text>
                <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>
                  {totalOut > 0 ? ((distribution.neighborKw + distribution.gridExportKw) / totalOut * 100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
};
