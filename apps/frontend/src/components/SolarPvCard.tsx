import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

const PANEL_RATINGS = [50, 100, 150, 200, 250, 300, 330, 350, 400, 450, 500, 550, 600, 650, 700];

export const SolarPvCard: React.FC = () => {
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

  const handlePshChange = (change: number) => {
    updateInputs({ peakSunHours: parseFloat(Math.max(0, inputs.peakSunHours + change).toFixed(1)) });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Solar PV Array Sizing</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.text}>Peak Sun Hours (PSH)</Text>
          <Text style={styles.subtext}>Average solar radiation (kWh/m²/day)</Text>
        </View>
        <View style={styles.controlGroup}>
          <TouchableOpacity style={styles.btnRound} onPress={() => handlePshChange(-0.2)}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>{inputs.peakSunHours} hrs</Text>
          <TouchableOpacity style={styles.btnRound} onPress={() => handlePshChange(0.2)}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.text}>Solar Panel Rating</Text>
          <Text style={styles.subtext}>Nominal power per module</Text>
        </View>
        <View style={{ width: 180 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PANEL_RATINGS.map(w => (
              <TouchableOpacity
                key={w}
                style={[
                  styles.pill,
                  inputs.panelRatingW === w && styles.pillActive
                ]}
                onPress={() => { updateInputs({ panelRatingW: w }); setTimeout(runAllCalculations, 50); }}
              >
                <Text style={[styles.pillText, inputs.panelRatingW === w && styles.pillTextActive]}>{w}W</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {userMode === 'PROFESSIONAL' && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={styles.label}>System & Environmental Losses</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Dust/Wiring Losses</Text>
              <Text style={styles.text}>{(inputs.losses * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtext}>Temp Derating (Pmax)</Text>
              <Text style={styles.text}>{(inputs.tempDerating * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.btnCalculate} onPress={runAllCalculations}>
        <Text style={styles.btnCalculateText}>Size Solar Array</Text>
      </TouchableOpacity>

      {results.solar && (
        <View>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.solar.requiredPvSizeKw} kWp</Text>
              <Text style={styles.resultLabel}>Required PV Power</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.solar.numberOfPanels} Panels</Text>
              <Text style={styles.resultLabel}>Total Panels ({inputs.panelRatingW}W)</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.solar.expectedAnnualGenKwh} kWh</Text>
              <Text style={styles.resultLabel}>Annual Generation</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{(results.solar.expectedAnnualGenKwh / 12).toFixed(0)} kWh</Text>
              <Text style={styles.resultLabel}>Average Monthly Gen</Text>
            </View>
          </View>
          <Text style={styles.explanation}>{results.solar.explanation}</Text>
        </View>
      )}
    </View>
  );
};
