import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useStore } from "../store/useStore";

type ViewAs = 'PROSUMER' | 'CONSUMER' | 'ADMIN';

const ROLE_OPTIONS: { type: ViewAs; icon: string; label: string; desc: string; color: string }[] = [
  {
    type: 'ADMIN',
    icon: '🏛️',
    label: 'Admin',
    desc: 'Full finance dashboard, withdrawal approvals, dispute resolution',
    color: '#00D4FF',
  },
  {
    type: 'PROSUMER',
    icon: '☀️',
    label: 'Prosumer',
    desc: 'Solar plant owner — design tools, P2P selling, fleet management',
    color: '#10B981',
  },
  {
    type: 'CONSUMER',
    icon: '🏠',
    label: 'Consumer',
    desc: 'Energy buyer — monitoring, billing, P2P purchasing',
    color: '#F59E0B',
  },
];

export default function SettingsScreen() {
  const { user, userRole, userType, setUserType, theme, toggleTheme, logout, isDbOffline } = useStore() as any;
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  const isAdminAccount = ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(userRole ?? '');

  const handleViewAs = (type: ViewAs) => {
    if (type === 'ADMIN' && !isAdminAccount) {
      Alert.alert('Access Denied', 'Only admin accounts can switch to Admin view.');
      return;
    }
    setUserType(type);
    Alert.alert(
      'View Switched ✅',
      `Now viewing as ${type}.\n\nNavigate using the menu to see the ${type.toLowerCase()} experience.`,
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── User Profile ── */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>
        User Profile
      </Text>

      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.3)" : "rgba(0,162,194,0.3)" }}>
            <Text style={{ fontSize: 30 }}>{isAdminAccount ? "🏛️" : userType === "PROSUMER" ? "☀️" : "🏠"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {user ? (
              <>
                <Text style={{ color: text, fontSize: 17, fontWeight: "800", marginBottom: 2 }}>{user.firstName} {user.lastName}</Text>
                <Text style={{ color: sub, fontSize: 12, marginBottom: 8 }}>{user.email}</Text>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>
                      {(userRole ?? "GUEST").replace(/_/g, " ")}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "700" }}>
                      Viewing as: {userType}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 4 }}>Guest Session</Text>
                <Text style={{ color: sub, fontSize: 12 }}>Sign in to access professional features.</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ── View As Switcher (Admin Only) ── */}
      {isAdminAccount && (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Preview App As
            </Text>
            <View style={{ backgroundColor: "rgba(0,212,255,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: accent, fontSize: 10, fontWeight: "700" }}>ADMIN ONLY</Text>
            </View>
          </View>

          <View style={{ backgroundColor: card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)", marginBottom: 20, gap: 10 }}>
            <Text style={{ color: sub, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>
              As a SUPER_ADMIN you can preview the full app from any user's perspective. The navigation menu will change to match the selected role.
            </Text>
            {ROLE_OPTIONS.map((opt) => {
              const isActive = userType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => handleViewAs(opt.type)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: isActive ? opt.color : border,
                    backgroundColor: isActive
                      ? isDark ? `${opt.color}15` : `${opt.color}10`
                      : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    gap: 12,
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${opt.color}20`, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isActive ? opt.color : text, fontSize: 15, fontWeight: "800" }}>{opt.label}</Text>
                    <Text style={{ color: sub, fontSize: 11, marginTop: 2, lineHeight: 16 }}>{opt.desc}</Text>
                  </View>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isActive ? opt.color : border,
                    backgroundColor: isActive ? opt.color : "transparent",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {isActive && <Text style={{ color: "#000", fontSize: 12, fontWeight: "900" }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* ── Preferences ── */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>
        Preferences
      </Text>

      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 20, gap: 16 }}>
        {/* Theme */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>Color Mode</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Toggle between light and dark theme</Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 1, backgroundColor: border }} />

        {/* Platform Mode (non-admin toggle) */}
        {!isAdminAccount && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>Platform Mode</Text>
                <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Switch between Prosumer and Consumer view</Text>
              </View>
              <TouchableOpacity
                onPress={() => setUserType(userType === 'PROSUMER' ? 'CONSUMER' : 'PROSUMER')}
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>
                  {userType === 'PROSUMER' ? "☀️ Prosumer" : "🏠 Consumer"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: border }} />
          </>
        )}

        {/* Startup selector */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>Startup Experience Selector</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Force the experience chooser on next startup</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              try { localStorage.removeItem('reos_user_type'); } catch (e) {}
              useStore.setState({ hasSelectedMode: false });
            }}
            style={{ backgroundColor: "rgba(0,212,255,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: accent, fontWeight: "700", fontSize: 13 }}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 1, backgroundColor: border }} />

        {/* System Status */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>System Status</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Connectivity and database status</Text>
          </View>
          <View style={{ backgroundColor: isDbOffline ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: isDbOffline ? "#F59E0B" : "#10B981", fontSize: 11, fontWeight: "700" }}>
              {isDbOffline ? "● Local Backup" : "● Cloud Sync"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Session ── */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>
        Session Management
      </Text>

      <TouchableOpacity
        onPress={() => logout()}
        style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", alignItems: "center", flexDirection: "row", justifyContent: "center" }}
      >
        <Text style={{ fontSize: 18, marginRight: 10 }}>🚪</Text>
        <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Sign Out of Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}