import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const animationDelayPlugin = plugin(function ({ matchUtilities, theme }) {
  matchUtilities(
    {
      'animation-delay': (value) => ({
        animationDelay: value,
      }),
    },
    {
      values: theme('animationDelay'),
    }
  );
});

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'message-enter': 'message-enter 0.3s ease-out',
        'float1': 'float1 20s ease-in-out infinite',
        'float2': 'float2 24s ease-in-out infinite',
        'float3': 'float3 28s ease-in-out infinite',
        'button-scale': 'buttonScale 2s ease-in-out infinite',
      },
      keyframes: {
        'message-enter': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'float1': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(20px, -20px)' },
          '50%': { transform: 'translate(-10px, 20px)' },
          '75%': { transform: 'translate(-20px, -10px)' },
        },
        'float2': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-15px, 15px)' },
          '50%': { transform: 'translate(15px, -15px)' },
          '75%': { transform: 'translate(20px, 10px)' },
        },
        'float3': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(10px, -25px)' },
          '50%': { transform: 'translate(-20px, 10px)' },
          '75%': { transform: 'translate(-10px, 20px)' },
        },
        'buttonScale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animationDelay: {
        '2000': '2s',
        '4000': '4s',
      },
    },
  },
  plugins: [animationDelayPlugin],
};

export default config;
