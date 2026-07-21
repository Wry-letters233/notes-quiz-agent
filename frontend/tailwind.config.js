/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: "var(--c-paper)",
        surface: "var(--c-surface)",
        paperLine: "var(--c-border)",
        ink: "var(--c-ink)",
        inkSoft: "var(--c-inkSoft)",
        amber: "var(--c-amber)",
        pen: "var(--c-pen)",
        sage: "var(--c-sage)",
        magenta: "var(--c-magenta)",
        violet: "var(--c-violet)",
        textMain: "var(--c-textMain)",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        neon: "var(--shadow-neon)",
        neonMagenta: "var(--shadow-neonMagenta)",
        neonLime: "var(--shadow-neonLime)",
        neonRed: "var(--shadow-neonRed)",
      },
    },
  },
  plugins: [],
}
