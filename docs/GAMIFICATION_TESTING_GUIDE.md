# Testing Guide: Gamification & Achievement System

**Created**: January 31, 2026  
**Framework**: Vitest  
**Coverage Goal**: >80% for business logic, >60% for UI components  

## Test Strategy

### Test Pyramid

```
        /\
       /  \  E2E Tests (10%)
      /____\  - Critical user flows
     /      \  
    / Integration \ (30%)
   /___________\  - Context + DataStore
  /             \ 
 /  Unit Tests   \ (60%)
/________________\ - Pure functions, utilities
```

### Coverage Goals

| Layer | Target | Priority |
|-------|--------|----------|
| **Utilities** (XP calc, level calc) | 95% | ⭐⭐⭐ Critical |
| **Services** (achievement detection, streaks) | 85% | ⭐⭐⭐ Critical |
| **Contexts** (GamificationContext) | 70% | ⭐⭐ High |
| **UI Components** (badges, leaderboards) | 60% | ⭐ Medium |
| **Integration** (full flows) | 50% | ⭐⭐ High |

### Test Framework Setup

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    environment: 'jsdom', // for React components
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/models/', // Amplify generated
        '**/*.stories.tsx',
        '**/*.d.ts'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    setupFiles: ['./test/setup.ts'],
  }
});
```

## Test Scenarios

### 1. XP Calculation & Leveling

#### Unit Tests: `src/utils/gamification/xp.test.ts`

**Happy Path Tests**
```typescript
describe('calculateXP', () => {
  it('should award 10 XP for first-attempt correct answer', () => {
    const event: XPEvent = {
      userId: 'user1',
      source: 'question_correct',
      amount: 10,
      multiplier: 1.0,
      timestamp: new Date().toISOString(),
      metadata: { attempts: 1 }
    };
    expect(calculateXP(event)).toBe(10);
  });

  it('should apply streak multiplier correctly', async () => {
    const baseXP = 100;
    const userId = 'user-with-7-day-streak';
    const result = await applyMultipliers(baseXP, userId);
    expect(result).toBe(110); // 1.1x for 7-day streak
  });

  it('should calculate level correctly from XP', () => {
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(400)).toBe(2);
    expect(calculateLevel(2500)).toBe(5);
    expect(calculateLevel(10000)).toBe(10);
  });

  it('should calculate XP needed for level', () => {
    expect(getXPForLevel(1)).toBe(100);
    expect(getXPForLevel(2)).toBe(400);
    expect(getXPForLevel(10)).toBe(10000);
  });
});

