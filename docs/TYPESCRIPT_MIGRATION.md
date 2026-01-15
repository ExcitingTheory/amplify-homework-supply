# TypeScript Migration Guide

This guide outlines the strategy and implementation details for migrating our JavaScript codebase to TypeScript.

## 🎯 Migration Goals

1. **Improve Code Quality**: Add type safety to prevent runtime errors
2. **Better Developer Experience**: Enhanced IDE support and autocomplete
3. **Maintainability**: Easier refactoring and code navigation
4. **Documentation**: Types serve as inline documentation
5. **Team Scalability**: Easier onboarding for new developers

## 📊 Current State Analysis

### Existing TypeScript Files
- `src/API.ts` - Auto-generated GraphQL types ✅
- `src/graphql/*.ts` - GraphQL operations ✅
- `amplify/backend/types/*.d.ts` - Amplify type definitions ✅
- `cypress.config.ts` - Test configuration ✅
- `next-env.d.ts` - Next.js type definitions ✅

### JavaScript Files to Migrate (~100+ files)
- `pages/*.js` - Next.js pages
- `src/components/*.js` - React components  
- `src/context/*.js` - React contexts
- `src/models/*.js` - Data models
- `src/utils/*.js` - Utility functions

### Current tsconfig.json Status
```json
{
  "compilerOptions": {
    "strict": false,     // ⚠️ Need to enable
    "allowJs": true,     // ✅ Good for migration
    "skipLibCheck": true // ✅ Helps with dependencies
  }
}
```

## 🛣️ Migration Strategy: Gradual Conversion

We've chosen **gradual migration** over rewrite for the following reasons:

### Why Gradual Migration?
- ✅ **Lower Risk**: Can test each component individually
- ✅ **Parallel Work**: Can happen alongside bug fixes and features
- ✅ **Easier Rollback**: Can revert individual files if issues arise
- ✅ **Timeline Compatible**: Fits our tight end-of-year deadline
- ✅ **Learning Opportunity**: Team learns TypeScript incrementally

### Why Not Ground-Up Rewrite?
- ❌ **High Risk**: Could introduce new bugs
- ❌ **Time Consuming**: Would require 6-8 weeks minimum
- ❌ **Resource Intensive**: Would block other critical work
- ❌ **Testing Overhead**: Would need to re-test everything

## 📋 Migration Plan (4 Weeks)

### Week 1: Foundation & Configuration
**Target Files**: Configuration and utility functions

#### Day 1-2: TypeScript Configuration
```json
// Updated tsconfig.json
{
  "compilerOptions": {
    "target": "es2018",
    "strict": true,          // Enable strict mode
    "noImplicitAny": false,  // Start lenient, tighten later
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Day 3-5: Models and Types
**Priority Files**:
- [ ] `src/models/index.d.ts` - Add proper type exports
- [ ] `src/models/schema.js` → `src/models/schema.ts`
- [ ] Create `src/types/` directory for custom types

**Example Model Conversion**:
```typescript
// Before (schema.js)
export const schema = { /* complex object */ }

// After (schema.ts)
import { Schema } from 'aws-amplify/datastore';

export interface UnitData {
  id: string;
  name: string;
  description?: string;
  data: Record<string, any>;
}

export const schema: Schema = { /* typed object */ }
```

### Week 2: Utility Functions & Simple Components
**Target Files**: Leaf components and utilities

#### Utility Functions (Day 1-2)
- [ ] `src/svg-converter.js` → `src/svg-converter.ts`
- [ ] `src/createEmotionCache.js` → `src/createEmotionCache.ts`
- [ ] `src/theme.js` → `src/theme.ts`
- [ ] `src/Link.js` → `src/Link.tsx`

**Example Utility Conversion**:
```typescript
// Before (theme.js)
export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }
  }
});

// After (theme.ts)
import { createTheme, Theme } from '@mui/material/styles';

export const theme: Theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }
  }
});
```

#### Simple Components (Day 3-5)
- [ ] `src/components/ItemTypes.js` → `src/components/ItemTypes.ts`
- [ ] `src/components/VideoPlayer.js` → `src/components/VideoPlayer.tsx`
- [ ] `src/components/SafeHydrate.js` → `src/components/SafeHydrate.tsx`

**Example Component Conversion**:
```typescript
// Before (VideoPlayer.js)
export default function VideoPlayer({ src, controls = true }) {
  return <video src={src} controls={controls} />;
}

// After (VideoPlayer.tsx)
interface VideoPlayerProps {
  src: string;
  controls?: boolean;
}

