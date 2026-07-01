import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Modal, TouchableOpacity, 
  TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { api, ChatMessage } from '../store/api';

interface AiChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AiChatModal: React.FC<AiChatModalProps> = ({ visible, onClose }) => {
  const { 
    theme, inputs, results, token, 
    devices, telemetry, alerts, 
    gridExportEnabled, neighbourTransferEnabled 
  } = useStore();
  const activeColors = Colors[theme];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: '👋 Hello! I am your REOS Copilot. I am fully aware of your current solar design. How can I help you optimize, verify, or understand your setup today?' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: activeColors.card,
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      height: '80%',
      maxHeight: 700,
      borderWidth: 1,
      borderColor: activeColors.border,
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
    subtitle: {
      color: activeColors.primary,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1,
      marginTop: 2,
    },
    btnClose: {
      padding: 4,
    },
    btnCloseText: {
      color: activeColors.textSecondary,
      fontSize: 18,
      fontWeight: '600',
    },
    chatArea: {
      flex: 1,
      padding: Spacing.md,
    },
    messageRow: {
      marginVertical: Spacing.xs,
      flexDirection: 'row',
    },
    messageUser: {
      justifyContent: 'flex-end',
    },
    messageBubble: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      maxWidth: '85%',
    },
    bubbleUser: {
      backgroundColor: activeColors.primary,
      borderBottomRightRadius: 2,
    },
    bubbleAssistant: {
      backgroundColor: activeColors.divider,
      borderBottomLeftRadius: 2,
      borderWidth: 1,
      borderColor: activeColors.border,
    },
    textUser: {
      color: '#fff',
      fontSize: 13.5,
      lineHeight: 18,
    },
    textAssistant: {
      color: activeColors.textPrimary,
      fontSize: 13.5,
      lineHeight: 18,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xs,
      gap: Spacing.xs,
    },
    btnQuick: {
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    btnQuickText: {
      color: activeColors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: activeColors.border,
      backgroundColor: activeColors.card,
    },
    input: {
      flex: 1,
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 8,
      color: activeColors.textPrimary,
      fontSize: 14,
      marginRight: Spacing.xs,
    },
    btnSend: {
      backgroundColor: activeColors.primary,
      borderRadius: BorderRadius.sm,
      paddingVertical: 8,
      paddingHorizontal: Spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnSendText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 13,
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    if (!customText) setInputText('');
    setIsLoading(true);

    const newUserMessage: ChatMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // Build Project-Aware context system prompt
    const systemContext = `
You are REOS Copilot, a premium solar engineering assistant.
Here is the current project design context:
- System Voltage: ${inputs.batteryVoltage}V DC
- Daily Energy Consumption: ${results.load?.dailyEnergyKwh?.toFixed(2) ?? 0} kWh
- Peak Load Demand: ${results.load?.maximumDemandW?.toFixed(0) ?? 0} W
- Solar Panel Size: ${results.solar?.requiredPvSizeKw ?? 0} kWp (${results.solar?.numberOfPanels ?? 0} panels of ${inputs.panelRatingW}W)
- Battery Storage: ${results.battery?.requiredCapacityKwh ?? 0} kWh (${results.battery?.batteryQty ?? 0} units of ${inputs.batteryType === 'LITHIUM' ? inputs.selectedLithiumKwh + 'kWh' : '12V ' + inputs.selectedBatteryAh + 'Ah'})
- Inverter Size: ${results.inverter?.recommendedInverterKw ?? 0} kW (${inputs.inverterOutputVoltage} output)
- Cable Voltage Drop: ${results.cable?.voltageDropPercent?.toFixed(2) ?? 0}%

Here is the LIVE system telemetry and device status:
- Grid Export Enabled: ${gridExportEnabled ? 'YES' : 'NO'}
- Neighbor Energy Transfer Enabled: ${neighbourTransferEnabled ? 'YES' : 'NO'}
- Devices Status: ${JSON.stringify(devices.map(d => ({ name: d.name, type: d.type, status: d.status, fw: d.firmwareVersion })))}
- Telemetry: ${telemetry ? JSON.stringify({
    inverterPowerKw: telemetry.inverter.powerKw,
    inverterGridSynced: telemetry.inverter.gridSynchronized,
    meterActivePowerKw: telemetry.smartMeter.activePowerKw,
    meterVoltageV: telemetry.smartMeter.voltageV,
    meterFrequencyHz: telemetry.smartMeter.frequencyHz,
    batterySoc: telemetry.battery.socPercent,
    batteryChargingState: telemetry.battery.chargingState,
    neighborPowerKw: telemetry.neighbourTrading.instantaneousPowerKw,
    neighborDeliveredKwh: telemetry.neighbourTrading.energyDeliveredKwh,
    neighborActiveLinks: telemetry.neighbourTrading.connectedNeighboursCount
  }) : 'No live telemetry available'}
- Active Fault Alerts: ${JSON.stringify(alerts.filter(a => !a.acknowledged).map(a => ({ code: a.code, title: a.title, severity: a.severity, action: a.recommendedAction })))}

Use this data to answer the user's questions. For example, if they ask 'Why has export stopped?' or 'Which device is offline?' look at the active alerts and device status to give technical, context-aware answers. Be professional, technical, and extremely helpful. Keep answers concise.
    `.trim();

    const payload: ChatMessage[] = [
      { role: 'system', content: systemContext },
      ...updatedMessages
    ];

    try {
      const response = await api.chatWithAi(payload, token || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    } catch (err: any) {
      console.warn('AI Chat failed. Falling back to local responder.', err);
      
      // Local fallback logic
      let fallbackText = '';
      const textLower = textToSend.toLowerCase();
      
      if (textLower.includes('export stopped') || textLower.includes('revenue lower') || textLower.includes('stopped')) {
        const activeGridAlerts = alerts.filter(a => !a.acknowledged && (a.code.includes('GRID') || a.code.includes('REVERSE')));
        if (activeGridAlerts.length > 0) {
          fallbackText = `According to live telemetry, export has stopped or is degraded due to the following grid faults:\n` +
            activeGridAlerts.map(a => `- **${a.title}**: ${a.recommendedAction}`).join('\n');
        } else if (!gridExportEnabled) {
          fallbackText = `Grid export is currently switched off in the Edge Gateway settings. You can re-enable it in the IoT & Edge Gateway Control Center to start selling power again.`;
        } else {
          fallbackText = `Grid export is active, but check solar production. If solar irradiance is low (current: ${telemetry?.weather?.solarIrradianceWm2 ?? 0} W/m²), you won't have surplus power to export.`;
        }
      } else if (textLower.includes('neighbor') || textLower.includes('neighbour') || textLower.includes('not receiving power')) {
        const neighborAlerts = alerts.filter(a => !a.acknowledged && a.code.includes('NEIGHBOUR'));
        if (neighborAlerts.length > 0) {
          fallbackText = `Neighbor energy sharing is active, but encountering issues:\n` +
            neighborAlerts.map(a => `- **${a.title}**: ${a.recommendedAction}`).join('\n');
        } else if (!neighbourTransferEnabled) {
          fallbackText = `Neighbor Transfer is currently disabled. Toggle P2P Neighbor Transfer on in the Edge Gateway Control Center to share surplus energy.`;
        } else if (telemetry?.neighbourTrading?.instantaneousPowerKw === 0) {
          fallbackText = `Neighbor Transfer is enabled, but current P2P transfer rate is 0 kW. This means your battery is charging or solar generation is just enough to cover your local load (${telemetry?.inverter?.powerKw?.toFixed(2)} kW PV vs ${((telemetry?.inverter?.powerKw ?? 0) - (telemetry?.smartMeter?.activePowerKw ?? 0)).toFixed(2)} kW load).`;
        } else {
          fallbackText = `Neighbor P2P link is healthy! Current transfer rate: ${telemetry?.neighbourTrading?.instantaneousPowerKw?.toFixed(2)} kW at ${telemetry?.neighbourTrading?.voltageV?.toFixed(1)} V. Total energy delivered: ${telemetry?.neighbourTrading?.energyDeliveredKwh?.toFixed(2)} kWh.`;
        }
      } else if (textLower.includes('offline') || textLower.includes('device offline')) {
        const offlineDevices = devices.filter(d => d.status === 'OFFLINE');
        if (offlineDevices.length > 0) {
          fallbackText = `The following field devices are currently offline:\n` +
            offlineDevices.map(d => `- **${d.name}** (${d.type}): Offline. Recommended Action: check connection, signal is ${d.signalStrength} dBm.`).join('\n');
        } else {
          fallbackText = `All registered field devices (Inverter, Smart Net Meter, BMS, Weather Station, Edge Gateway) are currently online and checking in successfully!`;
        }
      } else if (textLower.includes('synchronized') || textLower.includes('sync')) {
        const isSynced = telemetry?.inverter?.gridSynchronized;
        if (isSynced) {
          fallbackText = `Yes, the hybrid inverter is successfully synchronized with the utility grid at ${telemetry?.smartMeter?.frequencyHz?.toFixed(1)} Hz and phase voltage ${telemetry?.smartMeter?.voltageV?.toFixed(1)} V.`;
        } else {
          fallbackText = `⚠️ No, the inverter is not synchronized. Current grid voltage is ${telemetry?.smartMeter?.voltageV?.toFixed(1)} V. The sync threshold requires a steady grid voltage between 230V and 253V. Recommended action: Check for local grid undervoltage.`;
        }
      } else if (textLower.includes('explain')) {
        fallbackText = `Here is your system breakdown:\n- **Solar PV**: Sized at ${results.solar?.requiredPvSizeKw ?? 0} kWp (${results.solar?.numberOfPanels ?? 0} modules) to generate enough power for your ${results.load?.dailyEnergyKwh ?? 0} kWh daily consumption.\n- **Storage**: ${results.battery?.requiredCapacityKwh ?? 0} kWh battery bank providing ${inputs.autonomyDays} day(s) of backup.\n- **Inverter**: ${results.inverter?.recommendedInverterKw ?? 0} kW, adequate for your peak demand.`;
      } else if (textLower.includes('optimize')) {
        fallbackText = `1. **Peak Load Shift**: Shift heavy appliances like the Microwave to peak sun hours (10 AM - 2 PM) to run directly off solar and preserve battery life.\n2. **Cable Thickness**: Upgrade your cable size if your voltage drop exceeds 3.0%.\n3. **DoD Limit**: Ensure your battery Depth of Discharge (DoD) is capped at 80% to maximize cycle life.`;
      } else if (textLower.includes('compliance')) {
        const drop = results.cable?.voltageDropPercent ?? 0;
        fallbackText = `Compliance Check:\n- **Voltage Drop**: ${drop <= 3 ? '✅ PASS' : '❌ FAIL'} (${drop.toFixed(2)}% drop vs 3% limit).\n- **Inverter Margin**: ${results.inverter && results.inverter.safetyMarginUsed >= 1.25 ? '✅ PASS' : '⚠️ WARN'} (×${results.inverter?.safetyMarginUsed ?? 0} safety margin).\n- **Battery DoD**: ${inputs.dod <= 0.8 ? '✅ PASS' : '⚠️ WARN'} (${inputs.dod * 100}% DoD).`;
      } else {
        fallbackText = `I received your message. I am currently running in offline guest mode. You can ask me to: \n1. "Explain my design"\n2. "Get optimization tips"\n3. "Check compliance"\n4. "Why is neighbor not receiving power?"\n5. "Why has export stopped?"\n6. "Which device is offline?"\nAnd I will analyze your live system parameters!`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fallbackText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>💬 REOS AI Copilot</Text>
              <Text style={styles.subtitle}>PROJECT-AWARE ASSISTANT</Text>
            </View>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chat History */}
          <ScrollView 
            style={styles.chatArea} 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, i) => (
              <View 
                key={i} 
                style={[
                  styles.messageRow, 
                  msg.role === 'user' ? styles.messageUser : null
                ]}
              >
                <View 
                  style={[
                    styles.messageBubble, 
                    msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                  ]}
                >
                  <Text style={msg.role === 'user' ? styles.textUser : styles.textAssistant}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={styles.messageRow}>
                <View style={[styles.messageBubble, styles.bubbleAssistant, { flexDirection: 'row', gap: 6 }]}>
                  <ActivityIndicator size="small" color={activeColors.primary} />
                  <Text style={styles.textAssistant}>Analyzing design...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.btnQuick} onPress={() => handleSend('Explain my design')}>
              <Text style={styles.btnQuickText}>📋 Explain Design</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnQuick} onPress={() => handleSend('Give me optimization tips')}>
              <Text style={styles.btnQuickText}>💡 Optimize</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnQuick} onPress={() => handleSend('Check my compliance')}>
              <Text style={styles.btnQuickText}>⚠️ Check Compliance</Text>
            </TouchableOpacity>
          </View>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your solar system..."
              placeholderTextColor={activeColors.placeholder}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity style={styles.btnSend} onPress={() => handleSend()}>
              <Text style={styles.btnSendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
