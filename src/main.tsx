import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'   // ← this line is critical so Tailwind/base styles load

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
