import type { Config } from 'tailwindcss'
import withMT from '@material-tailwind/react/utils/withMT'

const config = withMT({
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontSize: {
        'h1': ['5rem', '7.5rem'],
        'h2': ['4rem', '6rem'],
        'h3': ['3rem', '4.5rem'],
        'h4': ['2.5rem', '3.75rem'],
        'h5': ['2rem', '3rem'],
        'h6': ['1.75rem', '2.625rem'],
      },
      colors: {
        'primary': {
          'black-100': '#000000',
          'black-200': '#373737',
          'black-300': '#1C1C1C',
          'black-400': '#CECECE',
          'black-500': '#EEF0F6',
        },
        'neutral': {
          'white': '#FFFFFF',
          'black': '#1A1A1A',
          '900': '#3D3D3D',
          '800': '#545454',
          '700': '#6B6B6B',
          '600': '#828282',
          '500': '#999999',
          '400': '#B0B0B0',
          '300': '#C7C7C7',
          '200': '#DEDEDE',
          '100': '#F5F5F5 ',
          'tone-700': '#F2F3F5',
        },
        'wireframe': {
          700: '#BCBACD',
        },
        'func': {
          'error': '#D82027',
          'info': '#208BD8',
          'warning': '#EDE405',
          'success': '#20D880',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
})
export default config
