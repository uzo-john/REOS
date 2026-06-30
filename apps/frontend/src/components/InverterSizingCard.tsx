import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

const INVERTER_RATINGS = [null, 0.3, 0.5, 1.0, 1.5, 2.0, 3.0, 3.5, 5.0, 6.0, 8.0, 10.0, 15.0, 20.0, 30.0, 50.0, 100.0];
const OUTPUT_VOLTAGES = ['230V', '400V'] as const;

export const InverterSizingCard: React.FC = () => {
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

  const handleSurgeChange = (change: number) => {
    updateInputs({ loadSurgePowerW: Math.max(500, inputs.loadSurgePowerW + change) });
  };

  const handleMarginChange = (change: number) => {
    const next = parseFloat((inputs.safetyMargin + change).toFixed(2));
    if (next >= 1.0 && next <= 2.0) {
      updateInputs({ safetyMargin: next });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Inverter & Charge Controller Sizing</Text>

      {/* Inverter Type Selector */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.text}>System Configuration</Text>
          <Text style={styles.subtext}>On-Grid, Off-Grid, or Hybrid</Text>
        </View>
        <View style={styles.controlGroup}>
          {(['ON_GRID', 'OFF_GRID', 'HYBRID'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.pill, inputs.inverterType === type && styles.pillActive]}
              onPress={() => { updateInputs({ inverterType: type }); setTimeout(runAllCalculations, 50); }}
            >
              <Text style={[styles.pillText, inputs.inverterType === type && styles.pillTextActive]}>
                {type === 'ON_GRID' ? 'On-Grid' : type === 'OFF_GRID' ? 'Off-Grid' : 'Hybrid'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.text}>Startup Surge Power</Text>
          <Text style={styles.subtext}>Motor/compressor inrush at startup</Text>
        </View>
        <View style={styles.controlGroup}>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleSurgeChange(-250)}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>{inputs.loadSurgePowerW} W</Text>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleSurgeChange(250)}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inverter Rating Selector */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.text}>Inverter Capacity</Text>
          <Text style={styles.subtext}>Manual rating or Auto-Sized</Text>
        </View>
        <View style={{ width: 180 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {INVERTER_RATINGS.map(kw => (
              <TouchableOpacity
                key={kw === null ? 'auto' : kw}
                style={[
                  styles.pill,
                  ((kw === null && inputs.inverterRatingKw === null) || inputs.inverterRatingKw === kw) && styles.pillActive
                ]}
                onPress={() => { updateInputs({ inverterRatingKw: kw }); setTimeout(runAllCalculations, 50); }}
              >
                <Text style={[
                  styles.pillText,
                  ((kw === null && inputs.inverterRatingKw === null) || inputs.inverterRatingKw === kw) && styles.pillTextActive
                ]}>
                  {kw === null ? 'Auto' : `${kw}kW`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Inverter Output Voltage Selector */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.text}>AC Output Voltage</Text>
          <Text style={styles.subtext}>Single-phase (230V) vs Three-phase (400V)</Text>
        </View>
        <View style={styles.controlGroup}>
          {OUTPUT_VOLTAGES.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.pill, inputs.inverterOutputVoltage === v && styles.pillActive]}
              onPress={() => { updateInputs({ inverterOutputVoltage: v }); setTimeout(runAllCalculations, 50); }}
            >
              <Text style={[styles.pillText, inputs.inverterOutputVoltage === v && styles.pillTextActive]}>
                {v === '230V' ? '230V AC' : '400V AC'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {userMode === 'PROFESSIONAL' && (
        <View style={styles.row}>
          <View>
            <Text style={styles.text}>Safety Margin Factor</Text>
            <Text style={styles.subtext}>Continuous derating headroom</Text>
          </View>
          <View style={styles.controlGroup}>
            <TouchableOpacity style={styles.btnRound} onPress={() => handleMarginChange(-0.05)}>
              <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.valueText}>×{inputs.safetyMargin.toFixed(2)}</Text>
            <TouchableOpacity style={styles.btnRound} onPress={() => handleMarginChange(0.05)}>
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {userMode === 'PROFESSIONAL' && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={styles.label}>Advanced Parameters</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Max Continuous Load</Text>
              <Text style={styles.text}>{results.load?.maximumDemandW?.toFixed(0) ?? 'N/A'} W</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Efficiency Class</Text>
              <Text style={styles.text}>Pure Sine Wave</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.btnCalculate} onPress={runAllCalculations}>
        <Text style={styles.btnCalculateText}>Size Inverter</Text>
      </TouchableOpacity>

      {results.inverter && (
        <View>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.inverter.recommendedInverterKw} kW</Text>
              <Text style={styles.resultLabel}>
                {inputs.inverterRatingKw !== null ? 'Selected Rating' : 'Recommended Rating'}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{(inputs.loadSurgePowerW / 1000).toFixed(1)} kW</Text>
              <Text style={styles.resultLabel}>Surge Capacity</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>×{results.inverter.safetyMarginUsed.toFixed(2)}</Text>
              <Text style={styles.resultLabel}>Safety Margin</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{inputs.inverterOutputVoltage === '230V' ? 'Pure Sine (1-Ph)' : 'Pure Sine (3-Ph)'}</Text>
              <Text style={styles.resultLabel}>Waveform Type</Text>
            </View>
          </View>
          <Text style={styles.explanation}>{results.inverter.explanation}</Text>
        </View>
      )}
    </View>
  );
};
