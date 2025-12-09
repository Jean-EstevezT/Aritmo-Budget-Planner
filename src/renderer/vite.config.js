import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Important for Electron to load assets with relative paths
    resolve: {
        alias: {
            '@common': path.resolve(__dirname, '../common'),
            '@': path.resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: '../../dist/renderer', // Output to a common dist folder or just 'dist' inside renderer
        emptyOutDir: true
    },
    server: {
        port: 5173,
        strictPort: true
    }
});
