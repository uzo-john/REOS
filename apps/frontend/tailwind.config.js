/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // REOS ASEMP Brand Palette
        reos: {
          primary:    "#00D4FF",  // Cyan — core brand
          secondary:  "#7C3AED",  // Violet
          accent:     "#F59E0B",  // Amber — energy/solar
          success:    "#10B981",  // Emerald
          danger:     "#EF4444",  // Red
          warning:    "#F97316",  // Orange
          info:       "#3B82F6",  // Blue
        },
        // Dark Mode Backgrounds
        dark: {
          900: "#050810",
          800: "#0A0E1A",
          700: "#111827",
          600: "#1C2333",
          500: "#243047",
          400: "#2D3B55",
          300: "#374563",
        },
        // Glass/Surface
        glass: {
          DEFAULT: "rgba(255,255,255,0.05)",
          border:  "rgba(255,255,255,0.10)",
          heavy:   "rgba(255,255,255,0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "System"],
        mono: ["JetBrains Mono", "Courier"],
      },
      boxShadow: {
        glow:      "0 0 20px rgba(0, 212, 255, 0.15)",
        "glow-lg": "0 0 40px rgba(0, 212, 255, 0.25)",
        panel:     "0 4px 24px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
