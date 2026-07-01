import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Switch, ActivityIndicator 
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';

export const IotControlCenter: React.FC = () => {
  const { 
    theme, devices, telemetry, alerts, 
    isGatewayBuffering, gridExportEnabled, neighbourTransferEnabled,
    registerDevice, removeDevice, toggleGridExport, 
    toggleNeighbourTransfer, toggleGatewayBuffering, acknowledgeAlert 
  } = useStore();
  const C = Colors[theme];

  // Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'INVERTER' | 'SMART_METER' | 'BMS' | 'WEATHER_STATION' | 'NEIGHBOUR_METER' | 'EDGE_GATEWAY'>('WEATHER_STATION');
  const [firmware, setFirmware] = useState('v1.0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  const handleAddDevice = async () => {
    if (!deviceName.trim()) return;
    setIsSubmitting(true);
    try {
      const newDev = {
        id: `dev-${deviceType.toLowerCase().substring(0, 3)}-${Date.now().toString().slice(-4)}`,
        name: deviceName.trim(),
        type: deviceType,
        status: 'ONLINE' as const,
        projectId: 'default',
        firmwareVersion: firmware.trim() || 'v1.0.0',
      };
      await registerDevice(newDev);
      setDeviceName('');
      setShowAddForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDevices = devices.filter(d => {
    if (deviceFilter === 'ONLINE') return d.status === 'ONLINE';
    if (deviceFilter === 'OFFLINE') return d.status === 'OFFLINE';
    return true;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'INVERTER': return '🔌';
      case 'SMART_METER': return '📟';
      case 'BMS': return '🔋';
      case 'WEATHER_STATION': return '🌦️';
      case 'NEIGHBOUR_METER': return '🤝';
      case 'EDGE_GATEWAY': return '🌐';
      default: return '⚙️';
    }
  };

  const s = StyleSheet.create({
    container: {
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    title: { color: C.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 2 },
    subtitle: { color: C.textSecondary, fontSize: 12, marginBottom: Spacing.md },
    divider: { height: 1, backgroundColor: C.divider, marginVertical: Spacing.md },
    
    // Grid/flex layout helpers
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    
    // Edge Gateway Controls
    gwContainer: {
      backgroundColor: C.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
    },
    gwTitle: { color: C.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 4 },
    gwDesc: { color: C.textSecondary, fontSize: 11, marginBottom: Spacing.sm },
    
    // Switch row
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
    },
    switchLabel: { color: C.textPrimary, fontSize: 13, fontWeight: '600' },
    switchSub: { color: C.textSecondary, fontSize: 10, marginTop: 1 },
    
    // Protocol Badge grid
    protoBadge: {
      backgroundColor: C.divider,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginRight: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    protoBadgeActive: {
      backgroundColor: C.successLight,
      borderColor: C.success,
    },
    protoText: { color: C.textSecondary, fontSize: 9, fontWeight: '700' },
    protoTextActive: { color: C.success },

    // Devices Registry
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    sectionTitle: { color: C.textPrimary, fontSize: 14, fontWeight: '700' },
    btnAdd: {
      backgroundColor: C.primary,
      borderRadius: BorderRadius.xs,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    btnAddText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    
    // Filter tabs
    filterRow: { flexDirection: 'row', marginBottom: Spacing.sm },
    filterTab: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: BorderRadius.xs,
      marginRight: Spacing.xs,
      backgroundColor: C.divider,
    },
    filterTabActive: {
      backgroundColor: C.primary,
    },
    filterTabText: { color: C.textSecondary, fontSize: 10, fontWeight: '600' },
    filterTabTextActive: { color: '#fff' },

    // Device Item Card
    deviceCard: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    devHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    devName: { color: C.textPrimary, fontWeight: '600', fontSize: 13 },
    devMeta: { color: C.textSecondary, fontSize: 10, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    statusOnline: { backgroundColor: C.success },
    statusOffline: { backgroundColor: C.error },
    statusMaint: { backgroundColor: C.warning },
    statusText: { fontSize: 9, fontWeight: '700' },
    btnRemove: { padding: 4 },
    btnRemoveText: { color: C.error, fontSize: 11, fontWeight: '600' },

    // Alerts panel
    alertCard: {
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.xs,
      borderWidth: 1,
    },
    alertCritical: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
    alertWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    alertTitle: { fontWeight: '700', fontSize: 12 },
    alertDesc: { color: C.textSecondary, fontSize: 10, marginTop: 2, lineHeight: 14 },
    alertMeta: { color: C.textSecondary, fontSize: 9, marginTop: 4 },
    btnAck: {
      backgroundColor: C.divider,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      paddingVertical: 2,
      paddingHorizontal: 6,
      marginTop: Spacing.xs,
      alignSelf: 'flex-end',
    },
    btnAckText: { color: C.textPrimary, fontSize: 9, fontWeight: '600' },

    // Form inputs
    formContainer: {
      backgroundColor: C.surface,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
    },
    inputBox: {
      backgroundColor: C.divider,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      padding: 6,
      color: C.textPrimary,
      fontSize: 12,
      marginBottom: Spacing.sm,
    },
    selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: Spacing.sm },
    selectPill: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.divider,
    },
    selectPillActive: {
      borderColor: C.primary,
      backgroundColor: C.infoLight,
    },
    selectText: { color: C.textSecondary, fontSize: 9, fontWeight: '600' },
    selectTextActive: { color: C.primary },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
    btnCancel: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: BorderRadius.xs, backgroundColor: C.divider },
    btnSave: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: BorderRadius.xs, backgroundColor: C.primary },

    // Live Telemetry Gauges
    telemetryRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
    telemetryCard: {
      flex: 1,
      backgroundColor: C.surface,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      alignItems: 'center',
    },
    telVal: { color: C.primary, fontWeight: '800', fontSize: 16, marginTop: 4 },
    telLbl: { color: C.textSecondary, fontSize: 9, marginTop: 2, textAlign: 'center' },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>🌐 IoT & Edge Gateway Control Center</Text>
      <Text style={s.subtitle}>Monitor grid sync, BMS cell status, and manage microgrid field devices</Text>

      {/* ── Real-Time Telemetry Gauges ───────────────────────────────────── */}
      {telemetry && (
        <View style={s.telemetryRow}>
          <View style={s.telemetryCard}>
            <Text style={{ fontSize: 16 }}>☀️</Text>
            <Text style={s.telVal}>{telemetry.inverter.powerKw.toFixed(2)} kW</Text>
            <Text style={s.telLbl}>PV Generation</Text>
          </View>
          <View style={s.telemetryCard}>
            <Text style={{ fontSize: 16 }}>🔋</Text>
            <Text style={s.telVal}>{telemetry.battery.socPercent.toFixed(1)}%</Text>
            <Text style={s.telLbl}>Battery SoC</Text>
          </View>
          <View style={s.telemetryCard}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <Text style={s.telVal}>{telemetry.smartMeter.voltageV.toFixed(1)} V</Text>
            <Text style={s.telLbl}>Grid Voltage</Text>
          </View>
          <View style={s.telemetryCard}>
            <Text style={{ fontSize: 16 }}>🌦️</Text>
            <Text style={s.telVal}>{telemetry.weather.solarIrradianceWm2} W/m²</Text>
            <Text style={s.telLbl}>Solar Irradiance</Text>
          </View>
        </View>
      )}

      {/* ── System Alerts Board ─────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={[s.sectionTitle, { marginBottom: Spacing.xs, color: C.error }]}>
            ⚠️ Active Alarms ({alerts.filter(a => !a.acknowledged).length})
          </Text>
          {alerts.map(a => (
            <View 
              key={a.id} 
              style={[
                s.alertCard, 
                a.severity === 'CRITICAL' ? s.alertCritical : s.alertWarning,
                a.acknowledged && { opacity: 0.5 }
              ]}
            >
              <View style={s.row}>
                <Text style={[s.alertTitle, { color: a.severity === 'CRITICAL' ? '#991B1B' : '#92400E' }]}>
                  {a.title} {a.acknowledged && '(Acked)'}
                </Text>
                <Text style={{ fontSize: 8, color: C.textSecondary }}>{new Date(a.timestamp).toLocaleTimeString()}</Text>
              </View>
              <Text style={s.alertDesc}>{a.recommendedAction}</Text>
              
              {!a.acknowledged && (
                <TouchableOpacity style={s.btnAck} onPress={() => acknowledgeAlert(a.id)}>
                  <Text style={s.btnAckText}>Acknowledge Alert</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── REOS Edge Gateway ────────────────────────────────────────────── */}
      <View style={s.gwContainer}>
        <Text style={s.gwTitle}>🌐 REOS Edge Gateway Config</Text>
        <Text style={s.gwDesc}>Handles industrial protocol adapters and provides local data buffering</Text>
        
        <View style={s.switchRow}>
          <View>
            <Text style={s.switchLabel}>Local Outage Buffering</Text>
            <Text style={s.switchSub}>Store telemetry locally in flash memory during internet loss</Text>
          </View>
          <Switch 
            value={isGatewayBuffering}
            onValueChange={toggleGatewayBuffering}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={[s.switchRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: Spacing.xs, marginTop: Spacing.xs }]}>
          <View>
            <Text style={s.switchLabel}>P2P Neighbor Transfer</Text>
            <Text style={s.switchSub}>Toggles microgrid connection sharing</Text>
          </View>
          <Switch 
            value={neighbourTransferEnabled}
            onValueChange={toggleNeighbourTransfer}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[s.gwTitle, { fontSize: 11, marginTop: Spacing.sm, marginBottom: 6 }]}>Active Protocol Adapters</Text>
        <View style={s.grid}>
          {[
            { name: 'Modbus TCP', active: true },
            { name: 'Modbus RTU', active: true },
            { name: 'MQTT', active: true },
            { name: 'LoRaWAN', active: true },
            { name: 'Zigbee', active: true },
            { name: 'IEC 61850', active: false },
            { name: 'DNP3', active: false },
            { name: 'OPC UA', active: false },
          ].map(p => (
            <View key={p.name} style={[s.protoBadge, p.active && s.protoBadgeActive]}>
              <Text style={[s.protoText, p.active && s.protoTextActive]}>
                {p.name} {p.active ? '● PASS' : '○ READY'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Devices Registry ────────────────────────────────────────────── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>📟 Device Registry ({devices.length})</Text>
        <TouchableOpacity style={s.btnAdd} onPress={() => setShowAddForm(!showAddForm)}>
          <Text style={s.btnAddText}>{showAddForm ? '✕ Close' : '➕ Register Device'}</Text>
        </TouchableOpacity>
      </View>

      {/* Register Form */}
      {showAddForm && (
        <View style={s.formContainer}>
          <Text style={[s.gwTitle, { marginBottom: 6 }]}>Register New Field Device</Text>
          
          <Text style={s.switchSub}>Device Name</Text>
          <TextInput 
            style={s.inputBox}
            placeholder="e.g. South Roof Smart Meter"
            placeholderTextColor={C.placeholder}
            value={deviceName}
            onChangeText={setDeviceName}
          />
          
          <Text style={s.switchSub}>Device Protocol Type</Text>
          <View style={s.selectRow}>
            {(['WEATHER_STATION', 'SMART_METER', 'INVERTER', 'BMS', 'NEIGHBOUR_METER'] as const).map(t => (
              <TouchableOpacity 
                key={t}
                style={[s.selectPill, deviceType === t && s.selectPillActive]}
                onPress={() => setDeviceType(t)}
              >
                <Text style={[s.selectText, deviceType === t && s.selectTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.switchSub}>Firmware Version</Text>
          <TextInput 
            style={s.inputBox}
            placeholder="e.g. v1.0.0"
            placeholderTextColor={C.placeholder}
            value={firmware}
            onChangeText={setFirmware}
          />

          <View style={s.formActions}>
            <TouchableOpacity style={s.btnCancel} onPress={() => setShowAddForm(false)}>
              <Text style={[s.btnAddText, { color: C.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSave} onPress={handleAddDevice} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.btnAddText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Devices List Filter Tabs */}
      <View style={s.filterRow}>
        {(['ALL', 'ONLINE', 'OFFLINE'] as const).map(f => (
          <TouchableOpacity 
            key={f}
            style={[s.filterTab, deviceFilter === f && s.filterTabActive]}
            onPress={() => setDeviceFilter(f)}
          >
            <Text style={[s.filterTabText, deviceFilter === f && s.filterTabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Devices Loop */}
      {filteredDevices.map(d => (
        <View key={d.id} style={s.deviceCard}>
          <View style={s.devHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>{getDeviceIcon(d.type)}</Text>
              <View>
                <Text style={s.devName}>{d.name}</Text>
                <Text style={s.devMeta}>
                  ID: {d.id} · FW: {d.firmwareVersion} · Signal: {d.signalStrength} dBm ({d.communicationQuality}%)
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[
                  s.statusDot, 
                  d.status === 'ONLINE' ? s.statusOnline : d.status === 'OFFLINE' ? s.statusOffline : s.statusMaint
                ]} />
                <Text style={[
                  s.statusText,
                  { color: d.status === 'ONLINE' ? C.success : d.status === 'OFFLINE' ? C.error : C.warning }
                ]}>
                  {d.status}
                </Text>
              </View>
              <TouchableOpacity style={s.btnRemove} onPress={() => removeDevice(d.id)}>
                <Text style={s.btnRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {filteredDevices.length === 0 && (
        <Text style={[s.gwDesc, { textAlign: 'center', marginVertical: Spacing.sm }]}>No devices match this status filter</Text>
      )}

    </View>
  );
};
