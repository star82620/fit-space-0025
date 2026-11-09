import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages 發布在 /fit-space-0025/ 底下；只在打包時套用，本機開發與測試仍使用根路徑。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fit-space-0025/' : '/',
  plugins: [react(), tailwindcss()],
}));
