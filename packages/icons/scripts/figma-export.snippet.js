// Paste into a use_figma call (fileKey zVmzXfi3vTia4o8Apl1aoQ). READ-ONLY: only exports.
// Exports a batch of variant nodes as compact SVG inner markup, one `id|markup` per line.
// Keep the returned string under ~20KB per call: raise START to continue where `next` says.
const START = 0, LIMIT = 18500;
const ids = ['18:4108' /* ...node ids from scripts/manifest.json... */];
let out = '', i = START;
for (; i < ids.length; i++) {
  const n = await figma.getNodeByIdAsync(ids[i]);
  let s = await n.exportAsync({ format: 'SVG_STRING' });
  s = s
    .replace(/^<svg[^>]*>\s*/, '').replace(/<\/svg>\s*$/, '').replace(/\n/g, '')
    .replace(/ fill="white"/g, '') // glyphs are exported white; the shell supplies currentColor
    .replace(/(\d+\.\d{3,})/g, (m) => String(+(+m).toFixed(2)));
  const line = ids[i] + '|' + s + '\n';
  if (out.length + line.length > LIMIT) break;
  out += line;
}
return JSON.stringify({ next: i, total: ids.length, out });
