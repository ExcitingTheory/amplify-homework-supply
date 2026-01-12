# DataStore Observe Query Analysis

## Summary
This document analyzes all DataStore observe queries in the codebase to identify:
1. Queries that can be replaced with join table queries
2. Redundant queries
3. Optimization opportunities

## ManyToMany Relations & Join Tables

The schema includes the following ManyToMany join tables:
- **QuestionUnit** - Links Questions ↔ Units
- **QuestionWord** - Links Questions ↔ Words
- **QuestionFile** - Links Questions ↔ Files
- **DocumentQuestion** - Links Documents ↔ Questions
- **UnitFile** - Links Units ↔ Files
- **WordFile** - Links Words ↔ Files
- **UnitWord** - Links Units ↔ Words
- **UnitDocument** - Links Units ↔ Documents
- **DocumentWord** - Links Documents ↔ Words

## Current Observe Queries Inventory

### 1. **pages/index.js** - Multiple Redundant Queries
**Location**: Lines 157-258

#### Issues Found:
- **4 separate observe queries** that could be consolidated:
  - `Grade` observed at line 157
  - `Assignment` observed at line 172 (for user's own)
  - `Assignment` observed at line 200 (for others)
  - `Grade` observed at line 213 (again!)
  - `Section` observed at line 227 (for others)
  - `Section` observed at line 241 (for user's own)
  - `Unit` observed at line 258

#### Redundancies:
1. **DUPLICATE**: Grade is observed **twice** (lines 157 & 213) - these queries fetch the same data
2. **DUPLICATE**: Section is observed **twice** (lines 227 & 241) - similar pattern to Grade
3. **DUPLICATE**: Assignment is observed **twice** (lines 172 & 200) - same pattern

#### Recommendations:
```javascript
// ❌ BEFORE - Redundant queries
useEffect(() => {
  const subscription = DataStore.observe(Grade).subscribe(() => fetchMyGrades())
  return () => subscription.unsubscribe();
}, [])

useEffect(() => {
  const subscription = DataStore.observe(Grade).subscribe(() => fetchGrades())
  return () => subscription.unsubscribe();
}, [])

// ✅ AFTER - Single query with client-side filtering
useEffect(() => {
  async function fetchAllGrades() {
    const myUserId = user.username
    const allGrades = await DataStore.query(Grade)
    
    // Split client-side
    const myGrades = allGrades.filter(g => g.owner === myUserId)
    const otherGrades = allGrades.filter(g => g.owner !== myUserId)
    
    setMyGradeMap(processMyGrades(myGrades))
    setGrades(otherGrades)
  }
  
  const subscription = DataStore.observe(Grade).subscribe(() => fetchAllGrades())
  return () => subscription.unsubscribe();
}, [])
```

### 2. **src/context/unitContext.js** - Efficient Use of Join Tables
**Location**: Lines 285-442

#### Current Implementation: ✅ GOOD
```javascript
const _unitWords = await _newUnit.words.toArray()  // Uses UnitWord join table
const _unitFiles = await _newUnit.files.toArray()  // Uses UnitFile join table
const _unitQuestions = await _newUnit.questions.toArray()  // Uses QuestionUnit join table
```

**Status**: Already optimized - using lazy loading through join tables. No changes needed.

### 3. **src/context/dictionaryContext.js** - Global Queries
**Location**: Lines 320-375

#### Current Implementation:
```javascript
DataStore.observeQuery(Word).subscribe(({ items }) => { ... })
DataStore.observeQuery(Question).subscribe(({ items }) => { ... })
```

#### Analysis:
- These are **global dictionary lookups** (no filters)
- Cannot be replaced with join tables since they need ALL words/questions
- **No redundancy** - each serves a distinct purpose

**Status**: Appropriate use case. No changes needed.

### 4. **src/context/sectionContext.js** - Filtered Queries
**Location**: Lines 23-68

#### Current Implementation:
```javascript
DataStore.observeQuery(Section, s => s.owner.eq(username)).subscribe(...)
DataStore.observeQuery(Assignment, s => s.unitID.eq(unitId)).subscribe(...)
```

#### Analysis:
- Uses predicates to filter data
- **Assignment query by unitID** - this is appropriate since Assignment has a direct `unitID` field (not a join table relationship)
- No join tables available for these queries

**Status**: Appropriate use case. No changes needed.

### 5. **src/components/ChatSidebar.js** - Duplicate Queries
**Location**: Lines 108-117

#### Issues Found:
```javascript
DataStore.observe(Section).subscribe(() => fetchSections())  // Line 108
DataStore.observeQuery(Document).subscribe(({ items }) => { ... })  // Line 117
```

#### Recommendations:
- The `Section` observe here may be redundant if `sectionContext.js` is also being used
- Check if ChatSidebar is wrapped in SectionProvider - if so, **remove this query** and use context instead

### 6. **pages/units.js** - Multiple Unit Queries
**Location**: Lines 95-124

#### Issues Found:
```javascript
DataStore.observe(Unit).subscribe(() => fetchPublishedUnits())  // Line 95
DataStore.observe(Unit).subscribe(() => fetchArchivedUnits())   // Line 108
DataStore.observe(Unit).subscribe(() => fetchDraftUnits())      // Line 124
```

#### Redundancies:
- **3 separate subscriptions** to the same `Unit` model
- All trigger on ANY unit change, even if status doesn't match

#### Recommendations:
```javascript
// ✅ BETTER - Single query with client-side filtering
useEffect(() => {
  async function fetchAllUnits() {
    const unitData = await DataStore.query(Unit)
    
    setPublishedUnits(unitData.filter(u => u.status === 'PUBLISHED'))
    setArchivedUnits(unitData.filter(u => u.status === 'ARCHIVED'))
    setDraftUnits(unitData.filter(u => u.status === 'DRAFT' || !u.status))
  }
  
  const subscription = DataStore.observe(Unit).subscribe(() => fetchAllUnits())
  return () => subscription.unsubscribe();
}, [])
```

### 7. **src/components/Editor3/** - Settings & Documents
**Location**: Various files

```javascript
// FileManager.js:877
DataStore.observeQuery(Settings).subscribe(...)

// FileManager.js:899
DataStore.observeQuery(Document).subscribe(...)

// ConfigurationManager.js:52
DataStore.observeQuery(Settings).subscribe(...)
```

#### Issues Found:
- **Settings is observed in 2 different components** (FileManager & ConfigurationManager)
- Should use a **SettingsContext** (which already exists at `src/context/settingsContext.js`!)

#### Recommendations:
- **Remove** Settings queries from FileManager and ConfigurationManager
- Use the existing SettingsContext instead

### 8. **Other Files** - Minor Usage
```javascript
// src/components/VocabularyReview.js:67
DataStore.observeQuery(ParsedContent).subscribe(...)

// src/context/fileContext.js:143
DataStore.observeQuery(File).subscribe(...)

// src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js:204
DataStore.observe(Question).subscribe(...)
```

**Status**: These are component-specific queries with specific purposes. No obvious redundancies.

---

## Recommendations Summary

### 🔴 HIGH PRIORITY - Remove Redundancies

#### 1. pages/index.js - Consolidate Duplicate Queries
**Impact**: Reduces subscription overhead by 50%

**Current**: 7 observe queries
**Proposed**: 4 observe queries (consolidate duplicates)

- Merge the two `Grade` observers (lines 157 & 213)
- Merge the two `Section` observers (lines 227 & 241)
- Merge the two `Assignment` observers (lines 172 & 200)

#### 2. pages/units.js - Consolidate Unit Queries
**Impact**: Reduces subscription overhead by 66%

**Current**: 3 observe queries on Unit
**Proposed**: 1 observe query with client-side filtering

#### 3. src/components/Editor3/ - Use SettingsContext
**Impact**: Eliminates redundant Settings subscriptions

**Current**: Settings queried in 3 places (2 components + context)
**Proposed**: Only query in SettingsContext, consume via context

### 🟡 MEDIUM PRIORITY - Potential Optimizations

#### 4. src/components/ChatSidebar.js
- Verify if Section query is redundant with SectionContext
- If yes, remove and use context instead

### 🟢 LOW PRIORITY - Already Optimized

The following are already using best practices:
- ✅ **src/context/unitContext.js** - Properly using join tables for Unit relations
- ✅ **src/context/dictionaryContext.js** - Global queries are appropriate
- ✅ **src/context/sectionContext.js** - Filtered queries are appropriate

---

## Join Table Query Opportunities

### ❌ No Direct Replacements Available

After analyzing the codebase, **none of the current observe queries can be directly replaced with join table queries** because:

1. **Most queries fetch parent models**, not relationships:
   - `DataStore.observe(Grade)` - fetches Grade records
   - `DataStore.observe(Unit)` - fetches Unit records
   - `DataStore.observe(Word)` - fetches Word records

2. **Join tables are already used correctly**:
   - In `unitContext.js`, join tables (UnitWord, UnitFile, QuestionUnit) are accessed via lazy loading: `unit.words.toArray()`
   - This is the **correct pattern** for ManyToMany relationships

3. **Join table queries would be used for different scenarios**:
   ```javascript
   // Use join table when you need: "Get all Units that contain a specific Word"
   const unitsWithWord = await DataStore.query(UnitWord, uw => uw.wordId.eq(someWordId))
   
   // Current queries need: "Get all Words" or "Get all Units"
   // These don't benefit from join table queries
   ```

---

## Implementation Priority

### Phase 1: Quick Wins (Immediate)
1. Consolidate duplicate observers in `pages/index.js`
2. Consolidate Unit observers in `pages/units.js`
3. Remove Settings queries from Editor3 components, use SettingsContext

**Expected Impact**: ~40% reduction in active subscriptions

### Phase 2: Review & Cleanup (Next sprint)
1. Audit ChatSidebar.js Section query
2. Review all components for context usage opportunities
3. Document best practices for team

### Phase 3: Monitoring (Ongoing)
1. Monitor DataStore performance improvements
2. Review sync logs for subscription overhead
3. Consider implementing a subscription manager utility

---

## Best Practices Going Forward

1. **Use Contexts for Shared State**
   - If multiple components need the same data, create a context
   - Already have: UnitContext, SectionContext, DictionaryContext, SettingsContext

2. **Consolidate Filters Client-Side**
   - If you need the same model filtered differently, use one query + client-side filtering
   - More efficient than multiple subscriptions

3. **Join Tables are for Relationships, Not Entities**
   - Use `unit.words.toArray()` for lazy loading (current approach ✅)
   - Don't query join tables directly unless you need relationship metadata

4. **Subscription Hygiene**
   - Always unsubscribe in cleanup functions
   - Avoid creating subscriptions in loops
   - Use `observeQuery` for filtered data, `observe` for single-item watching
