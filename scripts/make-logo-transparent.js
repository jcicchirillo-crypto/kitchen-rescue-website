// One-off: convert logo-light.png's dark background to transparent, preserving
// the red icon and white wordmark. Outputs logo-email.png (white logo on
// transparent) for use on dark email headers.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const src = path.join(__dirname, '..', 'public', 'assets', 'logo-light.png');
const out = path.join(__dirname, '..', 'public', 'assets', 'logo-email.png');

const png = PNG.sync.read(fs.readFileSync(src));
const { data, width, height } = png;

for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const isRed = r > 100 && r > g * 1.5 && r > b * 1.5;
    if (isRed) {
        // Keep the red icon as-is, fully opaque
        data[i + 3] = 255;
        continue;
    }
    // Everything else (white text + dark background): treat as greyscale.
    // Alpha follows luminance so the dark bg fades to transparent while the
    // white text stays opaque, with feathered anti-aliased edges.
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let alpha = lum;
    if (alpha < 18) alpha = 0; // fully clear the background
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
    data[i + 3] = Math.round(Math.min(255, alpha));
}

// Crop to the content bounding box (remove the large transparent margins around
// the square logo) so it renders as a compact wordmark in the email header.
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const a = data[(y * width + x) * 4 + 3];
        if (a > 12) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
}
const pad = 6;
minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1;
const cropped = new PNG({ width: cw, height: ch });
for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
        const si = ((y + minY) * width + (x + minX)) * 4;
        const di = (y * cw + x) * 4;
        cropped.data[di] = data[si];
        cropped.data[di + 1] = data[si + 1];
        cropped.data[di + 2] = data[si + 2];
        cropped.data[di + 3] = data[si + 3];
    }
}
fs.writeFileSync(out, PNG.sync.write(cropped));
console.log('Wrote', out, `cropped to ${cw}x${ch} (from ${width}x${height})`);
