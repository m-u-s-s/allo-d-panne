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
     * Un composant UI qui importe Three.js casse cette garantie en
     * silence — la regle le rattrape a l'edition, pas au test.
     *
     * Le canvas racine du Plan 2 vivra dans src/components/canvas/**,
     * qui n'est pas couvert par cette regle.
     */
    files: ['src/components/ui/**/*.{ts,tsx}'],
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
