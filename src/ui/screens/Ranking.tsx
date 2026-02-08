import React from "react";
import { View, Text, Pressable } from "react-native";
import { ScoreRow } from "../../types";

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString().slice(0, 5)}`;
}

export function RankingScreen(props: { scores: ScoreRow[]; onBack: () => void }) {
  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>Ranking</Text>
      <Text style={{ color: "#bbb" }}>Top 20 (local)</Text>

      <View style={{ marginTop: 10, gap: 10 }}>
        {props.scores.map((s, idx) => (
          <View
            key={s.id}
            style={{ padding: 12, borderRadius: 14, backgroundColor: "#1f1f1f" }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>
              #{idx + 1} — {s.points} pts
            </Text>
            <Text style={{ color: "#bbb" }}>
              {s.mode} • {fmt(s.timestamp)}
            </Text>
          </View>
        ))}
        {props.scores.length === 0 ? (
          <Text style={{ color: "#bbb" }}>Sem scores ainda.</Text>
        ) : null}
      </View>

      <Pressable
        onPress={props.onBack}
        style={{ marginTop: "auto", padding: 14, borderRadius: 14, backgroundColor: "#2a2a2a" }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Voltar</Text>
      </Pressable>
    </View>
  );
}
