import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Modal, TouchableOpacity, 
  TextInput, ScrollView, ActivityIndicator, Switch 
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

interface GridExportWizardProps {
  visible: boolean;
  onClose: () => void;
}

const UTILITIES_BY_CURRENCY: Record<string, string[]> = {
  NGN: ['Ikeja Electric (IKEDC)', 'Eko Electric (EKEDC)', 'Abuja Electric (AEDC)', 'Enugu Electric (EEDC)'],
  USD: ['Pacific Gas & Electric (PG&E)', 'Southern California Edison (SCE)', 'Con Edison'],
  GBP: ['National Grid', 'British Gas', 'EDF Energy'],
  EUR: ['Enel', 'Iberdrola', 'Vattenfall'],
  ZAR: ['Eskom', 'City Power Johannesburg'],
  KES: ['Kenya Power (KPLC)'],
  GHS: ['Electricity Company of Ghana (ECG)'],
};

export const GridExportWizard: React.FC<GridExportWizardProps> = ({ visible, onClose }) => {
  const { 
    theme, inputs, results, 
    gridExportStatus, utilityProvider, utilityAccountNo, accumulatedCredits,
    updateGridExportStatus, setUtilityDetails, addAccumulatedCredits, resetGridExport 
  } = useStore();
  const activeColors = Colors[theme];

  // Local UI states
  const [selectedUtility, setSelectedUtility] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [isExportEnabled, setIsExportEnabled] = useState(true);
  const [simulatedStatus, setSimulatedStatus] = useState<typeof gridExportStatus>('INACTIVE');

  const currency = inputs.currency;
  const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const utilities = UTILITIES_BY_CURRENCY[currency] || UTILITIES_BY_CURRENCY.USD;

  // Initialize local states from store
  useEffect(() => {
    if (visible) {
      setSimulatedStatus(gridExportStatus);
      if (utilityProvider) setSelectedUtility(utilityProvider);
      if (utilityAccountNo) setAccountNo(utilityAccountNo);
    }
  }, [visible, gridExportStatus, utilityProvider, utilityAccountNo]);

  // Step 3: Simulation timer for approval and meter installation
  useEffect(() => {
    let t1: any;
    let t2: any;

    if (simulatedStatus === 'APPLICATION_PENDING') {
      t1 = setTimeout(() => {
        setSimulatedStatus('METER_INSTALLATION');
        updateGridExportStatus('METER_INSTALLATION');
      }, 4000);
    } else if (simulatedStatus === 'METER_INSTALLATION') {
      t2 = setTimeout(() => {
        setSimulatedStatus('ACTIVE');
        updateGridExportStatus('ACTIVE');
      }, 4000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [simulatedStatus]);

  // Step 4: Live credit accumulator simulation
  useEffect(() => {
    let interval: any;
    if (gridExportStatus === 'ACTIVE' && isExportEnabled && results.solar && results.load) {
      const dailyGen = results.solar.expectedAnnualGenKwh / 365;
      const dailyUse = results.load.dailyEnergyKwh;
      const dailySurplus = Math.max(0, dailyGen - dailyUse);
      
      // Calculate earnings per second: (surplus kWh / 86400 seconds) * tariff rate
      const earningsPerSec = (dailySurplus / 86400) * inputs.gridTariffRate;
      
      // Update every 2 seconds for visibility
      interval = setInterval(() => {
        addAccumulatedCredits(earningsPerSec * 2);
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [gridExportStatus, isExportEnabled, results.solar, results.load]);

  const handleStartCheck = () => {
    setSimulatedStatus('COMPLIANCE_CHECK');
    updateGridExportStatus('COMPLIANCE_CHECK');
  };

  const handleSubmitApplication = () => {
    if (!selectedUtility || !accountNo.trim()) return;
    setUtilityDetails(selectedUtility, accountNo.trim());
    setSimulatedStatus('APPLICATION_PENDING');
    updateGridExportStatus('APPLICATION_PENDING');
  };

  // Compliance calculations
  const isSolarValid = (results.solar?.requiredPvSizeKw ?? 0) > 0;
  const isCableValid = (results.cable?.voltageDropPercent ?? 0) <= 3.0;
  
  const inverterKw = inputs.inverterRatingKw || results.inverter?.recommendedInverterKw || 0;
  const maxDemand = results.load?.maximumDemandW || 0;
  const isInverterValid = (inverterKw * 1000) >= maxDemand;

  const passesAllChecks = isSolarValid && isCableValid && isInverterValid;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.md,
    },
    container: {
      backgroundColor: activeColors.card,
      borderRadius: BorderRadius.lg,
      width: '100%',
      maxWidth: 500,
      borderWidth: 1,
      borderColor: activeColors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: activeColors.border,
    },
    title: {
      color: activeColors.textPrimary,
      fontWeight: '700',
      fontSize: 16,
    },
    btnClose: {
      padding: 4,
    },
    btnCloseText: {
      color: activeColors.textSecondary,
      fontSize: 16,
    },
    content: {
      padding: Spacing.md,
      maxHeight: 500,
    },
    sub: {
      color: activeColors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: Spacing.md,
    },
    // Compliance styles
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: activeColors.divider,
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.xs,
      borderWidth: 1,
      borderColor: activeColors.border,
    },
    checkIcon: {
      fontSize: 16,
      marginRight: Spacing.sm,
    },
    checkText: {
      color: activeColors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    checkSub: {
      color: activeColors.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    badge: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: BorderRadius.xs,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    // Form styles
    inputBox: {
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      color: activeColors.textPrimary,
      fontSize: 14,
      marginBottom: Spacing.sm,
    },
    label: {
      color: activeColors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    utilityOption: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      backgroundColor: activeColors.divider,
      marginBottom: 6,
      borderWidth: 1.5,
      borderColor: activeColors.border,
    },
    utilityOptionActive: {
      borderColor: activeColors.primary,
      backgroundColor: activeColors.surface,
    },
    utilityText: {
      color: activeColors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    // Stepper styles
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    stepDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    stepDotActive: {
      backgroundColor: activeColors.primary,
    },
    stepDotPending: {
      backgroundColor: activeColors.divider,
      borderWidth: 1,
      borderColor: activeColors.border,
    },
    stepNum: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    stepNumPending: {
      color: activeColors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    stepTitle: {
      color: activeColors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    stepSub: {
      color: activeColors.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    // Active Dashboard styles
    activeContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    liveLottie: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: activeColors.successLight,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: BorderRadius.full,
      marginBottom: Spacing.sm,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: activeColors.success,
    },
    liveText: {
      color: activeColors.success,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    creditValue: {
      fontSize: 32,
      fontWeight: '800',
      color: activeColors.primary,
      marginVertical: Spacing.xs,
    },
    creditLabel: {
      color: activeColors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: activeColors.divider,
      width: '100%',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: activeColors.border,
    },
    // Buttons
    btnPrimary: {
      backgroundColor: activeColors.primary,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.md,
    },
    btnPrimaryDisabled: {
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
    },
    btnPrimaryText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🔌 Grid Export Integration</Text>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* ── STEP 0: Inactive / Intro ───────────────────────────────────── */}
            {simulatedStatus === 'INACTIVE' && (
              <View>
                <Text style={styles.sub}>
                  Sell your excess solar electricity back to the grid to earn credits and lower your monthly bill. 
                  We will check your system compliance and generate your net metering application.
                </Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleStartCheck}>
                  <Text style={styles.btnPrimaryText}>Start Compliance Check →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 1: Compliance Check ───────────────────────────────────── */}
            {simulatedStatus === 'COMPLIANCE_CHECK' && (
              <View>
                <Text style={styles.sub}>
                  Before exporting, the utility company requires your solar design to meet safety and wiring regulations.
                </Text>

                {/* Solar Sized Check */}
                <View style={styles.checkRow}>
                  <Text style={styles.checkIcon}>{isSolarValid ? '✅' : '❌'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkText}>Solar Array Capacity</Text>
                    <Text style={styles.checkSub}>
                      {isSolarValid ? `Sized at ${results.solar?.requiredPvSizeKw} kWp` : 'No solar PV array sized yet'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isSolarValid ? activeColors.successLight : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: isSolarValid ? activeColors.success : '#EF4444' }]}>
                      {isSolarValid ? 'PASS' : 'FAIL'}
                    </Text>
                  </View>
                </View>

                {/* Inverter Capacity Check */}
                <View style={styles.checkRow}>
                  <Text style={styles.checkIcon}>{isInverterValid ? '✅' : '❌'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkText}>Inverter Capacity Margin</Text>
                    <Text style={styles.checkSub}>
                      {inverterKw > 0 
                        ? `Selected: ${inverterKw}kW (Peak load: ${(maxDemand / 1000).toFixed(1)}kW)` 
                        : 'No inverter sized yet'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isInverterValid ? activeColors.successLight : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: isInverterValid ? activeColors.success : '#EF4444' }]}>
                      {isInverterValid ? 'PASS' : 'FAIL'}
                    </Text>
                  </View>
                </View>

                {/* Cable Drop Check */}
                <View style={styles.checkRow}>
                  <Text style={styles.checkIcon}>{isCableValid ? '✅' : '❌'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkText}>Cable Coordination (Voltage Drop)</Text>
                    <Text style={styles.checkSub}>
                      {results.cable 
                        ? `Voltage drop: ${results.cable.voltageDropPercent.toFixed(2)}% (Limit: 3.0%)` 
                        : 'No cable sized yet'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isCableValid ? activeColors.successLight : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: isCableValid ? activeColors.success : '#EF4444' }]}>
                      {isCableValid ? 'PASS' : 'FAIL'}
                    </Text>
                  </View>
                </View>

                {passesAllChecks ? (
                  <View style={{ marginTop: Spacing.md }}>
                    <Text style={[styles.sub, { color: activeColors.success, fontWeight: '600' }]}>
                      🎉 Your design is fully compliant with Net Metering grid standards!
                    </Text>
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => setSimulatedStatus('APPLICATION_PENDING')}>
                      <Text style={styles.btnPrimaryText}>Continue to Application →</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ marginTop: Spacing.md }}>
                    <Text style={[styles.sub, { color: '#EF4444', fontWeight: '600' }]}>
                      ⚠️ Your design does not meet export compliance. Please go to the Installer or Engineer workspace to correct the failing parameters.
                    </Text>
                    <TouchableOpacity 
                      style={[styles.btnPrimary, styles.btnPrimaryDisabled]} 
                      disabled
                    >
                      <Text style={[styles.btnPrimaryText, { color: activeColors.textSecondary }]}>Continue to Application</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ── STEP 2: Application Form ───────────────────────────────────── */}
            {simulatedStatus === 'APPLICATION_PENDING' && !utilityProvider && (
              <View>
                <Text style={styles.sub}>
                  Select your utility provider and enter your account details. We will auto-fill your net metering agreement with your sizing metrics.
                </Text>

                <Text style={styles.label}>Select Utility Distribution Company</Text>
                {utilities.map(u => (
                  <TouchableOpacity 
                    key={u} 
                    style={[styles.utilityOption, selectedUtility === u && styles.utilityOptionActive]}
                    onPress={() => setSelectedUtility(u)}
                  >
                    <Text style={styles.utilityText}>{u}</Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.label, { marginTop: Spacing.md }]}>Utility Account Number</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="e.g. 12-3456-7890"
                  placeholderTextColor={activeColors.placeholder}
                  value={accountNo}
                  onChangeText={setAccountNo}
                  keyboardType="numeric"
                />

                <TouchableOpacity 
                  style={[styles.btnPrimary, (!selectedUtility || !accountNo.trim()) && styles.btnPrimaryDisabled]}
                  disabled={!selectedUtility || !accountNo.trim()}
                  onPress={handleSubmitApplication}
                >
                  <Text style={styles.btnPrimaryText}>Submit Net Metering Request</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 3: Stepper Tracker ────────────────────────────────────── */}
            {(simulatedStatus === 'APPLICATION_PENDING' && utilityProvider) || simulatedStatus === 'METER_INSTALLATION' ? (
              <View>
                <Text style={styles.sub}>
                  Your application has been submitted to **{utilityProvider}**. The utility company is verifying your electrical drawing and dispatching a smart net meter.
                </Text>

                {/* Step 1 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, styles.stepDotActive]}>
                    <Text style={styles.stepNum}>✓</Text>
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Application Submitted</Text>
                    <Text style={styles.stepSub}>Account: {utilityAccountNo}</Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, simulatedStatus === 'METER_INSTALLATION' ? styles.stepDotActive : styles.stepDotPending]}>
                    <Text style={simulatedStatus === 'METER_INSTALLATION' ? styles.stepNum : styles.stepNumPending}>
                      {simulatedStatus === 'METER_INSTALLATION' ? '✓' : '2'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Technical Review & Compliance Check</Text>
                    <Text style={styles.stepSub}>
                      {simulatedStatus === 'METER_INSTALLATION' ? 'Approved by Grid Engineer' : 'Reviewing system schematics...'}
                    </Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, styles.stepDotPending]}>
                    <ActivityIndicator size="small" color={activeColors.primary} style={{ transform: [{ scale: 0.8 }] }} />
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Dispatching Bi-directional Net Meter</Text>
                    <Text style={styles.stepSub}>Scheduling technician for physical meter installation...</Text>
                  </View>
                </View>

                {/* Step 4 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, styles.stepDotPending]}>
                    <Text style={styles.stepNumPending}>4</Text>
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Activated</Text>
                    <Text style={styles.stepSub}>Grid export credits active</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.btnPrimary, { backgroundColor: activeColors.divider, borderColor: activeColors.border, borderWidth: 1 }]}
                  onPress={() => alert(`REOS Net-Metering Spec Sheet Generated!\n\nSystem Owner: Account #${utilityAccountNo}\nProvider: ${utilityProvider}\nSolar Size: ${results.solar?.requiredPvSizeKw} kWp\nInverter Size: ${inverterKw} kW\nBattery Size: ${results.battery?.requiredCapacityKwh} kWh`)}
                >
                  <Text style={[styles.btnPrimaryText, { color: activeColors.textPrimary }]}>
                    📄 Download Sizing Spec Sheet
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── STEP 4: Active Dashboard ───────────────────────────────────── */}
            {simulatedStatus === 'ACTIVE' && (
              <View style={styles.activeContainer}>
                {isExportEnabled ? (
                  <View style={styles.liveLottie}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>EXPORTING LIVE</Text>
                  </View>
                ) : (
                  <View style={[styles.liveLottie, { backgroundColor: activeColors.divider }]}>
                    <View style={[styles.liveDot, { backgroundColor: activeColors.textSecondary }]} />
                    <Text style={[styles.liveText, { color: activeColors.textSecondary }]}>STANDBY</Text>
                  </View>
                )}

                <Text style={styles.creditValue}>
                  {currencySymbol}{accumulatedCredits.toFixed(4)}
                </Text>
                <Text style={styles.creditLabel}>Accumulated Net-Metering Credits</Text>
                
                <Text style={[styles.sub, { textAlign: 'center', marginTop: Spacing.sm, marginBottom: 0 }]}>
                  Utility Partner: **{utilityProvider}** · Account: **{utilityAccountNo}**
                </Text>

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, marginRight: Spacing.sm }}>
                    <Text style={[styles.checkText, { fontSize: 14 }]}>Feed-In to Grid</Text>
                    <Text style={styles.checkSub}>Toggles physical power export to the utility</Text>
                  </View>
                  <Switch 
                    value={isExportEnabled} 
                    onValueChange={setIsExportEnabled}
                    trackColor={{ false: activeColors.border, true: activeColors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.btnPrimary, { width: '100%', backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    resetGridExport();
                    setSimulatedStatus('INACTIVE');
                  }}
                >
                  <Text style={styles.btnPrimaryText}>Disconnect Grid Integration ✕</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
