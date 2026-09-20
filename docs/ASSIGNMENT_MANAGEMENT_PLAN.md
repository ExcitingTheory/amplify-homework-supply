# Assignment Management Plan

Date: 2026-09-08

## Goals

- Offer teachers quick time-window helpers for assignments: beginning of class period, end of class period, due 11:59 PM end of the day of the period, due 11:59 PM end of the week. Teachers can also save their own custom time patterns.
- Enforce a start/stop availability window: a unit cannot be opened before its window starts. It can still be completed late after the window ends, but the instructor must decide whether to keep or drop the late submission.
- Allow assignments to optionally target a single student directly instead of the whole section.

## Chat Assistant Integration

Assignment-management stories and the instructor assistant should use the same
observable workflow as the UI:

1. Search for the requested unit, section, or assignment.
2. Create or update only after resolving the target record and confirming any
  required inputs.
3. Search again using the returned record ID or exact name.
4. Render the resulting unit, section, or assignment in Search Results.

Planned Sage tools include `get_section_analytics`, `get_at_risk_students`,
`list_section_students`, `update_assignment_due_date`, and
`export_section_grades`. Assignment stories should include these records in
mock data before the tools are implemented so the intended UX is testable.

## Decisions

- **Direct-to-student assignments require both `sectionID` and `studentID`.** `sectionID` is always required and identifies which class context the assignment belongs to (grading, gamification, dynamic-group authorization). `studentID` is optional; when set, the assignment targets only that learner within the given section. A student enrolled in multiple sections with the same teacher is disambiguated by `sectionID`.
- **Timing patterns are saved per-instructor, not per-section.** Saved custom patterns live on the instructor's own `Settings` record (already owner-scoped), so they're reusable across every class the instructor teaches. Built-in presets (beginning/end of class, end of day, end of week) are hardcoded in the client, not persisted.
- **Dropped late assignments are tagged and filtered, never deleted.** `Assignment.lateStatus` is set to `DROPPED`; the record remains visible to the student (marked "Dropped by instructor") but is excluded from grade averages, curves, and completion-percentage calculations.

## 1. Schema changes (`amplify/data/resource.ts`)

**New enum**
```ts
const LateAssignmentStatus = a.enum(["PENDING", "KEPT", "DROPPED"]);
```

**New reusable time-pattern type** (instructor-saved, referenced by assignments)
```ts
const TimingPattern = a.customType({
  id: a.string().required(),
  name: a.string().required(),
  availableFromAnchor: a.enum(["CLASS_START", "CLASS_END", "CUSTOM"]),
  availableFromOffsetMinutes: a.integer(),
  availableUntilAnchor: a.enum([
    "CLASS_END",
    "END_OF_DAY",   // 11:59 PM same day as the meeting
    "END_OF_WEEK",  // 11:59 PM on the week's last meeting day
    "CUSTOM",
  ]),
  availableUntilOffsetMinutes: a.integer(),
  allowLateCompletion: a.boolean(),
});
```

**`Settings` changes**
- Add `timingPatterns: a.ref("TimingPattern").array()` — the instructor's saved pattern library, available across all their sections.

**`AssignmentSlot` changes**
- Add `timingPatternId: a.string()` so a planned slot can carry a default window.

**`Assignment` changes**
```ts
Assignment: a.model({
  ...
  studentID: a.id(), // optional — direct-to-student target, requires sectionID too
  availableFrom: a.datetime(),   // resolved concrete timestamp
  availableUntil: a.datetime(),
  allowLateCompletion: a.boolean(),
  lateStatus: LateAssignmentStatus, // set only once completed after availableUntil
  timingPatternId: a.string(), // which pattern produced these dates, for editing/reuse
  ...
})
```

## 2. Business logic

**Workbook access gating** (`unitContext` / workbook route guard)
- Block opening a unit if `now < availableFrom` — show "opens at …", no navigation into content.
- Allow opening after `availableUntil` only if `allowLateCompletion` is true; otherwise treat as closed.
- On grade completion after `availableUntil`, set `lateStatus = "PENDING"` and surface it to the instructor instead of silently accepting.

**Instructor late-review action**
- Add a "Late submissions" queue (likely inside `NeedsAttention` or the gradebook) listing `lateStatus === "PENDING"`.
- Instructor action: Keep (counts toward grade normally) or Drop (tagged `DROPPED`, excluded from grade/completion totals).

**Grade aggregation updates**
- Gradebook totals, curve calculations, `CompletionGrid`, and dashboard "completed" counts must all filter out `lateStatus === "DROPPED"` rows.

**Assignment resolution helper** (new util, e.g. `src/utils/assignmentTiming.js`)
- `resolveTimingWindow(pattern, meetingDate, classSchedule)` → `{ availableFrom, availableUntil }`.
- Centralizes anchor math using `ClassScheduleEntry.startTime`/`endTime` and the meeting-date computation already used in `CadenceCopyDialog`/`AssignmentComposer`.

## 3. UI changes

**Time-pattern picker** (new shared component, e.g. `TimingPatternPicker.jsx`)
- Dropdown of built-in presets + the instructor's saved `Settings.timingPatterns`.
- "Save as new pattern..." action writes to the instructor's own `Settings` record.
- Used in: `AssignmentConfiguration.jsx` (editor), `AssignmentComposer.jsx` (section-first), `CadenceCopyDialog.jsx` (cadence copy defaults).

**Direct-to-student assignment**
- Add a student selector (defaults to "Whole section") in `AssignmentConfiguration`/`AssignmentComposer`.
- When a student is chosen, `sectionID` stays the student's enrolled section; `studentID` is set; duplicate-prevention keys must include `studentID` so a section assignment and a direct one to the same unit can coexist.

**Learner-facing lock state**
- `AssignmentCard`/`UpNextCard`: show "Opens {time}" before `availableFrom`, disable Start Workbook.
- Show a "Late" badge if past `availableUntil` and `allowLateCompletion`.

**Instructor gradebook**
- Add late-status chip + Keep/Drop buttons per submission in `SectionDetailClient.jsx` gradebook and `GradeReviewDrawer`.

## 4. Rollout order

1. Schema: `TimingPattern`, `LateAssignmentStatus`, `Assignment` fields, `Settings.timingPatterns`, `AssignmentSlot.timingPatternId` — deploy/regenerate client.
2. `assignmentTiming.js` util + unit tests for anchor math.
3. `TimingPatternPicker` component + wire into `AssignmentConfiguration`, `AssignmentComposer`, `CadenceCopyDialog`.
4. Workbook gating (before/after window) + learner card states.
5. Late-review queue + Keep/Drop actions in gradebook, with grade-aggregation filtering for `DROPPED`.
6. Direct-to-student targeting (selector + duplicate-key updates + dashboard filtering so a student sees both section and direct assignments).
