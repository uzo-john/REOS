import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

export const EnergyGoalOptimizer: React.FC = () => {
  const { theme, inputs, results, updateInputs } = useStore();
  const C = Colors[theme];

  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [neighborCount, setNeighborCount] = React.useState('3');

  if (!results.load || !results.solar || !results.battery || !results.inverter) {
    return null;
  }

  const basePvKw = results.solar.requiredPvSizeKw;
  const baseBatteryKwh = results.battery.requiredCapacityKwh;
  const dailyUseKwh = results.load.dailyEnergyKwh;
  const baseCapex = inputs.capexBudget;

  // Sizing parameters
  const selectedGoals = inputs.optimizationGoals || ['MEET_DEMAND'];
  const additionalPv = inputs.additionalPvCapacityKw || 0;
  const microgridTariff = inputs.microgridTariff || 180;
  const gridHours = inputs.gridAvailabilityHours || 24;

  // Determine active strategy
  const getActiveStrategy = () => {
    if (selectedGoals.includes('SELL_GRID')) return 'GRID_FEED_IN';
    if (selectedGoals.includes('SELL_NEIGHBORS')) return 'NEIGHBOR_TRADE';
    return 'SELF_SUFFICIENCY';
  };

  const activeStrategy = getActiveStrategy();

  const selectStrategy = (strategy: 'SELF_SUFFICIENCY' | 'GRID_FEED_IN' | 'NEIGHBOR_TRADE') => {
    let updatedGoals: string[];
    let extraPv = additionalPv;

    if (strategy === 'SELF_SUFFICIENCY') {
      updatedGoals = ['MEET_DEMAND', 'MAX_SELF_CONSUMPTION', 'MAX_BACKUP'];
      extraPv = 0; // No surplus panel needed
    } else if (strategy === 'GRID_FEED_IN') {
      updatedGoals = ['SELL_GRID', 'REDUCE_BILLS', 'MAX_ROI', 'GENERATE_SURPLUS'];
      if (extraPv === 0) extraPv = 2.0; // Default surplus size
    } else {
      updatedGoals = ['SELL_NEIGHBORS', 'GENERATE_SURPLUS', 'MIN_PAYBACK'];
      if (extraPv === 0) extraPv = 2.0; // Default surplus size
    }

    updateInputs({
      optimizationGoals: updatedGoals,
      additionalPvCapacityKw: extraPv,
    });
  };

  const toggleGoal = (goal: string) => {
    let updated = [...selectedGoals];
    if (updated.includes(goal)) {
      updated = updated.filter(g => g !== goal);
      if (updated.length === 0) updated = ['MEET_DEMAND'];
    } else {
      if (goal === 'MEET_DEMAND') {
        updated = ['MEET_DEMAND'];
      } else {
        updated = updated.filter(g => g !== 'MEET_DEMAND');
        updated.push(goal);
      }
    }
    updateInputs({ optimizationGoals: updated });
  };

  // Surplus calculations
  const costPerKwp = basePvKw > 0 ? baseCapex / basePvKw : 500000;
  const addedPvCapex = additionalPv * costPerKwp;
  const totalCapex = baseCapex + addedPvCapex;

  const totalPvCapacity = basePvKw + additionalPv;
  const dailyGenKwh = totalPvCapacity * inputs.peakSunHours * (1 - inputs.losses) * inputs.tempDerating;
  const batteryChargingKwh = baseBatteryKwh * inputs.dod / inputs.batteryEfficiency;
  
  const dailySurplusKwh = Math.max(0, dailyGenKwh - dailyUseKwh - batteryChargingKwh);
  const monthlyExportKwh = dailySurplusKwh * 30;
  const annualExportKwh = dailySurplusKwh * 365;

  // Grid Export Financials
  const exportTariff = inputs.gridTariffRate;
  const exportEfficiency = 0.95;
  const gridFractionAvailable = Math.min(24, Math.max(0, gridHours)) / 24;
  const realDailyExportKwh = dailySurplusKwh * exportEfficiency * gridFractionAvailable;

  const dailyExportIncome = realDailyExportKwh * exportTariff;
  const monthlyExportIncome = dailyExportIncome * 30;
  const annualExportIncome = dailyExportIncome * 365;

  // ROI / Payback adjustments
  const baseMonthlySavings = Math.min(dailyUseKwh, basePvKw * inputs.peakSunHours * 0.7) * 30 * exportTariff;
  const optimizedMonthlyBenefit = baseMonthlySavings + (activeStrategy === 'GRID_FEED_IN' ? monthlyExportIncome : 0);

  const basePayback = baseMonthlySavings > 0 ? (baseCapex / (baseMonthlySavings * 12)).toFixed(1) : '--';
  const optimizedPayback = optimizedMonthlyBenefit > 0 ? (totalCapex / (optimizedMonthlyBenefit * 12)).toFixed(1) : '--';

  const baseRoi = baseCapex > 0 ? ((baseMonthlySavings * 12) / baseCapex * 100).toFixed(1) : '0';
  const optimizedRoi = totalCapex > 0 ? ((optimizedMonthlyBenefit * 12) / totalCapex * 100).toFixed(1) : '0';

  // Neighbor Trading (Microgrid)
  const nSubscribers = parseInt(neighborCount) || 1;
  const p2pTariff = microgridTariff;
  const neighborKwhAllocated = realDailyExportKwh * 0.6;
  const neighborRevenueDaily = neighborKwhAllocated * p2pTariff;

  // Visual Graph scales
  const maxBarHeight = 100;
  const totalGenVal = Math.max(dailyGenKwh, dailyUseKwh + batteryChargingKwh + realDailyExportKwh);
  const scale = totalGenVal > 0 ? maxBarHeight / totalGenVal : 1;

  const genHeight = dailyGenKwh * scale;
  const consHeight = dailyUseKwh * scale;
  const battHeight = batteryChargingKwh * scale;
  const exportHeight = realDailyExportKwh * scale;

  // AI Rule-based recommendation engine
  const getAiSizingRecommendation = () => {
    let recs: string[] = [];
    if (additionalPv === 0 && (activeStrategy === 'GRID_FEED_IN' || activeStrategy === 'NEIGHBOR_TRADE')) {
      recs.push(`💡 **Increase your Solar PV size:** You selected trading goals but have not added additional solar panels. Use the panel slider above to generate tradeable energy.`);
    }
    if (selectedGoals.includes('MAX_BACKUP') && inputs.autonomyDays < 2) {
      recs.push(`🔋 **Increase autonomy days:** For outage protection, we recommend increasing autonomy days to 1.5 or 2.0 days in the Battery Sizing card.`);
    }
    if (activeStrategy === 'GRID_FEED_IN') {
      const addedPaybackNum = parseFloat(optimizedPayback);
      const basePaybackNum = parseFloat(basePayback);
      if (addedPaybackNum < basePaybackNum) {
        recs.push(`📈 **Selling to the grid is profitable:** Your payback period decreases from ${basePayback} to ${optimizedPayback} years because export income outweighs the capex of extra panels.`);
      } else {
        recs.push(`⚠️ **Storage prioritized over export:** Adding more panels increases payback from ${basePayback} to ${optimizedPayback} years, but provides greater resilience.`);
      }
    }
    if (realDailyExportKwh === 0 && (activeStrategy === 'GRID_FEED_IN' || activeStrategy === 'NEIGHBOR_TRADE')) {
      recs.push(`🔌 **Zero surplus detected:** Your current solar generation is fully consumed by your household. Add more solar capacity to activate energy trading.`);
    }
    if (gridHours < 16) {
      recs.push(`🚨 **Low Grid Availability:** Grid is available only ${gridHours} hrs/day. Prioritize battery backup over grid export, as export is cut off during local blackouts.`);
    }
    if (recs.length === 0) {
      recs.push(`✅ **Optimized Balance:** Your current system layout is well-balanced. It meets your demand while maintaining a healthy payback of ${optimizedPayback} years.`);
    }
    return recs;
  };

  const s = StyleSheet.create({
    container: {
      backgroundColor: C.card,
      borderRadius: BorderRadius.md,
      borderColor: C.border,
      borderWidth: 1,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    title: { color: C.textPrimary, fontWeight: '800', fontSize: 18, marginBottom: 4 },
    subtitle: { color: C.textSecondary, fontSize: 13, marginBottom: Spacing.md },
    divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.md },

    // Strategy Path Selection Section
    sectionHeader: { color: C.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: Spacing.sm },
    strategyContainer: { flexDirection: 'column', gap: Spacing.sm, marginBottom: Spacing.md },
    strategyCard: {
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    strategyCardActive: {
      borderColor: C.primary,
      backgroundColor: theme === 'dark' ? '#0F2C2A' : '#F0FDF4',
    },
    strategyIconContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.sm,
      backgroundColor: C.divider,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    strategyIconActive: {
      backgroundColor: C.primary,
    },
    strategyTextContainer: { flex: 1 },
    strategyTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    strategyTitle: { color: C.textPrimary, fontWeight: '700', fontSize: 14 },
    strategyBadge: {
      fontSize: 10,
      fontWeight: '700',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
    },
    strategyBadgeSelf: { backgroundColor: C.divider, color: C.textSecondary },
    strategyBadgeGrid: { backgroundColor: C.successLight, color: C.success },
    strategyBadgeNeighbor: { backgroundColor: C.infoLight, color: C.info },
    strategyDesc: { color: C.textSecondary, fontSize: 11, lineHeight: 15 },

    // Toggle Advanced Section
    advancedToggleBtn: { alignSelf: 'flex-start', marginVertical: Spacing.xs },
    advancedToggleText: { color: C.primary, fontWeight: '700', fontSize: 12 },
    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm, marginBottom: Spacing.md },
    goalPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: BorderRadius.full,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    goalPillActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    goalText: { color: C.textSecondary, fontSize: 11, fontWeight: '700' },
    goalTextActive: { color: '#fff' },

    // Sizing inputs / visualizer
    sliderRow: {
      backgroundColor: C.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    sliderLabel: { color: C.textPrimary, fontWeight: '800', fontSize: 13, marginBottom: 2 },
    sliderSub: { color: C.textSecondary, fontSize: 11, marginBottom: Spacing.sm },
    flexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    btnIcon: { width: 44, height: 38, backgroundColor: C.divider, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
    btnIconText: { color: C.textPrimary, fontWeight: 'bold', fontSize: 20 },
    sliderVal: { color: C.primary, fontWeight: '800', fontSize: 20 },
    sliderPanelsInfo: { color: C.textSecondary, fontSize: 10, marginTop: 2 },

    // Energy Distribution flow visualizer
    flowContainer: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginVertical: Spacing.sm,
    },
    flowHeader: { color: C.textPrimary, fontWeight: '700', fontSize: 12, marginBottom: Spacing.sm, textAlign: 'center' },
    flowMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    flowNode: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      minWidth: 90,
      borderWidth: 1,
    },
    flowNodeGen: { backgroundColor: theme === 'dark' ? '#3B2F0F' : '#FEF3C7', borderColor: C.secondary },
    flowNodeLoad: { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', borderColor: C.border },
    flowNodeBattery: { backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE', borderColor: C.info },
    flowNodeSurplus: { backgroundColor: theme === 'dark' ? '#064E3B' : '#D1FAE5', borderColor: C.success },
    flowNodeLabel: { fontSize: 10, color: C.textSecondary, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    flowNodeVal: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
    flowArrow: { fontSize: 16, color: C.textSecondary, fontWeight: 'bold' },

    // Inputs settings
    metricBox: {
      backgroundColor: C.surface,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    mRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    mLbl: { color: C.textSecondary, fontSize: 12 },
    mVal: { color: C.textPrimary, fontWeight: '700', fontSize: 12 },
    mInput: {
      backgroundColor: C.divider,
      color: C.textPrimary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.xs,
      fontSize: 12,
      width: 60,
      textAlign: 'center',
      fontWeight: '700',
    },
    mHeader: { color: C.primary, fontWeight: '700', fontSize: 13, marginBottom: Spacing.sm },

    // Side-by-side Savings Cards
    compareContainer: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.sm },
    compareCard: {
      flex: 1,
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    compareCardActive: {
      borderColor: C.primary,
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    compareCardHeader: { fontSize: 13, fontWeight: '800', marginBottom: Spacing.sm, textTransform: 'uppercase' },
    compareCardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.divider },
    compareCardLabel: { fontSize: 11, color: C.textSecondary },
    compareCardVal: { fontSize: 11, fontWeight: '700', color: C.textPrimary },

    // AI dialog styled block
    aiBox: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
      borderColor: C.border,
      borderWidth: 1.5,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    aiIcon: { fontSize: 24 },
    aiContent: { flex: 1 },
    aiTitle: { color: C.primary, fontWeight: '800', fontSize: 13, marginBottom: Spacing.xs },
    aiText: { color: C.textPrimary, fontSize: 11, lineHeight: 16, marginBottom: 4 },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>🎯 Optimize System for Energy Goals</Text>
      <Text style={s.subtitle}>Maximize your savings, secure backup, or trade surplus energy</Text>

      {/* ── Strategy Path Selection ───────────────────────────────────────── */}
      <Text style={s.sectionHeader}>Select Your Energy Strategy</Text>
      <View style={s.strategyContainer}>
        {/* Path 1: Self Sufficiency */}
        <TouchableOpacity
          style={[s.strategyCard, activeStrategy === 'SELF_SUFFICIENCY' && s.strategyCardActive]}
          onPress={() => selectStrategy('SELF_SUFFICIENCY')}
        >
          <View style={[s.strategyIconContainer, activeStrategy === 'SELF_SUFFICIENCY' && s.strategyIconActive]}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
          </View>
          <View style={s.strategyTextContainer}>
            <View style={s.strategyTitleRow}>
              <Text style={s.strategyTitle}>Self-Sufficiency</Text>
              <Text style={[s.strategyBadge, s.strategyBadgeSelf]}>🔒 Local Safety</Text>
            </View>
            <Text style={s.strategyDesc}>Power your home and secure automatic backup battery storage during local grid outages.</Text>
          </View>
        </TouchableOpacity>

        {/* Path 2: Grid Feed-In */}
        <TouchableOpacity
          style={[s.strategyCard, activeStrategy === 'GRID_FEED_IN' && s.strategyCardActive]}
          onPress={() => selectStrategy('GRID_FEED_IN')}
        >
          <View style={[s.strategyIconContainer, activeStrategy === 'GRID_FEED_IN' && s.strategyIconActive]}>
            <Text style={{ fontSize: 22 }}>🔌</Text>
          </View>
          <View style={s.strategyTextContainer}>
            <View style={s.strategyTitleRow}>
              <Text style={s.strategyTitle}>Green Provider</Text>
              <Text style={[s.strategyBadge, s.strategyBadgeGrid]}>💰 Sell to Grid</Text>
            </View>
            <Text style={s.strategyDesc}>Size extra panels to export surplus solar energy back to the utility grid for bills credits.</Text>
          </View>
        </TouchableOpacity>

        {/* Path 3: Neighbor Sharing */}
        <TouchableOpacity
          style={[s.strategyCard, activeStrategy === 'NEIGHBOR_TRADE' && s.strategyCardActive]}
          onPress={() => selectStrategy('NEIGHBOR_TRADE')}
        >
          <View style={[s.strategyIconContainer, activeStrategy === 'NEIGHBOR_TRADE' && s.strategyIconActive]}>
            <Text style={{ fontSize: 22 }}>🤝</Text>
          </View>
          <View style={s.strategyTextContainer}>
            <View style={s.strategyTitleRow}>
              <Text style={s.strategyTitle}>Community Trading</Text>
              <Text style={[s.strategyBadge, s.strategyBadgeNeighbor]}>🌱 P2P Microgrid</Text>
            </View>
            <Text style={s.strategyDesc}>Set up peer-to-peer sharing to distribute and sell clean energy surplus directly to neighbors.</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Advanced Toggle ──────────────────────────────────────────────── */}
      <TouchableOpacity
        style={s.advancedToggleBtn}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={s.advancedToggleText}>
          {showAdvanced ? '🔼 Hide Advanced Options' : '⚙️ Show Advanced Sizing Goals'}
        </Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={s.goalsGrid}>
          {[
            { key: 'MEET_DEMAND', label: '🏠 Meet demand only' },
            { key: 'MAX_SELF_CONSUMPTION', label: '🔋 Maximize self-consumption' },
            { key: 'MAX_BACKUP', label: '🛡️ Maximize backup during outages' },
            { key: 'REDUCE_BILLS', label: '📉 Reduce electricity bills' },
            { key: 'GENERATE_SURPLUS', label: '☀️ Generate surplus power' },
            { key: 'SELL_GRID', label: '🔌 Sell excess to utility grid' },
            { key: 'SELL_NEIGHBORS', label: '🤝 Sell to neighbors (P2P)' },
            { key: 'MAX_ROI', label: '📈 Maximize return (ROI)' },
            { key: 'MIN_PAYBACK', label: '⏱️ Minimize payback period' },
          ].map(g => (
            <TouchableOpacity
              key={g.key}
              style={[s.goalPill, selectedGoals.includes(g.key) && s.goalPillActive]}
              onPress={() => toggleGoal(g.key)}
            >
              <Text style={[s.goalText, selectedGoals.includes(g.key) && s.goalTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.divider} />

      {/* ── Surplus Sizing Slider (Only shown if trading strategy is active) ────── */}
      {(activeStrategy === 'GRID_FEED_IN' || activeStrategy === 'NEIGHBOR_TRADE') && (
        <View style={s.sliderRow}>
          <Text style={s.sliderLabel}>☀️ Scale Solar Panels for Surplus</Text>
          <Text style={s.sliderSub}>Add panel capacity to generate tradeable excess electricity</Text>
          
          <View style={s.flexRow}>
            <TouchableOpacity 
              style={s.btnIcon} 
              onPress={() => updateInputs({ additionalPvCapacityKw: Math.max(0, additionalPv - 0.5) })}
            >
              <Text style={s.btnIconText}>-</Text>
            </TouchableOpacity>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={s.sliderVal}>+{additionalPv.toFixed(1)} kWp</Text>
              <Text style={s.sliderPanelsInfo}>
                Adds approx. {Math.ceil(additionalPv * 1000 / inputs.panelRatingW)} panels ({inputs.panelRatingW}W rating)
              </Text>
            </View>

            <TouchableOpacity 
              style={s.btnIcon} 
              onPress={() => updateInputs({ additionalPvCapacityKw: Math.min(20, additionalPv + 0.5) })}
            >
              <Text style={s.btnIconText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* ── Real-time Energy Distribution Flow ───────────────────────── */}
          <View style={s.flowContainer}>
            <Text style={s.flowHeader}>⚡ Daily Solar Power Split</Text>
            <View style={s.flowMainRow}>
              {/* Node 1: Generated */}
              <View style={[s.flowNode, s.flowNodeGen]}>
                <Text style={s.flowNodeLabel}>Solar Gen</Text>
                <Text style={s.flowNodeVal}>{dailyGenKwh.toFixed(1)} kWh</Text>
              </View>

              <Text style={s.flowArrow}>➔</Text>

              {/* Splits */}
              <View style={{ gap: Spacing.xxs }}>
                <View style={[s.flowNode, s.flowNodeLoad]}>
                  <Text style={s.flowNodeLabel}>🏠 Home Load</Text>
                  <Text style={s.flowNodeVal}>{dailyUseKwh.toFixed(1)} kWh</Text>
                </View>
                <View style={[s.flowNode, s.flowNodeBattery]}>
                  <Text style={s.flowNodeLabel}>🔋 Battery</Text>
                  <Text style={s.flowNodeVal}>{batteryChargingKwh.toFixed(1)} kWh</Text>
                </View>
                <View style={[s.flowNode, s.flowNodeSurplus]}>
                  <Text style={s.flowNodeLabel}>📢 Surplus</Text>
                  <Text style={[s.flowNodeVal, { color: dailySurplusKwh > 0 ? C.success : C.textSecondary }]}>
                    {dailySurplusKwh.toFixed(1)} kWh
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Utility Grid Export Settings ──────────────────────────────────── */}
      {activeStrategy === 'GRID_FEED_IN' && (
        <View style={s.metricBox}>
          <Text style={s.mHeader}>🔌 Grid Sizing Details & Tariff Settings</Text>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Utility Buy-back Tariff</Text>
            <Text style={s.mVal}>{inputs.currency} {exportTariff}/kWh</Text>
          </View>
          
          <View style={s.mRow}>
            <Text style={s.mLbl}>Average Grid Availability (Hours/Day)</Text>
            <TextInput
              style={s.mInput}
              value={String(gridHours)}
              onChangeText={v => updateInputs({ gridAvailabilityHours: parseFloat(v) || 24 })}
              keyboardType="number-pad"
            />
          </View>

          <View style={s.mRow}>
            <Text style={s.mLbl}>Estimated Monthly Exported Power</Text>
            <Text style={s.mVal}>{monthlyExportKwh.toFixed(0)} kWh</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Estimated Monthly Income</Text>
            <Text style={[s.mVal, { color: C.success }]}>{inputs.currency} {monthlyExportIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Estimated Annual Income</Text>
            <Text style={[s.mVal, { color: C.success }]}>{inputs.currency} {annualExportIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          </View>
        </View>
      )}

      {/* ── Neighbor Sharing Settings ────────────────────────────────────── */}
      {activeStrategy === 'NEIGHBOR_TRADE' && (
        <View style={s.metricBox}>
          <Text style={s.mHeader}>🤝 P2P Community Sharing settings</Text>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Selling Price (P2P Tariff)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: C.textSecondary, fontSize: 12, marginRight: 4 }}>{inputs.currency}</Text>
              <TextInput
                style={s.mInput}
                value={String(microgridTariff)}
                onChangeText={v => updateInputs({ microgridTariff: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
              />
              <Text style={{ color: C.textSecondary, fontSize: 12, marginLeft: 4 }}>/kWh</Text>
            </View>
          </View>

          <View style={s.mRow}>
            <Text style={s.mLbl}>Number of Subscribed Neighbors</Text>
            <TextInput
              style={s.mInput}
              value={neighborCount}
              onChangeText={setNeighborCount}
              keyboardType="number-pad"
            />
          </View>

          <View style={s.mRow}>
            <Text style={s.mLbl}>Average Allocation Per Neighbor</Text>
            <Text style={s.mVal}>{(neighborKwhAllocated / nSubscribers).toFixed(1)} kWh/day</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Estimated Daily Trading Revenue</Text>
            <Text style={[s.mVal, { color: C.success }]}>{inputs.currency} {neighborRevenueDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Microgrid Link Status</Text>
            <Text style={[s.mVal, { color: dailySurplusKwh > 0 ? C.success : C.warning }]}>
              {dailySurplusKwh > 0 ? 'COMMUNITY ACTIVE ●' : 'STANDBY'}
            </Text>
          </View>
        </View>
      )}

      {/* ── Scenario Financial Comparison Cards ─────────────────────────── */}
      <Text style={s.sectionHeader}>Strategy Financial Comparison</Text>
      <View style={s.compareContainer}>
        {/* Base Card */}
        <View style={s.compareCard}>
          <Text style={[s.compareCardHeader, { color: C.textSecondary }]}>Standard System</Text>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Solar PV</Text>
            <Text style={s.compareCardVal}>{basePvKw.toFixed(1)} kWp</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Battery</Text>
            <Text style={s.compareCardVal}>{baseBatteryKwh.toFixed(1)} kWh</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Total Cost</Text>
            <Text style={s.compareCardVal}>{inputs.currency} {baseCapex.toLocaleString()}</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Monthly Save</Text>
            <Text style={s.compareCardVal}>{inputs.currency} {baseMonthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>ROI %</Text>
            <Text style={[s.compareCardVal, { color: C.primary }]}>{baseRoi}%</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Payback</Text>
            <Text style={s.compareCardVal}>{basePayback} Years</Text>
          </View>
        </View>

        {/* Optimized Strategy Card */}
        <View style={[s.compareCard, s.compareCardActive]}>
          <Text style={[s.compareCardHeader, { color: C.primary }]}>Your Strategy</Text>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Solar PV</Text>
            <Text style={s.compareCardVal}>{totalPvCapacity.toFixed(1)} kWp</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Battery</Text>
            <Text style={s.compareCardVal}>{baseBatteryKwh.toFixed(1)} kWh</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Total Cost</Text>
            <Text style={s.compareCardVal}>{inputs.currency} {totalCapex.toLocaleString()}</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Total Benefit</Text>
            <Text style={[s.compareCardVal, { color: C.success }]}>
              {inputs.currency} {optimizedMonthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>ROI %</Text>
            <Text style={[s.compareCardVal, { color: C.success }]}>{optimizedRoi}%</Text>
          </View>
          <View style={s.compareCardRow}>
            <Text style={s.compareCardLabel}>Payback</Text>
            <Text style={s.compareCardVal}>{optimizedPayback} Years</Text>
          </View>
        </View>
      </View>

      {/* ── AI Recommendation Dialog ─────────────────────────────────────── */}
      <View style={s.aiBox}>
        <Text style={s.aiIcon}>🤖</Text>
        <View style={s.aiContent}>
          <Text style={s.aiTitle}>Energy Copilot Advisor</Text>
          {getAiSizingRecommendation().map((rec, i) => {
            // Simple markdown parser for bold styling in text
            const parts = rec.split('**');
            return (
              <Text key={i} style={s.aiText}>
                {parts.map((p, idx) => (
                  <Text key={idx} style={{ fontWeight: idx % 2 === 1 ? 'bold' : 'normal' }}>
                    {p}
                  </Text>
                ))}
              </Text>
            );
          })}
        </View>
      </View>

    </View>
  );
};
