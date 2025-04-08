import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/',
    plugins: [react()],
    server: {
        host: true,
        port: 5173
    },
    build: {
        assetsDir: '',
        rollupOptions: {
            output: {
                assetFileNames: '[name].[hash][extname]'
            }
        }
    }
})