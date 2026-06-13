/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Color Palette ──────────────────────────────────────────────────
      colors: {
        // Dashboard / system colors (unchanged — don't break existing UI)
        primary:            '#0F5B4F',
        secondary:          '#DDEB7B',
        gold:               '#D4AF37',
        background:         '#F6F8F5',
        surface:            '#FFFFFF',
        border:             '#E8ECE7',
        'text-primary':     '#1E1E1E',
        'text-secondary':   '#6B7280',
        success:            '#8BCF9B',
        warning:            '#F4D06F',
        error:              '#E57373',

        // ── Luxury landing page tokens ───────────────────────────────────
        'lux-gold':         '#F2B705',   // Warm gold accent
        'lux-gold-dark':    '#C9960A',   // Darker gold for depth
        'lux-green':        '#0F5B4F',   // Deep forest green (same as primary)
        'lux-green-dark':   '#093D35',   // Even deeper green
        'dark-bg':          '#0A0A0A',   // Near-black hero background
        'dark-surface':     '#111111',   // Card backgrounds on dark sections
        'dark-card':        '#181818',   // Slightly lighter dark card
        'dark-border':      'rgba(255,255,255,0.08)',  // Subtle light border on dark
        'warm-white':       '#FAFAF8',   // Warm off-white for content sections
        'warm-gray':        '#F5F5F2',   // Warm gray for alternating sections
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans:      ['Inter', 'sans-serif'],
        heading:   ['"Plus Jakarta Sans"', 'sans-serif'],
        display:   ['"Playfair Display"', 'Georgia', 'serif'],
        body:      ['Inter', 'system-ui', 'sans-serif'],
      },

      // ── Font Sizes ──────────────────────────────────────────────────────
      fontSize: {
        'hero':   ['clamp(3.5rem, 8vw, 7.5rem)', { lineHeight: '1.05', letterSpacing: '0.05em' }],
        'hero-sub': ['clamp(1.1rem, 2.5vw, 2rem)', { lineHeight: '1.4' }],
        'section': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1' }],
      },

      // ── Letter Spacing ──────────────────────────────────────────────────
      letterSpacing: {
        'hero':    '0.2em',
        'widest2': '0.3em',
        'luxury':  '0.15em',
      },

      // ── Box Shadows ─────────────────────────────────────────────────────
      boxShadow: {
        'soft':         '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'elevated':     '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
        'glow-gold':    '0 0 30px rgba(242, 183, 5, 0.35)',
        'glow-gold-sm': '0 0 15px rgba(242, 183, 5, 0.25)',
        'glow-green':   '0 0 30px rgba(15, 91, 79, 0.4)',
        'luxury':       '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'card-dark':    '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass':        '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.15)',
      },

      // ── Border Radius ───────────────────────────────────────────────────
      borderRadius: {
        'card':    '24px',
        'input':   '16px',
        'btn':     '14px',
        'modal':   '28px',
        'lux':     '32px',
        'pill':    '9999px',
      },

      // ── Backdrop Blur ───────────────────────────────────────────────────
      backdropBlur: {
        'xs':  '4px',
        'glass': '12px',
        'heavy': '24px',
      },

      // ── Transitions ─────────────────────────────────────────────────────
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ── Animations ──────────────────────────────────────────────────────
      animation: {
        // Existing
        'blob':       'blob 7s infinite',
        'fade-in':    'fadeIn 0.5s ease-out forwards',
        'slide-up':   'slideUp 0.5s ease-out forwards',

        // Landing page animations
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'float 9s ease-in-out infinite',
        'float-delayed':  'float 6s ease-in-out 2s infinite',
        'shimmer':        'shimmer 2.5s linear infinite',
        'bokeh':          'bokeh 8s ease-in-out infinite',
        'pulse-gold':     'pulseGold 2s ease-in-out infinite',
        'scroll-bounce':  'scrollBounce 1.8s ease-in-out infinite',
        'counter-in':     'counterIn 0.6s ease-out forwards',
        'sweep-in':       'sweepIn 0.4s ease-out forwards',
        'clip-reveal':    'clipReveal 0.8s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'fade-up':        'fadeUp 0.7s ease-out forwards',
        'gold-glow':      'goldGlow 3s ease-in-out infinite',
        'border-draw':    'borderDraw 0.5s ease-out forwards',
        'slide-in-left':  'slideInLeft 0.7s ease-out forwards',
        'slide-in-right': 'slideInRight 0.7s ease-out forwards',
        'scale-in':       'scaleIn 0.5s ease-out forwards',
        'particle-float': 'particleFloat 4s ease-in-out infinite',
        'spin-slow':      'spin 8s linear infinite',
      },

      // ── Keyframes ────────────────────────────────────────────────────────
      keyframes: {
        // Existing
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%':      { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // ── New luxury keyframes ───────────────────────────────────────
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        bokeh: {
          '0%, 100%': { transform: 'scale(1) translate(0, 0)',    opacity: '0.4' },
          '33%':      { transform: 'scale(1.3) translate(10px, -15px)', opacity: '0.7' },
          '66%':      { transform: 'scale(0.8) translate(-8px, 10px)',  opacity: '0.3' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(242,183,5,0.2)' },
          '50%':      { boxShadow: '0 0 35px rgba(242,183,5,0.6)' },
        },
        scrollBounce: {
          '0%, 100%': { transform: 'translateY(0)',   opacity: '1' },
          '50%':      { transform: 'translateY(10px)', opacity: '0.4' },
        },
        counterIn: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sweepIn: {
          '0%':   { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0% 0 0)' },
        },
        clipReveal: {
          '0%':   { clipPath: 'inset(0 100% 0 0)', opacity: '0' },
          '100%': { clipPath: 'inset(0 0% 0 0)',   opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        goldGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(242,183,5,0.4))' },
          '50%':      { filter: 'drop-shadow(0 0 20px rgba(242,183,5,0.8))' },
        },
        borderDraw: {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)',   opacity: '0.6' },
          '25%':      { transform: 'translateY(-20px) translateX(10px)', opacity: '1'   },
          '75%':      { transform: 'translateY(-10px) translateX(-8px)', opacity: '0.4' },
        },
      },

      // ── Spacing extras ──────────────────────────────────────────────────
      height: {
        'screen-90': '90vh',
        'screen-85': '85vh',
        'screen-70': '70vh',
      },

      // ── Z-Index ─────────────────────────────────────────────────────────
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};