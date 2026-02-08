import React, { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { RunState } from "../../domain/gameEngine";
import { speakDe } from "../../services/tts";

export function GameScreen(props: {
  run: RunState;
  onAnswerMc: (id: number) => void;
  onAnswerType: (text: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
  onFinish: () => void;
}) {
  const { run } = props;
  const card = run.card;
  const [typed, setTyped] = useState("");

  const progressText = useMemo(() => {
    return `${Math.min(run.index + 1, run.runSize)}/${run.runSize}`;
  }, [run.index, run.runSize]);

  if (!card) return null;

  const canAdvance = run.feedback !== null;
  const finished = run.index >= run.runSize - 1 && canAdvance;

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#bbb" }}>{progressText}</Text>
        <Text style={{ color: "#bbb" }}>
          Score: {run.score} | Streak: {run.streak} | Skip: {run.remainingSkips}
        </Text>
      </View>

      <Pressable
        onPress={() => speakDe(card.promptTtsDe)}
        style={{
          alignSelf: "flex-start",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: "#1f1f1f",
        }}
      >
        <Text style={{ color: "#ddd", fontWeight: "700" }}>🔊 Ouvir</Text>
      </Pressable>

      {card.kind === "MC" ? (
        <>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginTop: 8 }}>
            {card.promptDe}
          </Text>
          <Text style={{ color: "#bbb" }}>Escolha o significado</Text>

          <View style={{ gap: 10, marginTop: 12 }}>
            {card.options.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => props.onAnswerMc(o.id)}
                disabled={canAdvance}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#2a2a2a",
                  opacity: canAdvance ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>{o.label}</Text>
              </Pressable>
            ))}
          </View>

          {card.correctWord.exampleDe ? (
            <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: "#1f1f1f" }}>
              <Text style={{ color: "#bbb", fontSize: 12, marginBottom: 6 }}>Example</Text>
              <Text style={{ color: "white", fontSize: 14 }}>{card.correctWord.exampleDe}</Text>
              {card.correctWord.exampleGloss ? (
                <Text style={{ color: "#aaa", fontSize: 13, marginTop: 6 }}>
                  {card.correctWord.exampleGloss}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginTop: 8 }}>
            {card.promptGloss}
          </Text>
          <Text style={{ color: "#bbb" }}>Digite em alemão</Text>

          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!canAdvance}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="ex: die Zeit"
            placeholderTextColor="#666"
            style={{
              marginTop: 12,
              backgroundColor: "#1f1f1f",
              color: "white",
              padding: 14,
              borderRadius: 14,
              fontSize: 16,
            }}
          />

          <Pressable
            onPress={() => props.onAnswerType(typed)}
            disabled={canAdvance || typed.trim().length === 0}
            style={{
              marginTop: 10,
              backgroundColor: "#2a2a2a",
              padding: 14,
              borderRadius: 14,
              opacity: canAdvance || typed.trim().length === 0 ? 0.5 : 1,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>
              Confirmar
            </Text>
          </Pressable>
        </>
      )}

      {run.feedback ? (
        <View
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 14,
            backgroundColor: run.feedback.ok ? "#123b1a" : "#3b1212",
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            {run.feedback.ok ? "✅ Correto" : "❌ Errado"}
          </Text>
          {!run.feedback.ok ? (
            <Text style={{ color: "#eee", marginTop: 6 }}>Certo: {run.feedback.correct}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: "auto" }}>
        <Pressable
          onPress={props.onExit}
          style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#1a1a1a" }}
        >
          <Text style={{ color: "#ddd", textAlign: "center", fontWeight: "700" }}>Sair</Text>
        </Pressable>

        <Pressable
          onPress={props.onSkip}
          disabled={run.remainingSkips <= 0 || canAdvance}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "#1f1f1f",
            opacity: run.remainingSkips <= 0 || canAdvance ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#ddd", textAlign: "center", fontWeight: "700" }}>Pular</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (finished) props.onFinish();
            else {
              props.onNext();
              setTyped("");
            }
          }}
          disabled={!canAdvance}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "#2a2a2a",
            opacity: canAdvance ? 1 : 0.5,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>
            {finished ? "Finalizar" : "Próxima"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