describe('getLevelTitle', () => {
  it('should return correct title for level', () => {
    expect(getLevelTitle(1)).toBe('Beginner');
    expect(getLevelTitle(10)).toBe('Student');
    expect(getLevelTitle(50)).toBe('Sensei');
    expect(getLevelTitle(100)).toBe('Deity');
  });

  it('should return highest title for levels beyond max', () => {
    expect(getLevelTitle(150)).toBe('Deity');
  });
});
```

**Edge Case Tests**
```typescript
describe('XP edge cases', () => {
  it('should handle zero XP', () => {
    expect(calculateLevel(0)).toBe(0);
  });

  it('should handle negative XP gracefully', () => {
    expect(() => calculateXP({ ...baseEvent, amount: -10 }))
      .toThrow('XP amount cannot be negative');
  });

  it('should cap multiplier at maximum', () => {
    const event = { ...baseEvent, multiplier: 5.0 };
    expect(calculateXP(event)).toBeLessThanOrEqual(baseEvent.amount * 3);
  });

  it('should handle very large XP values', () => {
    const level = calculateLevel(1_000_000);
    expect(level).toBe(100);
  });
});
```

**Error Handling Tests**
```typescript
describe('XP error scenarios', () => {
  it('should throw on invalid XP source', () => {
    const event = { ...baseEvent, source: 'INVALID' as XPSource };
    expect(() => calculateXP(event)).toThrow('Invalid XP source');
  });

  it('should handle missing user gracefully', async () => {
    await expect(applyMultipliers(100, 'nonexistent-user'))
      .resolves.toBe(100); // no multiplier
  });
});
```

### 2. Achievement Detection

#### Unit Tests: `src/services/gamification/achievementDetection.test.ts`

**Happy Path Tests**
```typescript
describe('checkAchievements', () => {
  it('should detect "First Words" achievement at 5 words', async () => {
    const userId = 'user1';
    const event: XPEvent = {
      userId,
      source: 'word_learned',
      amount: 5,
      multiplier: 1.0,
      timestamp: new Date().toISOString(),
      metadata: { wordCount: 5 }
    };
    
    const achievements = await checkAchievements(userId, event);
    expect(achievements).toContainEqual(
      expect.objectContaining({ id: 'first-words' })
    );
  });

  it('should detect "Perfect Score" achievement', async () => {
    const event: XPEvent = {
      userId: 'user1',
      source: 'unit_complete',
      amount: 200,
      multiplier: 1.0,
      timestamp: new Date().toISOString(),
      metadata: { accuracy: 100 }
    };
    
    const achievements = await checkAchievements('user1', event);
    expect(achievements).toContainEqual(
      expect.objectContaining({ id: 'perfect-score' })
    );
  });

  it('should track progress toward incomplete achievements', async () => {
    await updateAchievementProgress('user1', 'word-explorer', 15); // 15/25
    const progress = await getAchievementProgress('user1', 'word-explorer');
    expect(progress).toBe(60); // 60% complete
  });
});
```

**Edge Case Tests**
```typescript
describe('Achievement edge cases', () => {
  it('should not award same achievement twice', async () => {
    const userId = 'user1';
    await awardAchievement(userId, firstWordsAchievement);
    await awardAchievement(userId, firstWordsAchievement); // duplicate
    
    const userAchievements = await getUserAchievements(userId);
    const count = userAchievements.filter(a => a.achievementId === 'first-words').length;
    expect(count).toBe(1);
  });

  it('should handle simultaneous achievement unlocks', async () => {
    const events = [
      { source: 'unit_complete', metadata: { unitCount: 5 } },
      { source: 'word_learned', metadata: { wordCount: 25 } },
    ];
    
    const achievements = await Promise.all(
      events.map(e => checkAchievements('user1', e as XPEvent))
    );
    
    expect(achievements.flat()).toHaveLength(2);
  });
});
```

### 3. Streak Management

#### Unit Tests: `src/services/gamification/streaks.test.ts`

**Happy Path Tests**
```typescript
describe('updateStreak', () => {
  it('should increment streak on consecutive days', async () => {
    const userId = 'user1';
    const day1 = new Date('2026-01-01');
    const day2 = new Date('2026-01-02');
    
    await updateStreak(userId, day1);
    const streak = await updateStreak(userId, day2);
    
    expect(streak).toBe(2);
  });

  it('should maintain streak when studying same day', async () => {
    const userId = 'user1';
    const day = new Date('2026-01-01');
    
    await updateStreak(userId, day);
    const streak = await updateStreak(userId, day); // same day, multiple sessions
    
    expect(streak).toBe(1);
  });

  it('should reset streak after gap', async () => {
    const userId = 'user1';
    await updateStreak(userId, new Date('2026-01-01'));
    await updateStreak(userId, new Date('2026-01-02'));
    const streak = await updateStreak(userId, new Date('2026-01-04')); // gap
    
    expect(streak).toBe(1);
  });
});

describe('getStreakMultiplier', () => {
  it('should return correct multipliers for streak tiers', () => {
    expect(getStreakMultiplier(1)).toBe(1.0);
    expect(getStreakMultiplier(7)).toBe(1.1);
    expect(getStreakMultiplier(30)).toBe(1.25);
    expect(getStreakMultiplier(100)).toBe(1.5);
  });
});
```

**Edge Case Tests**
```typescript
describe('Streak edge cases', () => {
  it('should handle timezone boundaries correctly', async () => {
    const userId = 'user1';
    const endOfDay = new Date('2026-01-01T23:59:00Z');
    const startOfNextDay = new Date('2026-01-02T00:01:00Z');
    
    await updateStreak(userId, endOfDay);
    const streak = await updateStreak(userId, startOfNextDay);
    
    expect(streak).toBe(2);
  });

  it('should track longest streak separately', async () => {
    const userId = 'user1';
    // Build 10-day streak
    for (let i = 0; i < 10; i++) {
      await updateStreak(userId, new Date(`2026-01-${i + 1}`));
    }
    
    // Break streak
    await updateStreak(userId, new Date('2026-01-15'));
    
    const progress = await getUserProgress(userId);
    expect(progress.longestStreak).toBe(10);
    expect(progress.currentStreak).toBe(1);
  });

  it('should handle future dates by using current server time', async () => {
    const futureDate = new Date('2030-01-01');
    const streak = await updateStreak('user1', futureDate);
    
    expect(streak).toBe(1); // should use current date
  });
});
```

### 4. Leaderboard

#### Unit Tests: `src/services/gamification/leaderboard.test.ts`

**Happy Path Tests**
```typescript
describe('getLeaderboard', () => {
  it('should return top users by XP', async () => {
    const filter: LeaderboardFilter = {
      scope: 'global',
      timeframe: 'all_time'
    };
    
    const leaderboard = await getLeaderboard(filter, 10);
    
    expect(leaderboard).toHaveLength(10);
    expect(leaderboard[0].totalXP).toBeGreaterThanOrEqual(leaderboard[1].totalXP);
  });

  it('should filter by section', async () => {
    const filter: LeaderboardFilter = {
      scope: 'section',
      timeframe: 'weekly',
      sectionId: 'section123'
    };
    
    const leaderboard = await getLeaderboard(filter, 10);
    
    expect(leaderboard.every(entry => 
      // Verify all users are in section123
      true // would check via DataStore join
    )).toBe(true);
  });

  it('should calculate rank changes correctly', async () => {
    const currentLeaderboard = await getLeaderboard({ scope: 'global', timeframe: 'weekly' }, 10);
    const previousLeaderboard = await getPreviousLeaderboard('weekly');
    
    const entry = currentLeaderboard[0];
    expect(entry.rankChange).toBeDefined();
  });
});

