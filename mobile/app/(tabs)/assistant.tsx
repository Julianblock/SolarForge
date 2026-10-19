import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { answerProjectQuestion, evaluateProject, exampleProject } from "@solarforge/shared";

const questions = [
  "How many panels do I need?",
  "What's the best azimuth for my roof?",
  "How big should my battery bank be?",
  "Why is my winter production lower?",
];

export default function AssistantScreen() {
  const project = exampleProject();
  const [answer, setAnswer] = useState("Answers use the example project until you save one on the web and open it there. This screen does not invent a measurement.");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Assistant</Text>
      {questions.map((question) => (
        <Pressable key={question} style={styles.button} onPress={() => setAnswer(answerProjectQuestion(question, project, evaluateProject(project)).answer)}>
          <Text style={styles.buttonText}>{question}</Text>
        </Pressable>
      ))}
      <Text style={styles.copy}>{answer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 20, gap: 10 },
  title: { color: "#e8eef8", fontSize: 28, fontWeight: "600" },
  button: { backgroundColor: "#122238", borderRadius: 12, padding: 14 },
  buttonText: { color: "#e8eef8" },
  copy: { color: "#f5b942", fontSize: 16 },
});
