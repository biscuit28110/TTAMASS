import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Colors } from "@/constants/theme";

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  return (
    <View style={{ alignItems: "center", gap: 2, paddingTop: 6 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? Colors.red : Colors.textMuted, fontWeight: focused ? "700" : "400" }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" label="Home" />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🥗" label="Nutrition" />,
        }}
      />
      <Tabs.Screen
        name="body"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📊" label="Corps" />,
        }}
      />
      <Tabs.Screen
        name="sport"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏋️" label="Sport" />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🤖" label="Coach" />,
        }}
      />
    </Tabs>
  );
}
