import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    server: {
        proxy: {
            '/data/': 'https://esistwarm.jetzt',
            '/station_data/': 'https://esistwarm.jetzt'
        }
    },
    plugins: [
        react(),
        tailwindcss(),
        nodePolyfills({
            // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
            include: ['process'],
            globals: { global: true, process: true },
        }),
    ]
});