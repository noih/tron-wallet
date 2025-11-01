import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseParser from '@typescript-eslint/parser'
import esImport from 'eslint-plugin-import'
import perfectionist from 'eslint-plugin-perfectionist'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default [
  eslint.configs.recommended,
  stylistic.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.ts', '**/*.tsx']
  },
  {
    ignores: [
      '**/node_modules/**/*',
      '**/dist/**/*',
      '**/build/**/*',
      '**/libs/**/*',
      '**/__tests__/**/*',
      'src/public/**/*',
      'migrations/**/*',
      'scripts/**/*',
      'gulpfile.js',
      '*.config.js'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          module: true,
          legacyDecorators: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        log: 'readonly'
      }
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@src', './src'],
          ],
          extensions: ['.js', '.ts']
        }
      }
    },
    rules: {
      'arrow-body-style': 'off',
      'class-methods-use-this': 'off',
      'max-classes-per-file': 'off',
      'no-bitwise': 'off',
      'no-console': 'off',
      'no-continue': 'off',
      'no-empty': 'warn',
      'no-empty-pattern': 'warn',
      'no-fallthrough': 'warn',
      'no-nested-ternary': 'off',
      'no-param-reassign': 'warn',
      'no-restricted-exports': 'off',
      'no-restricted-syntax': 'off',
      'no-useless-catch': 'off',
      'no-useless-constructor': 'off',
      'no-unused-vars': 'off',
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'no-var': 'warn',
      'prefer-arrow-callback': 'off',
      'prefer-destructuring': 'off'
    }
  },
  {
    plugins: {
      import: esImport
    },
    rules: {
      'import/extensions': ['error', 'always', { ignorePackages: true }],
      'import/no-extraneous-dependencies': 'off',
      'import/prefer-default-export': 'off'
    }
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        MemberExpression: 1,
        flatTernaryExpressions: false,
        offsetTernaryExpressions: true,
        ObjectExpression: 1,
        VariableDeclarator: 1,
        ignoredNodes: [
          'TSUnionType',
          'TSIntersectionType',
          'TSTypeLiteral',
          'TSMappedType'
        ]
      }],
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/implicit-arrow-linebreak': 'off',
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/object-curly-newline': ['error', { multiline: true, consistent: true }],
      '@stylistic/operator-linebreak': ['error', 'before', {
        overrides: {
          '?': 'before',
          ':': 'before'
        }
      }],
      '@stylistic/max-len': 'off',
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/no-confusing-arrow': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/padded-blocks': ['off', 'never'],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: "always"
        }
      ],
      '@stylistic/semi': ['error', 'never']
    }
  },
  {
    plugins: {
      tseslint
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      '@typescript-eslint/class-literal-property-style': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-useless-constructor': 'warn',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTaggedTemplates: true
        }
      ],
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/return-await': 'off'
    }
  },
  {
    plugins: {
      perfectionist
    },
    rules: {
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-svelte-attributes': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-enums': 'off',
      'perfectionist/sort-union-types': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: [
            'conditional',
            'function',
            'import',
            'named',
            'operator',
            'intersection',
            'union',
            'object',
            'tuple',
            'literal',
            'keyword',
            'nullish',
            'unknown'
          ]
        }
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          environment: 'node',
          type: 'natural',
          order: 'asc',
          groups: [
            'react',
            ['builtin-type', 'external-type'],
            ['builtin', 'external'],
            'side-effect',
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'style',
            'object',
            'unknown'
          ],
          customGroups: {
            value: {
              react: ['react', 'react-*']
            },
            type: {
              react: ['react', 'react-*']
            }
          },
          ignoreCase: true,
          maxLineLength: undefined,
          newlinesBetween: 'always',
          internalPattern: ['@src/*', '@settlement/*'],
        }
      ]
    }
  }
]
