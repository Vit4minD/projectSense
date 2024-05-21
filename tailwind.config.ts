import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInShrink: {
          '0%': { opacity: '0', scale: '1.5' },
          '80%': { opacity: '1', scale: '1' },
          '85%': { transform: 'translateX(0)' }, 
          '100%': { transform: 'translateX(-290%)', opacity: '0', scale: '.5' },
        },
        slideUp: {
          '0%': { transform: 'translateY(50%)', opacity: '.0', scale: '.3' },
          '100%': { transform: 'translateY(0)', opacity: '1', scale: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeInShrink 1650ms ease-in-out forwards ',
        slideUp: 'slideUp .8s ease-in-out forwards ',
      },
      
    },
  },
  plugins: [],
}
export default config
