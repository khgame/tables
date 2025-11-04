import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './app/components/ErrorBoundary';

const rootElement = document.getElementById('root') ?? document.getElementById('app');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  console.error('[game07] 未找到挂载节点 root/app，UI 未能初始化');
}
