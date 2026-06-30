import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

const BATTERY_VOLTAGES = [12, 24, 48, 96, 192];
const LEAD_ACID_CAPACITIES = [20, 50, 75, 100, 120, 150, 180, 200, 250, 300, 400, 500];
const LITHIUM_ENERGIES = [2.56, 5.12, 7.68, 10.24, 15.36, 20.48, 25.6, 30, 50, 100];

export const BatterySizingCard: React.FC = () => {
  const { theme, userMode, inputs, results, updateInputs, runAllCalculations } = useStore();
  const activeColors = Colors[theme];

  const styles = StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },
    label: {
      color: activeColors.textPrimary,
      fontWeight: '500',
      fontSize: 14,
      marginBottom: Spacing.xxs,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: activeColors.divider,
      padding: Spacing.xs,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.xxs,
    },
    text: {
      color: activeColors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    subtext: {
      color: activeColors.textSecondary,
      fontSize: 11,
    },
    controlGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    btnRound: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: activeColors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
      lineHeight: 18,
    },
    valueText: {
      color: activeColors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
    btnCalculate: {
      backgroundColor: activeColors.primary,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
    },
    btnCalculateText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    resultGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.md,
      padding: Spacing.xs,
      backgroundColor: activeColors.divider,
      borderRadius: BorderRadius.sm,
    },
    resultItem: {
      width: '48%',
      padding: Spacing.xs,
    },
    resultValue: {
      color: activeColors.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    resultLabel: {
      color: activeColors.textSecondary,
      fontSize: 11,
    },
    explanation: {
      color: activeColors.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: Spacing.xs,
      lineHeight: 16,
    },
    pill: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: BorderRadius.xs,
      backgroundColor: activeColors.card,
      borderWidth: 1,
      borderColor: activeColors.border,
      marginRight: 6,
    },
    pillActive: {
      backgroundColor: activeColors.primary,
      borderColor: activeColors.primary,
    },
    pillText: {
      color: activeColors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    pillTextActive: {
      color: '#fff',
    },
  });

  const handleAutonomyChange = (change: number) => {
    updateInputs({ autonomyDays: parseFloat(Math.max(0.5, inputs.autonomyDays + change).toFixed(1)) });
  };

  const handleTypeChange = (type: 'LITHIUM' | 'LEAD_ACID') => {
    updateInputs({ batteryType: type });
    setTimeout(runAllCalculations, 50);
  };

  if (inputs.inverterType === 'ON_GRID') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Battery Storage Sizing</Text>
        <View style={{
          backgroundColor: activeColors.divider,
          borderColor: activeColors.border,
          borderWidth: 1,
          borderRadius: BorderRadius.sm,
          padding: Spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.xs,
          marginTop: Spacing.xs,
        }}>
          <Text style={{ fontSize: 28, marginBottom: Spacing.xs }}>🔌</Text>
          <Text style={[styles.text, { fontWeight: '700', textAlign: 'center', fontSize: 14 }]}>
            Batteries Not Required (On-Grid System)
          </Text>
          <Text style={[styles.explanation, { textAlign: 'center', marginTop: Spacing.xxs }]}>
            {results.battery?.explanation || "Your selected system configuration is On-Grid. Excess solar energy is automatically exported to the grid, and power deficits are drawn directly from the grid."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Battery Storage Sizing</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.text}>Autonomy Period</Text>
          <Text style={styles.subtext}>Days of backup without solar generation</Text>
        </View>
        <View style={styles.controlGroup}>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleAutonomyChange(-0.5)}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>{inputs.autonomyDays} day(s)</Text>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleAutonomyChange(0.5)}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Battery Type Selector */}
      <View style={styles.row}>
        <View>
          <Text style={styles.text}>Battery Technology</Text>
          <Text style={styles.subtext}>Lithium (LFP) vs Lead-Acid</Text>
        </View>
        <View style={styles.controlGroup}>
          <TouchableOpacity
            style={[styles.pill, inputs.batteryType === 'LITHIUM' && styles.pillActive]}
            onPress={() => handleTypeChange('LITHIUM')}
          >
            <Text style={[styles.pillText, inputs.batteryType === 'LITHIUM' && styles.pillTextActive]}>Lithium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, inputs.batteryType === 'LEAD_ACID' && styles.pillActive]}
            onPress={() => handleTypeChange('LEAD_ACID')}
          >
            <Text style={[styles.pillText, inputs.batteryType === 'LEAD_ACID' && styles.pillTextActive]}>Lead-Acid</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Nominal Voltage Selector */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.text}>System Bus Voltage</Text>
          <Text style={styles.subtext}>DC voltage for battery/inverter</Text>
        </View>
        <View style={{ width: 180 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BATTERY_VOLTAGES.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.pill, inputs.batteryVoltage === v && styles.pillActive]}
                onPress={() => { updateInputs({ batteryVoltage: v }); setTimeout(runAllCalculations, 50); }}
              >
                <Text style={[styles.pillText, inputs.batteryVoltage === v && styles.pillTextActive]}>{v}V</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Battery Unit Rating Selector */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.text}>
            {inputs.batteryType === 'LITHIUM' ? 'Lithium Module Energy' : 'Lead-Acid Capacity'}
          </Text>
          <Text style={styles.subtext}>
            {inputs.batteryType === 'LITHIUM' ? 'Rating in kWh per pack' : 'Rating in Amp-Hours (Ah)'}
          </Text>
        </View>
        <View style={{ width: 180 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {inputs.batteryType === 'LITHIUM' ? (
              LITHIUM_ENERGIES.map(kwh => (
                <TouchableOpacity
                  key={kwh}
                  style={[styles.pill, inputs.selectedLithiumKwh === kwh && styles.pillActive]}
                  onPress={() => { updateInputs({ selectedLithiumKwh: kwh }); setTimeout(runAllCalculations, 50); }}
                >
                  <Text style={[styles.pillText, inputs.selectedLithiumKwh === kwh && styles.pillTextActive]}>{kwh}kWh</Text>
                </TouchableOpacity>
              ))
            ) : (
              LEAD_ACID_CAPACITIES.map(ah => (
                <TouchableOpacity
                  key={ah}
                  style={[styles.pill, inputs.selectedBatteryAh === ah && styles.pillActive]}
                  onPress={() => { updateInputs({ selectedBatteryAh: ah }); setTimeout(runAllCalculations, 50); }}
                >
                  <Text style={[styles.pillText, inputs.selectedBatteryAh === ah && styles.pillTextActive]}>{ah}Ah</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {userMode === 'PROFESSIONAL' && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={styles.label}>Battery Sizing Constraints</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Max DoD</Text>
              <Text style={styles.text}>{(inputs.dod * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Roundtrip Efficiency</Text>
              <Text style={styles.text}>{(inputs.batteryEfficiency * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.btnCalculate} onPress={runAllCalculations}>
        <Text style={styles.btnCalculateText}>Size Battery Bank</Text>
      </TouchableOpacity>

      {results.battery && (
        <View>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.battery.requiredCapacityKwh} kWh</Text>
              <Text style={styles.resultLabel}>Required Storage</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.battery.requiredCapacityAh} Ah</Text>
              <Text style={styles.resultLabel}>Amp-Hours (@{inputs.batteryVoltage}V)</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.battery.batteryQty} Units</Text>
              <Text style={styles.resultLabel}>
                {inputs.batteryType === 'LITHIUM' 
                  ? `Lithium (${inputs.selectedLithiumKwh}kWh)` 
                  : `Lead-Acid (${inputs.selectedBatteryAh}Ah)`}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>
                {inputs.batteryType === 'LITHIUM' ? 'LFP (LiFePO4)' : 'AGM / Deep Cycle'}
              </Text>
              <Text style={styles.resultLabel}>Recommended Chemistry</Text>
            </View>
          </View>
          <Text style={styles.explanation}>{results.battery.explanation}</Text>
        </View>
      )}
    </View>
  );
};
