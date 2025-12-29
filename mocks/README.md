# Mock Documents for Testing

This directory contains sample educational documents for testing the DocumentUploader and vocabulary/question extraction features.

## Available Documents

### 1. japanese-lesson-photosynthesis.txt
- **Language**: Japanese with English translations
- **Topic**: Biology - Photosynthesis
- **Content**: Comprehensive lesson on photosynthesis including:
  - Key vocabulary terms (葉緑体, クロロフィル, etc.)
  - Process descriptions
  - Chemical equations
  - Environmental factors
- **Best for**: Testing bilingual vocabulary extraction

### 2. science-lesson-water-cycle.md
- **Language**: English
- **Topic**: Earth Science - The Water Cycle
- **Content**: Detailed explanation of the hydrological cycle including:
  - 10+ key vocabulary terms with definitions
  - Stages of the cycle
  - Important concepts (residence time, water distribution)
  - Study questions
- **Best for**: Testing question generation and vocabulary extraction

### 3. philosophy-presocratics.txt
- **Language**: English
- **Topic**: Philosophy - Ancient Greek Pre-Socratic Philosophers
- **Content**: Comprehensive overview including:
  - 8 major philosophers with biographical information
  - Key concepts and vocabulary (arche, logos, nous, etc.)
  - 7 study questions
  - Philosophical legacy discussion
- **Best for**: Testing comprehension question generation

### 4. spanish-ar-verbs.txt
- **Language**: Spanish with English translations
- **Topic**: Language Learning - Spanish Regular -AR Verbs
- **Content**: Complete lesson on verb conjugation including:
  - 25+ verb vocabulary terms
  - Conjugation patterns
  - Example sentences
  - Common mistakes
- **Best for**: Testing vocabulary extraction with translations

### 5. biology-cell-structure.md
- **Language**: English
- **Topic**: Biology - Cell Structure and Function
- **Content**: Detailed textbook-style chapter including:
  - 50+ specialized vocabulary terms with definitions
  - Multiple sections (discovery, structures, transport)
  - Complex scientific concepts
- **Best for**: Testing technical vocabulary extraction

### 6. french-seasons-vocabulary.txt
- **Language**: French with English translations
- **Topic**: Language Learning - Seasons and Weather
- **Content**: Seasonal vocabulary lesson including:
  - 40+ vocabulary terms organized by season
  - Common expressions
  - Cultural notes
  - Comprehension questions
- **Best for**: Testing bilingual vocabulary with cultural context

### 7. biology-vocabulary-list.csv
- **Format**: CSV (Excel/Spreadsheet)
- **Topic**: Cell Biology Vocabulary
- **Content**: 25 cell biology terms with:
  - Definitions
  - Context examples
  - Category classification
  - Difficulty levels
- **Best for**: Testing spreadsheet vocabulary import

### 8. water-cycle-questions.csv
- **Format**: CSV (Excel/Spreadsheet)
- **Topic**: Water Cycle Comprehension Questions
- **Content**: 20 questions with:
  - Suggested answers
  - Difficulty ratings
  - Question types
  - Topic categorization
- **Best for**: Testing spreadsheet question import

### 9. spanish-verbs-vocabulary.csv
- **Format**: CSV (Excel/Spreadsheet)
- **Topic**: Spanish AR-Verb Vocabulary
- **Content**: 25 verbs with:
  - Spanish/English translations
  - Example sentences
  - Conjugation patterns
  - Categories
- **Best for**: Testing bilingual spreadsheet vocabulary

### 10. philosophy-questions.csv
- **Format**: CSV (Excel/Spreadsheet)
- **Topic**: Pre-Socratic Philosophy Questions
- **Content**: 20 questions with:
  - Suggested answers
  - Difficulty levels
  - Question types
  - Associated philosophers
- **Best for**: Testing complex question import from spreadsheet

## Testing Recommendations

### For Vocabulary Extraction
All documents contain clearly marked vocabulary with definitions. Best tests:
- **Technical terms**: biology-cell-structure.md, biology-vocabulary-list.csv
- **Bilingual content**: japanese-lesson-photosynthesis.txt, spanish-ar-verbs.txt, french-seasons-vocabulary.txt, spanish-verbs-vocabulary.csv
- **Context usage**: science-lesson-water-cycle.md
- **Spreadsheet format**: biology-vocabulary-list.csv, spanish-verbs-vocabulary.csv

### For Question Generation
Documents with built-in questions and clear topic divisions:
- science-lesson-water-cycle.md (has "Questions to Consider")
- philosophy-presocratics.txt (has "Study Questions")
- french-seasons-vocabulary.txt (has "Questions de Compréhension")
- **Spreadsheet format**: water-cycle-questions.csv, philosophy-questions.csv

### Expected Extraction Results

Each document should yield approximately:
- **Text documents**: 15-50 vocabulary terms, 5-15 questions depending on content
- **Spreadsheets**: Exact count matches number of rows (minus header)
- **Difficulty levels**: Mix of basic definitions and comprehension questions

### Testing Different File Formats

1. **Text files (.txt)** - Test basic text parsing
2. **Markdown files (.md)** - Test structured document parsing with headers
3. **CSV files (.csv)** - Test spreadsheet import with column mapping
4. **Word files (.docx)** - After conversion, test document parser (requires Pandoc conversion)
5. **PDF files (.pdf)** - After conversion, test PDF text extraction (requires Pandoc conversion)

