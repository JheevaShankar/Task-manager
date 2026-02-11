// Simple script to create placeholder icon files
// In production, replace these with actual designed icons

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon
const createSVGIcon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#3B82F6"/>
  <text x="50%" y="50%" font-size="${size * 0.6}" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">✓</text>
</svg>
`;

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Generate SVG icons
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = path.join(publicDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('Icon generation complete!');
console.log('Note: For production, convert these SVG files to PNG using an online converter or image processing tool.');
