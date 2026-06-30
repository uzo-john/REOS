import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

export const CableSizingCard: React.FC = () => {
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
      fontWeight: '700',
      fontSize: 16,
    },
    resultLabel: {
      color: activeColors.textSecondary,
      fontSize: 11,
    },
    explanation: {
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: Spacing.xs,
      lineHeight: 16,
    }
  });

  const handleLengthChange = (change: number) => {
    updateInputs({ lengthMeters: Math.max(1, inputs.lengthMeters + change) });
  };

  const handleAreaChange = (change: number) => {
    const areas = [1.5, 2.5, 4, 6, 10, 16, 25];
    const idx = areas.indexOf(inputs.areaMm2);
    let nextIdx = idx + change;
    if (nextIdx >= 0 && nextIdx < areas.length) {
      updateInputs({ areaMm2: areas[nextIdx] });
    }
  };

  const statusColor = results.cable 
    ? (results.cable.passesCheck ? activeColors.success : activeColors.error) 
    : activeColors.textPrimary;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cable & Voltage Drop Calculator</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.text}>Cable Run Length (One-Way)</Text>
          <Text style={styles.subtext}>Total distance from PV/Battery to Load</Text>
        </View>
        <View style={styles.controlGroup}>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleLengthChange(-2)}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>{inputs.lengthMeters} m</Text>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleLengthChange(2)}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.text}>Conductor Size (Cross Section)</Text>
          <Text style={styles.subtext}>Standard core copper wiring diameter</Text>
        </View>
        <View style={styles.controlGroup}>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleAreaChange(-1)}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>{inputs.areaMm2} mm²</Text>
          <TouchableOpacity style={styles.btnRound} onPress={() => handleAreaChange(1)}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {userMode === 'PROFESSIONAL' && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={styles.label}>Advanced Design Standards</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Operating Current</Text>
              <Text style={styles.text}>{inputs.currentA} A</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Allowable Limit</Text>
              <Text style={styles.text}>3.0% (IEC)</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Material</Text>
              <Text style={styles.text}>Copper (Cu)</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.btnCalculate} onPress={runAllCalculations}>
        <Text style={styles.btnCalculateText}>Calculate Voltage Drop</Text>
      </TouchableOpacity>

      {results.cable && (
        <View>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={[styles.resultValue, { color: statusColor }]}>
                {results.cable.voltageDropPercent.toFixed(2)} %
              </Text>
              <Text style={styles.resultLabel}>Voltage Drop</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultValue, { color: statusColor }]}>
                {results.cable.voltageDropVolts.toFixed(2)} V
              </Text>
              <Text style={styles.resultLabel}>Voltage Drop (V)</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultValue, { color: statusColor }]}>
                {results.cable.passesCheck ? 'PASS' : 'FAIL'}
              </Text>
              <Text style={styles.resultLabel}>Standard Check</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>Copper</Text>
              <Text style={styles.resultLabel}>Conductor Type</Text>
            </View>
          </View>
          <Text style={[styles.explanation, { color: statusColor }]}>
            {results.cable.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};
