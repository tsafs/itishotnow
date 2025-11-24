import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    server: {
        proxy: {
            '/data': {
                target: 'https://esistwarm.jetzt',
                changeOrigin: true,
                secure: false,
            },
            '/station_data': {
                target: 'https://esistwarm.jetzt',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    plugins: [
        react(),
        nodePolyfills({
            // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
            include: ['process'],
            globals: { global: true, process: true },
        }),
    ]
});