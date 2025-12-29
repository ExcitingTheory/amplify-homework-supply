# Base64 Data URLs for Mock Files Guide

This guide explains how to create base64 data URLs from your mock files and where to use them in Storybook stories.

## What are Base64 Data URLs?

Base64 data URLs embed file content directly in the URL string using the format:
```
data:[mediatype];base64,[base64-encoded-data]
```

Example:
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAE...
```

## Why Use Base64 Data URLs in Mocks?

1. **Self-contained**: No external file dependencies
2. **Storybook-friendly**: Works in isolated component stories
3. **No S3 dependency**: Avoids AWS infrastructure in development
4. **Consistent testing**: Same data every time
5. **Offline support**: Works without internet connection

## Converting Mock Files to Base64 Data URLs

### 1. Using Command Line Tools

#### macOS/Linux - Using `base64` command:
```bash
# Navigate to the mocks directory
cd mocks

# Convert a single file
base64 -i science-lesson-water-cycle.pdf -o science-lesson-water-cycle.base64

# For images
base64 -i kanji-chart.jpg -o kanji-chart.base64

# For audio (if you have sample audio files)
base64 -i pronunciation-guide.mp3 -o pronunciation-guide.base64
```

#### Creating Data URLs from Base64:
```bash
# Get the MIME type first
file --mime-type science-lesson-water-cycle.pdf
# Output: science-lesson-water-cycle.pdf: application/pdf

# Create the data URL
echo "data:application/pdf;base64,$(cat science-lesson-water-cycle.base64)" > science-lesson-water-cycle.dataurl
```

#### One-liner to create data URL directly:
```bash
# For PDF
echo "data:application/pdf;base64,$(base64 -i science-lesson-water-cycle.pdf)" > science-lesson-water-cycle.dataurl

# For JPEG image
echo "data:image/jpeg;base64,$(base64 -i sample-image.jpg)" > sample-image.dataurl

# For MP3 audio
echo "data:audio/mpeg;base64,$(base64 -i sample-audio.mp3)" > sample-audio.dataurl

# For PNG image
echo "data:image/png;base64,$(base64 -i chart.png)" > chart.dataurl

# For CSV/text files
echo "data:text/csv;base64,$(base64 -i biology-vocabulary-list.csv)" > biology-vocabulary-list.dataurl

# For Word documents (.docx)
echo "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,$(base64 -i document.docx)" > document.dataurl
```

### 2. Using Node.js Script

Create a conversion script `convert-to-base64.js` in the mocks directory:

```javascript
const fs = require('fs');
const path = require('path');

// MIME type mapping
const mimeTypes = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.md': 'text/markdown'
};

function convertFileToDataURL(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    return null;
  }
}

function convertAllFiles() {
  const files = fs.readdirSync('.');
  const conversions = [];
  
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    
    // Skip certain files
    if (file.startsWith('.') || 
        file === 'README.md' || 
        file === 'convert-to-base64.js' ||
        file === 'BASE64_MOCK_GUIDE.md' ||
        ext === '.base64' ||
        ext === '.dataurl' ||
        ext === '.sh') {
      return;
    }
    
    console.log(`Converting ${file}...`);
    const dataURL = convertFileToDataURL(file);
    
    if (dataURL) {
      const outputFile = `${path.parse(file).name}.dataurl`;
      fs.writeFileSync(outputFile, dataURL);
      
      conversions.push({
        originalFile: file,
        size: fs.statSync(file).size,
        mimeType: mimeTypes[ext] || 'application/octet-stream',
        dataURLFile: outputFile,
        dataURL: dataURL.substring(0, 100) + '...' // Truncated for display
      });
      
      console.log(`  ✓ Created ${outputFile}`);
    }
  });
  
  // Generate summary JSON
  fs.writeFileSync('conversions-summary.json', JSON.stringify(conversions, null, 2));
  console.log(`\nConversion complete! Generated ${conversions.length} data URLs.`);
  console.log('Summary saved to conversions-summary.json');
}

