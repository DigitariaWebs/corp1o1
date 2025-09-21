import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      montserrat: ['Montserrat', 'ui-sans-serif', 'system-ui'],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Revolutionary Corp1o1 palette
        revolutionary: {
          blue: "hsl(var(--revolutionary-blue))",
          cyan: "hsl(var(--revolutionary-cyan))",
          amber: "hsl(var(--revolutionary-amber))",
          purple: "hsl(var(--revolutionary-purple))",
          pink: "hsl(var(--revolutionary-pink))",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "subtle-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(34, 211, 238, 0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(34, 211, 238, 0.2)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "snow-fall": {
          "0%": { transform: "translateY(-100vh) translateX(0px)" },
          "100%": { transform: "translateY(100vh) translateX(100px)" },
        },
        "snow-drift": {
          "0%": { transform: "translateX(0px)" },
          "50%": { transform: "translateX(50px)" },
          "100%": { transform: "translateX(0px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "subtle-float": "subtle-float 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "snow-fall": "snow-fall 10s linear infinite",
        "snow-drift": "snow-drift 3s ease-in-out infinite",
      },
      backgroundImage: {
        "revolutionary-gradient": "linear-gradient(135deg, hsl(var(--revolutionary-blue)) 0%, hsl(var(--revolutionary-cyan)) 50%, hsl(var(--revolutionary-amber)) 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(30, 58, 138, 0.02) 100%)",
        "subtle-grid": "radial-gradient(circle at 1px 1px, rgba(34, 211, 238, 0.15) 1px, transparent 0)",
        "gradient-radial": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
