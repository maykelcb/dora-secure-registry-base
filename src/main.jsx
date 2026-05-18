import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Security measures
if (import.meta.env.PROD) {
  // Disable right click
  document.addEventListener('contextmenu', event => event.preventDefault());
  
  // Clear clipboard after 60 seconds if something was copied
  document.addEventListener('copy', () => {
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('');
      } catch (err) {
        // Ignore errors if document lost focus
      }
    }, 60000);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
