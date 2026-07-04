import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, TextInput, Switch, Modal, ActivityIndicator
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { generateInvoicePdf } from '../store/pdfGenerator';

export const ConsumerPortal: React.FC = () => {
  const {
    theme, inputs, telemetry, alerts, billingSummary, notifications,
    activeContract, verifyInviteCode, acceptEnergySharing,
    fetchConsumerContract, fetchConsumerBilling, fetchUserNotifications,
    rechargeWallet, payOutstandingInvoice, markNotificationRead
  } = useStore();

  const C = Colors[theme];

  // Component UI States
  const [portalTab, setPortalTab] = useState<'HOME' | 'BILLING' | 'ANALYTICS' | 'NOTIFICATIONS'>('HOME');
  const [inviteInput, setInviteInput] = useState('');
  const [verifyingInvite, setVerifyingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [pendingInviteData, setPendingInviteData] = useState<any | null>(null);

  // Top Up Modal State
  const [isTopUpVisible, setIsTopUpVisible] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchConsumerContract();
    fetchConsumerBilling();
    fetchUserNotifications();
  }, []);

  const handleVerifyCode = async () => {
    if (!inviteInput.trim()) return;
    setInviteError('');
    setVerifyingInvite(true);
    try {
      const invite = await verifyInviteCode(inviteInput.trim());
      if (invite) {
        setPendingInviteData(invite);
      } else {
        setInviteError('Invalid or expired invitation code.');
      }
    } catch (err) {
      setInviteError('Failed to verify code. Please try again.');
    } finally {
      setVerifyingInvite(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!pendingInviteData) return;
    setVerifyingInvite(true);
    try {
      await acceptEnergySharing(pendingInviteData.invitationCode);
      setPendingInviteData(null);
      setInviteInput('');
      await fetchConsumerContract();
      await fetchConsumerBilling();
      await fetchUserNotifications();
    } catch (err) {
      setInviteError('Failed to approve contract.');
    } finally {
      setVerifyingInvite(false);
    }
  };

  const handleTopUpSubmit = async () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) return;
    setIsProcessingPayment(true);
    try {
      await rechargeWallet(amt, 'FLUTTERWAVE');
      setIsTopUpVisible(false);
      setTopUpAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      await payOutstandingInvoice(invoiceId, 'PAYSTACK');
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Styles
  const s = StyleSheet.create({
    container: { paddingBottom: 40 },
    section: {
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionTitle: { color: C.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: Spacing.xs },
    sectionSub: { color: C.textSecondary, fontSize: 11, marginBottom: Spacing.md },
    
    // Status Bar Gauge
    gaugeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    gaugeTitle: { color: C.textPrimary, fontSize: 14, fontWeight: '700' },
    statusBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: BorderRadius.xs,
    },
    statusText: { fontSize: 10, fontWeight: '800', color: '#fff' },

    // Dial / Live Telemetry Grid
    liveGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginVertical: Spacing.sm,
    },
    liveCell: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      alignItems: 'center',
    },
    liveVal: { color: C.primary, fontSize: 20, fontWeight: '900', marginTop: 4 },
    liveLbl: { color: C.textSecondary, fontSize: 9, marginTop: 2, textAlign: 'center' },

    // Tabs
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
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.sm,
    },
    tabActive: { backgroundColor: C.primary },
    tabText: { color: C.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2 },
    tabTextActive: { color: '#fff' },

    // Inputs & Forms
    inputLabel: { color: C.textSecondary, fontSize: 11, marginBottom: 4 },
    input: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BorderRadius.xs,
      padding: 10,
      color: C.textPrimary,
      fontSize: 14,
      marginBottom: Spacing.sm,
    },
    btn: {
      borderRadius: BorderRadius.sm,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    // Billing Cards
    balanceContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
      backgroundColor: C.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: Spacing.md,
    },
    balanceVal: { fontSize: 32, fontWeight: '900', color: C.success },
    
    // Invoices list
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    itemTitle: { color: C.textPrimary, fontWeight: '700', fontSize: 13 },
    itemSub: { color: C.textSecondary, fontSize: 10, marginTop: 2 },
    btnPay: {
      backgroundColor: C.primary,
      borderRadius: BorderRadius.xs,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    btnPdf: {
      backgroundColor: C.divider,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginLeft: 4,
    },

    // Notifications List
    notifCard: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      marginBottom: Spacing.xs,
      position: 'relative',
    },
    dotUnread: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: C.primary,
      position: 'absolute',
      top: 10,
      right: 10,
    },

    // Analytics List & Score
    scoreContainer: {
      backgroundColor: C.infoLight,
      borderColor: C.info,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.md,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    scoreVal: { fontSize: 44, fontWeight: '900', color: C.info },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      width: '100%',
      maxWidth: 350,
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
    },
    modalTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: Spacing.md },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm }
  });

  // ─── IF CONTRACT NOT CONNECTED: REGISTRATION PORTAL ───────────────────────
  if (!activeContract) {
    return (
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={[s.section, { borderLeftWidth: 4, borderLeftColor: C.primary }]}>
          <Text style={s.sectionTitle}>🔌 P2P Energy Sharing Registry</Text>
          <Text style={s.sectionSub}>Join a neighbor's community microgrid to receive live electricity and diagnostics</Text>

          <Text style={s.inputLabel}>Enter invitation code (e.g. REOS-1234)</Text>
          <TextInput
            style={s.input}
            value={inviteInput}
            onChangeText={setInviteInput}
            placeholder="REOS-XXXX"
            placeholderTextColor={C.placeholder}
            autoCapitalize="characters"
          />

          {inviteError ? <Text style={{ color: C.error, fontSize: 11, marginBottom: 8 }}>⚠️ {inviteError}</Text> : null}

          <TouchableOpacity
            style={[s.btn, { backgroundColor: C.primary }]}
            onPress={handleVerifyCode}
            disabled={verifyingInvite}
          >
            {verifyingInvite ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.btnText}>Verify Connection Code</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Invitation confirmation card */}
        {pendingInviteData && (
          <View style={[s.section, { borderColor: C.success, borderWidth: 1.5 }]}>
            <Text style={[s.sectionTitle, { color: C.success }]}>📝 Energy Sharing Contract Summary</Text>
            <Text style={{ color: C.textPrimary, fontSize: 13, marginBottom: Spacing.sm }}>
              You are establishing an energy sharing relationship with:
            </Text>
            <View style={{ backgroundColor: C.surface, padding: Spacing.sm, borderRadius: BorderRadius.xs, marginBottom: Spacing.sm }}>
              <Text style={{ color: C.textPrimary, fontWeight: '700' }}>
                Supplier: {pendingInviteData.supplier.firstName} {pendingInviteData.supplier.lastName}
              </Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Email: {pendingInviteData.supplier.email}</Text>
              <Text style={{ color: C.textPrimary, fontWeight: '700', marginTop: 6 }}>
                P2P Tariff Rate: ₦180.00 / kWh
              </Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Billing Cycle: PREPAID</Text>
            </View>

            <Text style={{ color: C.textSecondary, fontSize: 10, lineHeight: 14, marginBottom: Spacing.md }}>
              By accepting, REOS creates a secure digital P2P energy sharing contract. The edge gateway will begin streaming telemetry and invoice calculators to your dashboard.
            </Text>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: C.success }]}
              onPress={handleAcceptContract}
              disabled={verifyingInvite}
            >
              <Text style={s.btnText}>Accept Connection & Activate Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // Derived Metrics
  const livePowerReceived = telemetry?.neighbourTrading?.instantaneousPowerKw ?? 0.60;
  const liveVoltage = telemetry?.neighbourTrading?.voltageV ?? 226.4;
  const liveCurrent = telemetry?.neighbourTrading?.currentA ?? 2.65;
  const liveFreq = telemetry?.inverter?.frequencyHz ?? 50.02;
  const livePF = telemetry?.smartMeter?.powerFactor ?? 0.98;
  const energyReceivedToday = telemetry?.neighbourTrading?.energyDeliveredKwh ?? 4.56;
  const currentTariff = activeContract?.tariffRate ?? 180;
  const estimatedCostToday = energyReceivedToday * currentTariff;

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Supplier Identity Banner */}
      <View style={[s.section, { backgroundColor: C.primary, borderColor: C.primary }]}>
        <View style={s.gaugeHeader}>
          <View>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
              🔌 Linked Supplier: {activeContract.supplier?.firstName || 'Sunshine'} {activeContract.supplier?.lastName || 'Supplier'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>
              Microgrid Link: {activeContract.gatewayId || 'dev-gw-001'} (Active)
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: C.success }]}>
            <Text style={s.statusText}>CONNECTED</Text>
          </View>
        </View>
      </View>

      {/* Main Tabs */}
      <View style={s.tabBar}>
        {([
          { key: 'HOME', emoji: '🏠', label: 'Home' },
          { key: 'BILLING', emoji: '💳', label: 'Billing' },
          { key: 'ANALYTICS', emoji: '📊', label: 'Analytics' },
          { key: 'NOTIFICATIONS', emoji: '🔔', label: `Alerts (${notifications.filter(n => !n.read).length})` },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, portalTab === t.key && s.tabActive]}
            onPress={() => setPortalTab(t.key)}
          >
            <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
            <Text style={[s.tabText, portalTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── HOME SCREEN TAB ────────────────────────────────────────────────── */}
      {portalTab === 'HOME' && (
        <View>
          {/* Live Energy Flow */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚡ Live Energy Telemetry</Text>
            <Text style={s.sectionSub}>Real-time stream from your neighbor P2P link</Text>

            <View style={s.liveGrid}>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 24 }}>⚡</Text>
                <Text style={s.liveVal}>{livePowerReceived.toFixed(3)} kW</Text>
                <Text style={s.liveLbl}>Power Received</Text>
              </View>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 24 }}>🔌</Text>
                <Text style={s.liveVal}>{liveVoltage.toFixed(1)} V</Text>
                <Text style={s.liveLbl}>Line Voltage</Text>
              </View>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 24 }}>⚙️</Text>
                <Text style={s.liveVal}>{liveCurrent.toFixed(2)} A</Text>
                <Text style={s.liveLbl}>Line Current</Text>
              </View>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 24 }}>〰️</Text>
                <Text style={s.liveVal}>{liveFreq.toFixed(2)} Hz</Text>
                <Text style={s.liveLbl}>Grid Frequency</Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: C.border, marginTop: Spacing.sm, paddingTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Power Factor: {livePF.toFixed(2)}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Last Checked: Just Now</Text>
            </View>
          </View>

          {/* Daily Consumption Metrics */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📅 Daily Energy Usage</Text>
            <Text style={s.sectionSub}>Summaries for today: {new Date().toLocaleDateString()}</Text>

            <View style={s.liveGrid}>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 20 }}>📦</Text>
                <Text style={[s.liveVal, { color: C.primary }]}>{energyReceivedToday.toFixed(2)} kWh</Text>
                <Text style={s.liveLbl}>Energy Received Today</Text>
              </View>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 20 }}>🪙</Text>
                <Text style={[s.liveVal, { color: C.success }]}>{formatCurrency(estimatedCostToday)}</Text>
                <Text style={s.liveLbl}>Estimated Cost Today</Text>
              </View>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 20 }}>📊</Text>
                <Text style={s.liveVal}>{activeContract.tariffRate} ₦/kWh</Text>
                <Text style={s.liveLbl}>Current Sharing Tariff</Text>
              </View>
              <View style={s.liveCell}>
                <Text style={{ fontSize: 20 }}>⏱️</Text>
                <Text style={s.liveVal}>24.0 Hrs</Text>
                <Text style={s.liveLbl}>Supply Duration Today</Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: C.border, marginTop: Spacing.sm, paddingTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Peak Demand: 1.84 kW</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Average Load: 0.19 kW</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Interruptions: 0</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── BILLING MODULE TAB ────────────────────────────────────────────── */}
      {portalTab === 'BILLING' && (
        <View>
          {/* Wallet Balance Card */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💳 Microgrid Wallet Summary</Text>
            <Text style={s.sectionSub}>Wallet top-ups and balance settlements</Text>
            
            <View style={s.balanceContainer}>
              <Text style={s.balanceVal}>{formatCurrency(billingSummary?.balance ?? 5000.0)}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 10, marginTop: 4 }}>Prepaid Balance (Auto-Depletes with usage)</Text>
            </View>

            {billingSummary?.outstandingBalance > 0 && (
              <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', padding: Spacing.sm, borderRadius: BorderRadius.xs, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700' }}>
                  Outstanding Balance: {formatCurrency(billingSummary.outstandingBalance)}
                </Text>
                <Text style={{ color: '#B45309', fontSize: 10 }}>Due in 10 days</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btn, { backgroundColor: C.success }]}
              onPress={() => setIsTopUpVisible(true)}
            >
              <Text style={s.btnText}>➕ Purchase Prepaid Credit</Text>
            </TouchableOpacity>
          </View>

          {/* Invoices List */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🧾 Invoices History</Text>
            <Text style={s.sectionSub}>Historical sharing logs and balances</Text>

            {billingSummary?.invoices?.map((invoice: any) => (
              <View key={invoice.id} style={s.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemTitle}>Invoice - {new Date(invoice.billingPeriodStart).toLocaleDateString('en-US', { month: 'short' })}</Text>
                  <Text style={s.itemSub}>
                    {invoice.energyReceivedKwh.toFixed(2)} kWh consumed @ ₦{invoice.tariffRate}/kWh
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {invoice.status === 'UNPAID' ? (
                    <TouchableOpacity
                      style={s.btnPay}
                      onPress={() => handlePayInvoice(invoice.id)}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>PAY {formatCurrency(invoice.amount)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ backgroundColor: C.successLight, paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.xs }}>
                      <Text style={{ color: C.success, fontSize: 10, fontWeight: '700' }}>PAID</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={s.btnPdf}
                    onPress={() => generateInvoicePdf(invoice, activeContract, activeContract.supplier, activeContract.consumer)}
                  >
                    <Text style={{ fontSize: 11 }}>📄 PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Transactions History */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💸 Transaction Log</Text>
            {billingSummary?.transactions?.map((tx: any) => (
              <View key={tx.id} style={s.itemRow}>
                <View>
                  <Text style={s.itemTitle}>
                    {tx.type === 'PREPAID_PURCHASE' ? '🔋 Top-Up Purchase' : '💳 Bill Payment'}
                  </Text>
                  <Text style={s.itemSub}>{new Date(tx.createdAt).toLocaleString()} · {tx.paymentGateway}</Text>
                </View>
                <Text style={{ color: C.success, fontWeight: '700' }}>+{formatCurrency(tx.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── ANALYTICS MODULE TAB ─────────────────────────────────────────── */}
      {portalTab === 'ANALYTICS' && (
        <View>
          {/* Energy Efficiency Card */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🌱 Energy Efficiency Profile</Text>
            <Text style={s.sectionSub}>Calculated based on power factor and load shifts</Text>
            
            <View style={s.scoreContainer}>
              <Text style={s.scoreVal}>88</Text>
              <Text style={{ color: C.info, fontWeight: '700', fontSize: 12 }}>EXCELLENT SCORE</Text>
            </View>

            <Text style={{ color: C.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
              Your energy sharing profile is highly efficient. Shifting heavy utility tasks to peak sun hours will further preserve your neighbor's battery reserve life.
            </Text>
          </View>

          {/* Historical Trends List */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📈 Historical Consumption Trends</Text>
            <Text style={s.sectionSub}>Daily peak load statistics</Text>

            <View style={s.itemRow}>
              <Text style={s.itemTitle}>Average Daily Consumption</Text>
              <Text style={{ color: C.primary, fontWeight: '700' }}>4.82 kWh</Text>
            </View>
            <View style={s.itemRow}>
              <Text style={s.itemTitle}>Highest Daily Consumption</Text>
              <Text style={{ color: C.primary, fontWeight: '700' }}>6.95 kWh (June 18)</Text>
            </View>
            <View style={s.itemRow}>
              <Text style={s.itemTitle}>Lowest Daily Consumption</Text>
              <Text style={{ color: C.primary, fontWeight: '700' }}>2.10 kWh (June 24)</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── NOTIFICATIONS ALERTS TAB ─────────────────────────────────────── */}
      {portalTab === 'NOTIFICATIONS' && (
        <View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>🔔 Active System Alerts & Notices</Text>
            <Text style={s.sectionSub}>Critical push messages from the Smart Grid edge gateway</Text>

            {notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[s.notifCard, {
                  backgroundColor: n.type === 'ALERT' ? '#FEF2F2' : n.type === 'BILLING' ? '#F0FDF4' : C.surface,
                  borderColor: n.type === 'ALERT' ? '#FCA5A5' : n.type === 'BILLING' ? '#BBF7D0' : C.border,
                }]}
                onPress={() => markNotificationRead(n.id)}
              >
                {!n.read && <View style={s.dotUnread} />}
                <Text style={{ color: n.type === 'ALERT' ? '#991B1B' : C.textPrimary, fontWeight: '700', fontSize: 13 }}>
                  {n.title}
                </Text>
                <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 }}>
                  {n.message}
                </Text>
                <Text style={{ color: C.textSecondary, fontSize: 9, marginTop: 6 }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}

            {notifications.length === 0 && (
              <Text style={{ color: C.textSecondary, textAlign: 'center', marginVertical: Spacing.md }}>
                No notifications logged.
              </Text>
            )}
          </View>

          {/* Active IoT alerts from gateway */}
          {alerts.filter(a => !a.acknowledged && (a.code.includes('UNDERVOLTAGE') || a.code.includes('OFFLINE'))).length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: C.error, fontSize: 13 }]}>⚠️ Edge Gateway Protection Alerts</Text>
              {alerts
                .filter(a => !a.acknowledged && (a.code.includes('UNDERVOLTAGE') || a.code.includes('OFFLINE')))
                .map(a => (
                  <View key={a.id} style={[s.notifCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 12 }}>{a.title}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 2 }}>{a.recommendedAction}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Prepaid Recharge Modal */}
      <Modal visible={isTopUpVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Purchase Prepaid Credit</Text>
            
            <Text style={s.inputLabel}>Enter Credit Amount (₦)</Text>
            <TextInput
              style={s.input}
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="number-pad"
              placeholder="e.g. 5000"
              placeholderTextColor={C.placeholder}
            />

            <Text style={{ color: C.textSecondary, fontSize: 10, marginBottom: Spacing.md }}>
              Payments are simulated instantly using mock credit gateways.
            </Text>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.xs, backgroundColor: C.divider }}
                onPress={() => { setIsTopUpVisible(false); setTopUpAmount(''); }}
              >
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.xs, backgroundColor: C.primary }}
                onPress={handleTopUpSubmit}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
