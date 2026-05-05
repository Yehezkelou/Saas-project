import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
  withSequence,
} from "react-native-reanimated";

// ── Types ──────────────────────────────────────────────────
interface IconOrbiterProps {
  children: React.ReactNode;
  radius: number;
  duration: number; // in ms
  delay?: number;   // in ms
  reverse?: boolean;
}

// ── IconOrbiter ────────────────────────────────────────────
const IconOrbiter = ({ children, radius, duration, delay = 0, reverse = false }: IconOrbiterProps) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Convert duration to MS
    setTimeout(() => {
      rotation.value = withRepeat(
        withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
        -1, // Infinite
        false
      );
    }, delay);
  }, [duration, delay, reverse]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const itemStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: radius },
        { rotate: `${-rotation.value}deg` }, // Counter-rotate to keep icon upright
      ],
    };
  });

  return (
    <Animated.View style={containerStyle}>
      <Animated.View style={itemStyle}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// ── LogoOrbit ──────────────────────────────────────────────
export const LogoOrbit = ({ size = 300 }: { size?: number }) => {
  const scale = size / 300;
  const outerOrbit = 120 * scale;
  const innerOrbit = 85 * scale;

  const icons = [
    { component: MaterialIcons, name: "storefront", color: "#60a5fa" },
    { component: MaterialCommunityIcons, name: "glass-mug-variant", color: "#f59e0b" },
    { component: MaterialIcons, name: "restaurant", color: "#f87171" },
    { component: MaterialIcons, name: "local-cafe", color: "#d97706" },
    { component: MaterialIcons, name: "fastfood", color: "#fbbf24" },
    { component: MaterialIcons, name: "business", color: "#c084fc" },
  ];

  const opacityScale = useSharedValue(0.5);
  const opacityVal = useSharedValue(0);

  useEffect(() => {
    opacityScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    opacityVal.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
    transform: [{ scale: opacityScale.value }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Mot Central : Saas */}
      <Animated.Text
        style={[
          {
            fontSize: 72 * scale,
            fontWeight: "900",
            color: "#fff",
            letterSpacing: -0.05 * 72 * scale,
            zIndex: 10,
            textShadowColor: "rgba(255,255,255,0.3)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
          },
          textStyle,
        ]}
      >
        Saas
      </Animated.Text>

      {/* Cercles d'orbite subtils */}
      <View
        style={{
          position: "absolute",
          width: 240 * scale,
          height: 240 * scale,
          borderRadius: 120 * scale,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 160 * scale,
          height: 160 * scale,
          borderRadius: 80 * scale,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
        }}
      />

      {/* Icônes qui tournent */}
      {icons.slice(0, 3).map((item, i) => (
        <IconOrbiter key={i} radius={outerOrbit} duration={20000} delay={i * (20000 / 3)}>
          <item.component 
            name={item.name} 
            size={24 * scale} 
            color={item.color} 
            style={{ textShadowColor: item.color, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } }} 
          />
        </IconOrbiter>
      ))}

      {icons.slice(3, 6).map((item, i) => (
        <IconOrbiter key={i + 3} radius={innerOrbit} duration={15000} delay={i * (15000 / 3)} reverse>
          <item.component 
            name={item.name} 
            size={18 * scale} 
            color={item.color} 
            style={{ textShadowColor: item.color, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } }} 
          />
        </IconOrbiter>
      ))}
    </View>
  );
};

// ── GlassyBackground ───────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const Particle = ({ index, total }: { index: number; total: number }) => {
  const yVal = useSharedValue(SCREEN_H + 50);
  const opVal = useSharedValue(0);
  const rotVal = useSharedValue(0);

  useEffect(() => {
    const duration = Math.random() * 20000 + 20000;
    const delay = Math.random() * 10000;
    setTimeout(() => {
      yVal.value = withRepeat(withTiming(-100, { duration, easing: Easing.linear }), -1, false);
      rotVal.value = withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false);
      
      opVal.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: duration / 2 }),
          withTiming(0, { duration: duration / 2 })
        ),
        -1, false
      );
    }, delay);
  }, []);

  const pStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: `${(index / total) * 100}%`,
    transform: [{ translateY: yVal.value }, { rotate: `${rotVal.value}deg` }],
    opacity: opVal.value,
  }));

  const iconNames = ["restaurant", "local-cafe", "storefront"];
  return (
    <Animated.View style={pStyle}>
      <MaterialIcons name={iconNames[index % 3]} size={24} color="rgba(255,255,255,0.5)" />
    </Animated.View>
  );
};

export const GlassyBackground = () => {
  const particles = Array.from({ length: 8 });

  // Blobs animés
  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.2);

  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, false
    );
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 5000 }),
        withTiming(0.3, { duration: 5000 })
      ),
      -1, false
    );

    setTimeout(() => {
      scale2.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 7500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 7500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      );
      opacity2.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 7500 }),
          withTiming(0.2, { duration: 7500 })
        ),
        -1, false
      );
    }, 2000);
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));
  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -SCREEN_H * 0.2,
            left: -SCREEN_W * 0.2,
            width: SCREEN_W * 0.8,
            height: SCREEN_H * 0.6,
            backgroundColor: "rgba(96, 165, 250, 0.15)",
            borderRadius: 999,
          },
          blob1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -SCREEN_H * 0.1,
            right: -SCREEN_W * 0.1,
            width: SCREEN_W * 0.7,
            height: SCREEN_H * 0.5,
            backgroundColor: "rgba(192, 132, 252, 0.1)",
            borderRadius: 999,
          },
          blob2Style,
        ]}
      />

      {particles.map((_, i) => (
        <Particle key={i} index={i} total={particles.length} />
      ))}
    </View>
  );
};
