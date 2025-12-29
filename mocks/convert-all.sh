#!/bin/bash
# Convert all markdown files to PDF and DOCX
# Handles Unicode characters properly

for file in *.md; do
    if [ "$file" != "README.md" ]; then
        echo "Converting $file..."
        
        # Word conversion (always works)
        pandoc "$file" -o "${file%.md}.docx"
        echo "  ✓ DOCX created"
        
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

echo ""
echo "Conversion complete!"
echo "Created files:"
ls -1 *.docx *.pdf 2>/dev/null | grep -v README
