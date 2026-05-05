import React from "react";
import { StatusBar } from "react-native";
import { RootNavigator } from "./src/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0c0c0c"
        translucent={false}
      />
      <RootNavigator />
    </GestureHandlerRootView>
  );
}