const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const mediaDir = '/Users/colinbarrett-fox/Downloads/media';
const outputFile = '.storybook/__mocks__/featuredImagesCropped.json';

// Target dimensions for cropped images (smaller for cards)
const TARGET_WIDTH = 300;
const TARGET_HEIGHT = 200;

console.log('Cropping and converting images to base64...\n');

async function cropAndConvertImages() {
  const files = fs.readdirSync(mediaDir).filter(f => f.endsWith('.jpg'));
  const base64Images = {};

  for (const file of files) {
    const filePath = path.join(mediaDir, file);
    
    // Load the image
    const image = await loadImage(filePath);
    
    // Create canvas with target dimensions
    const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
    const ctx = canvas.getContext('2d');
    
    // Calculate crop dimensions (center crop)
    const sourceAspect = image.width / image.height;
    const targetAspect = TARGET_WIDTH / TARGET_HEIGHT;
    
    let sx, sy, sWidth, sHeight;
    
    if (sourceAspect > targetAspect) {
      // Source is wider - crop width
      sHeight = image.height;
      sWidth = image.height * targetAspect;
      sx = (image.width - sWidth) / 2;
      sy = 0;
    } else {
      // Source is taller - crop height
      sWidth = image.width;
      sHeight = image.width / targetAspect;
      sx = 0;
      sy = (image.height - sHeight) / 2;
    }
    
    // Draw cropped and resized image
    ctx.drawImage(
      image,
      sx, sy, sWidth, sHeight,  // source rectangle
      0, 0, TARGET_WIDTH, TARGET_HEIGHT  // destination rectangle
    );
    
    // Convert to base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality
    
    // Create a friendly name
    const name = file
      .replace(/shutterstock_/, '')
      .replace(/\s*\(.*?\)\s*/, '')
      .replace(/\.jpg$/, '');
    
    base64Images[name] = dataUrl;
    
    console.log(`✓ ${file} -> ${name}`);
    console.log(`  Original: ${image.width}x${image.height}`);
    console.log(`  Cropped: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
    console.log(`  Size: ${(dataUrl.length / 1024).toFixed(1)} KB`);
    console.log('');
  }

  // Write to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(base64Images, null, 2));

  console.log(`✓ Saved ${files.length} cropped images to ${outputFile}`);
  console.log(`\nTotal size: ${(JSON.stringify(base64Images).length / 1024 / 1024).toFixed(1)} MB`);
  console.log('\nImage names:');
  Object.keys(base64Images).forEach(name => console.log(`  - ${name}`));
}

cropAndConvertImages().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
