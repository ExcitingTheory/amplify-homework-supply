# Graded Blocks Test Attributes Reference

Test attributes (`data-testid`) for interacting with graded block components in Cypress tests.

## Answer Block (Vocabulary-based)

**File:** `src/components/Editor3/components/AnswerComponent.jsx`

### Input Field

```typescript
cy.get('[data-testid="answer-input"]');
cy.get('[data-testid="answer-input"][data-word-id="word-123"]');
```

### Submit Button

```typescript
cy.get('[data-testid="answer-submit-button"]');
cy.get('[data-testid="answer-submit-button"][data-word-id="word-123"]');
```

### Usage Example

```typescript
// Fill in answer for a specific word
cy.get('[data-testid="answer-input"]').first().type("My answer text");

// Submit the answer
cy.get('[data-testid="answer-submit-button"]').first().click();
```

---

## Custom Answer Block (Custom prompts)

**File:** `src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerComponent.jsx`

### Input Field

```typescript
cy.get('[data-testid="custom-answer-input"]');
cy.get('[data-testid="custom-answer-input"][data-question-id="question-456"]');
```

### Submit Button

```typescript
cy.get('[data-testid="custom-answer-submit-button"]');
cy.get(
  '[data-testid="custom-answer-submit-button"][data-question-id="question-456"]',
);
```

### Usage Example

```typescript
// Fill in answer for a specific question
cy.get('[data-testid="custom-answer-input"]').type("My custom answer");

// Submit the answer
cy.get('[data-testid="custom-answer-submit-button"]').click();
```

---

## Quiz Block (Multiple Choice)

**File:** `src/components/Editor3/components/QuizComponent.jsx`

### Block Container

```typescript
cy.get('[data-tour="quiz-block"]');
```

### Answer Checkboxes

```typescript
cy.get('[data-tour="quiz-answers"] input[type="checkbox"]');
```

### Usage Example

```typescript
// Select first answer choice
cy.get('[data-tour="quiz-answers"] input[type="checkbox"]').first().click();

// Quiz automatically grades when enough answers are selected
```

---

## Meaning Association Block (Drag & Drop)

**Files:**

- `src/components/MeaningAssociationExercise/DragBox.jsx`
- `src/components/MeaningAssociationExercise/index.jsx`

### Draggable Items

```typescript
cy.get('[data-testid="drag-box"]');
cy.get('[data-testid="drag-box"][data-word-id="word-789"]');
cy.get('[data-testid="drag-box"][data-answer="こんにちは"]');
```

### Drop Targets (Learn Mode)

```typescript
cy.get('[data-testid="drop-target-learn"]');
cy.get('[data-testid="drop-target-learn"][data-word-id="word-789"]');
cy.get('[data-testid="drop-target-learn"][data-is-matched="true"]');
```

### Drop Targets (Easy/Hard Mode)

```typescript
cy.get('[data-testid="drop-target"]');
cy.get('[data-testid="drop-target"][data-word-id="word-789"]');
```

### Usage Example (Cypress Drag & Drop)

```typescript
// Note: Drag & drop in Cypress requires the @4tw/cypress-drag-drop plugin
// Install: npm install --save-dev @4tw/cypress-drag-drop

// Option 1: Using Cypress drag command
cy.get('[data-testid="drag-box"]').first().drag('[data-testid="drop-target"]');

// Option 2: Using mouse events
cy.get('[data-testid="drag-box"]').first().trigger("dragstart");

cy.get('[data-testid="drop-target"]').first().trigger("drop");
```

---

## Complete Workbook Test Example

```typescript
describe("Workbook Exercise Completion", () => {
  it("completes all graded blocks", () => {
    // Navigate to workbook
    cy.visit("/workbook/unit-id-123");

    // Wait for content to load
    cy.get('[data-tour="workbook-content"]').should("be.visible");

    // Complete Answer block
    cy.get('[data-testid="answer-input"]').first().type("Test answer");
    cy.get('[data-testid="answer-submit-button"]').first().click();

    // Complete Custom Answer block
    cy.get('[data-testid="custom-answer-input"]')
      .first()
      .type("Custom test answer");
    cy.get('[data-testid="custom-answer-submit-button"]').first().click();

    // Complete Quiz block
    cy.get('[data-tour="quiz-answers"] input[type="checkbox"]').first().click();

    // Verify progress
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text).to.match(/\d+\s*of\s*\d+/); // Should show progress like "3 of 4"
    });
  });
});
```

---

## Notes

1. **Automatic Grading**: All blocks automatically update grade data when completed
2. **Progress Tracking**: Progress is tracked in `Grade.data` JSON structure
3. **Drag & Drop**: Requires additional Cypress plugin for proper automation
4. **Audio Blocks**: Not yet implemented with test selectors (future enhancement)
5. **Drawing Blocks**: Not yet implemented with test selectors (future enhancement)

---

## See Also

- [cypress/e2e/workbook-spec.cy.ts](e2e/workbook-spec.cy.ts) - Example workbook test
- [cypress/e2e/learner-workflow.cy.ts](e2e/learner-workflow.cy.ts) - Learner completing exercises
- [src/context/unitContext.js](../src/context/unitContext.js) - Grade data structure
