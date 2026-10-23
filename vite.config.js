import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        signup: resolve(__dirname, 'signup.html'),
        login: resolve(__dirname, 'login.html'),
        fiche: resolve(__dirname, 'fiche.html'),
        aide: resolve(__dirname, 'aide.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
