/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    '"SF Pro Display"',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif'
                ],
                display: [
                    'Manrope',
                    // ⚡ Fallback metric-adjusted (size-adjust en index.css) →
                    // CLS ~0 cuando Manrope llega tras el primer pintado.
                    '"Manrope Fallback"',
                    '"SF Pro Display"',
                    'system-ui',
                    '-apple-system',
                    'sans-serif'
                ],
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
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
                    // Texto/iconos sobre fondo claro (--destructive por sí solo falla AA ~3.5:1)
                    text: "hsl(var(--destructive-text) / <alpha-value>)",
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
                // Color de marca (#0066CC). Sustituye a todos los `[#0066CC]` arbitrarios
                // que había repartidos por componentes. Soporta opacidad (bg-brand/10)
                // gracias al placeholder <alpha-value>.
                brand: {
                    DEFAULT: "hsl(var(--brand) / <alpha-value>)",
                    hover: "hsl(var(--brand-hover) / <alpha-value>)",
                    foreground: "hsl(var(--brand-foreground) / <alpha-value>)",
                    deep: "hsl(var(--brand-deep) / <alpha-value>)",
                },
                ink: {
                    DEFAULT: "hsl(var(--ink) / <alpha-value>)",
                    strong: "hsl(var(--ink-strong) / <alpha-value>)",
                    muted: "hsl(var(--ink-muted) / <alpha-value>)",
                    soft: "hsl(var(--ink-soft) / <alpha-value>)",
                },
                surface: {
                    DEFAULT: "hsl(var(--surface) / <alpha-value>)",
                    tinted: "hsl(var(--surface-tinted) / <alpha-value>)",
                },
                line: {
                    DEFAULT: "hsl(var(--line) / <alpha-value>)",
                    soft: "hsl(var(--line-soft) / <alpha-value>)",
                },
                success: {
                    DEFAULT: "hsl(var(--success) / <alpha-value>)",
                    hover: "hsl(var(--success-hover) / <alpha-value>)",
                    foreground: "hsl(var(--success-foreground) / <alpha-value>)",
                    tint: "hsl(var(--success-tint) / <alpha-value>)",
                    border: "hsl(var(--success-border) / <alpha-value>)",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning) / <alpha-value>)",
                    tint: "hsl(var(--warning-tint) / <alpha-value>)",
                    border: "hsl(var(--warning-border) / <alpha-value>)",
                    // Texto sobre fondo claro (--warning por sí solo falla AA ~3.2:1)
                    text: "hsl(var(--warning-text) / <alpha-value>)",
                },
                avail: {
                    free: "hsl(var(--avail-free) / <alpha-value>)",
                    low: "hsl(var(--avail-low) / <alpha-value>)",
                    full: "hsl(var(--avail-full) / <alpha-value>)",
                },
                map: {
                    sky: "hsl(var(--map-sky) / <alpha-value>)",
                    "sky-muted": "hsl(var(--map-sky-muted) / <alpha-value>)",
                    land: "hsl(var(--map-land) / <alpha-value>)",
                    border: "hsl(var(--map-border) / <alpha-value>)",
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
                "pulse-selection": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.85" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-selection": "pulse-selection 0.6s ease-in-out 2",
            },
            /* Escala Inspecciono (DESIGN.md §3) — sustituye text-[Npx] arbitrarios */
            fontSize: {
                badge: ["10px", { lineHeight: "12px" }],
                kicker: ["11px", { lineHeight: "1.2" }],
                caption: ["12px", { lineHeight: "16px" }],
                meta: ["13px", { lineHeight: "18px" }],
                body: ["14px", { lineHeight: "18px" }],
                lead: ["15px", { lineHeight: "1.5" }],
                subtitle: ["16px", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
                title: ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
                headline: ["1.65rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
            },
        },
    },
    plugins: [],
}