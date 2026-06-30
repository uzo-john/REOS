import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

const APPLIANCE_DEFAULT_NAMES = ['LED Lights', 'Ceiling Fans', 'TV / Laptops', 'Microwave / Kettle'];

export const LoadAssessmentCard: React.FC = () => {
  const { theme, userMode, inputs, results, updateInputs, runAllCalculations } = useStore();
  const activeColors = Colors[theme];

  // Local UI states for adding custom appliance
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPower, setNewPower] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newHours, setNewHours] = useState('4');

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
    applianceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: activeColors.divider,
      padding: Spacing.xs,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.xxs,
    },
    applianceText: {
      color: activeColors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    applianceSubtext: {
      color: activeColors.textSecondary,
      fontSize: 11,
    },
    qtyControl: {
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
    qtyText: {
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
    btnSecondary: {
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.xs,
    },
    btnSecondaryText: {
      color: activeColors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
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
    // Form styles
    formContainer: {
      backgroundColor: activeColors.divider,
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      marginVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: activeColors.border,
      gap: Spacing.xs,
    },
    formTitle: {
      color: activeColors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
      marginBottom: 4,
    },
    inputRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    inputBox: {
      flex: 1,
      backgroundColor: activeColors.card,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      padding: 6,
      color: activeColors.textPrimary,
      fontSize: 12,
    },
    formButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    btnForm: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: BorderRadius.xs,
    }
  });

  const handleQtyChange = (index: number, change: number) => {
    const updated = [...inputs.appliances];
    updated[index].quantity = Math.max(0, updated[index].quantity + change);
    updateInputs({ appliances: updated });
    setTimeout(runAllCalculations, 50);
  };

  const handleAddAppliance = () => {
    const power = parseInt(newPower) || 0;
    const qty = parseInt(newQty) || 0;
    const hours = parseFloat(newHours) || 0;

    if (!newName.trim() || power <= 0 || qty <= 0) return;

    // Generate 24-hour duty cycle array based on hours
    // (e.g., if hours is 6, fill the first 6 hours with 1s, others with 0s)
    const hoursOn = Array(24).fill(0).map((_, i) => (i < hours ? 1 : 0));

    const newAppliance = {
      name: newName.trim(),
      powerW: power,
      quantity: qty,
      hoursOn,
    };

    updateInputs({ appliances: [...inputs.appliances, newAppliance] });
    
    // Reset form
    setNewName('');
    setNewPower('');
    setNewQty('1');
    setNewHours('4');
    setIsAdding(false);

    setTimeout(runAllCalculations, 50);
  };

  // Sort appliances by powerW in descending order, keeping track of original index for modifications
  const sortedAppliances = inputs.appliances
    .map((app, originalIndex) => ({ ...app, originalIndex }))
    .sort((a, b) => b.powerW - a.powerW);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Appliance Inventory & Load Profile (Sorted by Power)</Text>
      
      {sortedAppliances.map((app, idx) => {
        const name = app.name || APPLIANCE_DEFAULT_NAMES[app.originalIndex] || `Appliance ${app.originalIndex + 1}`;
        return (
          <View key={idx} style={styles.applianceRow}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Text style={styles.applianceText}>{name} ({app.powerW}W)</Text>
              <Text style={styles.applianceSubtext}>Duty cycle: {app.hoursOn.filter(h => h > 0).length} hrs/day</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.btnRound} onPress={() => handleQtyChange(app.originalIndex, -1)}>
                <Text style={styles.btnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{app.quantity}</Text>
              <TouchableOpacity style={styles.btnRound} onPress={() => handleQtyChange(app.originalIndex, 1)}>
                <Text style={styles.btnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Add Custom Appliance Form */}
      {isAdding ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>➕ Add Custom Appliance</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Appliance Name (e.g. Air Conditioner)"
            placeholderTextColor={activeColors.placeholder}
            value={newName}
            onChangeText={setNewName}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputBox}
              placeholder="Power (Watts)"
              placeholderTextColor={activeColors.placeholder}
              value={newPower}
              onChangeText={setNewPower}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.inputBox}
              placeholder="Qty"
              placeholderTextColor={activeColors.placeholder}
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.inputBox}
              placeholder="Hours/Day"
              placeholderTextColor={activeColors.placeholder}
              value={newHours}
              onChangeText={setNewHours}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity 
              style={[styles.btnForm, { backgroundColor: activeColors.divider }]} 
              onPress={() => setIsAdding(false)}
            >
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnForm, { backgroundColor: activeColors.primary }]} 
              onPress={handleAddAppliance}
            >
              <Text style={[styles.btnSecondaryText, { color: '#fff' }]}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsAdding(true)}>
          <Text style={styles.btnSecondaryText}>➕ Add Custom Appliance</Text>
        </TouchableOpacity>
      )}

      {userMode === 'PROFESSIONAL' && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={styles.label}>Advanced Sizing Parameters</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.applianceSubtext}>Demand Factor</Text>
              <Text style={styles.applianceText}>{(inputs.demandFactor * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.applianceSubtext}>Diversity Factor</Text>
              <Text style={styles.applianceText}>{(inputs.diversityFactor * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.btnCalculate} onPress={runAllCalculations}>
        <Text style={styles.btnCalculateText}>Calculate Load Demand</Text>
      </TouchableOpacity>

      {results.load && (
        <View style={styles.resultGrid}>
          <View style={styles.resultItem}>
            <Text style={styles.resultValue}>{results.load.connectedLoadW} W</Text>
            <Text style={styles.resultLabel}>Connected Load</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultValue}>{results.load.maximumDemandW.toFixed(0)} W</Text>
            <Text style={styles.resultLabel}>Peak Max Demand</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultValue}>{results.load.dailyEnergyKwh.toFixed(2)} kWh</Text>
            <Text style={styles.resultLabel}>Daily Consumption</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultValue}>{results.load.annualEnergyKwh.toFixed(0)} kWh</Text>
            <Text style={styles.resultLabel}>Annual Estimate</Text>
          </View>
        </View>
      )}
    </View>
  );
};
