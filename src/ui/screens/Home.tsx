import React from "react";
import { View, Text, Pressable } from "react-native";
import { Mode } from "../../types";

export function HomeScreen(props: {
  onStart: (mode: Mode) => void;
  onRanking: () => void;
  wordCount: number;
}) {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8, color: "white" }}>
        Flashcard Deutsch
      </Text>
      <Text style={{ color: "#bbb", marginBottom: 16 }}>
        Seed carregado: {props.wordCount} palavras
      </Text>

      <Pressable
        onPress={() => props.onStart("MC_DE_TO_GLOSS")}
        style={{ backgroundColor: "#2a2a2a", padding: 16, borderRadius: 14 }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Start — Múltipla escolha (DE → gloss)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => props.onStart("TYPE_GLOSS_TO_DE")}
        style={{ backgroundColor: "#2a2a2a", padding: 16, borderRadius: 14 }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Start — Digitar (gloss → DE)
        </Text>
      </Pressable>

      <Pressable
        onPress={props.onRanking}
        style={{ backgroundColor: "#1f1f1f", padding: 14, borderRadius: 14, marginTop: 8 }}
      >
        <Text style={{ color: "#ddd", fontSize: 15, fontWeight: "600" }}>Ver Ranking</Text>
      </Pressable>
    </View>
  );
}
