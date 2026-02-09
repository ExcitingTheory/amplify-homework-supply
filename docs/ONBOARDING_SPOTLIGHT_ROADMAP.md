# Onboarding Spotlight Implementation Roadmap

Complete roadmap for implementing spotlight tours across the entire application.

## 📊 Current Status

| Component | Status | Priority | Estimated Time |
|-----------|--------|----------|----------------|
| **Core System** | ✅ Complete | - | - |
| SpotlightOverlay | ✅ Built & tested | - | - |
| Spotlight Configs | ✅ All 28 tasks configured | - | - |
| OnboardingPanel | ✅ Integrated | - | - |
| Documentation | ✅ Complete | - | - |
| **UI Integration** | ⚠️ Pending | - | - |
| Sections Page | ⚠️ To Do | **High** | 2 hours |
| Units Page | ⚠️ To Do | **High** | 1 hour |
| Editor | ⚠️ To Do | **High** | 3 hours |
| Dictionary Editor | ⚠️ To Do | Medium | 2 hours |
| Chat Sidebar | ⚠️ To Do | Medium | 1 hour |
| Workbook | ⚠️ To Do | **High** | 2 hours |
| Grades View | ⚠️ To Do | **High** | 1 hour |
| Assignments | ⚠️ To Do | **High** | 1.5 hours |
| Help/Shortcuts | ⚠️ To Do | Low | 1 hour |
| Storybook Nav | ⚠️ To Do | Low | 0.5 hours |

**Total Estimated Time**: ~15 hours

---

## 🎯 Implementation Phases

### Phase 1: Core Instructor Flow (Priority 1) 
**Goal**: Enable full instructor onboarding journey  
**Time**: ~7.5 hours  
**Impact**: High - enables primary user flow

#### Tasks
1. **Sections Page** (2 hours)
   - [ ] Add `data-tour="sections-page"` to page container
   - [ ] Add `data-tour="create-section-button"` to Create button
   - [ ] Add `data-tour="section-form"` to creation form
   - [ ] Add `data-tour="join-code"` to join code display
   - [ ] Add `data-tour="section-card"` to section cards
   - [ ] Add `data-tour="assignments-tab"` to Assignments tab
   - [ ] Add `data-tour="grades-tab"` to Grades tab
   - [ ] Test: instructor-setup-class spotlight
   - [ ] Test: learner-view-assignments spotlight

2. **Units Page** (1 hour)
   - [ ] Add `data-tour="units-page"` to page container
   - [ ] Add `data-tour="create-unit-button"` to Create button
   - [ ] Add `data-tour="units-list"` to units grid
   - [ ] Test: instructor-create-unit spotlight

3. **Editor** (3 hours)
   - [ ] Add `data-tour="editor"` to ContentEditable
   - [ ] Add `data-tour="editor-toolbar"` to toolbar
   - [ ] Add `data-tour="save-button"` to Save button
   - [ ] Add `data-tour="quiz-block"` to QuizNode
   - [ ] Add `data-tour="quiz-answers"` to answers container
   - [ ] Add `data-tour="correct-checkbox"` to correct answer checkbox
   - [ ] Test: instructor-create-unit spotlight
   - [ ] Test: instructor-add-quiz spotlight

4. **Assignments** (1.5 hours)
   - [ ] Add `data-tour="section-view"` to section detail page
   - [ ] Add `data-tour="create-assignment-button"` to Create button
   - [ ] Add `data-tour="unit-selector"` to unit dropdown
   - [ ] Add `data-tour="due-date-picker"` to date picker
   - [ ] Add `data-tour="assignment-settings"` to settings panel
   - [ ] Add `data-tour="assignments-list"` to assignments list
   - [ ] Test: instructor-create-assignment spotlight
   - [ ] Test: learner-view-assignments spotlight

**Phase 1 Deliverable**: Instructor can create section → create unit → add quiz → assign work

---

### Phase 2: Learner Flow (Priority 1)
**Goal**: Enable student onboarding journey  
**Time**: ~3 hours  
**Impact**: High - enables student experience

#### Tasks
5. **Workbook** (2 hours)
   - [ ] Add `data-tour="workbook"` to workbook page
   - [ ] Add `data-tour="quiz-question"` to question containers
   - [ ] Add `data-tour="submit-button"` to Submit button
   - [ ] Add `data-tour="results"` to results/score display
   - [ ] Test: learner-complete-assignment spotlight

6. **Grades View** (1 hour)
   - [ ] Add `data-tour="grades-list"` to grades list
   - [ ] Add `data-tour="grade-card"` to grade cards
   - [ ] Add `data-tour="grade-detail"` to detail view
   - [ ] Add `data-tour="correct-answers"` to answer key
   - [ ] Add `data-tour="my-grades"` to learner grades section
   - [ ] Test: instructor-view-grades spotlight
   - [ ] Test: learner-review-feedback spotlight

