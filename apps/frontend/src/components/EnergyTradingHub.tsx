/**
 * EnergyTradingHub.tsx
 *
 * Standalone Energy Trading tab for the Customer Dashboard.
 * Works with OR without a calculated load profile.
 * Combines: Sell to Grid, Neighbor Transfer, and IoT Control Center.
 */
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, ScrollView, Switch,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { GridExportWizard } from './GridExportWizard';
import { IotControlCenter } from './IotControlCenter';

// ─── Currency config ──────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'NGN', symbol: '₦', tariff: 225 },
  { code: 'USD', symbol: '$', tariff: 0.14 },
  { code: 'GBP', symbol: '£', tariff: 0.28 },
  { code: 'EUR', symbol: '€', tariff: 0.25 },
  { code: 'ZAR', symbol: 'R', tariff: 2.5 },
  { code: 'KES', symbol: 'KSh', tariff: 25 },
  { code: 'GHS', symbol: '₵', tariff: 1.5 },
] as const;

const fmt = (n: number, sym: string) => {
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${sym}${(n / 1_000).toFixed(1)}k`;
  return `${sym}${n.toFixed(2)}`;
};

export const EnergyTradingHub: React.FC = () => {
  const {
    theme, inputs, results,
    telemetry, alerts,
    gridExportStatus, accumulatedCredits,
    gridExportEnabled, neighbourTransferEnabled,
    toggleGridExport, toggleNeighbourTransfer,
    createInviteCode, consumerInvite, activeContract
  } = useStore();
  const C = Colors[theme];

  const [activeSection, setActiveSection] = useState<'GRID' | 'NEIGHBOR' | 'IOT'>('GRID');
  const [isWizardVisible, setIsWizardVisible] = useState(false);
  const [transferKwh, setTransferKwh] = useState('');
  const [manualExportKw, setManualExportKw] = useState('');

  // P2P Invite States
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteTariff, setInviteTariff] = useState(String(inputs?.gridTariffRate || 225));
  const [inviteCycle, setInviteCycle] = useState<'PREPAID' | 'POSTPAID' | 'HYBRID'>('PREPAID');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const currency = CURRENCIES.find(c => c.code === (inputs?.currency || 'NGN')) || CURRENCIES[0];
  const tariff = inputs?.gridTariffRate || currency.tariff;

  // Surplus from load profile (if available) — or 0 if no profile yet
  const monthlySurplusKwh = results?.solar
    ? Math.max(0, (results.solar.requiredPvSizeKw * 4.5 * 30) - ((results.load?.dailyEnergyKwh || 0) * 30))
    : 0;
  const transferKwhNum = parseFloat(transferKwh) || 0;
  const monthlySurplusRevenue = monthlySurplusKwh * tariff;
  const transferValue = transferKwhNum * tariff;

  // Live telemetry values
  const liveExportKw = telemetry?.smartMeter?.activePowerKw ?? 0;
  const liveVoltage  = telemetry?.smartMeter?.voltageV ?? 0;
  const liveFreq     = telemetry?.smartMeter?.frequencyHz ?? 0;
  const gridSynced   = telemetry?.inverter?.gridSynchronized ?? false;
  const neighborKw   = telemetry?.neighbourTrading?.instantaneousPowerKw ?? 0;
  const neighborV    = telemetry?.neighbourTrading?.voltageV ?? 0;
  const neighborKwh  = telemetry?.neighbourTrading?.energyDeliveredKwh ?? 0;
  const neighborLinks = telemetry?.neighbourTrading?.connectedNeighboursCount ?? 0;
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  const s = StyleSheet.create({
    // Section tabs
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
      flex: 1,
      paddingVertical: Spacing.xs,
      alignItems: 'center',
      borderRadius: BorderRadius.sm,
    },
    tabActive: { backgroundColor: C.primary },
    tabText: { color: C.textSecondary, fontSize: 11, fontWeight: '700' },
    tabTextActive: { color: '#fff' },
    tabEmoji: { fontSize: 16 },

    // Cards
    card: {
      backgroundColor: C.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    cardTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 4 },
    cardSub: { color: C.textSecondary, fontSize: 11, marginBottom: Spacing.sm },

    // Status banner
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.sm,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

    // Telemetry grid
    telGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
    telCell: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      alignItems: 'center',
    },
    telVal: { color: C.primary, fontSize: 18, fontWeight: '800', marginTop: 2 },
    telLbl: { color: C.textSecondary, fontSize: 9, marginTop: 2, textAlign: 'center' },
    telEmoji: { fontSize: 18 },

    // Big revenue figure
    bigNum: { color: C.success, fontSize: 28, fontWeight: '900', textAlign: 'center' },
    bigUnit: { color: C.success, fontSize: 11, textAlign: 'center', marginBottom: Spacing.xs },

    // Action button
    btn: {
      borderRadius: BorderRadius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Switch row
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: C.border,
      marginTop: Spacing.xs,
    },
    switchLabel: { color: C.textPrimary, fontSize: 13, fontWeight: '600' },
    switchSub: { color: C.textSecondary, fontSize: 10, marginTop: 1 },

    // Manual input
    inputBox: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BorderRadius.xs,
      padding: 8,
      color: C.textPrimary,
      fontSize: 13,
      marginTop: 4,
    },
    inputLabel: { color: C.textSecondary, fontSize: 11 },

    // Alert pills
    alertPill: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 6,
      borderRadius: BorderRadius.xs,
      marginBottom: 4,
    },
    alertCrit: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
    alertWarn: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
    alertText: { fontSize: 10, fontWeight: '700' },

    // No-profile notice
    noProfile: {
      backgroundColor: C.divider,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: C.warning,
    },
    noProfileText: { color: C.textSecondary, fontSize: 11, lineHeight: 16 },
  });

  const hasProfile = !!results?.solar;

  // ── Section: GRID EXPORT ───────────────────────────────────────────────────
  const GridSection = () => (
    <View>
      {!hasProfile && (
        <View style={s.noProfile}>
          <Text style={[s.noProfileText, { fontWeight: '700', color: C.warning }]}>
            ℹ️ No load profile calculated yet
          </Text>
          <Text style={s.noProfileText}>
            You can still manage live grid export below using your IoT telemetry.
            For estimated revenue projections, fill in your appliances in the "My System" tab.
          </Text>
        </View>
      )}

      {/* Enable/Disable toggle */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🔌 Sell to Grid</Text>
        <Text style={s.cardSub}>
          {hasProfile
            ? `Estimated surplus: ${monthlySurplusKwh.toFixed(1)} kWh/month`
            : 'Live export managed via IoT telemetry'}
        </Text>

        {/* Live telemetry gauges */}
        {telemetry && (
          <View style={s.telGrid}>
            <View style={s.telCell}>
              <Text style={s.telEmoji}>⚡</Text>
              <Text style={s.telVal}>{liveExportKw > 0 ? `+${liveExportKw.toFixed(2)}` : liveExportKw.toFixed(2)} kW</Text>
              <Text style={s.telLbl}>Active Export Power</Text>
            </View>
            <View style={s.telCell}>
              <Text style={s.telEmoji}>🔌</Text>
              <Text style={s.telVal}>{liveVoltage.toFixed(1)} V</Text>
              <Text style={s.telLbl}>Line Voltage</Text>
            </View>
            <View style={s.telCell}>
              <Text style={s.telEmoji}>〰️</Text>
              <Text style={s.telVal}>{liveFreq.toFixed(2)} Hz</Text>
              <Text style={s.telLbl}>Grid Frequency</Text>
            </View>
            <View style={s.telCell}>
              <Text style={s.telEmoji}>{gridSynced ? '✅' : '⚠️'}</Text>
              <Text style={[s.telVal, { fontSize: 12 }]}>{gridSynced ? 'SYNCED' : 'NOT SYNCED'}</Text>
              <Text style={s.telLbl}>Inverter Grid Sync</Text>
            </View>
          </View>
        )}

        {/* Accumulated credits or estimated revenue */}
        {gridExportStatus === 'ACTIVE' ? (
          <>
            <Text style={s.bigNum}>{currency.symbol}{accumulatedCredits.toFixed(2)}</Text>
            <Text style={s.bigUnit}>total credits earned this session</Text>
          </>
        ) : hasProfile ? (
          <>
            <Text style={s.bigNum}>{fmt(monthlySurplusRevenue, currency.symbol)}</Text>
            <Text style={s.bigUnit}>estimated revenue / month</Text>
          </>
        ) : null}

        <View style={s.switchRow}>
          <View>
            <Text style={s.switchLabel}>Enable Grid Export</Text>
            <Text style={s.switchSub}>Authorize your inverter to sell surplus back to the utility</Text>
          </View>
          <Switch
            value={gridExportEnabled}
            onValueChange={toggleGridExport}
            trackColor={{ false: C.border, true: C.success }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.success, marginTop: Spacing.sm }]}
          onPress={() => setIsWizardVisible(true)}
        >
          <Text style={s.btnText}>
            {gridExportStatus === 'ACTIVE' ? '⚙️ Manage Net Metering →' : '🔌 Configure Grid Export →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Fault Alerts for Grid */}
      {activeAlerts.filter(a => a.code.includes('GRID') || a.code.includes('SYNC') || a.code.includes('REVERSE')).length > 0 && (
        <View style={s.card}>
          <Text style={[s.cardTitle, { color: C.error, fontSize: 13 }]}>⚠️ Active Grid Faults</Text>
          {activeAlerts
            .filter(a => a.code.includes('GRID') || a.code.includes('SYNC') || a.code.includes('REVERSE'))
            .map(a => (
              <View key={a.id} style={[s.alertPill, a.severity === 'CRITICAL' ? s.alertCrit : s.alertWarn]}>
                <Text style={[s.alertText, { color: a.severity === 'CRITICAL' ? '#991B1B' : '#92400E' }]}>
                  {a.severity === 'CRITICAL' ? '🔴 ' : '🟡 '}{a.title}: {a.recommendedAction}
                </Text>
              </View>
            ))}
        </View>
      )}

      <GridExportWizard visible={isWizardVisible} onClose={() => setIsWizardVisible(false)} />
    </View>
  );

  // ── Section: NEIGHBOR TRANSFER ─────────────────────────────────────────────
  const NeighborSection = () => {
    const handleCreateInvite = async () => {
      setIsCreatingInvite(true);
      try {
        await createInviteCode(parseFloat(inviteTariff) || 225, inviteCycle, inviteEmail || undefined, invitePhone || undefined);
        setInviteEmail('');
        setInvitePhone('');
      } catch (err) {
        console.error(err);
      } finally {
        setIsCreatingInvite(false);
      }
    };

    return (
      <View>
        {!hasProfile && (
          <View style={s.noProfile}>
            <Text style={[s.noProfileText, { fontWeight: '700', color: C.warning }]}>
              ℹ️ No load profile calculated yet
            </Text>
            <Text style={s.noProfileText}>
              You can still configure and monitor live P2P neighbor energy sharing.
              Enter a manual transfer amount below, or go to "My System" to calculate your real surplus.
            </Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>🤝 Neighbor Transfer</Text>
          <Text style={s.cardSub}>
            Share surplus solar energy directly with neighbors at peer-to-peer tariff
          </Text>

          {/* Live P2P gauges */}
          {telemetry && (
            <View style={s.telGrid}>
              <View style={s.telCell}>
                <Text style={s.telEmoji}>⚡</Text>
                <Text style={s.telVal}>{neighborKw.toFixed(2)} kW</Text>
                <Text style={s.telLbl}>Transfer Rate</Text>
              </View>
              <View style={s.telCell}>
                <Text style={s.telEmoji}>🔌</Text>
                <Text style={s.telVal}>{neighborV.toFixed(1)} V</Text>
                <Text style={s.telLbl}>Line Voltage</Text>
              </View>
              <View style={s.telCell}>
                <Text style={s.telEmoji}>📦</Text>
                <Text style={s.telVal}>{neighborKwh.toFixed(2)} kWh</Text>
                <Text style={s.telLbl}>Delivered Total</Text>
              </View>
              <View style={s.telCell}>
                <Text style={s.telEmoji}>🏘️</Text>
                <Text style={s.telVal}>{neighborLinks}</Text>
                <Text style={s.telLbl}>Active P2P Links</Text>
              </View>
            </View>
          )}

          {/* Value summary */}
          {hasProfile && monthlySurplusKwh > 0 ? (
            <>
              <Text style={s.bigNum}>{fmt(transferValue || monthlySurplusRevenue * 0.3, currency.symbol)}</Text>
              <Text style={s.bigUnit}>transfer credit value / month</Text>
            </>
          ) : (
            <>
              <Text style={s.bigNum}>{fmt(neighborKw * 24 * 30 * tariff, currency.symbol)}</Text>
              <Text style={s.bigUnit}>projected neighbor revenue / month at live rate</Text>
            </>
          )}

          {/* Manual kWh input */}
          <Text style={[s.inputLabel, { marginTop: Spacing.sm }]}>
            Set monthly transfer target (kWh)
            {hasProfile && ` — max available: ${monthlySurplusKwh.toFixed(1)} kWh`}
          </Text>
          <TextInput
            style={s.inputBox}
            value={transferKwh}
            onChangeText={setTransferKwh}
            keyboardType="decimal-pad"
            placeholder={hasProfile ? `max ${monthlySurplusKwh.toFixed(0)} kWh` : 'e.g. 150'}
            placeholderTextColor={C.placeholder}
          />

          <View style={s.switchRow}>
            <View>
              <Text style={s.switchLabel}>Enable P2P Transfer</Text>
              <Text style={s.switchSub}>Open microgrid link to neighbor subscribers</Text>
            </View>
            <Switch
              value={neighbourTransferEnabled}
              onValueChange={toggleNeighbourTransfer}
              trackColor={{ false: C.border, true: C.info }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── P2P Consumer Connection Invitation Panel ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>✉️ Invite Neighbor Consumer</Text>
          <Text style={s.cardSub}>Generate invitation details or codes for neighbors to join your supply contract</Text>

          <Text style={s.inputLabel}>Neighbor Email (Optional)</Text>
          <TextInput
            style={s.inputBox}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="neighbor@community.com"
            placeholderTextColor={C.placeholder}
            autoCapitalize="none"
          />

          <Text style={[s.inputLabel, { marginTop: Spacing.xs }]}>Neighbor Phone Number (Optional)</Text>
          <TextInput
            style={s.inputBox}
            value={invitePhone}
            onChangeText={setInvitePhone}
            placeholder="+234..."
            placeholderTextColor={C.placeholder}
          />

          <Text style={[s.inputLabel, { marginTop: Spacing.xs }]}>Peer-to-Peer Tariff ({currency.symbol}/kWh)</Text>
          <TextInput
            style={s.inputBox}
            value={inviteTariff}
            onChangeText={setInviteTariff}
            keyboardType="decimal-pad"
            placeholder="180"
            placeholderTextColor={C.placeholder}
          />

          <Text style={[s.inputLabel, { marginTop: Spacing.xs }]}>Billing Mode</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            {(['PREPAID', 'POSTPAID', 'HYBRID'] as const).map((cycle) => (
              <TouchableOpacity
                key={cycle}
                style={[{
                  paddingVertical: 6, paddingHorizontal: 12, borderRadius: BorderRadius.full,
                  borderWidth: 1, borderColor: C.border, backgroundColor: C.divider
                }, inviteCycle === cycle && { backgroundColor: C.primary, borderColor: C.primary }]}
                onPress={() => setInviteCycle(cycle)}
              >
                <Text style={[{ fontSize: 10, fontWeight: '700', color: C.textSecondary }, inviteCycle === cycle && { color: '#fff' }]}>
                  {cycle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: C.primary, marginTop: Spacing.md }]}
            onPress={handleCreateInvite}
            disabled={isCreatingInvite}
          >
            <Text style={s.btnText}>{isCreatingInvite ? 'Generating...' : '🎟️ Generate Invitation Code'}</Text>
          </TouchableOpacity>

          {/* Invitation code outputs */}
          {consumerInvite && (
            <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: C.divider, borderRadius: BorderRadius.xs, borderWidth: 1, borderColor: C.border, alignItems: 'center' }}>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>INVITATION CODE</Text>
              <Text style={{ color: C.primary, fontSize: 24, fontWeight: '900', letterSpacing: 2, marginVertical: 4 }}>
                {consumerInvite.invitationCode}
              </Text>
              <Text style={{ color: C.textSecondary, fontSize: 10, textAlign: 'center', marginBottom: Spacing.sm }}>
                Share this code with your neighbor. They can enter it in their REOS Dashboard to link accounts.
              </Text>
              {/* Simulated QR Code */}
              <View style={{ width: 100, height: 100, backgroundColor: '#fff', padding: 8, borderRadius: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 44 }}>🏁</Text>
                <Text style={{ color: '#000', fontSize: 6, fontWeight: '700', marginTop: 2 }}>REOS P2P SCAN</Text>
              </View>
            </View>
          )}
        </View>

        {/* Active Connected Consumers List */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🏘️ Connected Neighbor Contracts</Text>
          {activeContract ? (
            <View style={{ padding: Spacing.sm, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: BorderRadius.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: C.textPrimary, fontWeight: '700', fontSize: 14 }}>
                    👤 {activeContract.consumer?.firstName || 'Neighbor'} {activeContract.consumer?.lastName || 'Consumer'}
                  </Text>
                  <Text style={{ color: C.textSecondary, fontSize: 11 }}>{activeContract.consumer?.email || 'neighbor@reos.io'}</Text>
                </View>
                <View style={{ backgroundColor: C.successLight, paddingVertical: 2, paddingHorizontal: 6, borderRadius: BorderRadius.xs }}>
                  <Text style={{ color: C.success, fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>
                </View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: C.border, marginTop: Spacing.sm, paddingTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: C.textSecondary, fontSize: 11 }}>Tariff Rate: ₦{activeContract.tariffRate}/kWh</Text>
                <Text style={{ color: C.textSecondary, fontSize: 11 }}>Mode: {activeContract.billingCycle}</Text>
              </View>
            </View>
          ) : (
            <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: 'center', marginVertical: Spacing.sm }}>
              No active energy sharing contracts. Generate an invite code above to connect!
            </Text>
          )}
        </View>

        {/* P2P Fault Alerts */}
        {activeAlerts.filter(a => a.code.includes('NEIGHBOUR')).length > 0 && (
          <View style={s.card}>
            <Text style={[s.cardTitle, { color: C.error, fontSize: 13 }]}>⚠️ P2P Link Faults</Text>
            {activeAlerts.filter(a => a.code.includes('NEIGHBOUR')).map(a => (
              <View key={a.id} style={[s.alertPill, a.severity === 'CRITICAL' ? s.alertCrit : s.alertWarn]}>
                <Text style={[s.alertText, { color: a.severity === 'CRITICAL' ? '#991B1B' : '#92400E' }]}>
                  {a.title}: {a.recommendedAction}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      {/* Tab bar */}
      <View style={s.tabBar}>
        {([
          { key: 'GRID',     emoji: '🔌', label: 'Sell to Grid' },
          { key: 'NEIGHBOR', emoji: '🤝', label: 'Neighbors' },
          { key: 'IOT',      emoji: '🌐', label: 'IoT Center' },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, activeSection === t.key && s.tabActive]}
            onPress={() => setActiveSection(t.key)}
          >
            <Text style={s.tabEmoji}>{t.emoji}</Text>
            <Text style={[s.tabText, activeSection === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeSection === 'GRID'     && <GridSection />}
      {activeSection === 'NEIGHBOR' && <NeighborSection />}
      {activeSection === 'IOT'      && <IotControlCenter />}
    </View>
  );
};