// Run if called directly
if (require.main === module) {
  convertAllFiles();
}

module.exports = { convertFileToDataURL, convertAllFiles };
```

Run the script:
```bash
cd mocks
node convert-to-base64.js
```

### 3. Using Python Script

Create `convert_to_base64.py`:

```python
import os
import base64
import json
from pathlib import Path

MIME_TYPES = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.md': 'text/markdown'
}

def convert_file_to_data_url(file_path):
    """Convert a file to a data URL string."""
    try:
        with open(file_path, 'rb') as file:
            file_content = file.read()
        
        base64_data = base64.b64encode(file_content).decode('utf-8')
        file_ext = Path(file_path).suffix.lower()
        mime_type = MIME_TYPES.get(file_ext, 'application/octet-stream')
        
        return f"data:{mime_type};base64,{base64_data}"
    except Exception as e:
        print(f"Error converting {file_path}: {e}")
        return None

def convert_all_files():
    """Convert all eligible files in current directory to data URLs."""
    conversions = []
    
    for file_path in Path('.').iterdir():
        if (file_path.is_file() and 
            not file_path.name.startswith('.') and
            file_path.name not in ['README.md', 'convert_to_base64.py', 'BASE64_MOCK_GUIDE.md'] and
            file_path.suffix.lower() not in ['.base64', '.dataurl', '.sh', '.py']):
            
            print(f"Converting {file_path.name}...")
            data_url = convert_file_to_data_url(file_path)
            
            if data_url:
                output_file = f"{file_path.stem}.dataurl"
                
                with open(output_file, 'w') as f:
                    f.write(data_url)
                
                conversions.append({
                    'originalFile': file_path.name,
                    'size': file_path.stat().st_size,
                    'mimeType': MIME_TYPES.get(file_path.suffix.lower(), 'application/octet-stream'),
                    'dataURLFile': output_file,
                    'dataURL': data_url[:100] + '...'  # Truncated for display
                })
                
                print(f"  ✓ Created {output_file}")
    
    # Save summary
    with open('conversions-summary.json', 'w') as f:
        json.dump(conversions, f, indent=2)
    
    print(f"\nConversion complete! Generated {len(conversions)} data URLs.")
    print("Summary saved to conversions-summary.json")

if __name__ == "__main__":
    convert_all_files()
