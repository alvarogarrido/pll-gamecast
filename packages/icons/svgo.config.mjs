// svgo config used to normalise Figma exports.
// Run from packages/icons: npx svgo -f src/svg -r --config svgo.config.mjs
export default {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    {
      name: 'preset-default',
      // keep the viewBox; keep (non-minified) ids only where they are referenced (gradients)
      params: { overrides: { removeViewBox: false, cleanupIds: { minify: false } } },
    },
    'removeDimensions',
  ],
};
