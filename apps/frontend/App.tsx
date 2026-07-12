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
  { name: "Overview",    label: "Dashboard",         icon: "⚡" },
  { name: "Monitoring",  label: "Live Monitoring",   icon: "📡" },
  { name: "SolarDesign", label: "Solar Design",      icon: "☀️" },
  { name: "Devices",     label: "Device Manager",    icon: "🔌" },
  { name: "AIForecast",  label: "AI Forecasting",    icon: "🤖" },
  { name: "AIChat",      label: "AI Assistant",      icon: "💬" },
  { name: "Analytics",   label: "Energy Analytics",  icon: "📊" },
  { name: "Billing",     label: "Billing",           icon: "💰" },
  { name: "Trading",     label: "P2P Trading",       icon: "🔄" },
  { name: "Fleet",       label: "Fleet Dashboard",   icon: "🏭" },
  { name: "Alarms",      label: "Alarm Center",      icon: "🚨" },
  { name: "Maintenance", label: "Maintenance",       icon: "🔧" },
  { name: "Settings",    label: "Settings",          icon: "⚙️" },
];

function CustomDrawerContent(props: any) {
  const { userRole, user, theme, logout, alerts } = useStore();
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
          <View style={{ gap: 10 }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: border }}>
              <Text style={{ color: textPrimary, fontWeight: "700", fontSize: 14 }}>{user.firstName} {user.lastName}</Text>
              <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>{user.email}</Text>
              <View style={{ marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)", borderRadius: 6, alignSelf: "flex-start" }}>
                <Text style={{ color: activeText, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>{(userRole ?? "GUEST").replace(/_/g, " ")}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => logout()} style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", alignItems: "center" }}>
              <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>🚪 Sign Out of REOS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => logout()} style={{ backgroundColor: cardBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: border, alignItems: "center" }}>
            <Text style={{ color: activeText, fontWeight: "700", fontSize: 14 }}>🔑 Sign In to REOS</Text>
          </TouchableOpacity>
        )}
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingVertical: 12 }}>
        {NAV_ITEMS.map((item) => {
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
  const { theme, alerts, toggleTheme } = useStore();
  const isDark = theme === "dark";
  const activeAlarms = alerts?.filter((a: any) => !a.acknowledged)?.length || 0;

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
      <Drawer.Screen name="Overview"    component={OverviewScreen}          options={{ title: "Dashboard" }} />
      <Drawer.Screen name="Monitoring"  component={MonitoringScreen}        options={{ title: "Live Monitoring" }} />
      <Drawer.Screen name="SolarDesign" component={SolarDesignScreen}       options={{ title: "Solar Design Engine" }} />
      <Drawer.Screen name="Devices"     component={DeviceManagementScreen}  options={{ title: "Device Manager" }} />
      <Drawer.Screen name="AIForecast"  component={AIForecastingScreen}     options={{ title: "AI Forecasting" }} />
      <Drawer.Screen name="AIChat"      component={AIChatScreen}            options={{ title: "AI Assistant" }} />
      <Drawer.Screen name="Analytics"   component={AnalyticsScreen}         options={{ title: "Energy Analytics" }} />
      <Drawer.Screen name="Billing"     component={BillingScreen}           options={{ title: "Billing" }} />
      <Drawer.Screen name="Trading"     component={TradingScreen}           options={{ title: "P2P Trading" }} />
      <Drawer.Screen name="Fleet"       component={FleetScreen}             options={{ title: "Fleet Dashboard" }} />
      <Drawer.Screen name="Alarms"      component={AlarmScreen}             options={{ title: "Alarm Center" }} />
      <Drawer.Screen name="Maintenance" component={MaintenanceScreen}       options={{ title: "Maintenance" }} />
      <Drawer.Screen name="Settings"    component={SettingsScreen}          options={{ title: "Settings" }} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const { fetchIotData, fetchUserProjects, loadProject, currentProjectId, projectsList, theme, isAuthenticated } = useStore();
  const isDark = theme === "dark";

  useEffect(() => {
    fetchIotData();
    if (isAuthenticated) {
      fetchUserProjects().then(() => {
        // Auto-load the first online project if not already set
        const state = useStore.getState();
        if (!state.currentProjectId) {
          const onlineProjects = state.projectsList.filter((p: any) => p.id && !p.id.startsWith('local-'));
          if (onlineProjects.length > 0) {
            state.loadProject(onlineProjects[0].id);
          }
        }
      });
    }
    const iv = setInterval(fetchIotData, 3000);
    return () => clearInterval(iv);
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0A0E1A" : "#FFFFFF"} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Main" component={DrawerNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}