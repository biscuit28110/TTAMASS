import { Stack } from "expo-router";
import { Colors } from "@/constants/theme";

export default function SportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="log" />
      <Stack.Screen name="session" />
    </Stack>
  );
}
