import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    /**
     * La couche WebGL doit rester supprimable : c'est ce qui garantit que
     * le palier Static fonctionne reellement plutot que d'etre suppose.
     * Restreinte partout sous src/, sauf les deux repertoires qui possedent
     * legitimement ce code : components/canvas/** et components/motion/**.
     */
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/canvas/**', 'src/components/motion/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['three', 'three/*', '@react-three/*', 'gsap', 'gsap/*', 'lenis'],
              message:
                'Les composants UI ne doivent dependre d aucun module WebGL/animation : le palier Static doit fonctionner sans eux. Placez ce code dans src/components/canvas/ ou src/components/motion/.',
            },
          ],
        },
      ],
    },
  },
);
