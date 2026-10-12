import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    // Game logic must run on server time (useServerNow), never on the device clock.
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'Use useServerNow() from @/api/queries instead of the device clock.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'new Date() reads the device clock. Use useServerNow() from @/api/queries.',
        },
      ],
    },
  },
  { ignores: ['.next/**', 'out/**', 'next-env.d.ts'] },
];

export default eslintConfig;