describe('getUserRank', () => {
  it('should return user rank in leaderboard', async () => {
    const rank = await getUserRank('user1', { scope: 'global', timeframe: 'all_time' });
    expect(rank).toBeGreaterThan(0);
  });

  it('should return -1 for users not on leaderboard', async () => {
    const rank = await getUserRank('no-activity-user', { scope: 'global', timeframe: 'weekly' });
    expect(rank).toBe(-1);
  });
});
```

**Edge Case Tests**
```typescript
describe('Leaderboard edge cases', () => {
  it('should handle ties correctly', async () => {
    // Create users with identical XP
    const leaderboard = await getLeaderboard({ scope: 'global', timeframe: 'all_time' }, 10);
    
    // Ties should be sorted by secondary criteria (e.g., timestamp)
    const ties = leaderboard.filter(e => e.totalXP === leaderboard[0].totalXP);
    if (ties.length > 1) {
      expect(ties[0].rank).toBe(ties[1].rank);
    }
  });

  it('should paginate large leaderboards', async () => {
    const page1 = await getLeaderboard({ scope: 'global', timeframe: 'all_time' }, 10);
    const page2 = await getLeaderboard({ scope: 'global', timeframe: 'all_time' }, 10, 10); // offset 10
    
    expect(page1[0].rank).toBe(1);
    expect(page2[0].rank).toBe(11);
  });
});
```

### 5. React Context Integration

#### Integration Tests: `src/context/gamificationContext.test.tsx`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { GamificationProvider, useGamification } from './gamificationContext';

describe('GamificationContext', () => {
  it('should provide user progress data', async () => {
    const { result } = renderHook(() => useGamification(), {
      wrapper: GamificationProvider
    });
    
    await waitFor(() => {
      expect(result.current.userProgress).toBeDefined();
      expect(result.current.userProgress?.totalXP).toBeGreaterThanOrEqual(0);
    });
  });

  it('should award XP and update progress', async () => {
    const { result } = renderHook(() => useGamification(), {
      wrapper: GamificationProvider
    });
    
    const initialXP = result.current.userProgress?.totalXP || 0;
    
    await act(async () => {
      await result.current.awardXP({
        source: 'unit_complete',
        amount: 100,
        multiplier: 1.0,
        timestamp: new Date().toISOString(),
        metadata: {}
      });
    });
    
    await waitFor(() => {
      expect(result.current.userProgress?.totalXP).toBe(initialXP + 100);
    });
  });

  it('should trigger achievement notifications', async () => {
    const onAchievement = vi.fn();
    const { result } = renderHook(() => useGamification(), {
      wrapper: ({ children }) => (
        <GamificationProvider onAchievementUnlocked={onAchievement}>
          {children}
        </GamificationProvider>
      )
    });
    
    await act(async () => {
      // Award enough XP to trigger achievement
      await result.current.awardXP({ /* event that triggers achievement */ });
    });
    
    await waitFor(() => {
      expect(onAchievement).toHaveBeenCalled();
    });
  });
});
```

### 6. UI Component Tests

#### Component Tests: `src/components/gamification/*.test.tsx`