export default function VideoPlayer({ 
  src, 
  controls = true 
}: VideoPlayerProps): JSX.Element {
  return <video src={src} controls={controls} />;
}
```

### Week 3: Complex Components & Context
**Target Files**: Interactive components and React contexts

#### Complex Components (Day 1-3)
- [ ] `src/components/QuestionEditor.js` → `src/components/QuestionEditor.tsx`
- [ ] `src/components/RecordingStudio2.js` → `src/components/RecordingStudio2.tsx`
- [ ] `src/components/DictionaryEditor.js` → `src/components/DictionaryEditor.tsx`
- [ ] `src/components/SectionAssigner.js` → `src/components/SectionAssigner.tsx`

#### React Context (Day 4-5)
- [ ] `src/context/authContext.js` → `src/context/authContext.tsx`
- [ ] `src/context/fileContext.js` → `src/context/fileContext.tsx`
- [ ] `src/context/dictionaryContext.js` → `src/context/dictionaryContext.tsx`

**Example Context Conversion**:
```typescript
// Before (authContext.js)
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// After (authContext.tsx)
interface User {
  id: string;
  email: string;
  groups?: string[];
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Week 4: Pages & Final Cleanup
**Target Files**: Next.js pages and remaining files

#### Pages Conversion (Day 1-4)
- [ ] `pages/_app.js` → `pages/_app.tsx`
- [ ] `pages/_document.js` → `pages/_document.tsx`
- [ ] `pages/index.js` → `pages/index.tsx`
- [ ] `pages/units.js` → `pages/units.tsx`
- [ ] `pages/grades.js` → `pages/grades.tsx`
- [ ] Dynamic pages: `pages/workbook/[id].js` → `pages/workbook/[id].tsx`

**Example Page Conversion**:
```typescript
// Before (units.js)
export default function UnitsPage() {
  return <div>Units</div>;
}

export async function getServerSideProps(context) {
  return { props: {} };
}

// After (units.tsx)
import { GetServerSideProps, NextPage } from 'next';

interface UnitsPageProps {
  // Define props if any
}

const UnitsPage: NextPage<UnitsPageProps> = () => {
  return <div>Units</div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: {} };
};

export default UnitsPage;
```

#### Final Cleanup (Day 5)
- [ ] Enable strict TypeScript checking
- [ ] Resolve all type errors
- [ ] Update build scripts
- [ ] Update documentation

## 🔧 Migration Tools & Helpers

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

### Type Definition Helpers
Create `src/types/global.d.ts`:
```typescript
// Global type definitions
declare global {
  interface Window {
    // Add any global window properties
  }
}

// AWS Amplify augmentations
declare module 'aws-amplify' {
  // Add missing type definitions
}

// Custom component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
```

### Migration Checklist Template
For each file conversion:
```typescript
// File: ComponentName.tsx
// ✅ Props interface defined
// ✅ Return type specified  
// ✅ State types defined
// ✅ Event handler types
// ✅ Import/export types
// ✅ No TypeScript errors
// ✅ Functionality tested
```

## 🧪 Testing During Migration

### Type Checking
```bash
# Check specific file
npx tsc --noEmit src/components/ComponentName.tsx

# Check all files
npx tsc --noEmit

# Watch mode during development
npx tsc --noEmit --watch
```

### Runtime Testing
- Test each converted component in isolation
- Ensure no breaking changes in functionality
- Verify props are passed correctly
- Check event handlers work as expected

## 📊 Progress Tracking

### Daily Checklist
- [ ] Morning: Review files to convert today
- [ ] Convert files following patterns
- [ ] Test converted files locally
- [ ] Commit individual file conversions
- [ ] Evening: Update progress tracker

### Progress Dashboard
Track conversion progress:
```
Week 1: Foundation        [████████████████████] 100%
Week 2: Utils/Components  [████████████░░░░░░░░] 60%
Week 3: Complex/Context   [░░░░░░░░░░░░░░░░░░░░] 0%
Week 4: Pages/Cleanup     [░░░░░░░░░░░░░░░░░░░░] 0%

Total Progress: 40% (32/80 files)
```

## ⚠️ Common Pitfalls & Solutions

### 1. Type Definition Complexity
**Problem**: AWS Amplify types are complex
**Solution**: Start with `any` types, refine gradually
```typescript
// Start simple
const data: any = await DataStore.query(Unit);

// Refine later  
const data: Unit[] = await DataStore.query(Unit);
```

### 2. React Props Drilling
**Problem**: Props interfaces become unwieldy
**Solution**: Use composition and utility types
```typescript
// Use Pick for partial props
type PartialProps = Pick<FullProps, 'name' | 'id'>;

// Use Omit to exclude props
type WithoutChildren = Omit<Props, 'children'>;
```

### 3. Event Handler Types
**Problem**: Event types are confusing
**Solution**: Use React's built-in types
```typescript
// Form events
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// Button clicks
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // handle click
};
```

## 🚀 Success Metrics

### Technical Metrics
- **Type Coverage**: 90%+ of code has explicit types
- **Build Success**: No TypeScript compilation errors
- **Performance**: No degradation in build/runtime performance

### Developer Experience
- **IDE Support**: Full autocomplete and error detection
- **Refactoring**: Safe automated refactoring capabilities
- **Documentation**: Types serve as documentation

### Code Quality
- **Error Prevention**: Catch type-related bugs at compile time
- **Maintainability**: Easier to understand and modify code
- **Team Velocity**: Faster development after initial learning curve

## 📈 Post-Migration Benefits

### Immediate Benefits
- Better IDE support and autocomplete
- Compile-time error detection
- Improved code documentation

### Long-term Benefits  
- Easier onboarding for new developers
- More confident refactoring
- Better integration with third-party libraries
- Enhanced maintainability

---

**Next Steps**: Begin Week 1 foundation work, focusing on configuration and simple utilities.

*Last Updated: November 30, 2024*