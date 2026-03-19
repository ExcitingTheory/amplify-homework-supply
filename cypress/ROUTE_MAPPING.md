# Application Route Mapping

**Last Updated**: March 10, 2026  
**Purpose**: Quick reference for E2E test developers

---

## ✅ ACTUAL ROUTES (Use These in Tests)

| Route | File Location | Component | Purpose | Auth Required |
|-------|--------------|-----------|---------|---------------|
| `/` | `pages/index.jsx` | Home | Dashboard with assignments and grades | Yes |
| `/units` | `pages/units.jsx` | Units | List of all units (published/draft/archived) | Yes |
| `/unit/[id]` | `pages/unit/[id].jsx` | Editor3 | **Unit editor** (Lexical editor) | Yes |
| `/sections` | `pages/sections.jsx` | Sections | List of sections, create/join dialogs | Yes |
| `/section/[id]` | `pages/section/[id].jsx` | SectionDetail | Section detail **+ gradebook** | Yes |
| `/workbook/[id]` | `pages/workbook/[id].jsx` | Workbook | Student workbook view | Yes |
| `/profile` | `pages/profile.jsx` | Profile | User settings | Yes |

---

## ❌ ROUTES THAT DON'T EXIST

**Do NOT use these in tests - they will fail:**

| Incorrect Route | Why It's Wrong | Use This Instead |
|----------------|----------------|------------------|
| `/edit/[id]` | Route doesn't exist | `/unit/[id]` |
| `/sections/join` | No separate join page | `/sections` (join via dialog/input on this page) |
| `/grades` | No standalone grades page | `/section/[id]` (gradebook embedded here) |
| `/workbook` | Requires unit ID | `/workbook/[id]` |
| `/units/new` | No separate creation page | `/units` (auto-redirects on create) |
| `/sections/new` | No separate creation page | `/sections` (dialog on main page) |

---

## Route Behavior Patterns

### **Create Flows**

**Create Unit:**
```javascript
// User clicks create button on /units
cy.visit('/units');
cy.get('[data-tour="create-unit-button"]').click();

// AUTO-REDIRECTS to /unit/[new-id]
cy.url().should('include', '/unit/'); // ✅ 
cy.url().should('include', '/edit/'); // ❌ WRONG
```

**Create Section:**
```javascript
// User clicks create button on /sections
cy.visit('/sections');
cy.get('[data-tour="create-section-button"]').click();

// Dialog appears (NO REDIRECT)
cy.get('[data-tour="section-form"]').should('be.visible');
cy.get('input[name="name"]').type('My Section');
cy.contains('button', 'Create').click();

// STAYS ON /sections page
cy.url().should('eq', '/sections'); // ✅
```

---

## Nav Structure

### **Main Navigation** (MainToolbar component)
- Home (`/`)
- Units (`/units`)
- Sections (`/sections`)
- Profile (`/profile`)

### **No Direct Nav Links For:**
- Unit editors (accessed via units list)
- Section detail (accessed via sections list)
- Workbooks (accessed via assignment cards on home page)

---

## Data Flow Routes

### **Instructor Workflow**
```
/units → create → /unit/[id] (editor)
                ↓
          Save/Publish
                ↓
/sections → create section → assign unit
                ↓
/section/[id] → view gradebook
```

### **Learner Workflow**
```
/sections → join via code → section appears in list
               ↓
/ (home) → view assignment card → /workbook/[id]
               ↓
         Complete workbook
               ↓
/section/[id] → view own grade in gradebook
```

---

## URL Parameter Patterns

### **Dynamic ID Format**
All IDs are UUIDs:
```
/unit/a1b2c3d4-e5f6-7890-abcd-ef1234567890
/section/a1b2c3d4-e5f6-7890-abcd-ef1234567890
/workbook/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Extracting IDs in Tests:**
```javascript
cy.url().then((url) => {
  const match = url.match(/\/unit\/([a-f0-9-]+)/);
  if (match) {
    const unitId = match[1];
    cy.wrap(unitId).as('unitId');
  }
});
```

---

## Query Parameters

### **Currently Used:**
None observed in production routes

### **NOT Used:**
- `?edit=true` - NO separate edit mode
- `?view=student` - NO query param mode switching
- `?tab=grades` - NO query param tabs

**All routing is path-based, not query-based.**

---

## Redirection Patterns

### **After Login:**
- Redirects to `/` (home page)
- NOT to `/units` or any other page

### **After Create Unit:**
- Redirects to `/unit/[new-id]` (editor)
- NOT to a success page or back to units list

### **After Create Section:**
- STAYS on `/sections` page
- No redirect (dialog closes, section appears in list)

### **After Join Section:**
- STAYS on `/sections` page
- Section appears in user's list

---

## Testing Recommendations

### ✅ **DO:**
- Use exact route paths from this document
- Extract IDs from URLs after redirects
- Wait for redirects with `cy.url().should('include', ...)`
- Use `cy.visit('/relative/path')` (baseUrl handles the domain)

### ❌ **DON'T:**
- Hardcode full URLs with `http://localhost:3000`
- Assume routes exist without verifying in `pages/` directory
- Use invented query parameters
- Navigate to non-existent routes

---

## Route Testing Template

```javascript
describe('Route: /unit/[id]', () => {
  it('should navigate to unit editor', () => {
    // 1. Login
    cy.visit('/');
    // ... login flow ...
    
    // 2. Navigate to units list
    cy.visit('/units');
    cy.wait(2000);
    
    // 3. Create or select a unit
    cy.get('[data-tour="create-unit-button"]').click();
    
    // 4. Verify redirect to correct route
    cy.url({ timeout: 10000 }).should('include', '/unit/');
    
    // 5. Extract ID for later use
    cy.url().then((url) => {
      const match = url.match(/\/unit\/([a-f0-9-]+)/);
      expect(match).to.exist;
      cy.wrap(match[1]).as('unitId');
    });
    
    // 6. Verify editor loaded
    cy.get('[data-testid="editor"]', { timeout: 10000 })
      .should('be.visible');
  });
});
```

---

## Quick Reference: Test-to-Route Mapping

| Test Scenario | Route(s) Used | Key Selectors |
|--------------|---------------|---------------|
| Create unit | `/units` → `/unit/[id]` | `[data-tour="create-unit-button"]` |
| Edit unit | `/units` → `/unit/[id]` | Unit card → click |
| Create section | `/sections` (stays here) | `[data-tour="create-section-button"]`, `[data-tour="section-form"]` |
| Join section | `/sections` (stays here) | `input[name="code"]` |
| View gradebook | `/section/[id]` | Section card → click |
| Complete assignment | `/workbook/[id]` | Assignment card from `/` |
| View grades | `/section/[id]` | Gradebook table |

---

## Validation

This mapping was created by:
1. ✅ Reading all files in `pages/` directory
2. ✅ Testing actual navigation flows
3. ✅ Verifying component mounting
4. ✅ Checking `useRouter()` behavior in components

**All routes verified as of March 10, 2026.**
