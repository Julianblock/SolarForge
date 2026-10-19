import { useRef, useState, type ComponentRef } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { answerProjectQuestion } from "@solarforge/shared";
import { ThemeToggle, tap } from "@/components/ui";
import { gradients, onPhoto, photos, radius, type ThemeColors } from "@/constants/theme";
import { useProject } from "@/lib/ProjectContext";
import { useStyles, useTheme } from "@/lib/ThemeContext";

const SUGGESTIONS = [
  { title: "How many panels", detail: "do I need for my home?", question: "How many panels do I need?" },
  { title: "Best direction", detail: "for my roof to face", question: "What's the best azimuth for my roof?" },
  { title: "Battery size", detail: "for a night without the grid", question: "How big should my battery bank be?" },
  { title: "Winter output", detail: "why it drops in December", question: "Why is my winter production lower?" },
];

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { project, results } = useProject();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const nextId = useRef(0);

  function ask(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    tap();
    setDraft("");
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text }]);
    setThinking(true);
    setTimeout(() => {
      const answer = results
        ? answerProjectQuestion(text, project, results).answer
        : "Your design has a value the engine can’t use yet. Fix it on the Design tab and ask again.";
      setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: answer }]);
      setThinking(false);
    }, 450);
  }

  const empty = messages.length === 0;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <LinearGradient colors={gradients.sun} style={styles.headerOrb}>
          <SymbolView name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }} tintColor={onPhoto.onSun} size={16} />
        </LinearGradient>
        <Text style={styles.headerTitle}>SolarForge Assistant</Text>
        <ThemeToggle style={styles.headerToggle} />
      </View>

      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.thread, empty && { flexGrow: 1, justifyContent: "flex-end" }]}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {empty ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeImage}>
              <Image source={{ uri: photos.blueSkyField }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
              <LinearGradient colors={["rgba(5,7,13,0)", "rgba(5,7,13,0.9)"]} style={StyleSheet.absoluteFill} />
              <Text style={styles.welcomeTitle}>What would you like to know?</Text>
            </View>
            <Text style={styles.welcomeCopy}>Answers come from your design and the calculation engine. Nothing is made up.</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s.title} onPress={() => ask(s.question)} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.suggestionTitle}>{s.title}</Text>
                  <Text style={styles.suggestionDetail}>{s.detail}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <View key={m.id} style={styles.userBubble}>
                <Text style={styles.userText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={styles.assistantRow}>
                <LinearGradient colors={gradients.sun} style={styles.avatar}>
                  <SymbolView name={{ ios: "sun.max.fill", android: "wb_sunny", web: "wb_sunny" }} tintColor={onPhoto.onSun} size={13} />
                </LinearGradient>
                <Text style={styles.assistantText}>{m.text}</Text>
              </View>
            ),
          )
        )}
        {thinking ? (
          <View style={styles.assistantRow}>
            <LinearGradient colors={gradients.sun} style={styles.avatar}>
              <SymbolView name={{ ios: "sun.max.fill", android: "wb_sunny", web: "wb_sunny" }} tintColor={onPhoto.onSun} size={13} />
            </LinearGradient>
            <Text style={[styles.assistantText, { color: colors.textMuted }]}>Thinking…</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.composerWrap}>
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about your solar design"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={() => ask(draft)}
            returnKeyType="send"
            multiline
            submitBehavior="submit"
          />
          <Pressable onPress={() => ask(draft)} disabled={!draft.trim()} style={[styles.send, !draft.trim() && { opacity: 0.35 }]}>
            <SymbolView name={{ ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }} tintColor={colors.bg} size={16} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    headerOrb: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    headerToggle: { position: "absolute", left: 16, bottom: 6 },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: "700" },
    thread: { padding: 20, gap: 18 },
    welcome: { gap: 14 },
    welcomeImage: { height: 200, borderRadius: radius.lg, overflow: "hidden", justifyContent: "flex-end", padding: 18 },
    welcomeTitle: { color: onPhoto.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
    welcomeCopy: { color: c.textMuted, fontSize: 15, lineHeight: 21 },
    suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    suggestion: {
      flexBasis: "47%",
      flexGrow: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 14,
      gap: 2,
    },
    suggestionTitle: { color: c.text, fontSize: 15, fontWeight: "700" },
    suggestionDetail: { color: c.textMuted, fontSize: 13 },
    userBubble: { alignSelf: "flex-end", maxWidth: "82%", backgroundColor: c.surfaceRaised, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11 },
    userText: { color: c.text, fontSize: 16, lineHeight: 22 },
    assistantRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    avatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 1 },
    assistantText: { flex: 1, color: c.text, fontSize: 16, lineHeight: 24 },
    composerWrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 96 },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: c.surface,
      borderRadius: 26,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.14)",
      paddingLeft: 18,
      paddingRight: 6,
      paddingVertical: 6,
    },
    composerInput: { flex: 1, color: c.text, fontSize: 16, maxHeight: 120, paddingTop: 9, paddingBottom: 9 },
    send: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.text, alignItems: "center", justifyContent: "center" },
  });
