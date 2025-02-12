
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('ServiceWorker registration successful:', registration.scope);

      // Request background sync permission if available
      if ('sync' in registration) {
        try {
          await registration.sync.register('sync-entries');
          console.log('Background sync registered');
        } catch (error) {
          console.error('Background sync registration failed:', error);
        }
      }
    }
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
  }
};

registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
