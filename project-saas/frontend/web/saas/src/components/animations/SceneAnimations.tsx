// src/components/animations/SceneAnimations.tsx

import React from "react";
import { motion } from "framer-motion";
import { 
  MdOutlineStorefront, 
  MdRestaurant, 
  MdCoffee, 
  MdFastfood, 
  MdBusiness
} from "react-icons/md";
import { BiBeer } from "react-icons/bi";

// ── Types ──────────────────────────────────────────────────
interface IconOrbiterProps {
  children: React.ReactNode;
  radius: number;
  duration: number;
  delay?: number;
  reverse?: boolean;
}

// ── Petit composant pour faire tourner un élément ────────────
const IconOrbiter = ({ children, radius, duration, delay = 0, reverse = false }: IconOrbiterProps) => {
  return (
    <motion.div
      style={{
        position: "absolute",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      animate={{
        rotate: reverse ? -360 : 360,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
    >
      <motion.div
        style={{
          x: radius,
        }}
        animate={{
          rotate: reverse ? 360 : -360, // Garder l'icône droite
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// ── Composant Principal : Logo avec Orbites ──────────────────
export const LogoOrbit = ({ size = 300 }: { size?: number }) => {
  const icons = [
    { Icon: MdOutlineStorefront, color: "#60a5fa" },
    { Icon: BiBeer,              color: "#f59e0b" },
    { Icon: MdRestaurant,        color: "#f87171" },
    { Icon: MdCoffee,            color: "#d97706" },
    { Icon: MdFastfood,          color: "#fbbf24" },
    { Icon: MdBusiness,          color: "#c084fc" },
  ];

  const scale = size / 300;
  const outerOrbit = 120 * scale;
  const innerOrbit = 85 * scale;

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Mot Central : Saas */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          fontSize: 72 * scale,
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "-0.05em",
          zIndex: 10,
          textShadow: "0 0 20px rgba(255,255,255,0.3)",
        }}
      >
        Saas
      </motion.h1>

      {/* Cercles d'orbite subtils */}
      <div style={{
        position: "absolute",
        width: 240 * scale,
        height: 240 * scale,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.05)",
      }} />
      <div style={{
        position: "absolute",
        width: 160 * scale,
        height: 160 * scale,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.05)",
      }} />

      {/* Icônes qui tournent */}
      {icons.slice(0, 3).map((item, i) => (
        <IconOrbiter key={i} radius={outerOrbit} duration={20} delay={i * (20 / 3)}>
          <item.Icon size={24 * scale} style={{ color: item.color, filter: `drop-shadow(0 0 8px ${item.color}66)` }} />
        </IconOrbiter>
      ))}

      {icons.slice(3, 6).map((item, i) => (
        <IconOrbiter key={i + 3} radius={innerOrbit} duration={15} delay={i * (15 / 3)} reverse>
          <item.Icon size={18 * scale} style={{ color: item.color, filter: `drop-shadow(0 0 6px ${item.color}66)` }} />
        </IconOrbiter>
      ))}
    </div>
  );
};

// ── Fond 'Noir Glacé' avec éléments flottants ────────────────
export const GlassyBackground = () => {
  // Générer quelques éléments de fond
  const particles = Array.from({ length: 15 });

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0c0c0c",
      overflow: "hidden",
      zIndex: -1,
    }}>
      {/* Gradients de fond interactifs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-5%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(192, 132, 252, 0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Particules / Icônes flottantes */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%", 
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: ["-10%", "110%"],
            opacity: [0, 0.15, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            color: "rgba(255,255,255,0.1)",
          }}
        >
          {i % 3 === 0 ? <MdRestaurant size={24} /> : i % 3 === 1 ? <MdCoffee size={20} /> : <BiBeer size={22} />}
        </motion.div>
      ))}

      {/* Overlay de grain/bruit subtil */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.02,
        pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
};
