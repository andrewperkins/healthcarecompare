import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { initializeDarkMode } from './healthcareCompare';
import '../styles.css';

// Set canonical URL and Open Graph URL dynamically
if (typeof window !== 'undefined') {
  const currentUrl = window.location.href;
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  const ogUrlMeta = document.querySelector('meta[property="og:url"]');
  
  if (canonicalLink) canonicalLink.href = currentUrl;
  if (ogUrlMeta) ogUrlMeta.content = currentUrl;
  
  // Update image URLs to be absolute
  const baseUrl = window.location.origin;
  const ogImageMeta = document.querySelector('meta[property="og:image"]');
  const twitterImageMeta = document.querySelector('meta[name="twitter:image"]');
  
  if (ogImageMeta) ogImageMeta.content = baseUrl + '/assets/images/icon.png';
  if (twitterImageMeta) twitterImageMeta.content = baseUrl + '/assets/images/icon.png';
}

// Initialize dark mode
initializeDarkMode();

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
