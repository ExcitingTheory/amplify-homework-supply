# Onboarding Panel Click Handler Fix

## Problem
Task cards in the OnboardingPanel sidebar were not launching spotlight tours when clicked. Users could see the tasks but clicking them had no effect.

## Root Cause
The task cards had nested clickable elements (checkbox, expand button, story link) that were calling `stopPropagation()`, preventing the parent Card's onClick handler from firing. Additionally, the disabled checkbox had an unnecessary click handler that was blocking events.

## Solution Implemented

### 1. Moved Click Handler to CardContent
- **Before**: `onClick` was on the `Card` component
- **After**: `onClick` is on the `CardContent` component
- **Benefit**: More reliable click area without interference from Card's internal styling

### 2. Made Checkbox Non-Interactive
- **Before**: Checkbox had `onClick={(e) => e.stopPropagation()}`
- **After**: Checkbox has `pointerEvents: 'none'`
- **Benefit**: Checkbox is purely visual (it's disabled anyway), so it no longer blocks clicks

### 3. Enhanced Visual Feedback
- Added hover effect to show boxShadow on card hover
- Made "Click to start" chip fade in/out on hover using `.spotlight-hint` class
- Changed chip opacity from 0.7 to 0.6 (default) → 1.0 (on hover)

### 4. Preserved Interactive Elements
- Expand button: Still has `stopPropagation()` - correctly toggles instructions without triggering spotlight
- Story link: Still has `stopPropagation()` - correctly navigates to story without triggering spotlight

## Expected Behavior Now

### Clicking the Card
Clicking anywhere on the card (except expand button or story link) will:
1. Call `handleTaskClick(task)`
2. Generate spotlight steps based on current mode (tutorial/quiz)
3. Open the SpotlightOverlay with the first step highlighted
4. Navigate to the appropriate story/page automatically

### Visual Feedback
- **Idle**: Card shows with subtle background color
- **Hover**: Card elevates with boxShadow, "Click to start" chip becomes more visible
- **Completed**: Card has green tint, title is strikethrough, chip is hidden

### Interactive Elements Still Work
- **Expand button**: Toggles instructions panel (tutorial mode only)
- **Story link**: Opens the Storybook story in a new view
- **Checkbox**: Visual indicator only, no interaction

## Testing Checklist

- [ ] Click on task card body → launches spotlight tour
- [ ] Click on expand button → toggles instructions (tutorial mode)
- [ ] Click on story link → navigates to story
- [ ] Hover over card → shows visual feedback (boxShadow + chip highlight)
- [ ] Completed tasks → show green background and strikethrough
- [ ] Switch between tutorial/quiz modes → updates task content appropriately

## Files Modified
- `.storybook/components/OnboardingPanel.tsx` (3 changes)
  - Line ~505: Added `px: 2` to List for proper spacing
  - Line ~514: Moved onClick from Card to CardContent
  - Line ~524: Changed Checkbox from stopPropagation to pointerEvents: 'none'
  - Line ~562: Added spotlight-hint className and adjusted opacity
  - Line ~500: Added hover effect for '.spotlight-hint' selector

## Related Documentation
- [ONBOARDING_SPOTLIGHT_IMPLEMENTATION_COMPLETE.md](ONBOARDING_SPOTLIGHT_IMPLEMENTATION_COMPLETE.md) - Original implementation details
- [SPOTLIGHT_SYSTEM_GUIDE.md](SPOTLIGHT_SYSTEM_GUIDE.md) - How the spotlight system works
- [ONBOARDING_SPOTLIGHT_CONFIGS.md](ONBOARDING_SPOTLIGHT_CONFIGS.md) - All 28 task configurations
