import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";

import { router } from './router.tsx';

import "@fontsource-variable/inter/index.css";
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.error('Could not register the JikJik service worker:', error);
  });
}

// Create once 
const queryClient = new QueryClient();

// Mount the App
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);