import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tiket: {
          bg: "#0B1120",
          surface: "#111827",
          card: "#1A2332",
          "card-hover": "#212D42",
          border: "#2A3548",
          "border-light": "#354158",
          blue: "#007BFF",
          "blue-dark": "#0062CC",
          orange: "#FF6819",
          "orange-dark": "#E55A0F",
          text: "#F0F4FA",
          muted: "#8B95AD",
          green: "#00C48C",
          yellow: "#FFB020",
          red: "#FF5252",
        },
        brand: {
          50: "#E6F3FF",
          500: "#007BFF",
          600: "#0062CC",
          700: "#004DA3",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        tiket: "0 4px 24px rgba(0, 0, 0, 0.35)",
        "tiket-glow": "0 0 40px rgba(0, 123, 255, 0.12)",
      },
      backgroundImage: {
        "tiket-gradient": "linear-gradient(135deg, #007BFF 0%, #0056B3 50%, #FF6819 100%)",
        "tiket-header": "linear-gradient(180deg, #111827 0%, #0B1120 100%)",
        "tiket-card-shine":
          "linear-gradient(135deg, rgba(0,123,255,0.08) 0%, rgba(255,104,25,0.04) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
