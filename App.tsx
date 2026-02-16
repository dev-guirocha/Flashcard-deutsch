import React from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HomeScreen } from "./src/ui/screens/Home";
import { GameScreen } from "./src/ui/screens/Game";
import { RankingScreen } from "./src/ui/screens/Ranking";
import { useAppModel } from "./src/state/appStore";

type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Ranking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { ready, words, scores, run, actions } = useAppModel();

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
                onRanking={() => navProps.navigation.navigate("Ranking")}
                onStart={(mode) => {
                  actions.startRun(mode);
                  navProps.navigation.navigate("Game");
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