## File Formats

Documents are provided in multiple formats:
- **.txt** - Plain text format, good for testing basic extraction
- **.md** - Markdown format with structured headings and formatting
- **.csv** - Comma-separated values (spreadsheet format) for structured data

All formats should be handled by the DocumentUploader component.

## Converting Markdown Files to Other Formats

The `.md` files can be converted to PDF and Word (.doc/.docx) formats using [Pandoc](https://pandoc.org/), a universal document converter.

### Installation

**macOS:**
```bash
brew install pandoc

# For PDF with Unicode support (recommended):
brew install --cask mactex  # Full TeX distribution with XeLaTeX

# OR for smaller install:
brew install basictex       # Basic TeX (may have issues with Unicode)

brew install weasyprint          # Alternative PDF engine (html)
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install pandoc

# For PDF with Unicode support:
sudo apt-get install texlive-xetex texlive-fonts-recommended
```

**Windows:**
Download the installer from [pandoc.org/installing.html](https://pandoc.org/installing.html)

### Conversion Commands

**Convert Markdown to Word (.docx):**
```bash
# Single file
pandoc science-lesson-water-cycle.md -o science-lesson-water-cycle.docx

# All markdown files at once
for file in *.md; do pandoc "$file" -o "${file%.md}.docx"; done
```

**Convert Markdown to PDF:**
```bash
# Single file (use xelatex for Unicode support)
pandoc science-lesson-water-cycle.md -o science-lesson-water-cycle.pdf --pdf-engine=xelatex

# All markdown files at once (with Unicode support)
for file in *.md; do pandoc "$file" -o "${file%.md}.pdf" --pdf-engine=xelatex; done

# If xelatex is not available, skip README and files with Unicode
for file in *.md; do
    if [ "$file" != "README.md" ]; then
        pandoc "$file" -o "${file%.md}.pdf" --pdf-engine=xelatex 2>/dev/null || echo "Skipping $file (Unicode error)"
    fi
done
```

> **Note:** For documents with Japanese, Greek, or other non-Latin characters, you must use `--pdf-engine=xelatex` instead of the default pdflatex engine. Install XeLaTeX with `brew install --cask mactex` (macOS) or `sudo apt-get install texlive-xetex` (Linux).

**Convert Markdown to Word with custom styling:**
```bash
pandoc science-lesson-water-cycle.md -o science-lesson-water-cycle.docx \
  --reference-doc=custom-template.docx
```

**Convert to PDF with table of contents:**
```bash
pandoc science-lesson-water-cycle.md -o science-lesson-water-cycle.pdf \
  --pdf-engine=xelatex --toc --toc-depth=2
```

**Alternative: Convert to PDF via HTML (no LaTeX required):**
```bash
# Simpler option that handles all Unicode automatically
pandoc science-lesson-water-cycle.md -o science-lesson-water-cycle.pdf -t html5

# All files at once
for file in *.md; do pandoc "$file" -o "${file%.md}.pdf" -t html5; done
```

### Quick Conversion Script

Create a file called `convert-all.sh` in the mocks directory:

```bash
#!/bin/bash
# Convert all markdown files to PDF and DOCX

for file in *.md; do
    if [ "$file" != "README.md" ]; then
        echo "Converting $file..."
        
        # Word conversion (always works)
        pandoc "$file" -o "${file%.md}.docx"
        
        # PDF conversion with Unicode support
        # Try xelatex first, fall back to HTML method
        if pandoc "$file" -o "${file%.md}.pdf" --pdf-engine=xelatex 2>/dev/null; then
            echo "  ✓ PDF created with xelatex"
        elif pandoc "$file" -o "${file%.md}.pdf" -t html5 2>/dev/null; then
            echo "  ✓ PDF created via HTML"
        else
            echo "  ✗ PDF conversion failed for $file"
        fi
    fi
done

echo "Conversion complete!"
```

Make it executable and run:
```bash
chmod +x convert-all.sh
./convert-all.sh
```

### Opening Spreadsheets in Different Applications

**CSV files** can be opened with:
- Microsoft Excel
- Google Sheets (File → Import)
- LibreOffice Calc
- Apple Numbers

**Converting CSV to Excel (.xlsx):**
You can use Python with pandas:
```bash
pip install pandas openpyxl
python3 -c "import pandas as pd; pd.read_csv('biology-vocabulary-list.csv').to_excel('biology-vocabulary-list.xlsx', index=False)"
```

Or open in Excel/Numbers and "Save As" .xlsx format.

## Usage

To test the document upload feature:
1. Navigate to the DictionaryEditor or QuestionEditor
2. Switch to the "Upload Document" tab
3. Drag and drop or select one of these mock documents
4. Wait for processing
5. Check the "Suggested Vocabulary" or "Suggested Questions" tab
6. Verify extracted content matches expectations

## Notes

- All documents are educational and copyright-free for testing purposes
- Content is structured to facilitate easy parsing
- Vocabulary terms are clearly formatted with bold text, definitions, and examples
- Questions are explicitly marked in dedicated sections
- Multiple languages represented to test internationalization
