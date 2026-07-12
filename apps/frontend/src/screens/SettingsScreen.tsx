import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useStore } from "../store/useStore";

export default function SettingsScreen() {
  const { user, userRole, userType, setUserType, theme, toggleTheme, logout } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* User Profile Info Section */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>User Profile</Text>
      
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 20 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.3)" : "rgba(0,162,194,0.3)" }}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        
        {user ? (
          <View>
            <Text style={{ color: text, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>{user.firstName} {user.lastName}</Text>
            <Text style={{ color: sub, fontSize: 14, marginBottom: 12 }}>{user.email}</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={{ backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: isDark ? accent : "#0284C7", fontSize: 11, fontWeight: "700" }}>
                  {(userRole ?? "GUEST").replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text style={{ color: text, fontSize: 16, fontWeight: "800", marginBottom: 4 }}>Guest Session</Text>
            <Text style={{ color: sub, fontSize: 13 }}>Please sign in to access professional design features.</Text>
          </View>
        )}
      </View>

      {/* Preferences Section */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Preferences</Text>
      
      <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 20, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>Color Mode</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Toggle between light and dark theme</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 1, backgroundColor: border }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>Platform Mode</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Select experience style (Prosumer vs Consumer)</Text>
          </View>
          <TouchableOpacity onPress={() => setUserType(userType === 'PROSUMER' ? 'CONSUMER' : 'PROSUMER')} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>
              {userType === 'PROSUMER' ? "☀️ Prosumer (Solar)" : "🏠 Consumer (Buyer)"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 1, backgroundColor: border }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>Startup Experience Selector</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Force choose screen to pop up on startup</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              try {
                localStorage.removeItem('reos_user_type');
              } catch (e) {}
              useStore.setState({ hasSelectedMode: false });
            }} 
            style={{ backgroundColor: "rgba(0,212,255,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: accent, fontWeight: "700", fontSize: 13 }}>🔄 Force Popup</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 1, backgroundColor: border }} />
        
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: text, fontSize: 14, fontWeight: "800" }}>System Status</Text>
            <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>Connectivity and database status</Text>
          </View>
          <View style={{ backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>● Online</Text>
          </View>
        </View>
      </View>

      {/* Account Actions Section */}
      <Text style={{ color: sub, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Session Management</Text>
      
      <TouchableOpacity
        onPress={() => logout()}
        style={{
          backgroundColor: "rgba(239,68,68,0.1)",
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.2)",
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center"
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 10 }}>🚪</Text>
        <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Sign Out of Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}