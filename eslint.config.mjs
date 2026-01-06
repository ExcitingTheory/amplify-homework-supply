import i18next from 'eslint-plugin-i18next';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: await import('@babel/eslint-parser').then(mod => mod.default),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
    },
    plugins: {
      i18next,
    },
    rules: {
      'i18next/no-literal-string': [
        'warn',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            exclude: [
              'className',
              'style',
              'type',
              'id',
              'name',
              'key',
              'ref',
              'href',
              'src',
              'alt',
              'role',
              'aria-label',
              'aria-labelledby',
              'aria-describedby',
              'data-testid',
              'variant',
              'color',
              'size',
              'align',
              'position',
              'direction',
              'spacing',
              'component',
              'to',
              'icon',
              'edge',
              'severity',
              'level',
              'contentType',
              'accept',
              'method',
              'target',
              'rel',
              'placeholder',
              'inputMode',
              'autoComplete',
              'enterKeyHint',
              'title',
              'slot',
              'part',
            ],
          },
          'jsx-components': {
            exclude: ['Icon', 'IconButton', 'SvgIcon', 'MenuItem', 'Option'],
          },
          ignore: [
            '^\\s*$', // Empty strings
            '^[0-9]+$', // Numbers only
            '^[0-9.]+$', // Numbers with decimals
            '^[A-Z_]+$', // All caps (constants)
            '^[a-z-]+$', // Kebab case (CSS)
            '^[a-z]+[A-Z][a-zA-Z]*$', // camelCase
            '\\$\\{.*\\}', // Template literals
            '^/', // Paths
            '^https?://', // URLs
            '^#', // Hashes
            '^\\.', // Dot notation
            '^data:', // Data URLs
            '^blob:', // Blob URLs
            '^@', // Decorators/scoped packages
            'px$', // CSS units
            '%$',
            'em$',
            'rem$',
            'vh$',
            'vw$',
            'deg$',
            ': ', // CSS properties like "padding: '1rem'" or "display: 'flex'"
            'blur\\(', // CSS filters
            'translate\\(', // CSS transforms
            'scale\\(', // CSS transforms
            'rotate\\(', // CSS transforms
            'solid', // CSS values
            'auto', // CSS values
            'none', // CSS values
            'flex', // CSS values
            'center', // CSS values
            'left', // CSS values
            'right', // CSS values
            'top', // CSS values
            'bottom', // CSS values
            'fit-content', // CSS values
            '^console\\.', // Console methods
            'gradesForUnit',
            'assignments',
          ],
          ignoreCallee: [
            'console.log',
            'console.warn',
            'console.error',
            'console.info',
            'console.debug',
            'require',
            'require.resolve',
            'DataStore',
            'DataStore.query',
            'DataStore.save',
            'DataStore.delete',
            'DataStore.observe',
            'DataStore.observeQuery',
            'JSON.stringify',
            'JSON.parse',
            'new Date',
            'Date',
            'Math',
            'Number',
            'parseInt',
            'parseFloat',
            'Boolean',
            'String',
            'Array',
            'Object',
            'Error',
            'TypeError',
            'Promise',
            'setTimeout',
            'setInterval',
            'clearTimeout',
            'clearInterval',
            'fetch',
            'URL',
            'URLSearchParams',
            'localStorage.getItem',
            'localStorage.setItem',
            'sessionStorage.getItem',
            'sessionStorage.setItem',
          ],
          ignoreProperty: [
            'key',
            'id',
            'type',
            'name',
            'className',
            'style',
            'props',
            'state',
            'ref',
            'displayName',
            'propTypes',
            'defaultProps',
            'contextType',
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'amplify/**',
      'cypress/**',
      'public/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      '.storybook/**',
    ],
  },
  {
    files: [
      '**/*.stories.{js,jsx,ts,tsx}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
    ],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },
];
