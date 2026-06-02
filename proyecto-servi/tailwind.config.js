/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        servi: {
          fondo: '#0B1F17',
          superficie: '#143528',
          primario: '#1B7A4E',
          primarioOscuro: '#145A3A',
          acento: '#F97316',
          acentoClaro: '#FDBA74',
          texto: '#FFFFFF',
          suave: '#A7C4B5',
          borde: '#2D5A45',
          exito: '#22C55E',
          pendiente: '#64748B',
          completado: '#0EA5E9',
          peligro: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
