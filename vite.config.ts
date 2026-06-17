import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');
          if (!normalizedId.includes('node_modules')) {
            return undefined;
          }
          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (normalizedId.includes('/antd/')) {
            return 'vendor-antd';
          }
          if (normalizedId.includes('/@ant-design/icons') || normalizedId.includes('/lucide-react/')) {
            return 'vendor-icons';
          }
          return 'vendor-ui-support';
        }
      }
    }
  },
  server: {
    port: 5178,
    proxy: {
      '/api': 'http://127.0.0.1:8012'
    }
  }
});