**Phase 2 Deliverable**: Learner can join class → view assignments → complete work → review feedback

---

### Phase 3: Enhanced Features (Priority 2)
**Goal**: Add support features  
**Time**: ~3 hours  
**Impact**: Medium - improves user experience

#### Tasks
7. **Dictionary Editor** (2 hours)
   - [ ] Add `data-tour="dictionary-editor"` to page
   - [ ] Add `data-tour="add-word-button"` to Add button
   - [ ] Add `data-tour="word-form"` to word form
   - [ ] Add `data-tour="audio-upload"` to file input
   - [ ] Add `data-tour="dictionary"` to dictionary page
   - [ ] Add `data-tour="word-card"` to vocabulary cards
   - [ ] Add `data-tour="play-audio"` to audio buttons
   - [ ] Test: instructor-create-vocabulary spotlight
   - [ ] Test: learner-practice-vocabulary spotlight

8. **Chat Sidebar** (1 hour)
   - [ ] Add `data-tour="chat-button"` to chat toggle
   - [ ] Add `data-tour="chat-sidebar"` to chat panel
   - [ ] Add `data-tour="chat-input"` to message input
   - [ ] Add `data-tour="ai-message"` to AI messages
   - [ ] Add `data-tour="insert-button"` to Insert buttons
   - [ ] Test: instructor-use-ai-assistant spotlight
   - [ ] Test: learner-use-chat-help spotlight

**Phase 3 Deliverable**: Full feature set with AI and vocabulary support

---

### Phase 4: Developer Onboarding (Priority 2)
**Goal**: Help developers learn the codebase  
**Time**: ~1.5 hours  
**Impact**: Medium - developer experience

#### Tasks
9. **Storybook Navigation** (0.5 hours)
   - [ ] Add `data-tour="storybook-sidebar"` to Storybook sidebar
   - [ ] Add `data-tour="tech-overview"` to overview page
   - [ ] Add `data-tour="docs-tab"` to Docs tab
   - [ ] Add `data-tour="canvas-tab"` to Canvas tab
   - [ ] Add `data-tour="editor-stories"` to Editor section
   - [ ] Test: developer-explore-components spotlight
   - [ ] Test: developer-understand-editor spotlight

10. **Help & Shortcuts** (1 hour)
    - [ ] Add `data-tour="help-menu"` to Help menu
    - [ ] Add `data-tour="shortcuts-page"` to shortcuts reference
    - [ ] Add `data-tour="shortcuts-demo"` to demo story
    - [ ] Add `data-tour="help-shortcuts"` to help page
    - [ ] Test: instructor-learn-shortcuts spotlight
    - [ ] Test: learner-learn-shortcuts spotlight
    - [ ] Test: developer-keyboard-shortcuts-demo spotlight

**Phase 4 Deliverable**: Complete developer onboarding experience

---

### Phase 5: Secret/Gamification (Priority 3)
**Goal**: Add fun achievement elements  
**Time**: Variable (requires new features)  
**Impact**: Low - engagement boost

#### Tasks
11. **Interactive Keyboard Training** (TBD)
    - [ ] Build interactive training mode component
    - [ ] Add `data-tour="interactive-training"` attribute
    - [ ] Implement achievement system UI
    - [ ] Test: secret-keyboard-master spotlight
    - [ ] Test: secret-speed-demon spotlight
    - [ ] Test: secret-achievement-hunter spotlight

**Phase 5 Deliverable**: Gamified keyboard shortcut learning

---

## 📋 Implementation Checklist Template

Use this for each component you implement:

### Component Name: _________________

#### Planning
- [ ] Read spotlight config for related tasks
- [ ] Identify all required `data-tour` attributes
- [ ] Plan attribute placement in component tree
- [ ] Review fallback selectors needed

#### Implementation
- [ ] Add `data-tour` attributes to component
- [ ] Verify attributes in browser DevTools
- [ ] Ensure elements are stable (not conditional)
- [ ] Add attributes to dialogs/modals if needed

#### Testing
- [ ] Open Storybook OnboardingPanel
- [ ] Select appropriate persona
- [ ] Click each related task
- [ ] Verify spotlight highlights correct element
- [ ] Check tooltip positioning (adjust if off-screen)
- [ ] Test step navigation (Next/Skip/Complete)
- [ ] Verify task completion tracking
- [ ] Test in both Tutorial and Quiz modes

#### Documentation
- [ ] Update component README with `data-tour` attributes
- [ ] Add comments explaining spotlight integration
- [ ] Update Storybook story with examples