```

Run the script:
```bash
cd mocks
python3 convert_to_base64.py
```

## Using Base64 Data URLs in Storybook

### 1. In Mock File Seeds

Add to [`.storybook/__mocks__/aws-amplify-datastore.js`](.storybook/__mocks__/aws-amplify-datastore.js):

```javascript
// Add new mock files with base64 data URLs
seedMockFiles([
  {
    id: 'mock-textbook-pdf',
    name: 'science-lesson-water-cycle.pdf',
    path: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8...',
    mimeType: 'application/pdf',
    size: 2097152,
    identityId: 'mock-identity-id',
    owner: 'mock-user-sub',
    _version: 1,
  },
  {
    id: 'mock-kanji-image',
    name: 'japanese-kanji-chart.jpg', 
    path: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQ...',
    mimeType: 'image/jpeg',
    size: 786432,
    identityId: 'mock-identity-id',
    owner: 'mock-user-sub',
    _version: 1,
  },
  {
    id: 'mock-pronunciation-audio',
    name: 'french-pronunciation-guide.mp3',
    path: 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAdhgAKCg...',
    mimeType: 'audio/mpeg',
    size: 1048576,
    identityId: 'mock-identity-id',
    owner: 'mock-user-sub',
    waveformData: JSON.stringify([0.1,0.3,0.5,0.7,0.9,1.0,0.9,0.7,0.5,0.3]),
    _version: 1,
  }
]);
```

### 2. In Individual Story Files

For document upload stories:

```javascript
// In DictionaryEditor.stories.jsx or similar
export const WithMockDocument = {
  loaders: [
    async () => {
      // Seed mock file with base64 data URL from your mocks
      seedMockFiles([{
        id: 'story-mock-file',
        name: 'biology-vocabulary-list.csv',
        path: 'data:text/csv;base64,V29yZCxEZWZpbml0aW9uLENvbnRleHQKY2VsbCxiYXNpYyB1bml0IG9mIGxpZmU...',
        mimeType: 'text/csv',
        size: 2048,
        identityId: 'mock-identity-id',
        owner: 'mock-user-sub',
        _version: 1,
      }]);
    }
  ],
  render: () => <DictionaryEditor />,
};
```

For file manager stories:

```javascript
// In FileManager.stories.jsx
export const WithVariousFileTypes = {
  loaders: [
    async () => {
      seedMockFiles([
        {
          id: 'file-pdf-1',
          name: 'philosophy-presocratics.pdf',
          path: 'data:application/pdf;base64,...', // Your converted PDF
          mimeType: 'application/pdf',
          size: 1500000,
        },
        {
          id: 'file-img-1',
          name: 'vocabulary-chart.png',
          path: 'data:image/png;base64,...', // Your converted image
          mimeType: 'image/png',
          size: 512000,
        },
        {
          id: 'file-audio-1',
          name: 'spanish-pronunciation.mp3',
          path: 'data:audio/mpeg;base64,...', // Your converted audio
          mimeType: 'audio/mpeg',
          size: 800000,
          waveformData: JSON.stringify([/* waveform data */]),
        }
      ]);
    }
  ],
  render: () => <FileManager />,
};
```

### 3. In SeedData Helpers

Add to [`.storybook/__mocks__/seedData.js`](.storybook/__mocks__/seedData.js):

```javascript
// Add helper function for realistic file mocks
export const seedRealisticMockFiles = {
  async withTextbookFiles({ identityId, owner }) {
    const { seedMockFiles } = await import('./aws-amplify-datastore');
    
    seedMockFiles([
      {
        id: 'textbook-chapter-1',
        name: 'japanese-lesson-photosynthesis.pdf',
        path: 'data:application/pdf;base64,...', // Base64 from your converted mock
        mimeType: 'application/pdf',
        size: 1024000,
        identityId: identityId || 'us-east-1:mock-123',
        owner: owner || 'test-user',
        _version: 1,
      },
      {
        id: 'vocabulary-csv',
        name: 'biology-vocabulary-list.csv',
        path: 'data:text/csv;base64,...', // Base64 from your CSV
        mimeType: 'text/csv',
        size: 4096,
        identityId: identityId || 'us-east-1:mock-123',
        owner: owner || 'test-user',
        _version: 1,
      }
    ]);
  }
};
```

## Directory Structure for Base64 Files

Create this organization in your mocks folder:

```
mocks/
├── README.md                           # Current README
├── BASE64_MOCK_GUIDE.md               # This guide
├── convert-to-base64.js               # Node.js conversion script
├── convert_to_base64.py               # Python conversion script
├── 
├── # Original files
├── biology-cell-structure.md
├── japanese-lesson-photosynthesis.txt
├── science-lesson-water-cycle.pdf
├── spanish-ar-verbs.txt
├── biology-vocabulary-list.csv
├── ...
├── 
├── # Generated base64 data URLs
├── biology-cell-structure.dataurl
├── japanese-lesson-photosynthesis.dataurl
├── science-lesson-water-cycle.dataurl
├── spanish-ar-verbs.dataurl
├── biology-vocabulary-list.dataurl
├── ...
├── 
└── conversions-summary.json           # Summary of all conversions
```

## Common MIME Types for Educational Content

| File Extension | MIME Type | Use Case |
|---------------|-----------|----------|
| `.pdf` | `application/pdf` | Textbooks, worksheets, study guides |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Word documents |
| `.doc` | `application/msword` | Legacy Word documents |
| `.txt` | `text/plain` | Plain text lessons |
| `.md` | `text/markdown` | Markdown lessons |
| `.csv` | `text/csv` | Vocabulary lists, question sets |
| `.jpg`, `.jpeg` | `image/jpeg` | Photos, charts, diagrams |
| `.png` | `image/png` | Screenshots, graphics, transparent images |
| `.gif` | `image/gif` | Simple animations, diagrams |
| `.mp3` | `audio/mpeg` | Pronunciation guides, listening exercises |
| `.wav` | `audio/wav` | High-quality audio recordings |
| `.mp4` | `video/mp4` | Video lessons, demonstrations |

## Best Practices

### 1. File Size Considerations
- **Keep files small**: Base64 increases size by ~33%
- **Compress images**: Use JPEG for photos, PNG for graphics
- **Limit audio**: Use MP3 compression for audio samples
- **PDF optimization**: Use tools to reduce PDF file size

### 2. Naming Conventions
- Use descriptive names: `japanese-kanji-chart.jpg`
- Include content type: `biology-vocabulary-list.csv`
- Add context: `spanish-pronunciation-guide.mp3`

### 3. Organization
- Keep original files for reference
- Store `.dataurl` files separately
- Maintain a conversion summary JSON
- Update base64 when original files change

### 4. Performance
- Lazy load large files in stories
- Use smaller sample files for fast iteration
- Consider truncated versions for development

## Example: Complete Workflow

1. **Create a new educational image**:
   ```bash
   # Add kanji-chart.jpg to mocks/
   ls mocks/kanji-chart.jpg
   ```

2. **Convert to base64 data URL**:
   ```bash
   cd mocks
   echo "data:image/jpeg;base64,$(base64 -i kanji-chart.jpg)" > kanji-chart.dataurl
   ```

3. **Get the data URL content**:
   ```bash
   cat kanji-chart.dataurl
   # data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...
   ```

4. **Add to Storybook mock**:
   ```javascript
   // In .storybook/__mocks__/aws-amplify-datastore.js
   {
     id: 'kanji-chart-file',
     name: 'kanji-chart.jpg',
     path: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...', // Paste full data URL
     mimeType: 'image/jpeg',
     size: 786432,
     identityId: 'mock-identity-id',
     owner: 'mock-user-sub',
     _version: 1,
   }
   ```

5. **Use in story**:
   ```javascript
   export const WithKanjiChart = {
     render: () => <ImageViewer fileId="kanji-chart-file" />,
   };
   ```

## Troubleshooting

### File Too Large Error
If base64 conversion creates very large strings:
- Compress original files first
- Use smaller sample files for mocks
- Consider external hosting for very large assets

### Invalid Base64 Data
If you get base64 decode errors:
- Check for line breaks in the data URL
- Ensure proper MIME type
- Verify base64 encoding is complete

### MIME Type Issues
If files don't display correctly:
- Verify MIME type matches file extension
- Check browser developer console for errors
- Test data URL directly in browser address bar

## Automation Scripts

### Quick Convert Script
Create `quick-convert.sh` in mocks folder:

```bash
#!/bin/bash
# Quick convert a single file to data URL

if [ $# -eq 0 ]; then
    echo "Usage: ./quick-convert.sh <filename>"
    echo "Example: ./quick-convert.sh biology-chart.jpg"
    exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
    echo "File not found: $FILE"
    exit 1
fi

# Get MIME type
MIME=$(file --brief --mime-type "$FILE")
echo "Converting $FILE (MIME: $MIME)..."

# Create data URL
echo "data:$MIME;base64,$(base64 -i "$FILE")" > "${FILE%.*}.dataurl"
echo "✓ Created ${FILE%.*}.dataurl"

# Show truncated preview
echo "Preview: $(head -c 100 "${FILE%.*}.dataurl")..."
```

Usage:
```bash
chmod +x quick-convert.sh
./quick-convert.sh spanish-verbs.csv
```

This comprehensive guide should help you create and use base64 data URLs effectively in your Storybook mocks!