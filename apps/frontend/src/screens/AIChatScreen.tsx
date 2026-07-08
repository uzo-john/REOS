import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useStore } from "../store/useStore";
import { aiChat, fetchAIInsights } from "../services/aiService";

interface Message { id: string; role: "user" | "assistant"; content: string; timestamp: string; }

const QUICK_PROMPTS = [
  "Analyze my current solar performance",
  "How can I optimize my battery usage?",
  "What are my savings this month?",
  "Forecast tomorrow's generation",
  "Explain my latest alarm",
  "Recommend P2P trading opportunities",
];

export default function AIChatScreen() {
  const { theme, telemetry, results, alerts } = useStore();
  const isDark = theme === "dark";
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "assistant", content: "👋 Hello! I am your **REOS AI Energy Assistant** powered by a real LLM.\n\nI can help you:\n• 📊 Analyze solar & battery performance\n• 💡 Optimize energy consumption\n• 💰 Maximize P2P trading revenue\n• ⚠️ Interpret alarms & faults\n• 🔮 Forecast generation & demand\n\nWhat would you like to explore today?", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const bg = isDark ? "#050810" : "#F1F5F9";
  const card = isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#F1F5F9" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const accent = "#00D4FF";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC";

  useEffect(() => {
    fetchAIInsights().then(setInsights).catch(() => {});
  }, []);

  const buildSystemPrompt = () => `You are REOS AI, an intelligent energy management assistant for the REOS platform (Renewable Energy Operating System).
Current plant data:
- Solar output: ${telemetry?.inverter?.powerKw?.toFixed(1) ?? "2.4"} kW
- Battery SoC: ${telemetry?.battery?.socPercent?.toFixed(0) ?? "78"}%
- Grid flow: ${telemetry?.smartMeter?.activePowerKw?.toFixed(1) ?? "0.8"} kW (positive = export)
- Active alarms: ${alerts?.filter((a: any) => !a.acknowledged)?.length ?? 0}
- Currency: NGN (Nigerian Naira)
Respond concisely, be specific with numbers, and always provide actionable recommendations.`;

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || loading) return;
    setInput("");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await aiChat(history, buildSystemPrompt());
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "⚠️ Unable to reach AI backend. Please check your API key in `.env` (GEMINI_API_KEY or OPENAI_API_KEY) and ensure the backend server is running.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const impactColor = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981" };
  const insightIcon = { SAVING: "💰", ANOMALY: "⚠️", MAINTENANCE: "🔧", OPTIMIZATION: "⚡", FORECAST: "🔮" };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
      {/* AI Insights Strip */}
      {insights.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {insights.map((ins) => (
            <TouchableOpacity key={ins.id} onPress={() => sendMessage(ins.title)}
              style={{ backgroundColor: card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: `${(impactColor as any)[ins.impact] ?? "#64748B"}30`, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 200 }}>
              <Text style={{ fontSize: 18 }}>{(insightIcon as any)[ins.type] ?? "💡"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>{ins.title}</Text>
                {ins.savings && <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "600" }}>Save ₦{ins.savings.toLocaleString()}</Text>}
              </View>
              <View style={{ backgroundColor: `${(impactColor as any)[ins.impact] ?? "#64748B"}20`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: (impactColor as any)[ins.impact] ?? "#64748B", fontSize: 10, fontWeight: "700" }}>{ins.impact}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <View key={msg.id} style={{ marginBottom: 16, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: "rgba(0,212,255,0.15)", alignItems: "center", justifyContent: "center", marginRight: 6 }}>
                  <Text style={{ fontSize: 12 }}>🤖</Text>
                </View>
                <Text style={{ color: accent, fontSize: 11, fontWeight: "700" }}>REOS AI</Text>
              </View>
            )}
            <View style={{
              maxWidth: "85%", borderRadius: msg.role === "user" ? 20 : 20, padding: 14,
              backgroundColor: msg.role === "user" ? accent : card,
              borderWidth: 1,
              borderColor: msg.role === "user" ? "transparent" : border,
              borderBottomRightRadius: msg.role === "user" ? 4 : 20,
              borderBottomLeftRadius: msg.role === "user" ? 20 : 4,
            }}>
              <Text style={{ color: msg.role === "user" ? "#000" : text, fontSize: 14, lineHeight: 22 }}>{msg.content}</Text>
              <Text style={{ color: msg.role === "user" ? "rgba(0,0,0,0.5)" : sub, fontSize: 10, marginTop: 6, textAlign: "right" }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={{ alignItems: "flex-start", marginBottom: 16 }}>
            <View style={{ backgroundColor: card, borderRadius: 20, borderBottomLeftRadius: 4, padding: 16, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: border }}>
              <ActivityIndicator size="small" color={accent} />
              <Text style={{ color: sub, fontSize: 13 }}>REOS AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {QUICK_PROMPTS.map((p) => (
          <TouchableOpacity key={p} onPress={() => sendMessage(p)}
            style={{ backgroundColor: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,162,194,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "600" }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 12, paddingBottom: Platform.OS === "ios" ? 20 : 12, borderTopWidth: 1, borderTopColor: border, backgroundColor: card, gap: 10 }}>
        <TextInput
          style={{ flex: 1, backgroundColor: inputBg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, color: text, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: border }}
          value={input} onChangeText={setInput} placeholder="Ask REOS AI anything about your energy..."
          placeholderTextColor={sub} multiline returnKeyType="send" onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: (!input.trim() || loading) ? `${accent}50` : accent, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}