import "react-native-gesture-handler";
import "./polyfill";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useStore } from "./src/store/useStore";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import OverviewScreen from "./src/screens/OverviewScreen";
import MonitoringScreen from "./src/screens/MonitoringScreen";
import SolarDesignScreen from "./src/screens/SolarDesignScreen";
import DeviceManagementScreen from "./src/screens/DeviceManagementScreen";
import AIForecastingScreen from "./src/screens/AIForecastingScreen";
import AIChatScreen from "./src/screens/AIChatScreen";
import BillingScreen from "./src/screens/BillingScreen";
import TradingScreen from "./src/screens/TradingScreen";
import FleetScreen from "./src/screens/FleetScreen";
import AlarmScreen from "./src/screens/AlarmScreen";
import MaintenanceScreen from "./src/screens/MaintenanceScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

// Drawer Content
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const NAV_ITEMS = [
  { name: "Overview",    label: "Dashboard",         icon: "⚡", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "Monitoring",  label: "Live Monitoring",   icon: "📡", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "SolarDesign", label: "Solar Design",      icon: "☀️", userTypes: ["PROSUMER"] },
  { name: "Devices",     label: "Device Manager",    icon: "🔌", userTypes: ["PROSUMER"] },
  { name: "AIForecast",  label: "AI Forecasting",    icon: "🤖", userTypes: ["PROSUMER"] },
  { name: "AIChat",      label: "AI Assistant",      icon: "💬", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "Analytics",   label: "Energy Analytics",  icon: "📊", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "Billing",     label: "Billing",           icon: "💰", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "Trading",     label: "P2P Trading",       icon: "🔄", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "Fleet",       label: "Fleet Dashboard",   icon: "🏭", userTypes: ["PROSUMER"] },
  { name: "Alarms",      label: "Alarm Center",      icon: "🚨", userTypes: ["PROSUMER", "CONSUMER"] },
  { name: "Maintenance", label: "Maintenance",       icon: "🔧", userTypes: ["PROSUMER"] },
  { name: "Settings",    label: "Settings",          icon: "⚙️", userTypes: ["PROSUMER", "CONSUMER"] },
];

function ModeSelectorScreen({ onSelect, isDark }: { onSelect: (mode: 'PROSUMER' | 'CONSUMER') => void; isDark: boolean }) {
  const bg = isDark ? "#050810" : "#F1F5F9";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";

  return (
    <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", padding: 24 }}>
      <View style={{ marginBottom: 32, alignItems: "center" }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.3)" : "rgba(0,162,194,0.3)" }}>
          <Text style={{ fontSize: 32 }}>⚡</Text>
        </View>
        <Text style={{ color: textPrimary, fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 8 }}>Welcome to REOS</Text>
        <Text style={{ color: textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20, paddingHorizontal: 16 }}>
          Select how you would like to experience the AI-powered smart energy management platform.
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <TouchableOpacity
          onPress={() => onSelect('PROSUMER')}
          style={{
            backgroundColor: cardBg, borderRadius: 24, padding: 24,
            borderWidth: 1.5, borderColor: isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)",
            shadowColor: "#F59E0B", shadowOpacity: isDark ? 0.1 : 0.05, shadowRadius: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ fontSize: 22 }}>☀️</Text>
            </View>
            <View>
              <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "800" }}>Solar Owner / Engineer</Text>
              <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "700", marginTop: 2 }}>PROSUMER MODE</Text>
            </View>
          </View>
          <Text style={{ color: textSecondary, fontSize: 12, lineHeight: 18 }}>
            For users who own or manage solar power plants. Design energy assets, size batteries, coordinate safety breakers, monitor inverter production, and control power exports.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelect('CONSUMER')}
          style={{
            backgroundColor: cardBg, borderRadius: 24, padding: 24,
            borderWidth: 1.5, borderColor: isDark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.15)",
            shadowColor: accent, shadowOpacity: isDark ? 0.1 : 0.05, shadowRadius: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(0,212,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ fontSize: 22 }}>🏠</Text>
            </View>
            <View>
              <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "800" }}>Energy Consumer</Text>
              <Text style={{ color: accent, fontSize: 11, fontWeight: "700", marginTop: 2 }}>CONSUMER MODE</Text>
            </View>
          </View>
          <Text style={{ color: textSecondary, fontSize: 12, lineHeight: 18 }}>
            For microgrid customers. View live power consumption, track daily/monthly grid usage, monitor balances, purchase prepaid tokens, view billing invoices, and link with local suppliers.
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: textSecondary, fontSize: 11, textAlign: "center", marginTop: 32, letterSpacing: 0.5 }}>
        You can always switch your mode anytime inside the Profile Settings.
      </Text>
    </View>
  );
}

