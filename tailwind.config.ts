import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        // Core palette
        void: "#060810",
        surface: "#0d1117",
        panel: "#111827",
        border: "#1f2937",
        // Stage colors
        fetch: { DEFAULT: "#3b82f6", dim: "#1d4ed8", glow: "#60a5fa" },
        decode: { DEFAULT: "#8b5cf6", dim: "#6d28d9", glow: "#a78bfa" },
        execute: { DEFAULT: "#f59e0b", dim: "#b45309", glow: "#fbbf24" },
        memory: { DEFAULT: "#10b981", dim: "#047857", glow: "#34d399" },
        writeback: { DEFAULT: "#ef4444", dim: "#b91c1c", glow: "#f87171" },
        // Hazard colors
        hazard: {
          data: "#f59e0b",
          control: "#ef4444",
          structural: "#8b5cf6",
        },
        // Accent
        accent: "#00d4ff",
        "accent-dim": "#0ea5e9",
      },
      backgroundImage: {
        "grid-subtle":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flow-right": "flowRight 1s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        flowRight: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px currentColor" },
          "50%": { boxShadow: "0 0 20px currentColor, 0 0 40px currentColor" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.4)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.4)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.4)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.4)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.4)",
        "glow-accent": "0 0 20px rgba(0, 212, 255, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
