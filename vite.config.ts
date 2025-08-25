import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Check if we should use direct API calls (for CORS testing)
  const useDirectApi = process.env.VITE_USE_DIRECT_API === 'true';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      // Conditionally enable proxy based on environment variable
      ...(useDirectApi ? {} : {
        proxy: {
          '/api': {
            target: 'http://localhost:9001',
            changeOrigin: true,
            secure: false,
            ws: true, // Support WebSocket proxy
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          },
          '/websocket': {
            target: 'ws://localhost:9001',
            ws: true,
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('WebSocket proxy error', err);
              });
              proxy.on('open', () => {
                console.log('WebSocket proxy connection opened');
              });
              proxy.on('close', () => {
                console.log('WebSocket proxy connection closed');
              });
            },
          },
        }
      }),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
