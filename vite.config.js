import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { requestHandler } from './server/index.js'

function apiServerPlugin() {
  return {
    name: 'rescueroom-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/') || url === '/api') {
          return requestHandler(req, res);
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('@cometchat/calls-sdk-javascript')) {
              return 'vendor-cometchat-calls';
            }
            if (id.includes('@cometchat/chat-sdk-javascript')) {
              return 'vendor-cometchat-chat';
            }
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
