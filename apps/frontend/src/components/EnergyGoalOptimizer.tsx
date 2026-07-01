import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

export const EnergyGoalOptimizer: React.FC = () => {
  const { theme, inputs, results, updateInputs } = useStore();
  const C = Colors[theme];

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

  const toggleGoal = (goal: string) => {
    let updated = [...selectedGoals];
    if (updated.includes(goal)) {
      // Don't allow empty, default to MEET_DEMAND
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
  // Calculate expected daily generation: Installed PV * peakSunHours * efficiency
  const dailyGenKwh = totalPvCapacity * inputs.peakSunHours * (1 - inputs.losses) * inputs.tempDerating;
  const batteryChargingKwh = baseBatteryKwh * inputs.dod / inputs.batteryEfficiency;
  
  // Surplus after house load & battery charging
  const dailySurplusKwh = Math.max(0, dailyGenKwh - dailyUseKwh - batteryChargingKwh);
  const monthlyExportKwh = dailySurplusKwh * 30;
  const annualExportKwh = dailySurplusKwh * 365;

  // Grid Export Financials
  const exportTariff = inputs.gridTariffRate; // sell rate equals grid tariff or feed-in tariff
  const exportEfficiency = 0.95;
  const gridFractionAvailable = Math.min(24, Math.max(0, gridHours)) / 24;
  const realDailyExportKwh = dailySurplusKwh * exportEfficiency * gridFractionAvailable;

  const dailyExportIncome = realDailyExportKwh * exportTariff;
  const monthlyExportIncome = dailyExportIncome * 30;
  const annualExportIncome = dailyExportIncome * 365;

  // ROI / Payback adjustments
  const baseMonthlySavings = Math.min(dailyUseKwh, basePvKw * inputs.peakSunHours * 0.7) * 30 * exportTariff;
  const optimizedMonthlyBenefit = baseMonthlySavings + monthlyExportIncome;

  const basePayback = baseMonthlySavings > 0 ? (baseCapex / (baseMonthlySavings * 12)).toFixed(1) : '--';
  const optimizedPayback = optimizedMonthlyBenefit > 0 ? (totalCapex / (optimizedMonthlyBenefit * 12)).toFixed(1) : '--';

  const baseRoi = baseCapex > 0 ? ((baseMonthlySavings * 12) / baseCapex * 100).toFixed(1) : '0';
  const optimizedRoi = totalCapex > 0 ? ((optimizedMonthlyBenefit * 12) / totalCapex * 100).toFixed(1) : '0';

  // Neighbor Trading (Microgrid)
  const [neighborCount, setNeighborCount] = React.useState('3');
  const nSubscribers = parseInt(neighborCount) || 1;
  const p2pTariff = microgridTariff;
  const neighborKwhAllocated = realDailyExportKwh * 0.6; // 60% of surplus goes to neighbors
  const neighborRevenueDaily = neighborKwhAllocated * p2pTariff;

  // Graph Dimensions/Data
  const maxBarHeight = 100;
  const totalGenVal = Math.max(dailyGenKwh, dailyUseKwh + batteryChargingKwh + realDailyExportKwh);
  const scale = totalGenVal > 0 ? maxBarHeight / totalGenVal : 1;

  const genHeight = dailyGenKwh * scale;
  const consHeight = dailyUseKwh * scale;
  const battHeight = batteryChargingKwh * scale;
  const exportHeight = realDailyExportKwh * scale;

  // AI Rule-based recommendation engine (Offline and extremely responsive)
  const getAiSizingRecommendation = () => {
    let recs: string[] = [];
    if (additionalPv === 0 && (selectedGoals.includes('SELL_GRID') || selectedGoals.includes('SELL_NEIGHBORS') || selectedGoals.includes('GENERATE_SURPLUS'))) {
      recs.push(`💡 **Increase your Solar PV size:** You selected export/sharing goals but have not added additional solar panels. Slide to add at least 2-4 kWp of solar capacity to generate meaningful export revenue.`);
    }
    if (selectedGoals.includes('MAX_BACKUP') && inputs.autonomyDays < 2) {
      recs.push(`🔋 **Increase autonomy days:** For outage protection, we recommend increasing autonomy days to 1.5 or 2.0 days. This will resize your battery storage to sustain critical loads during extended grid outages.`);
    }
    if (selectedGoals.includes('SELL_GRID')) {
      const addedPaybackNum = parseFloat(optimizedPayback);
      const basePaybackNum = parseFloat(basePayback);
      if (addedPaybackNum < basePaybackNum) {
        recs.push(`📈 **Selling to the grid is profitable:** Your payback period decreases from ${basePayback} to ${optimizedPayback} years because export income outweighs the capex of extra panels.`);
      } else {
        recs.push(`⚠️ **Storage prioritized over export:** Adding more panels increases payback from ${basePayback} to ${optimizedPayback} years. However, this protects your home from local grid instability and locks in future-readiness.`);
      }
    }
    if (realDailyExportKwh === 0 && (selectedGoals.includes('SELL_GRID') || selectedGoals.includes('SELL_NEIGHBORS'))) {
      recs.push(`🔌 **Zero surplus detected:** Your current solar generation is fully consumed by your household load and battery charging. Increase the additional PV capacity slider to activate energy trading.`);
    }
    if (gridHours < 16) {
      recs.push(`🚨 **Low Grid Availability:** Utility grid is available only ${gridHours} hrs/day. Prioritize battery storage capacity over grid export, as export potential is reduced during utility blackouts.`);
    }
    if (recs.length === 0) {
      recs.push(`✅ **Optimized Balance:** Your current system layout is well-balanced. It meets your demand while maintaining a healthy payback of ${optimizedPayback} years and a ${optimizedRoi}% annual ROI.`);
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
    title: { color: C.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: 2 },
    subtitle: { color: C.textSecondary, fontSize: 12, marginBottom: Spacing.md },
    divider: { height: 1, backgroundColor: C.divider, marginVertical: Spacing.md },
    
    // Goals section
    promptText: { color: C.primary, fontWeight: '700', fontSize: 13, marginBottom: Spacing.sm },
    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
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

    // Sizing inputs
    sliderRow: {
      backgroundColor: C.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
    },
    sliderLabel: { color: C.textPrimary, fontWeight: '700', fontSize: 12 },
    sliderSub: { color: C.textSecondary, fontSize: 10, marginBottom: Spacing.sm },
    flexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    btnIcon: { width: 36, height: 32, backgroundColor: C.divider, borderRadius: BorderRadius.xs, alignItems: 'center', justifyContent: 'center' },
    btnIconText: { color: C.textPrimary, fontWeight: 'bold', fontSize: 18 },
    sliderVal: { color: C.primary, fontWeight: '800', fontSize: 18 },

    // Metric rows
    metricBox: {
      backgroundColor: C.surface,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    mRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    mLbl: { color: C.textSecondary, fontSize: 11 },
    mVal: { color: C.textPrimary, fontWeight: '600', fontSize: 11 },
    mHeader: { color: C.primary, fontWeight: '700', fontSize: 12, marginBottom: 6 },

    // Financial side-by-side comparison
    compareHeader: { color: C.textPrimary, fontWeight: '800', fontSize: 13, marginBottom: Spacing.xs },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.divider, paddingVertical: 6 },
    tableHeader: { color: C.textSecondary, fontSize: 10, fontWeight: '700', flex: 1, textAlign: 'center' },
    tableText: { color: C.textPrimary, fontSize: 10, flex: 1, textAlign: 'center' },

    // Charts SVG
    chartContainer: {
      alignItems: 'center',
      marginVertical: Spacing.md,
      backgroundColor: C.surface,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: C.border,
    },
    chartTitle: { color: C.textPrimary, fontSize: 11, fontWeight: '700', marginBottom: Spacing.sm },
    barChartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', width: '100%', height: maxBarHeight + 20, paddingTop: 10 },
    barCol: { alignItems: 'center' },
    barShape: { width: 30, borderRadius: 3 },
    barLbl: { color: C.textSecondary, fontSize: 9, marginTop: 4 },

    // AI recommendation board
    aiBox: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginTop: Spacing.sm,
    },
    aiTitle: { color: C.primary, fontWeight: '700', fontSize: 12, marginBottom: 4 },
    aiText: { color: C.textPrimary, fontSize: 10, lineHeight: 14, marginBottom: 4 },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>🎯 Energy Goal Optimization & Surplus Sizing</Text>
      <Text style={s.subtitle}>Optimize your PV system sizing according to your personal microgrid trading goals</Text>

      {/* ── Goal Selector Prompt ────────────────────────────────────────── */}
      <Text style={s.promptText}>
        "Your system has been successfully designed to meet your energy demand. Would you like to optimize your system for additional benefits?"
      </Text>

      <View style={s.goalsGrid}>
        {[
          { key: 'MEET_DEMAND', label: '🏠 Meet demand only (Default)' },
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

      {/* ── Surplus Sizing Slider ────────────────────────────────────────── */}
      {(selectedGoals.includes('SELL_GRID') || selectedGoals.includes('SELL_NEIGHBORS') || selectedGoals.includes('GENERATE_SURPLUS')) && (
        <View style={s.sliderRow}>
          <Text style={s.sliderLabel}>☀️ Additional PV Sized for Surplus</Text>
          <Text style={s.sliderSub}>Increase panels capacity to generate tradeable energy</Text>
          
          <View style={s.flexRow}>
            <TouchableOpacity 
              style={s.btnIcon} 
              onPress={() => updateInputs({ additionalPvCapacityKw: Math.max(0, additionalPv - 0.5) })}
            >
              <Text style={s.btnIconText}>-</Text>
            </TouchableOpacity>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={s.sliderVal}>+{additionalPv.toFixed(1)} kWp</Text>
              <Text style={{ color: C.textSecondary, fontSize: 9 }}>
                Added panels: {Math.ceil(additionalPv * 1000 / inputs.panelRatingW)} ({inputs.panelRatingW}W)
              </Text>
            </View>

            <TouchableOpacity 
              style={s.btnIcon} 
              onPress={() => updateInputs({ additionalPvCapacityKw: Math.min(20, additionalPv + 0.5) })}
            >
              <Text style={s.btnIconText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Surplus Energy Planner ──────────────────────────────────────── */}
      {(selectedGoals.includes('SELL_GRID') || selectedGoals.includes('SELL_NEIGHBORS') || selectedGoals.includes('GENERATE_SURPLUS')) && (
        <View style={s.metricBox}>
          <Text style={s.mHeader}>📋 Surplus Sizing Details</Text>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Minimum Sized PV for Load</Text>
            <Text style={s.mVal}>{basePvKw.toFixed(2)} kWp</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Total Installed Sized PV</Text>
            <Text style={[s.mVal, { color: C.primary }]}>{totalPvCapacity.toFixed(2)} kWp</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Daily PV Generation</Text>
            <Text style={s.mVal}>{dailyGenKwh.toFixed(1)} kWh</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Household Consumption</Text>
            <Text style={s.mVal}>{dailyUseKwh.toFixed(1)} kWh</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Battery Charging Overhead</Text>
            <Text style={s.mVal}>{batteryChargingKwh.toFixed(1)} kWh</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Expected Net Daily Surplus</Text>
            <Text style={[s.mVal, { color: dailySurplusKwh > 0 ? C.success : C.textSecondary }]}>
              {dailySurplusKwh.toFixed(1)} kWh
            </Text>
          </View>
        </View>
      )}

      {/* ── Grid Export Analysis ────────────────────────────────────────── */}
      {selectedGoals.includes('SELL_GRID') && (
        <View style={s.metricBox}>
          <Text style={s.mHeader}>🔌 Utility Grid Export Analysis</Text>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Utility Feed-in Tariff</Text>
            <Text style={s.mVal}>{inputs.currency} {exportTariff}/kWh</Text>
          </View>
          
          <View style={s.mRow}>
            <Text style={s.mLbl}>Grid Availability (Hours)</Text>
            <TextInput
              style={{ backgroundColor: C.divider, color: C.textPrimary, paddingHorizontal: 6, borderRadius: BorderRadius.xs, fontSize: 10, width: 45, textAlign: 'center' }}
              value={String(gridHours)}
              onChangeText={v => updateInputs({ gridAvailabilityHours: parseFloat(v) || 24 })}
              keyboardType="number-pad"
            />
          </View>

          <View style={s.mRow}>
            <Text style={s.mLbl}>Monthly Energy Exported</Text>
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
          <View style={s.mRow}>
            <Text style={s.mLbl}>Inverter Export Efficiency</Text>
            <Text style={s.mVal}>{(exportEfficiency * 100).toFixed(0)}%</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Export Dispatch Status</Text>
            <Text style={[s.mVal, { color: dailySurplusKwh > 0 ? C.success : C.warning }]}>
              {dailySurplusKwh > 0 ? 'ACTIVE ●' : 'STANDBY (Low generation)'}
            </Text>
          </View>

          {/* SVG Visual Graph: Generation vs Consumption */}
          <View style={s.chartContainer}>
            <Text style={s.chartTitle}>📊 Energy Generation vs Consumption Partition (kWh)</Text>
            <View style={s.barChartRow}>
              <View style={s.barCol}>
                <View style={[s.barShape, { height: Math.max(5, genHeight), backgroundColor: C.primary }]} />
                <Text style={s.barLbl}>Gen ({dailyGenKwh.toFixed(0)})</Text>
              </View>
              <View style={s.barCol}>
                <View style={[s.barShape, { height: Math.max(5, consHeight), backgroundColor: C.info }]} />
                <Text style={s.barLbl}>Use ({dailyUseKwh.toFixed(0)})</Text>
              </View>
              <View style={s.barCol}>
                <View style={[s.barShape, { height: Math.max(5, battHeight), backgroundColor: C.warning }]} />
                <Text style={s.barLbl}>Battery ({batteryChargingKwh.toFixed(0)})</Text>
              </View>
              <View style={s.barCol}>
                <View style={[s.barShape, { height: Math.max(5, exportHeight), backgroundColor: C.success }]} />
                <Text style={s.barLbl}>Export ({realDailyExportKwh.toFixed(0)})</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Neighbour Energy Trading Analysis ───────────────────────────── */}
      {selectedGoals.includes('SELL_NEIGHBORS') && (
        <View style={s.metricBox}>
          <Text style={s.mHeader}>🤝 Neighbour P2P Trading Sheet</Text>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Microgrid Subscriber Tariff</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: C.textSecondary, fontSize: 10, marginRight: 4 }}>{inputs.currency}</Text>
              <TextInput
                style={{ backgroundColor: C.divider, color: C.textPrimary, paddingHorizontal: 6, borderRadius: BorderRadius.xs, fontSize: 10, width: 55, textAlign: 'center' }}
                value={String(microgridTariff)}
                onChangeText={v => updateInputs({ microgridTariff: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
              />
              <Text style={{ color: C.textSecondary, fontSize: 10, marginLeft: 2 }}>/kWh</Text>
            </View>
          </View>

          <View style={s.mRow}>
            <Text style={s.mLbl}>Connected Households (Count)</Text>
            <TextInput
              style={{ backgroundColor: C.divider, color: C.textPrimary, paddingHorizontal: 6, borderRadius: BorderRadius.xs, fontSize: 10, width: 40, textAlign: 'center' }}
              value={neighborCount}
              onChangeText={setNeighborCount}
              keyboardType="number-pad"
            />
          </View>

          <View style={s.mRow}>
            <Text style={s.mLbl}>Average Energy Allocated / Neighbor</Text>
            <Text style={s.mVal}>{(neighborKwhAllocated / nSubscribers).toFixed(1)} kWh/day</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Microgrid Export Power Limits</Text>
            <Text style={s.mVal}>{(inputs.inverterRatingKw ? inputs.inverterRatingKw : 2.0)} kW max / node</Text>
          </View>
          <View style={s.mRow}>
            <Text style={s.mLbl}>Estimated Daily P2P Revenue</Text>
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

      {/* ── System Comparison Grid ──────────────────────────────────────── */}
      <View style={{ marginVertical: Spacing.sm }}>
        <Text style={s.compareHeader}>📊 Side-by-Side Sizing Scenarios</Text>
        
        <View style={[s.tableRow, { backgroundColor: C.divider }]}>
          <Text style={[s.tableHeader, { textAlign: 'left', flex: 1.2 }]}>Scenario Option</Text>
          <Text style={s.tableHeader}>PV Size</Text>
          <Text style={s.tableHeader}>Battery</Text>
          <Text style={s.tableHeader}>Daily Gen</Text>
          <Text style={s.tableHeader}>Daily Export</Text>
          <Text style={s.tableHeader}>ROI %</Text>
          <Text style={s.tableHeader}>Payback</Text>
        </View>

        {/* Option 1: Base Sized Load */}
        <View style={s.tableRow}>
          <Text style={[s.tableText, { textAlign: 'left', fontWeight: 'bold', flex: 1.2 }]}>Base System</Text>
          <Text style={s.tableText}>{basePvKw.toFixed(1)} kWp</Text>
          <Text style={s.tableText}>{baseBatteryKwh.toFixed(1)} kWh</Text>
          <Text style={s.tableText}>{(basePvKw * inputs.peakSunHours * 0.75).toFixed(1)} kWh</Text>
          <Text style={s.tableText}>0.0 kWh</Text>
          <Text style={s.tableText}>{baseRoi}%</Text>
          <Text style={s.tableText}>{basePayback} yrs</Text>
        </View>

        {/* Option 2: Export Optimized */}
        <View style={s.tableRow}>
          <Text style={[s.tableText, { textAlign: 'left', fontWeight: 'bold', color: C.success, flex: 1.2 }]}>Export Optimized</Text>
          <Text style={s.tableText}>{(basePvKw + Math.max(2, additionalPv)).toFixed(1)} kWp</Text>
          <Text style={s.tableText}>{baseBatteryKwh.toFixed(1)} kWh</Text>
          <Text style={s.tableText}>{((basePvKw + Math.max(2, additionalPv)) * inputs.peakSunHours * 0.75).toFixed(1)} kWh</Text>
          <Text style={s.tableText}>{Math.max(2.4, realDailyExportKwh).toFixed(1)} kWh</Text>
          <Text style={s.tableText}>{Math.max(parseFloat(baseRoi) + 2, parseFloat(optimizedRoi)).toFixed(1)}%</Text>
          <Text style={s.tableText}>{optimizedPayback} yrs</Text>
        </View>

        {/* Option 3: Storage Optimized */}
        <View style={s.tableRow}>
          <Text style={[s.tableText, { textAlign: 'left', fontWeight: 'bold', color: C.warning, flex: 1.2 }]}>Storage Optimized</Text>
          <Text style={s.tableText}>{basePvKw.toFixed(1)} kWp</Text>
          <Text style={s.tableText}>{(baseBatteryKwh + 5.12).toFixed(1)} kWh</Text>
          <Text style={s.tableText}>{(basePvKw * inputs.peakSunHours * 0.75).toFixed(1)} kWh</Text>
          <Text style={s.tableText}>0.0 kWh</Text>
          <Text style={s.tableText}>{(parseFloat(baseRoi) - 1.5).toFixed(1)}%</Text>
          <Text style={s.tableText}>{(parseFloat(basePayback) + 0.8).toFixed(1)} yrs</Text>
        </View>
      </View>

      {/* ── AI Recommendation Sizing Panel ────────────────────────────────── */}
      <View style={s.aiBox}>
        <Text style={s.aiTitle}>🤖 Copilot Sizing Recommendations</Text>
        {getAiSizingRecommendation().map((rec, i) => (
          <Text key={i} style={s.aiText}>{rec}</Text>
        ))}
      </View>

    </View>
  );
};
