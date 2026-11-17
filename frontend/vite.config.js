import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({plugins:[tailwindcss()],base:'/static/console/',build:{outDir:'dist',emptyOutDir:true}});
