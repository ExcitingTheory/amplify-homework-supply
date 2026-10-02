# Translation Verification Report

Generated: 2026-10-01T01:08:54.623Z

## Summary

- **Total files scanned**: 144
- **Total translation calls**: 1526
- **Existing keys**: 1526
- **Missing keys added**: 0
- **Namespace mismatches**: 6
- **Files calling useTranslations()/getTranslations() with no namespace**: 0

## ⚠️ Namespace Mismatches

These keys exist in a different namespace file than expected. This may indicate:
- Wrong `useTranslations()` namespace in the component
- Key should be moved to the correct namespace file
- Duplicate keys across namespaces

### common.cancel

- **Expected namespace**: `common`
- **Found in namespace**: `components`
- **Used in**:
  - `src/components/AssignmentComposer.jsx`

### sectionDetail.assignUnit

- **Expected namespace**: `common`
- **Found in namespace**: `pages`
- **Used in**:
  - `src/components/Section/NeedsAttention.jsx`

### table.addColumn

- **Expected namespace**: `common`
- **Found in namespace**: `editor.shared`
- **Used in**:
  - `src/components/Editor3/plugins/TableHoverActionsPlugin.tsx`

### table.addRow

- **Expected namespace**: `common`
- **Found in namespace**: `editor.shared`
- **Used in**:
  - `src/components/Editor3/plugins/TableHoverActionsPlugin.tsx`

### common.cancel

- **Expected namespace**: `pages`
- **Found in namespace**: `components`
- **Used in**:
  - `app/[locale]/squads/page.jsx`

### sectionDetail.studentHeader

- **Expected namespace**: `pages`
- **Found in namespace**: `common`
- **Used in**:
  - `app/[locale]/section/[id]/SectionDetailClient.jsx`

