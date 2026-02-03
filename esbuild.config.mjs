import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // Handle @components/* imports
    build.onResolve({ filter: /^@components\// }, (args) => {
      const newPath = args.path.replace('@components/', 'src/components/');
      return { path: path.resolve(__dirname, newPath + '.ts') };
    });

    // Handle @mocks/* imports
    build.onResolve({ filter: /^@mocks\// }, (args) => {
      const newPath = args.path.replace('@mocks/', 'mocks/');
      return { path: path.resolve(__dirname, newPath + '.ts') };
    });

    // Handle @/* imports
    build.onResolve({ filter: /^@\// }, (args) => {
      const newPath = args.path.replace('@/', 'src/');
      return { path: path.resolve(__dirname, newPath + '.ts') };
    });
  },
};

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/init.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  target: 'es2015',
  format: 'iife',
  minify: true,
  plugins: [aliasPlugin],
  define: {
    'process.env.MOCKED_FALLBACK_VIDEO_URL': JSON.stringify(process.env.MOCKED_FALLBACK_VIDEO_URL || ''),
    'process.env.MOVIES_FOLDER': JSON.stringify(process.env.MOVIES_FOLDER || ''),
    'process.env.PLAYER_NAME': JSON.stringify(process.env.PLAYER_NAME || 'videoTag'),
  },
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('Build complete!');
}