#### Review
- [ ] No console errors during spotlight tour
- [ ] All steps highlight correctly
- [ ] Tooltips are readable and positioned well
- [ ] Navigation works smoothly
- [ ] Tour completes successfully
- [ ] Code reviewed by team member

---

## 🚀 Quick Win Strategy

**Week 1**: Phase 1 Tasks 1-2 (Sections + Units)  
**Week 2**: Phase 1 Tasks 3-4 (Editor + Assignments)  
**Week 3**: Phase 2 (Workbook + Grades)  
**Week 4**: Phase 3 (Dictionary + Chat)  
**Week 5**: Phase 4 (Developer onboarding)

**Result**: Full onboarding system live in 5 weeks

---

## 📊 Success Metrics

Track these metrics after each phase:

### Quantitative
- [ ] All tasks have working spotlight tours
- [ ] 100% of required `data-tour` attributes added
- [ ] Zero console errors during tours
- [ ] < 2 second delay for any spotlight step
- [ ] Tooltips visible on all screen sizes

### Qualitative
- [ ] User feedback positive
- [ ] Support questions decrease
- [ ] Feature adoption increases
- [ ] Onboarding time reduced

---

## 🛠️ Tools & Resources

### Development
```bash
# Start Storybook
npm run storybook

# Test spotlight tours
# Navigate to OnboardingPanel → Select persona → Click task

# Check data-tour coverage
grep -r "data-tour=" src/

# Find missing attributes for a component
grep -r "ComponentName" .storybook/code/spotlight-configs.ts
```

### DevTools Console
```javascript
// Monitor spotlight events
document.addEventListener('spotlight-step-changed', console.log);

// Check current spotlight state
window.__SPOTLIGHT_DEBUG__ = true; // Enable debug mode
```

### Reference Documents
- [Task Reference](./ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md) - All tasks and required attributes
- [Quick Start](./ONBOARDING_SPOTLIGHT_QUICK_START.md) - 5-minute guide
- [Implementation Guide](./ONBOARDING_SPOTLIGHT_IMPLEMENTATION.md) - Complete guide

---

## 🎨 Visual Priority Matrix

```
     HIGH IMPACT          │     LOW IMPACT
                          │
  Sections ✅🔥           │   Help/Shortcuts ⚠️
  Units ✅🔥              │   Storybook Nav ⚠️
  Editor ✅🔥             │   Secret Tasks ⏸️
  Workbook ✅🔥           │
  Assignments ✅🔥        │
  Grades ✅🔥             │
─────────────────────────┼──────────────────────
HIGH   Dictionary ⚠️     │
EFFORT Chat ⚠️           │   (Quick wins)
                         │
─────────────────────────┴──────────────────────
   HIGH EFFORT           │   LOW EFFORT
```

**Legend**:
- 🔥 = High priority
- ✅ = System ready (pending `data-tour` attributes)
- ⚠️ = Medium priority
- ⏸️ = Low priority

---

## 💡 Pro Tips

1. **Start with one complete flow**: Implement Sections → Units → Editor first to see full instructor journey
2. **Test as you go**: Don't wait until all attributes are added - test each component individually
3. **Use fallback selectors**: Add text-based selectors as backups in spotlight configs
4. **Check mobile**: Verify tooltips position correctly on smaller screens
5. **Document as you build**: Update README files when adding attributes
6. **Get feedback early**: Show stakeholders after Phase 1 for course corrections

---

## 🔄 Iteration Process

For each component:

```
1. Add data-tour attributes
   ↓
2. Test in OnboardingPanel
   ↓
3. Issues found?
   ├─ Yes → Adjust attributes or config → Retest
   └─ No → Document & move to next
```

---

## 📞 Need Help?

| Issue | Solution |
|-------|----------|
| Spotlight not highlighting | Check DevTools for `data-tour` attribute |
| Tooltip off-screen | Update `tooltipPosition` in config |
| Wrong element highlighted | Make `data-tour` more specific |
| Element not stable | Target parent container instead |
| Multiple matches | Use unique ID in `data-tour` |

---

## 🎉 Completion Celebration

Once all phases are complete:
- [ ] All 28 tasks have working spotlight tours
- [ ] All required `data-tour` attributes added
- [ ] Full test suite passing
- [ ] Documentation updated
- [ ] Demo created for stakeholders
- [ ] Analytics tracking implemented
- [ ] User feedback collected
- [ ] Team trained on system

**Status**: ⚠️ In Progress  
**Target Completion**: [Set your date]  
**Current Phase**: Phase 0 (System Built, Pending UI Integration)

---

**Last Updated**: February 6, 2026  
**Maintained By**: Development Team  
**Version**: 1.0.0
