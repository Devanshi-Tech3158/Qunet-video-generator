import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { isFirebaseConfigured } from './lib/firebase';
import { queryClient } from './lib/queryClient';
import { DEV_USER_UID } from './store/useAuthStore';
import './index.css';

// When Firebase is not configured, default browser visitors to the demo creator
// ("Devanshi Goyal") unless they explicitly signed out in this session.
try {
  if (
    !isFirebaseConfigured &&
    window.localStorage.getItem('creatordna.dev-uid') === null &&
    window.sessionStorage.getItem('creatordna.signed-out') !== '1'
  ) {
    window.localStorage.setItem('creatordna.dev-uid', DEV_USER_UID);
  }
} catch {
  // Storage disabled - continue normally.
}

const rawBase = import.meta.env.BASE_URL ?? '/';
const configuredBase = rawBase === '/' ? '/' : rawBase.replace(/\/$/, '');
const pathname = window.location.pathname;
const isRepoPath = pathname.toLowerCase().startsWith('/qunet-video-generator');
const basename =
  configuredBase !== '/' && pathname.startsWith(configuredBase)
    ? configuredBase
    : isRepoPath
      ? pathname.slice(0, '/qunet-video-generator'.length)
      : '/';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('CreatorDNA: #root element is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
