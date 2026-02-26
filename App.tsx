import React from "react";
import { View, Text, ActivityIndicator, Alert, Platform } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HomeScreen } from "./src/ui/screens/Home";
import { GameScreen } from "./src/ui/screens/Game";
import { RankingScreen } from "./src/ui/screens/Ranking";
import { useAppModel } from "./src/state/appStore";
import { exportTextToLocalFile, pickImportTextFile } from "./src/services/backupFiles";

type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Ranking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { ready, words, scores, run, reviewStats, articleTrainableCount, actions } = useAppModel();

  const handleExportJson = async () => {
    try {
      const json = await actions.exportBackupJson();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uri = await exportTextToLocalFile({
        filename: `flashcard-backup-${stamp}.json`,
        content: json,
        mimeType: "application/json",
        dialogTitle: "Exportar backup JSON",
      });
      Alert.alert("Exportação concluída", `Arquivo salvo em: ${uri}`);
    } catch (e) {
      Alert.alert("Erro na exportação", String(e));
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await actions.exportWordsCsv();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uri = await exportTextToLocalFile({
        filename: `flashcard-deck-${stamp}.csv`,
        content: csv,
        mimeType: "text/csv",
        dialogTitle: "Exportar deck CSV",
      });
      Alert.alert("Exportação concluída", `Arquivo salvo em: ${uri}`);
    } catch (e) {
      Alert.alert("Erro na exportação", String(e));
    }
  };

  const handleImport = async () => {
    try {
      const picked = await pickImportTextFile();
      if (!picked) return;

      const name = picked.name.toLowerCase();
      if (name.endsWith(".json") || picked.content.trim().startsWith("{")) {
        const result = await actions.importBackupJson(picked.content);
        Alert.alert(
          "Importação concluída",
          `Backup JSON importado.\nPalavras: ${result.words}\nProgresso: ${result.progress}\nScores: ${result.scores}`
        );
        return;
      }

      const result = await actions.importWordsCsv(picked.content);
      Alert.alert("Importação concluída", `Deck CSV importado.\nPalavras: ${result.words}`);
    } catch (e) {
      Alert.alert("Erro na importação", String(e));
    }
  };

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator />
        <Text style={{ color: "#bbb" }}>Inicializando banco e seed...</Text>
        <Text style={{ color: "#666", fontSize: 12 }}>{Platform.OS.toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#121212" },
            headerTitleStyle: { color: "white" },
            contentStyle: { backgroundColor: "#121212" },
          }}
        >
          <Stack.Screen name="Home" options={{ title: "Flashcard Deutsch" }}>
            {(navProps) => (
              <HomeScreen
                wordCount={words.length}
                dueCount={reviewStats.dueCount}
                trackedCount={reviewStats.trackedCount}
                masteredCount={reviewStats.masteredCount}
                newCount={reviewStats.newCount}
                articleTrainableCount={articleTrainableCount}
                onRanking={() => navProps.navigation.navigate("Ranking")}
                onStart={(mode) => {
                  const started = actions.startRun(mode);
                  if (!started) {
                    Alert.alert("Sem palavras disponíveis", "Não há palavras válidas para iniciar esta sessão.");
                    return;
                  }
                  navProps.navigation.navigate("Game");
                }}
                onStartNouns={(mode) => {
                  const started = actions.startRun(mode, "STANDARD", { onlyArticles: true });
                  if (!started) {
                    Alert.alert(
                      "Modo Só artigos indisponível",
                      "Seu deck atual não possui palavras com artigos e tradução para este modo."
                    );
                    return;
                  }
                  navProps.navigation.navigate("Game");
                }}
                onReviewDue={(mode) => {
                  const started = actions.startRun(mode, "REVIEW_DUE");
                  if (!started) {
                    Alert.alert("Sem palavras disponíveis", "Não há palavras para revisar no momento.");
                    return;
                  }
                  navProps.navigation.navigate("Game");
                }}
                onReviewDueNouns={(mode) => {
                  const started = actions.startRun(mode, "REVIEW_DUE", { onlyArticles: true });
                  if (!started) {
                    Alert.alert(
                      "Modo Só artigos indisponível",
                      "Seu deck atual não possui palavras com artigos e tradução para revisão."
                    );
                    return;
                  }
                  navProps.navigation.navigate("Game");
                }}
                onExportJson={() => {
                  void handleExportJson();
                }}
                onExportCsv={() => {
                  void handleExportCsv();
                }}
                onImportData={() => {
                  void handleImport();
                }}
                onInstallStarterDeck={() => {
                  Alert.alert(
                    "Instalar deck mínimo",
                    "Isso vai substituir o deck atual e limpar progresso das palavras. Deseja continuar?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Instalar",
                        style: "destructive",
                        onPress: () => {
                          void actions
                            .installStarterArticlesDeck()
                            .then((result) => {
                              Alert.alert(
                                "Deck instalado",
                                `Deck mínimo pronto com ${result.words} palavras.`
                              );
                            })
                            .catch((e) => Alert.alert("Erro", String(e)));
                        },
                      },
                    ]
                  );
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Game" options={{ title: "Run" }}>
            {(navProps) =>
              run ? (
                <GameScreen
                  run={run}
                  onAnswerMc={(id) => actions.answerMc(id)}
                  onAnswerType={(t) => actions.answerType(t)}
                  onNext={() => actions.next()}
                  onSkip={() => actions.doSkip()}
                  onExit={() => {
                    actions.abandonRun();
                    navProps.navigation.navigate("Home");
                  }}
                  onFinish={async () => {
                    await actions.finishAndSave();
                    navProps.navigation.navigate("Home");
                  }}
                />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#bbb" }}>Sem run ativa.</Text>
                </View>
              )
            }
          </Stack.Screen>

          <Stack.Screen name="Ranking" options={{ title: "Ranking" }}>
            {(navProps) => (
              <RankingScreen scores={scores} onBack={() => navProps.navigation.goBack()} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
