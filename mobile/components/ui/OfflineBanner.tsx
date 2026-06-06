import { useState, useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const anim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const checkOnline = async () => {
      try {
        const res = await fetch("https://www.gstatic.com/generate_204", { method: "HEAD", cache: "no-store" });
        const online = res.status === 204 || res.ok;
        if (!online && !isOffline) { setIsOffline(true); setWasOffline(true); }
        if (online && isOffline) { setIsOffline(false); setShowBack(true); setTimeout(() => setShowBack(false), 3000); }
      } catch {
        if (!isOffline) { setIsOffline(true); setWasOffline(true); }
      }
    };

    const interval = setInterval(checkOnline, 5000);
    checkOnline();
    return () => clearInterval(interval);
  }, [isOffline]);

  const visible = isOffline || showBack;

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [visible, anim]);

  if (!visible && !wasOffline) return null;

  return (
    <Animated.View style={{ opacity: anim, backgroundColor: showBack ? Colors.success : Colors.error, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.lg, alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: FontSize.xs, fontWeight: "600" }}>
        {showBack ? "✓ Connexion rétablie" : "⚠ Pas de connexion internet"}
      </Text>
    </Animated.View>
  );
}