function CustomDrawerContent(props: any) {
  const { userRole, userType, user, theme, logout, alerts } = useStore();
  const isDark = theme === "dark";
  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const activeBg = isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.10)";
  const activeText = isDark ? "#00D4FF" : "#0284C7";
  const activeAlarms = alerts?.filter((a: any) => !a.acknowledged)?.length || 0;

  const currentRoute = props.state?.routeNames?.[props.state?.index] ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: border }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.1)", alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.3)" : "rgba(0,162,194,0.3)" }}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>
          <View>
            <Text style={{ color: activeText, fontSize: 18, fontWeight: "800", letterSpacing: 0.5 }}>REOS</Text>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "600", letterSpacing: 1.5 }}>AI ENERGY OS</Text>
          </View>
        </View>
        {user ? (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: textPrimary, fontWeight: "700", fontSize: 14 }}>{user.firstName} {user.lastName}</Text>
            <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>{user.email}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)", borderRadius: 6 }}>
                <Text style={{ color: activeText, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>{(userRole ?? "GUEST").replace(/_/g, " ")}</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.1)", borderRadius: 6 }}>
                <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>{userType}</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => logout()} style={{ backgroundColor: cardBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: border, alignItems: "center" }}>
            <Text style={{ color: activeText, fontWeight: "700", fontSize: 14 }}>🔑 Sign In to REOS</Text>
          </TouchableOpacity>
        )}
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingVertical: 12 }}>
        {NAV_ITEMS.filter(item => item.userTypes.includes(userType)).map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity key={item.name} onPress={() => props.navigation.navigate(item.name)}
              style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginVertical: 2, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: isActive ? activeBg : "transparent", borderWidth: isActive ? 1 : 0, borderColor: isActive ? (isDark ? "rgba(0,212,255,0.2)" : "rgba(0,162,194,0.2)") : "transparent" }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: isActive ? "700" : "500", color: isActive ? activeText : textSecondary }}>{item.label}</Text>
              {item.name === "Alarms" && activeAlarms > 0 && (
                <View style={{ backgroundColor: "#EF4444", borderRadius: 10, minWidth: 20, paddingHorizontal: 5, paddingVertical: 2, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>{activeAlarms}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: border }}>
        {user ? (
          <TouchableOpacity onPress={logout} style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.1)" }}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>🚪</Text>
            <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Sign Out</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={{ color: textSecondary, fontSize: 10, textAlign: "center", marginTop: 8, letterSpacing: 0.5 }}>REOS v2.0 • AI Smart Energy Platform</Text>
      </View>
    </View>
  );
}

function DrawerNavigator() {
  const { theme, alerts, toggleTheme, userType } = useStore();
  const isDark = theme === "dark";
  const activeAlarms = alerts?.filter((a: any) => !a.acknowledged)?.length || 0;

  const screensConfig = [
    { name: "Overview",    component: OverviewScreen,         title: "Dashboard",         userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "Monitoring",  component: MonitoringScreen,       title: "Live Monitoring",   userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "SolarDesign", component: SolarDesignScreen,      title: "Solar Design",      userTypes: ["PROSUMER"] },
    { name: "Devices",     component: DeviceManagementScreen,  title: "Device Manager",    userTypes: ["PROSUMER"] },
    { name: "AIForecast",  component: AIForecastingScreen,     title: "AI Forecasting",    userTypes: ["PROSUMER"] },
    { name: "AIChat",      component: AIChatScreen,           title: "AI Assistant",      userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "Analytics",   component: AnalyticsScreen,        title: "Energy Analytics",  userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "Billing",     component: BillingScreen,          title: "Billing",           userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "Trading",     component: TradingScreen,          title: "P2P Energy Trading", userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "Fleet",       component: FleetScreen,            title: "Fleet Dashboard",   userTypes: ["PROSUMER"] },
    { name: "Alarms",      component: AlarmScreen,            title: "Alarm Center",      userTypes: ["PROSUMER", "CONSUMER"] },
    { name: "Maintenance", component: MaintenanceScreen,      title: "Maintenance",       userTypes: ["PROSUMER"] },
    { name: "Settings",    component: SettingsScreen,         title: "Settings",          userTypes: ["PROSUMER", "CONSUMER"] },
  ];

  return (
    <Drawer.Navigator
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? "#0A0E1A" : "#FFFFFF" },
        headerTintColor: isDark ? "#F1F5F9" : "#0F172A",
        headerTitleStyle: { fontWeight: "700", fontSize: 16 },
        drawerStyle: { width: 285 },
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 10 }}>
            {activeAlarms > 0 && (
              <View style={{ position: "relative" }}>
                <Text style={{ fontSize: 20 }}>🚨</Text>
                <View style={{ position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, paddingHorizontal: 2, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>{activeAlarms}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity onPress={toggleTheme}>
              <Text style={{ fontSize: 20 }}>{isDark ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      {screensConfig.map((s) => (
        <Drawer.Screen key={s.name} name={s.name} component={s.component} options={{ title: s.title }} />
      ))}
    </Drawer.Navigator>
  );
}

export default function App() {
  const { fetchIotData, fetchUserProjects, fetchProfile, user, token, theme, isAuthenticated, hasSelectedMode, setUserType } = useStore();
  const isDark = theme === "dark";

  useEffect(() => {
    fetchIotData();
    if (isAuthenticated) {
      const loadData = async () => {
        if (!user && token && token !== 'guest-token') {
          await fetchProfile();
        }
        await fetchUserProjects();
        const state = useStore.getState();
        if (!state.currentProjectId) {
          const onlineProjects = state.projectsList.filter((p: any) => p.id && !p.id.startsWith('local-'));
          if (onlineProjects.length > 0) {
            state.loadProject(onlineProjects[0].id);
          }
        }
      };
      loadData();
    }
    const iv = setInterval(fetchIotData, 3000);
    return () => clearInterval(iv);
  }, [isAuthenticated, user, token]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0A0E1A" : "#FFFFFF"} />
      {!hasSelectedMode ? (
        <ModeSelectorScreen onSelect={(mode) => setUserType(mode)} isDark={isDark} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
              <Stack.Screen name="Main" component={DrawerNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </GestureHandlerRootView>
  );
}