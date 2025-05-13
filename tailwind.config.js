// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // from the brand book
        'brand-green':    '#4CAF50',
        'brand-green-2':  '#2E7D32',
        'brand-gold':     '#C8B273',
        'brand-charcoal': '#2C2C2C',
      },
      fontFamily: {
        // headings vs body
        heading: ['"Playfair Display"', 'serif'],
        body:    ['Lato', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1rem',   // for those 2xl rounded corners
      },
      boxShadow: {
        card: '0 8px 20px rgba(0,0,0,0.05)',
      },
    }
  },
  plugins: [],
}
