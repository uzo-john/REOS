import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

export const AiAssistantPanel: React.FC = () => {
  const { theme, results, aiResponse, isAiLoading, getAiInsights, inputs } = useStore();
  const activeColors = Colors[theme];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: activeColors.surface,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      color: activeColors.primary,
      fontWeight: '700',
      fontSize: 15,
    },
    pulsar: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isAiLoading ? activeColors.secondary : activeColors.success,
      marginRight: Spacing.xs,
    },
    message: {
      color: activeColors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: Spacing.xs,
    },
    bullet: {
      color: activeColors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      marginLeft: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    warningContainer: {
      backgroundColor: activeColors.errorLight,
      borderColor: activeColors.error,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.xs,
      marginTop: Spacing.sm,
    },
    warningTitle: {
      color: activeColors.error,
      fontWeight: '600',
      fontSize: 12,
      marginBottom: 2,
    },
    warningText: {
      color: activeColors.error,
      fontSize: 11,
      lineHeight: 14,
    },
    btnAnalyze: {
      backgroundColor: activeColors.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: BorderRadius.xs,
      alignItems: 'center',
    },
    btnAnalyzeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
    },
  });

  const hasCableWarning = results.cable && !results.cable.passesCheck;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.pulsar} />
          <Text style={styles.title}>REOS AI Copilot</Text>
        </View>
        {results.load && !isAiLoading && (
          <TouchableOpacity style={styles.btnAnalyze} onPress={getAiInsights}>
            <Text style={styles.btnAnalyzeText}>⚡ Analyze Design</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isAiLoading ? (
          <Text style={[styles.message, { fontStyle: 'italic', color: activeColors.textSecondary }]}>
            🤖 Copilot is analyzing your electrical loads, PV string configuration, and battery autonomy...
          </Text>
        ) : aiResponse ? (
          <Text style={styles.message}>{aiResponse}</Text>
        ) : (
          <Text style={styles.message}>
            Run the calculators below to feed project details to the AI Assistant. Once calculated, click "Analyze Design" to optimize your setup.
          </Text>
        )}

        {results.load && !isAiLoading && !aiResponse && (
          <View style={{ marginVertical: Spacing.xxs }}>
            <Text style={styles.bullet}>
              • Peak demand:{' '}
              <Text style={{ fontWeight: '600' }}>{results.load.maximumDemandW.toFixed(0)} W</Text>
            </Text>
            <Text style={styles.bullet}>
              • Daily energy:{' '}
              <Text style={{ fontWeight: '600' }}>{results.load.dailyEnergyKwh.toFixed(2)} kWh</Text>
            </Text>
            {results.solar && (
              <Text style={styles.bullet}>
                • Solar array:{' '}
                <Text style={{ fontWeight: '600' }}>{results.solar.numberOfPanels} panels</Text> ({results.solar.requiredPvSizeKw} kWp)
              </Text>
            )}
            {results.battery && (
              <Text style={styles.bullet}>
                • Battery bank:{' '}
                <Text style={{ fontWeight: '600' }}>{results.battery.batteryQty} units</Text> ({results.battery.requiredCapacityKwh} kWh)
              </Text>
            )}
            {results.inverter && (
              <Text style={styles.bullet}>
                • Inverter:{' '}
                <Text style={{ fontWeight: '600' }}>{results.inverter.recommendedInverterKw} kW</Text> continuous rating
              </Text>
            )}
          </View>
        )}

        {hasCableWarning && results.cable && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ Sizing Check: High Voltage Drop</Text>
            <Text style={styles.warningText}>
              Your cable run has a voltage drop of {results.cable.voltageDropPercent.toFixed(2)}%, which exceeds the 3.0% IEC limit. Increase conductor to 6mm² or 10mm² to restore compliance.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
