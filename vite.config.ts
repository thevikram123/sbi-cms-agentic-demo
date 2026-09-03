import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const repoName = process.env.GITHUB_REPOSITORY
    ? '/' + process.env.GITHUB_REPOSITORY.split('/')[1]
    : '';
  const primaryVideoPath = process.env.PRIMARY_VIDEO_PATH || env.PRIMARY_VIDEO_PATH;
  return {
    base: repoName + '/',
    plugins: [react(), tailwindcss(), {
      name: 'private-evidence-dev-route',
      configureServer(server) {
        server.middlewares.use('/__evidence/primary.mp4', (_req, res, next) => {
          if (!primaryVideoPath || !fs.existsSync(primaryVideoPath)) return next();
          const size = fs.statSync(primaryVideoPath).size;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Length', size);
          res.setHeader('Cache-Control', 'private, max-age=0');
          fs.createReadStream(primaryVideoPath).pipe(res);
        });
      },
    }],
    define: {
      'process.env.BASE_URL': JSON.stringify(repoName),
      'import.meta.env.VITE_WORKER_URL': JSON.stringify(process.env.VITE_WORKER_URL || env.VITE_WORKER_URL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
