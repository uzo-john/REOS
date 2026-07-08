import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from "react-native";
import { useStore } from "../store/useStore";

export default function LoginScreen({ navigation }: any) {
  const { login, register, theme, isAuthenticated } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDark = theme === "dark";

  React.useEffect(() => {
    if (isAuthenticated) navigation.replace("Main");
  }, [isAuthenticated]);

  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";
  const accent = "#00D4FF";

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all required fields."); return; }
    setLoading(true); setError("");
    try {
      if (isRegister) {
        if (!firstName || !lastName) { setError("Please enter your full name."); setLoading(false); return; }
        await register({ email, password, firstName, lastName });
      } else {
        await login({ email, password });
      }
      navigation.replace("Main");
    } catch (e: any) {
      setError(e.message || "Authentication failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: "rgba(0,212,255,0.12)", alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: "rgba(0,212,255,0.3)", marginBottom: 16,
          }}>
            <Text style={{ fontSize: 40 }}>⚡</Text>
          </View>
          <Text style={{ color: accent, fontSize: 30, fontWeight: "900", letterSpacing: 1 }}>REOS</Text>
          <Text style={{ color: sub, fontSize: 12, fontWeight: "600", letterSpacing: 2.5, marginTop: 4 }}>
            RENEWABLE ENERGY OS
          </Text>
          <Text style={{ color: sub, fontSize: 13, marginTop: 12, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
            AI-powered smart energy management for solar, storage, and smart grids
          </Text>
        </View>

        {/* Card */}
        <View style={{ backgroundColor: card, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: border, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
          <Text style={{ color: text, fontSize: 22, fontWeight: "800", marginBottom: 6 }}>
            {isRegister ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={{ color: sub, fontSize: 13, marginBottom: 24 }}>
            {isRegister ? "Join the REOS energy platform" : "Sign in to your energy dashboard"}
          </Text>

          {isRegister && (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>First Name</Text>
                <TextInput style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 14, color: text, fontSize: 14 }}
                  value={firstName} onChangeText={setFirstName} placeholder="John" placeholderTextColor={sub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Last Name</Text>
                <TextInput style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 14, color: text, fontSize: 14 }}
                  value={lastName} onChangeText={setLastName} placeholder="Doe" placeholderTextColor={sub} />
              </View>
            </View>
          )}

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Email Address</Text>
            <TextInput style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 14, color: text, fontSize: 14 }}
              value={email} onChangeText={setEmail} placeholder="engineer@reos.io"
              placeholderTextColor={sub} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: sub, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Password</Text>
            <TextInput style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 14, color: text, fontSize: 14 }}
              value={password} onChangeText={setPassword} placeholder="••••••••"
              placeholderTextColor={sub} secureTextEntry />
          </View>

          {error ? (
            <View style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}>
              <Text style={{ color: "#EF4444", fontSize: 13 }}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit} disabled={loading}
            style={{ backgroundColor: accent, borderRadius: 14, padding: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <ActivityIndicator color="#000" size="small" style={{ marginRight: 8 }} /> : null}
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "800" }}>
              {loading ? "Connecting..." : isRegister ? "Create Account" : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: accent, fontSize: 14 }}>
              {isRegister ? "Already have an account? Sign In" : "New to REOS? Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo access */}
        <TouchableOpacity
          onPress={() => navigation.replace("Main")}
          style={{ marginTop: 20, alignItems: "center", padding: 12 }}
        >
          <Text style={{ color: sub, fontSize: 13 }}>🔍 Continue as Guest (Demo Mode)</Text>
        </TouchableOpacity>

        <Text style={{ color: sub, fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 18 }}>
          Enterprise-grade security • TLS encrypted • RBAC protected{"\n"}REOS AI Smart Energy Platform v2.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}