import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
  resolve: {
    alias: [
      { find: '@ats/supabase/client', replacement: path.resolve(__dirname, '../../packages/supabase/src/client.ts') },
      { find: '@ats/supabase/types', replacement: path.resolve(__dirname, '../../packages/supabase/src/database.types.ts') },
      { find: '@ats/supabase', replacement: path.resolve(__dirname, '../../packages/supabase/src/index.ts') },
      { find: '@ats/types', replacement: path.resolve(__dirname, '../../packages/types/src/index.ts') },
      { find: '@ats/ui', replacement: path.resolve(__dirname, '../../packages/ui/src/index.ts') },
    ],
  },
});