```typescript
describe('BadgeShowcase', () => {
  it('should render earned badges', () => {
    render(<BadgeShowcase badges={mockEarnedBadges} />);
    expect(screen.getAllByRole('img')).toHaveLength(mockEarnedBadges.length);
  });

  it('should show locked badges as grayed out', () => {
    render(<BadgeShowcase badges={mockLockedBadges} />);
    const lockedBadges = screen.getAllByTestId('locked-badge');
    expect(lockedBadges[0]).toHaveClass('opacity-50');
  });

  it('should display progress toward locked badges', () => {
    const badge = { ...mockBadge, progress: 50 };
    render(<BadgeShowcase badges={[badge]} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

describe('LeaderboardTable', () => {
  it('should render leaderboard entries', () => {
    render(<LeaderboardTable entries={mockLeaderboard} />);
    expect(screen.getAllByRole('row')).toHaveLength(mockLeaderboard.length + 1); // +1 for header
  });

  it('should highlight current user', () => {
    const entries = mockLeaderboard.map((e, i) => ({
      ...e,
      userId: i === 2 ? 'current-user' : e.userId
    }));
    
    render(<LeaderboardTable entries={entries} currentUserId="current-user" />);
    const highlightedRow = screen.getByTestId('user-row-current-user');
    expect(highlightedRow).toHaveClass('bg-blue-50');
  });

  it('should show medals for top 3', () => {
    render(<LeaderboardTable entries={mockLeaderboard} />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });
});

describe('XPProgressBar', () => {
  it('should show correct progress percentage', () => {
    render(<XPProgressBar currentXP={150} nextLevelXP={400} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '37.5');
  });

  it('should display level and title', () => {
    render(<XPProgressBar level={10} title="Student" currentXP={10000} nextLevelXP={12100} />);
    expect(screen.getByText('Level 10')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });
});
```

### 7. E2E Tests (Cypress)

#### E2E Flow: `cypress/e2e/gamification/achievement-flow.cy.ts`

```typescript
describe('Achievement Unlock Flow', () => {
  beforeEach(() => {
    cy.login('student@test.com');
    cy.visit('/units');
  });

  it('should award XP and unlock achievement on unit completion', () => {
    // Complete a unit
    cy.get('[data-testid="unit-card"]').first().click();
    cy.get('[data-testid="start-unit"]').click();
    
    // Answer all questions correctly
    cy.get('[data-testid="submit-answer"]').each($btn => {
      cy.wrap($btn).click();
    });
    
    // Should see XP notification
    cy.get('[data-testid="xp-notification"]').should('be.visible');
    cy.get('[data-testid="xp-amount"]').should('contain', '+100 XP');
    
    // Should see achievement modal if criteria met
    cy.get('[data-testid="achievement-modal"]', { timeout: 5000 })
      .should('be.visible');
    cy.get('[data-testid="achievement-name"]').should('contain', 'First Steps');
  });

  it('should update leaderboard after XP award', () => {
    const initialRank = cy.get('[data-testid="user-rank"]').invoke('text');
    
    // Complete unit to gain XP
    cy.completeUnit(); // custom command
    
    // Check leaderboard updated
    cy.visit('/leaderboard');
    cy.get('[data-testid="user-rank"]').invoke('text').should('not.equal', initialRank);
  });
});
```

## Validation Checklist

### Pre-Implementation
- [ ] All type definitions approved
- [ ] Amplify schema changes reviewed
- [ ] XP economy balanced (tested with spreadsheet)
- [ ] Achievement criteria validated

### During Implementation
- [ ] TypeScript compiles with no errors (`tsc --noEmit`)
- [ ] All utility functions have unit tests
- [ ] All services have integration tests
- [ ] Context providers tested with React Testing Library
- [ ] UI components tested with Storybook + tests

### Post-Implementation
- [ ] Code coverage meets 80% threshold
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] E2E tests passing
- [ ] Performance benchmarks met (leaderboard query < 500ms)
- [ ] Accessibility audit passed (badges have alt text, etc.)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive testing

### Documentation
- [ ] API documentation updated
- [ ] Storybook stories created for all UI components
- [ ] Migration guide written
- [ ] User guide created
- [ ] Admin guide created (how to manage achievements)

## Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/utils/gamification/xp.test.ts

# Run tests in watch mode
npm test -- --watch

# Run E2E tests
npm run cypress:run

# Type check
tsc --noEmit --project tsconfig.json

# Lint
npm run lint
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Gamification Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: tsc --noEmit
      - run: npm test -- --coverage
      - run: npm run lint
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Performance Testing

### Load Testing Scenarios

```typescript
// Test leaderboard query performance with 10,000 users
describe('Leaderboard performance', () => {
  it('should return top 100 in under 500ms', async () => {
    const start = Date.now();
    await getLeaderboard({ scope: 'global', timeframe: 'all_time' }, 100);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
});

// Test achievement detection with 100 achievements
describe('Achievement detection performance', () => {
  it('should check all achievements in under 1000ms', async () => {
    const start = Date.now();
    await checkAchievements('user1', mockXPEvent);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000);
  });
});
```

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

describe('Badge accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<BadgeShowcase badges={mockBadges} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have descriptive alt text', () => {
    render(<BadgeCard badge={mockBadge} />);
    expect(screen.getByAltText(/First Words badge/i)).toBeInTheDocument();
  });
});
```

## Next Steps

1. Review testing strategy with team
2. Set up test infrastructure (Vitest config, mocks)
3. Begin writing tests alongside implementation (TDD approach)
4. Set up CI/CD pipeline with test automation
5. Establish coverage monitoring with Codecov or similar
