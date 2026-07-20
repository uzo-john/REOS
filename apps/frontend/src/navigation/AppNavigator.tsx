import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { useStore } from "../store/useStore";

// ── Screens ────────────────────────────────────────────────────────────────
import ConsumerMeterRegistrationScreen from "../screens/ConsumerMeterRegistrationScreen";
import ProducerSetupWizardScreen from "../screens/ProducerSetupWizardScreen";
import OverviewScreen from "../screens/OverviewScreen";
import MonitoringScreen from "../screens/MonitoringScreen";
import SolarDesignScreen from "../screens/SolarDesignScreen";
import DeviceManagementScreen from "../screens/DeviceManagementScreen";
import AIForecastingScreen from "../screens/AIForecastingScreen";
import BillingScreen from "../screens/BillingScreen";
import TradingScreen from "../screens/TradingScreen";
import FleetScreen from "../screens/FleetScreen";
import AlarmScreen from "../screens/AlarmScreen";
import MaintenanceScreen from "../screens/MaintenanceScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import AIChatScreen from "../screens/AIChatScreen";
import SettingsScreen from "../screens/SettingsScreen";
import LoginScreen from "../screens/LoginScreen";
import AdminScreen from "../screens/AdminScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// ── Nav Items config ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: "Overview",    label: "Dashboard",         icon: "⚡", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "RegisterConsumerMeter", label: "Register Smart Meter", icon: "📟", userTypes: ["CONSUMER", "PROSUMER"] },
  { name: "ProducerSetupWizard", label: "Producer Setup Wizard", icon: "🏭", userTypes: ["PROSUMER", "ADMIN"] },
  { name: "Monitoring",  label: "Live Monitoring",   icon: "📡", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "SolarDesign", label: "Solar Design",      icon: "☀️", userTypes: ["PROSUMER"] },
  { name: "Devices",     label: "Device Manager",    icon: "🔌", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "AIForecast",  label: "AI Forecasting",    icon: "🤖", userTypes: ["PROSUMER"] },
  { name: "AIChat",      label: "AI Assistant",      icon: "💬", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "Analytics",   label: "Energy Analytics",  icon: "📊", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "Billing",     label: "Billing",           icon: "💰", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "Trading",     label: "P2P Trading",       icon: "🔄", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "Admin",       label: "Admin Finance",     icon: "🏛️", userTypes: ["ADMIN"] },
  { name: "Fleet",       label: "Fleet Dashboard",   icon: "🏗️", userTypes: ["PROSUMER"] },
  { name: "Alarms",      label: "Alarm Center",      icon: "🚨", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  { name: "Maintenance", label: "Maintenance",       icon: "🔧", userTypes: ["PROSUMER", "ADMIN"] },
  { name: "Settings",    label: "Settings",          icon: "⚙️", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
];

function CustomDrawerContent(props: any) {
  const { userRole, userType, user, theme, logout, alerts } = useStore();
  const isDark = theme === "dark";
  const activeAlarms = alerts?.filter((a: any) => !a.acknowledged)?.length || 0;

  const bg = isDark ? "#0A0E1A" : "#F8FAFC";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const activeBg = isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.10)";
  const activeText = isDark ? "#00D4FF" : "#0284C7";

  const currentRoute = props.state?.routeNames?.[props.state?.index] ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: border }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: isDark ? "rgba(0,212,255,0.15)" : "rgba(0,162,194,0.1)",
            alignItems: "center", justifyContent: "center", marginRight: 12,
            borderWidth: 1, borderColor: isDark ? "rgba(0,212,255,0.3)" : "rgba(0,162,194,0.3)",
          }}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>
          <View>
            <Text style={{ color: activeText, fontSize: 18, fontWeight: "800", letterSpacing: 0.5 }}>REOS</Text>
            <Text style={{ color: textSecondary, fontSize: 10, fontWeight: "600", letterSpacing: 1.5 }}>
              ENERGY OS
            </Text>
          </View>
        </View>
        {user && (
          <View style={{
            backgroundColor: cardBg, borderRadius: 12, padding: 12,
            borderWidth: 1, borderColor: border,
          }}>
            <Text style={{ color: textPrimary, fontWeight: "700", fontSize: 14 }}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>{user.email}</Text>
            <View style={{
              marginTop: 8, paddingHorizontal: 8, paddingVertical: 3,
              backgroundColor: isDark ? "rgba(0,212,255,0.12)" : "rgba(0,162,194,0.1)",
              borderRadius: 6, alignSelf: "flex-start",
            }}>
              <Text style={{ color: activeText, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                {userRole?.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Nav Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingVertical: 12 }} scrollIndicatorInsets={{ right: 1 }}>
        {NAV_ITEMS.filter(item => item.userTypes.includes(userType)).map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => props.navigation.navigate(item.name)}
              style={{
                flexDirection: "row", alignItems: "center",
                marginHorizontal: 12, marginVertical: 2,
                paddingHorizontal: 14, paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isActive ? activeBg : "transparent",
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? (isDark ? "rgba(0,212,255,0.2)" : "rgba(0,162,194,0.2)") : "transparent",
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
              <Text style={{
                flex: 1, fontSize: 14, fontWeight: isActive ? "700" : "500",
                color: isActive ? activeText : textSecondary,
              }}>
                {item.label}
              </Text>
              {item.name === "Alarms" && activeAlarms > 0 && (
                <View style={{ backgroundColor: "#EF4444", borderRadius: 10, minWidth: 20, paddingHorizontal: 5, paddingVertical: 2, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>{activeAlarms}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: border }}>
        {user ? (
          <TouchableOpacity
            onPress={() => logout()}
            style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.1)" }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>🚪</Text>
            <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => props.navigation.navigate("Login")}
            style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: "rgba(0,212,255,0.1)" }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>🔑</Text>
            <Text style={{ color: activeText, fontWeight: "700", fontSize: 14 }}>Sign In</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: textSecondary, fontSize: 10, textAlign: "center", marginTop: 8, letterSpacing: 0.5 }}>
          REOS v2.0 • AI Energy OS
        </Text>
      </View>
    </View>
  );
}

function DrawerNavigator() {
  const { theme, userType } = useStore();
  const isDark = theme === "dark";

  const screensConfig = [
    { name: "Overview",    component: OverviewScreen,         title: "Dashboard",         userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "RegisterConsumerMeter", component: ConsumerMeterRegistrationScreen, title: "Register Smart Meter", userTypes: ["CONSUMER", "PROSUMER"] },
    { name: "ProducerSetupWizard", component: ProducerSetupWizardScreen, title: "Producer Setup Wizard", userTypes: ["PROSUMER", "ADMIN"] },
    { name: "Monitoring",  component: MonitoringScreen,       title: "Live Monitoring",   userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "SolarDesign", component: SolarDesignScreen,      title: "Solar Design",      userTypes: ["PROSUMER"] },
    { name: "Devices",     component: DeviceManagementScreen,  title: "Device Manager",    userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "AIForecast",  component: AIForecastingScreen,     title: "AI Forecasting",    userTypes: ["PROSUMER"] },
    { name: "AIChat",      component: AIChatScreen,           title: "AI Assistant",      userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "Analytics",   component: AnalyticsScreen,        title: "Energy Analytics",  userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "Billing",     component: BillingScreen,          title: "Billing",           userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "Trading",     component: TradingScreen,          title: "P2P Energy Trading", userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "Admin",       component: AdminScreen,            title: "Admin Finance Centre", userTypes: ["ADMIN"] },
    { name: "Fleet",       component: FleetScreen,            title: "Fleet Dashboard",   userTypes: ["PROSUMER"] },
    { name: "Alarms",      component: AlarmScreen,            title: "Alarm Center",      userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
    { name: "Maintenance", component: MaintenanceScreen,      title: "Maintenance",       userTypes: ["PROSUMER", "ADMIN"] },
    { name: "Settings",    component: SettingsScreen,         title: "Settings",          userTypes: ["PROSUMER", "CONSUMER", "ADMIN"] },
  ];

  return (
    <Drawer.Navigator
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? "#0A0E1A" : "#FFFFFF" },
        headerTintColor: isDark ? "#F1F5F9" : "#0F172A",
        headerTitleStyle: { fontWeight: "700", fontSize: 16 },
        drawerStyle: { width: 280 },
        headerRight: () => <HeaderActions />,
        headerStatusBarHeight: 0,
      }}
    >
      {screensConfig.map((s) => (
        <Drawer.Screen key={s.name} name={s.name} component={s.component} options={{ title: s.title }} />
      ))}
    </Drawer.Navigator>
  );
}

function HeaderActions() {
  const { theme, toggleTheme, alerts, notifications } = useStore();
  const activeAlarms = alerts?.filter((a: any) => !a.acknowledged)?.length || 0;
  const unreadNotifs = notifications?.filter((n: any) => !n.read)?.length || 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 12, gap: 8 }}>
      {activeAlarms > 0 && (
        <View style={{ position: "relative" }}>
          <Text style={{ fontSize: 20 }}>🚨</Text>
          <View style={{ position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, paddingHorizontal: 3, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>{activeAlarms}</Text>
          </View>
        </View>
      )}
      <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
        <Text style={{ fontSize: 20 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}