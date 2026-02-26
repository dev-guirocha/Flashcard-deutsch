import React from "react";
import { View, Text, Pressable } from "react-native";
import { Mode } from "../../types";

export function HomeScreen(props: {
  onStart: (mode: Mode) => void;
  onReviewDue: (mode: Mode) => void;
  onStartNouns: (mode: Mode) => void;
  onReviewDueNouns: (mode: Mode) => void;
  onRanking: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportData: () => void;
  onInstallStarterDeck: () => void;
  wordCount: number;
  articleTrainableCount: number;
  dueCount: number;
  trackedCount: number;
  masteredCount: number;
  newCount: number;
}) {
  const hasArticleModeData = props.articleTrainableCount > 0;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8, color: "white" }}>
        Flashcard Deutsch
      </Text>
      <Text style={{ color: "#bbb", marginBottom: 16 }}>
        Seed carregado: {props.wordCount} palavras
      </Text>
      <Text style={{ color: "#bbb" }}>
        Revisões vencidas: {props.dueCount} | Dominadas: {props.masteredCount}
      </Text>
      <Text style={{ color: "#888", marginBottom: 12 }}>
        Acompanhadas: {props.trackedCount} | Novas: {props.newCount}
      </Text>
      <Text style={{ color: "#888", marginBottom: 12 }}>
        Só artigos disponíveis: {props.articleTrainableCount}
      </Text>
      {!hasArticleModeData ? (
        <Pressable
          onPress={props.onInstallStarterDeck}
          accessibilityRole="button"
          accessibilityLabel="Instalar deck mínimo de artigos"
          accessibilityHint="Substitui o deck atual por um deck inicial de artigos"
          style={{ backgroundColor: "#7a3a14", padding: 16, borderRadius: 14, marginBottom: 6 }}
        >
          <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
            Instalar deck mínimo de artigos (A1)
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => props.onStart("MC_DE_TO_GLOSS")}
        accessibilityRole="button"
        accessibilityLabel="Iniciar treino de múltipla escolha"
        accessibilityHint="Inicia uma sessão nova de múltipla escolha"
        style={{ backgroundColor: "#2a2a2a", padding: 16, borderRadius: 14 }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Start — Múltipla escolha (DE → gloss)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => props.onStart("TYPE_GLOSS_TO_DE")}
        accessibilityRole="button"
        accessibilityLabel="Iniciar treino de escrita"
        accessibilityHint="Inicia uma sessão nova para digitar as respostas em alemão"
        style={{ backgroundColor: "#2a2a2a", padding: 16, borderRadius: 14 }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Start — Digitar (gloss → DE)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => props.onStartNouns("MC_DE_TO_GLOSS")}
        disabled={!hasArticleModeData}
        accessibilityRole="button"
        accessibilityLabel="Iniciar modo só artigos"
        accessibilityHint="Inicia treino somente com substantivos para praticar der, die e das"
        accessibilityState={{ disabled: !hasArticleModeData }}
        style={{
          backgroundColor: "#2a2a2a",
          padding: 16,
          borderRadius: 14,
          opacity: hasArticleModeData ? 1 : 0.5,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Start — Só artigos (NOUN)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => props.onStartNouns("TYPE_GLOSS_TO_DE")}
        disabled={!hasArticleModeData}
        accessibilityRole="button"
        accessibilityLabel="Iniciar modo só artigos para digitar"
        accessibilityHint="Inicia treino de escrita somente com palavras de artigos"
        accessibilityState={{ disabled: !hasArticleModeData }}
        style={{ backgroundColor: "#2a2a2a", padding: 16, borderRadius: 14, opacity: hasArticleModeData ? 1 : 0.5 }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Start — Só artigos (digitar)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => props.onReviewDue("MC_DE_TO_GLOSS")}
        accessibilityRole="button"
        accessibilityLabel="Revisar palavras vencidas"
        accessibilityHint="Prioriza cartões que já estão no momento de revisão"
        style={{
          backgroundColor: props.dueCount > 0 ? "#0f5132" : "#2d2d2d",
          padding: 16,
          borderRadius: 14,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
          Revisar vencidos ({props.dueCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => props.onReviewDueNouns("MC_DE_TO_GLOSS")}
        disabled={!hasArticleModeData}
        accessibilityRole="button"
        accessibilityLabel="Revisar vencidos no modo só artigos"
        accessibilityHint="Prioriza revisões vencidas somente de substantivos"
        accessibilityState={{ disabled: !hasArticleModeData }}
        style={{
          backgroundColor: "#2d2d2d",
          padding: 16,
          borderRadius: 14,
          opacity: hasArticleModeData ? 1 : 0.5,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
          Revisar vencidos — Só artigos
        </Text>
      </Pressable>

      <View style={{ marginTop: 10, gap: 8 }}>
        <Text style={{ color: "#9a9a9a", fontSize: 12, fontWeight: "600" }}>Backup e compartilhamento</Text>

        <Pressable
          onPress={props.onExportJson}
          accessibilityRole="button"
          accessibilityLabel="Exportar backup em JSON"
          style={{ backgroundColor: "#1f1f1f", padding: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#ddd", fontSize: 14, fontWeight: "600" }}>Exportar backup (JSON)</Text>
        </Pressable>

        <Pressable
          onPress={props.onExportCsv}
          accessibilityRole="button"
          accessibilityLabel="Exportar deck em CSV"
          style={{ backgroundColor: "#1f1f1f", padding: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#ddd", fontSize: 14, fontWeight: "600" }}>Exportar deck (CSV)</Text>
        </Pressable>

        <Pressable
          onPress={props.onImportData}
          accessibilityRole="button"
          accessibilityLabel="Importar JSON ou CSV"
          accessibilityHint="Importa backup completo em JSON ou deck em CSV"
          style={{ backgroundColor: "#1f1f1f", padding: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#ddd", fontSize: 14, fontWeight: "700" }}>Importar JSON/CSV</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={props.onRanking}
        accessibilityRole="button"
        accessibilityLabel="Ver ranking"
        accessibilityHint="Abre o ranking local de pontuações"
        style={{ backgroundColor: "#1f1f1f", padding: 14, borderRadius: 14, marginTop: 8 }}
      >
        <Text style={{ color: "#ddd", fontSize: 15, fontWeight: "600" }}>Ver Ranking</Text>
      </Pressable>
    </View>
  );
}
