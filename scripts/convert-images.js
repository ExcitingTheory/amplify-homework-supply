const fs = require('fs');
const path = require('path');

const mediaDir = '/Users/colinbarrett-fox/Downloads/media';
const outputFile = '.storybook/__mocks__/featuredImages.json';

console.log('Converting images to base64...\n');

const files = fs.readdirSync(mediaDir).filter(f => f.endsWith('.jpg'));
const base64Images = {};

files.forEach((file, index) => {
  const filePath = path.join(mediaDir, file);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64}`;
  
  // Create a friendly name
  const name = file
    .replace(/shutterstock_/, '')
    .replace(/\s*\(.*?\)\s*/, '')
    .replace(/\.jpg$/, '');
  
  base64Images[name] = dataUrl;
  
  console.log(`✓ ${file} -> ${name}`);
  console.log(`  Original: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`  Base64: ${(base64.length / 1024).toFixed(1)} KB`);
  console.log('');
});

// Write to JSON file
fs.writeFileSync(outputFile, JSON.stringify(base64Images, null, 2));

console.log(`✓ Saved ${files.length} images to ${outputFile}`);
console.log('\nImage names:');
Object.keys(base64Images).forEach(name => console.log(`  - ${name}`));
