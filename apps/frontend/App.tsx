import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  StatusBar, 
  Modal, 
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from './src/store/useStore';
import { UserRole } from '@reos/types';
import { WorkspaceCard } from './src/components/WorkspaceCard';
import { LoadAssessmentCard } from './src/components/LoadAssessmentCard';
import { SolarPvCard } from './src/components/SolarPvCard';
import { BatterySizingCard } from './src/components/BatterySizingCard';
import { CableSizingCard } from './src/components/CableSizingCard';
import { InverterSizingCard } from './src/components/InverterSizingCard';
import { AiAssistantPanel } from './src/components/AiAssistantPanel';
import { CustomerDashboard } from './src/components/CustomerDashboard';
import { InstallerDashboard } from './src/components/InstallerDashboard';
import { AiChatModal } from './src/components/AiChatModal';
import { DownloadReportButton } from './src/components/DownloadReportButton';
import { PlantOperatorDashboard } from './src/components/PlantOperatorDashboard';
import { ConsumerPortal } from './src/components/ConsumerPortal';

export default function App() {
  const { 
    theme, 
    userRole, 
    userMode, 
    results, 
    setRole, 
    setMode, 
    toggleTheme,
    // Auth State & Actions
    token,
    user,
    isAuthenticated,
    authError,
    login,
    register,
    logout,
    // Project State & Actions
    currentProjectId,
    projectsList,
    isSaving,
    isDbOffline,
    saveProject,
    loadProject,
    fetchUserProjects,
    fetchIotData,
  } = useStore();

  const activeColors = Colors[theme];

  // Local UI States
  const [expandedCard, setExpandedCard] = useState<string | null>('load');
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isProjectsModalVisible, setIsProjectsModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isAiChatVisible, setIsAiChatVisible] = useState(false);

  // Form Inputs
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch projects on mount / auth change
  useEffect(() => {
    fetchUserProjects();
  }, [isAuthenticated]);

  // Poll live telemetry every 2.5 seconds
  useEffect(() => {
    fetchIotData();
    const interval = setInterval(() => {
      fetchIotData();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleCardToggle = (card: string) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  const handleAuthSubmit = async () => {
    setErrorMessage('');
    try {
      if (isRegisterMode) {
        await register({ email, password, firstName, lastName });
      } else {
        await login({ email, password });
      }
      setIsAuthModalVisible(false);
      // Reset form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    }
  };

  const handleSaveSubmit = async () => {
    if (!projectName.trim()) return;
    try {
      await saveProject(projectName);
      setIsSaveModalVisible(false);
      setProjectName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadProject = async (id: string) => {
    await loadProject(id);
    setIsProjectsModalVisible(false);
  };

  const mainStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeColors.background,
    },
    header: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: activeColors.border,
      backgroundColor: activeColors.card,
    },
    headerTitle: {
      color: activeColors.textPrimary,
      fontWeight: '700',
      fontSize: 18,
    },
    headerSubtitle: {
      color: activeColors.primary,
      fontWeight: '600',
      fontSize: 10,
      letterSpacing: 1,
    },
    navGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    btnNav: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: BorderRadius.xs,
      backgroundColor: activeColors.divider,
      marginLeft: Spacing.xs,
    },
    btnNavText: {
      color: activeColors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    workspace: {
      flex: 1,
      padding: Spacing.md,
    },
    configBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: activeColors.card,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
    },
    configText: {
      color: activeColors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    roleSelector: {
      flexDirection: 'row',
      backgroundColor: activeColors.divider,
      borderRadius: BorderRadius.xs,
      padding: 2,
    },
    roleBtn: {
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderRadius: BorderRadius.xs,
      marginLeft: 4,
    },
    roleBtnActive: {
      backgroundColor: activeColors.primary,
    },
    roleBtnText: {
      color: activeColors.textSecondary,
      fontSize: 10,
      fontWeight: '600',
    },
    roleBtnTextActive: {
      color: '#fff',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: activeColors.card,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
    },
    modalTitle: {
      color: activeColors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: Spacing.md,
    },
    inputGroup: {
      marginBottom: Spacing.md,
    },
    inputLabel: {
      color: activeColors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      padding: Spacing.xs,
      color: activeColors.textPrimary,
      fontSize: 14,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: Spacing.xs,
    },
    btnModalClose: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: BorderRadius.xs,
      backgroundColor: activeColors.divider,
    },
    btnModalSubmit: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: BorderRadius.xs,
      backgroundColor: activeColors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.xs,
    },
    btnModalSubmitText: {
      color: '#fff',
      fontWeight: '600',
    },
    errorText: {
      color: activeColors.error,
      fontSize: 12,
    },
    projectItem: {
      padding: Spacing.sm,
      backgroundColor: activeColors.divider,
      borderColor: activeColors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      marginBottom: Spacing.xs,
    },
    projectItemTitle: {
      color: activeColors.textPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
    projectItemMeta: {
      color: activeColors.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    badgeOffline: {
      backgroundColor: activeColors.warningLight,
      borderColor: activeColors.warning,
      borderWidth: 1,
      borderRadius: BorderRadius.xs,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginBottom: Spacing.md,
    },
    badgeOfflineText: {
      color: activeColors.warning,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    }
  });

  const getLoadStatus = () => results.load ? 'PASS' : 'PENDING';
  const getSolarStatus = () => results.solar ? 'PASS' : 'PENDING';
  const getBatteryStatus = () => results.battery ? 'PASS' : 'PENDING';
  const getInverterStatus = () => results.inverter ? 'PASS' : 'PENDING';

  const getCableStatus = () => {
    if (!results.cable) return 'PENDING';
    return results.cable.passesCheck ? 'PASS' : 'ERROR';
  };

  const roles: { role: UserRole; icon: string; desc: string }[] = [
    { role: 'SYSTEM_OWNER',    icon: '🏠', desc: 'System Owner' },
    { role: 'CONSUMER',        icon: '🔌', desc: 'Energy Consumer' },
    { role: 'INSTALLER',       icon: '🔧', desc: 'Site & BOM' },
    { role: 'ENGINEER',        icon: '⚙️', desc: 'Full Workspace' },
    { role: 'PLANT_OPERATOR',  icon: '🌱', desc: 'Mini-Grid Ops' },
  ];

  return (
    <SafeAreaView style={mainStyles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* ── App Header ─────────────────────────────────────────────────── */}
      <View style={mainStyles.header}>
        <View>
          <Text style={mainStyles.headerTitle}>REOS Workspace</Text>
          <Text style={mainStyles.headerSubtitle}>RENEWABLE ENERGY OS</Text>
        </View>
        <View style={mainStyles.navGroup}>
          <TouchableOpacity style={mainStyles.btnNav} onPress={toggleTheme}>
            <Text style={mainStyles.btnNavText}>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</Text>
          </TouchableOpacity>

          {/* Pro Mode toggle — Engineer only */}
          {userRole === 'ENGINEER' && (
            <TouchableOpacity
              style={[mainStyles.btnNav, { backgroundColor: activeColors.primary }]}
              onPress={() => setMode(userMode === 'SIMPLE' ? 'PROFESSIONAL' : 'SIMPLE')}
            >
              <Text style={[mainStyles.btnNavText, { color: '#fff' }]}>
                {userMode === 'SIMPLE' ? '⚡ Pro Mode' : '🌱 Simple Mode'}
              </Text>
            </TouchableOpacity>
          )}

          {results.load && (
            <TouchableOpacity style={mainStyles.btnNav} onPress={() => setIsSaveModalVisible(true)}>
              <Text style={mainStyles.btnNavText}>💾 Save</Text>
            </TouchableOpacity>
          )}
          <DownloadReportButton compact />
          <TouchableOpacity style={mainStyles.btnNav} onPress={() => setIsProjectsModalVisible(true)}>
            <Text style={mainStyles.btnNavText}>📂 Projects</Text>
          </TouchableOpacity>

          {isAuthenticated ? (
            <TouchableOpacity style={[mainStyles.btnNav, { backgroundColor: activeColors.error }]} onPress={logout}>
              <Text style={[mainStyles.btnNavText, { color: '#fff' }]}>🚪 {user?.firstName}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[mainStyles.btnNav, { backgroundColor: activeColors.primary }]} onPress={() => setIsAuthModalVisible(true)}>
              <Text style={[mainStyles.btnNavText, { color: '#fff' }]}>🔑 Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Role Selector Bar ───────────────────────────────────────────── */}
      <View style={[mainStyles.configBar, { flexDirection: 'row', alignItems: 'center' }]}>
        <Text style={[mainStyles.configText, { marginRight: Spacing.sm }]}>View as:</Text>
        <View style={mainStyles.roleSelector}>
          {roles.map(({ role, icon, desc }) => (
            <TouchableOpacity
              key={role}
              style={[
                mainStyles.roleBtn,
                userRole === role && mainStyles.roleBtnActive,
                { alignItems: 'center' },
              ]}
              onPress={() => setRole(role)}
            >
              <Text style={{ fontSize: 14 }}>{icon}</Text>
              <Text style={[mainStyles.roleBtnText, userRole === role && mainStyles.roleBtnTextActive]}>
                {role}
              </Text>
              <Text style={{ fontSize: 9, color: userRole === role ? activeColors.primary : activeColors.textSecondary }}>
                {desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Role-Based Workspace ────────────────────────────────────────── */}
      {/* SYSTEM OWNER view */}
      {(userRole === 'SYSTEM_OWNER' || userRole === 'CUSTOMER') && (
        <ScrollView
          style={[mainStyles.workspace, { paddingHorizontal: Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {isDbOffline && (
            <View style={mainStyles.badgeOffline}>
              <Text style={mainStyles.badgeOfflineText}>
                ⚠️ Running offline — data saved locally in your browser.
              </Text>
            </View>
          )}
          <CustomerDashboard />
        </ScrollView>
      )}

      {/* ENERGY CONSUMER view */}
      {userRole === 'CONSUMER' && (
        <ScrollView
          style={[mainStyles.workspace, { paddingHorizontal: Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {isDbOffline && (
            <View style={mainStyles.badgeOffline}>
              <Text style={mainStyles.badgeOfflineText}>
                ⚠️ Running offline — received energy telemetry simulated locally.
              </Text>
            </View>
          )}
          <ConsumerPortal />
        </ScrollView>
      )}

      {/* INSTALLER view */}
      {userRole === 'INSTALLER' && (
        <ScrollView
          style={[mainStyles.workspace, { paddingHorizontal: Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {isDbOffline && (
            <View style={mainStyles.badgeOffline}>
              <Text style={mainStyles.badgeOfflineText}>
                ⚠️ Running offline — data saved locally in your browser.
              </Text>
            </View>
          )}
          <InstallerDashboard />
        </ScrollView>
      )}

      {/* PLANT OPERATOR view — mini-grid / solar farm operator workspace */}
      {userRole === 'PLANT_OPERATOR' && (
        <ScrollView
          style={[mainStyles.workspace, { paddingHorizontal: Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {isDbOffline && (
            <View style={mainStyles.badgeOffline}>
              <Text style={mainStyles.badgeOfflineText}>
                ⚠️ Running offline — IoT telemetry is running on local simulation.
              </Text>
            </View>
          )}
          <PlantOperatorDashboard />
        </ScrollView>
      )}

      {/* ENGINEER view — full technical workspace */}
      {userRole === 'ENGINEER' && (
      <ScrollView style={mainStyles.workspace} showsVerticalScrollIndicator={false}>
        {isDbOffline && (
          <View style={mainStyles.badgeOffline}>
            <Text style={mainStyles.badgeOfflineText}>
              ⚠️ Database is offline. Sizing calculations are running locally, and projects will be saved to your browser storage.
            </Text>
          </View>
        )}
        <AiAssistantPanel />
        <View style={{ height: Spacing.md }} />

        {/* Card 1: Load Sizing */}
        <WorkspaceCard
          title="1. Load Assessment"
          icon="🔌"
          status={getLoadStatus()}
          summaryText={results.load ? `Peak demand: ${results.load.maximumDemandW.toFixed(0)}W` : 'Define connected load configurations'}
          expanded={expandedCard === 'load'}
          onToggle={() => handleCardToggle('load')}
        >
          <LoadAssessmentCard />
        </WorkspaceCard>

        {/* Card 2: Solar PV Sizing */}
        <WorkspaceCard
          title="2. Solar PV Design"
          icon="☀️"
          status={getSolarStatus()}
          summaryText={results.solar ? `Calculated PV capacity: ${results.solar.requiredPvSizeKw} kWp` : 'Calculate solar generation footprint'}
          expanded={expandedCard === 'solar'}
          onToggle={() => handleCardToggle('solar')}
        >
          <SolarPvCard />
        </WorkspaceCard>

        {/* Card 3: Battery Sizing */}
        <WorkspaceCard
          title="3. Battery Capacity"
          icon="🔋"
          status={getBatteryStatus()}
          summaryText={results.battery ? `Required capacity: ${results.battery.requiredCapacityKwh} kWh` : 'Determine storage autonomy requirements'}
          expanded={expandedCard === 'battery'}
          onToggle={() => handleCardToggle('battery')}
        >
          <BatterySizingCard />
        </WorkspaceCard>

        {/* Card 4: Inverter Sizing */}
        <WorkspaceCard
          title="4. Inverter Sizing"
          icon="🔌"
          status={getInverterStatus()}
          summaryText={results.inverter ? `Recommended: ${results.inverter.recommendedInverterKw} kW inverter` : 'Size inverter for continuous & surge loads'}
          expanded={expandedCard === 'inverter'}
          onToggle={() => handleCardToggle('inverter')}
        >
          <InverterSizingCard />
        </WorkspaceCard>

        {/* Card 5: Cable Sizing & Voltage Drop */}
        <WorkspaceCard
          title="5. Cable Coordination"
          icon="⚡"
          status={getCableStatus()}
          summaryText={results.cable ? `Voltage drop: ${results.cable.voltageDropPercent.toFixed(2)}%` : 'Verify voltage drop standard limits'}
          expanded={expandedCard === 'cable'}
          onToggle={() => handleCardToggle('cable')}
        >
          <CableSizingCard />
        </WorkspaceCard>

        <View style={{ height: 48 }} />
      </ScrollView>
      )}

      {/* Auth Modal (Login / Register) */}
      <Modal visible={isAuthModalVisible} transparent animationType="fade">
        <View style={mainStyles.modalOverlay}>
          <View style={mainStyles.modalContent}>
            <Text style={mainStyles.modalTitle}>{isRegisterMode ? 'Create REOS Account' : 'Login to REOS'}</Text>
            
            {isDbOffline && (
              <Text style={{ color: activeColors.warning, fontSize: 12 }}>
                Note: The backend database is offline. You can log in using any mock credentials, or close this modal and use local guest mode.
              </Text>
            )}

            <View style={mainStyles.inputGroup}>
              <Text style={mainStyles.inputLabel}>Email Address</Text>
              <TextInput 
                style={mainStyles.input} 
                value={email} 
                onChangeText={setEmail}
                placeholder="engineering@reos.io"
                placeholderTextColor={activeColors.placeholder}
                autoCapitalize="none"
              />
            </View>

            <View style={mainStyles.inputGroup}>
              <Text style={mainStyles.inputLabel}>Password</Text>
              <TextInput 
                style={mainStyles.input} 
                value={password} 
                onChangeText={setPassword}
                secureTextEntry
                placeholder="******"
                placeholderTextColor={activeColors.placeholder}
              />
            </View>

            {isRegisterMode && (
              <>
                <View style={mainStyles.inputGroup}>
                  <Text style={mainStyles.inputLabel}>First Name</Text>
                  <TextInput 
                    style={mainStyles.input} 
                    value={firstName} 
                    onChangeText={setFirstName}
                    placeholder="John"
                    placeholderTextColor={activeColors.placeholder}
                  />
                </View>
                <View style={mainStyles.inputGroup}>
                  <Text style={mainStyles.inputLabel}>Last Name</Text>
                  <TextInput 
                    style={mainStyles.input} 
                    value={lastName} 
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor={activeColors.placeholder}
                  />
                </View>
              </>
            )}

            {errorMessage ? <Text style={mainStyles.errorText}>{errorMessage}</Text> : null}

            <View style={mainStyles.modalButtons}>
              <TouchableOpacity style={mainStyles.btnModalClose} onPress={() => setIsAuthModalVisible(false)}>
                <Text style={mainStyles.btnNavText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={mainStyles.btnModalSubmit} onPress={handleAuthSubmit}>
                <Text style={mainStyles.btnModalSubmitText}>
                  {isRegisterMode ? 'Register' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: Spacing.xs }} onPress={() => setIsRegisterMode(!isRegisterMode)}>
              <Text style={{ color: activeColors.primary, fontSize: 13, textAlign: 'center' }}>
                {isRegisterMode ? 'Already have an account? Login' : 'Need an account? Register'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Projects Modal (Browse / Load) */}
      <Modal visible={isProjectsModalVisible} transparent animationType="fade">
        <View style={mainStyles.modalOverlay}>
          <View style={mainStyles.modalContent}>
            <Text style={mainStyles.modalTitle}>Saved Solar Projects</Text>
            
            <ScrollView style={{ maxHeight: 300, marginVertical: Spacing.xs }}>
              {projectsList.length === 0 ? (
                <Text style={{ color: activeColors.textSecondary, textAlign: 'center', marginVertical: Spacing.md }}>
                  No saved projects found.
                </Text>
              ) : (
                projectsList.map((p: any) => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={mainStyles.projectItem} 
                    onPress={() => handleLoadProject(p.id)}
                  >
                    <Text style={mainStyles.projectItemTitle}>{p.name}</Text>
                    <Text style={mainStyles.projectItemMeta}>
                      {p.id.startsWith('local-') ? '📁 Local Browser Storage' : '🌐 Cloud Database'} • {new Date(p.createdAt || p.updatedAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={mainStyles.modalButtons}>
              <TouchableOpacity style={mainStyles.btnModalClose} onPress={() => setIsProjectsModalVisible(false)}>
                <Text style={mainStyles.btnNavText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Project Modal */}
      <Modal visible={isSaveModalVisible} transparent animationType="fade">
        <View style={mainStyles.modalOverlay}>
          <View style={mainStyles.modalContent}>
            <Text style={mainStyles.modalTitle}>Save Current Project</Text>

            <View style={mainStyles.inputGroup}>
              <Text style={mainStyles.inputLabel}>Project Name</Text>
              <TextInput 
                style={mainStyles.input} 
                value={projectName} 
                onChangeText={setProjectName}
                placeholder="My Solar System"
                placeholderTextColor={activeColors.placeholder}
              />
            </View>

            <View style={mainStyles.modalButtons}>
              <TouchableOpacity style={mainStyles.btnModalClose} onPress={() => setIsSaveModalVisible(false)}>
                <Text style={mainStyles.btnNavText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={mainStyles.btnModalSubmit} 
                onPress={handleSaveSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={mainStyles.btnModalSubmitText}>Save Project</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Floating AI Chat Button */}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: activeColors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 9999,
        }}
        onPress={() => setIsAiChatVisible(true)}
      >
        <Text style={{ fontSize: 24 }}>💬</Text>
      </TouchableOpacity>

      {/* AI Chat Modal */}
      <AiChatModal visible={isAiChatVisible} onClose={() => setIsAiChatVisible(false)} />
    </SafeAreaView>
  );
}
