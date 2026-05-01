import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './lib/theme.js'
import './index.css'
import './styles/glass.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
