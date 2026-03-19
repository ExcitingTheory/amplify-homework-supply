# Unit Permission Checking Implementation

## Overview

This document describes the implementation of permission checking for unit access. When a user tries to access a unit they don't have permission to view, a modal overlay displays an error message instead of rendering the unit content.

## Architecture

### Components

#### 1. PermissionErrorOverlay Component
**Location**: `src/components/PermissionErrorOverlay.jsx`

A reusable Material-UI Dialog component that displays when access is denied.

**Props**:
- `open` (boolean): Whether the overlay is visible
- `resourceType` (string): Type of resource ('unit', 'section', etc.)
- `message` (string, optional): Custom error message
- `onClose` (function, optional): Callback when overlay is closed

**Features**:
- Lock icon and error styling
- Clear explanation of the issue
- Two action buttons: "Go Back" and "Go to Home"
- Cannot be dismissed by clicking outside or pressing ESC
- Fully internationalized with i18next

#### 2. Updated AuthContext
**Location**: `src/context/authContext.jsx`

Enhanced to extract and expose user groups from Cognito tokens.

**Changes**:
- Extracts `cognito:groups` from access token payload
- Exposes groups via `session.groups` array
- Groups include: 'Admins', 'Instructors', 'Moderators', 'Learners'

#### 3. Enhanced UnitContext
**Location**: `src/context/unitContext.jsx`

**New State**:
- `permissionError` (string | null): Error message when access is denied (deprecated - not used in context)

**New Function**: 
- `checkUnitEditPermission(unit, currentUser, userGroups)` - Strict check for editing
- Returns `{ hasAccess: boolean, reason: string | null }`

**Permission Logic (checkUnitEditPermission)**:
1. **Published Units**: Anyone can view (returns `{ hasAccess: true }`)
2. **Unauthenticated Users**: Denied (must be signed in)
3. **Unit Owner**: Full access (owner field matches user ID)
4. **Privileged Groups**: Full access (Instructors, Moderators, Admins)
5. **Others**: Denied with error message

**Integration**:
- Permission check functions available in UnitContext
- Pages call permission check functions as needed
- UnitContext loads all data (no blocking at context level)
- **Only unit editor page uses permission checking**
- **Workbook page has absolutely zero permission checks**
- Backend GraphQL `@auth` is sole enforcement for workbook access

### Page Changes

#### 1. Unit Editor Page
**Location**: `pages/unit/[id].jsx`

**Changes**:
- Created inner `UnitPageContent` component to access UnitContext and AuthContext
- Calls `checkUnitEditPermission()` function with current user and groups
- Renders `PermissionErrorOverlay` when permission check fails
- Conditionally renders `Editor` only when permission check passes
- **Strict permission checking** - only owners and instructors can edit unpublished units

#### 2. Workbook Page  
**Location**: `pages/workbook/[id].jsx`

**Changes**:
- **ABSOLUTELY NO permission checking** - completely open to all authenticated users
- No imports of `PermissionErrorOverlay`
- No permission check function calls
- No conditional rendering based on permissions
- Backend (Grade model via GraphQL `@auth`) is sole enforcement
- Students can freely view and work on any unit content
- GraphQL prevents unauthorized grade operations at mutation time
- Zero frontend barriers for student learning

## Permission Matrix

### Unit Editor Page (Strict Permissions)

| User Type | Published Unit | Draft/Archived Unit (Owner) | Draft/Archived Unit (Non-Owner) |
|-----------|----------------|----------------------------|--------------------------------|
| **Guest (Not Signed In)** | ✅ View | ❌ Denied | ❌ Denied |
| **Learner** | ✅ View | ✅ Edit | ❌ Denied |
| **Any User (Owner)** | ✅ Edit | ✅ Edit | - |
| **Instructor** | ✅ Edit | ✅ Edit | ✅ Edit |
| **Moderator** | ✅ Edit | ✅ Edit | ✅ Edit |
| **Admin** | ✅ Edit | ✅ Edit | ✅ Edit |

### Workbook Page (No Frontend Restrictions)

| User Type | Any Unit (Published/Draft/Archived) |
|-----------|-------------------------------------|
| **Guest (Not Signed In)** | ❌ Requires Sign In (MyAuth wrapper) |
| **Any Authenticated User** | ✅ Full Access* |

\* **No frontend permission checks whatsoever**. Backend GraphQL `@auth` on Grade model enforces whether user can actually create/update grades. Students can view any unit content but may not be able to save grades depending on backend authorization.

## User Flow

### Unit Editor - Authorized Access
1. User navigates to `/unit/[id]`
2. UnitContext fetches unit data
3. Page calls `checkUnitEditPermission()`
4. Permission check passes
5. Editor renders normally

### Unit Editor - Denied Access
1. User navigates to `/unit/[id]`
2. UnitContext fetches unit data
3. Page calls `checkUnitEditPermission()`
4. Permission check fails
5. `PermissionErrorOverlay` displays:
   - Lock icon with "Access Denied" title
   - Error message explaining restriction
   - "Go Back" button (returns to previous page)
   - "Go to Home" button (navigates to `/`)

### Workbook - Always Accessible (Authentication Required)
1. User navigates to `/workbook/[id]`
2. MyAuth wrapper ensures user is authenticated
3. UnitContext fetches unit data
4. **ZERO frontend permission checks** - workbook renders immediately
5. User can view content and attempt to submit answers
6. User attempts to create/update Grade via GraphQL mutation
7. Backend enforces authorization via GraphQL `@auth` rules
8. If unauthorized, GraphQL mutation fails (not frontend blocked)
9. User sees normal form validation/mutation error messages

## Translations

Translation keys in `public/locales/en/components.json`:

```json
{
  "permissionError": {
    "title": "Access Denied",
    "defaultMessage": "You don't have permission to access this {{resourceType}}.",
    "explanation": "This content is restricted. You need to be the owner or have instructor permissions to access it.",
    "contactInfo": "If you believe this is an error, please contact your instructor or administrator.",
    "goBack": "Go Back",
    "goHome": "Go to Home",
    "resourceTypes": {
      "unit": "unit",
      "section": "section",
      "assignment": "assignment",
      "grade": "grade"
    }
  }
}
```

## Testing

### Manual Testing Scenarios

#### Unit Editor Page Tests

1. **Published Unit - Any User**
   - Navigate to `/unit/{id}` with published unit
   - Should render editor normally

2. **Draft Unit - Owner**
   - Create unit as instructor
   - Navigate to `/unit/{id}`
   - Should render editor normally

3. **Draft Unit - Non-Owner Learner**
   - Have another user create a draft unit
   - Sign in as learner (different user)
   - Navigate to `/unit/{id}` for that unit
   - Should show permission error overlay

4. **Draft Unit - Instructor (Non-Owner)**
   - Have a user create a draft unit
   - Sign in as different user with Instructor role
   - Navigate to `/unit/{id}` for that unit
   - Should render editor normally (instructors can access all units)

5. **Unit Editor - Not Signed In**
   - Sign out
   - Navigate to draft unit URL at `/unit/{id}`
   - Should show permission error

#### Workbook Page Tests

1. **Published Unit - Any Authenticated User**
   - Sign in as any user
   - Navigate to `/workbook/{id}` with published unit
   - Should render workbook normally

2. **Draft Unit - Any Authenticated User**
   - Sign in as learner
   - Navigate to `/workbook/{id}` with another user's draft unit
   - Should render workbook (frontend allows access)
   - Try to create/save grade
   - Backend may allow or deny based on GraphQL auth rules

3. **Workbook - Not Signed In**
   - Sign out
   - Navigate to `/workbook/{id}`
   - Should be redirected to login by MyAuth wrapper

### Storybook Stories

Run `npm run storybook` and navigate to **Components/PermissionErrorOverlay**:

- **UnitPermissionError**: Default error for unit
- **CustomMessage**: Error with custom message
- **SectionPermissionError**: Example for section resource
- **AssignmentPermissionError**: Example for assignment resource
- **I**Unit Editor Only**: Prevents unauthorized editing with clear UX
   - **Workbook**: No frontend blocking - allows students to work on assignments
   - Reduces unnecessary friction for legitimate student access
   - Improves UX with clear error messages for edit restrictions

2. **GraphQL Authorization** (Amplify DataStore) - **Primary Security Layer**
   - Defined in `amplify/data/resource.ts`
   - Uses `@auth` directives with owner-based and group-based rules
   - Backend enforcement prevents unauthorized queries/mutations
   - Grade model enforces who can create/update student submissions
   - Unit model enforces who can edit unit content
   - Improves UX with clear error messages
   - Reduces unnecessary API calls for related data

2. **GraphQL Authorization** (Amplify DataStore)
   - Defined in `amplify/data/resource.ts`
   - Uses `@auth` directives with owner-based and group-based rules
   - Backend enforcement prevents unauthorized queries

3. **S3 Storage Authorization**
   - Configured in `amplify/storage/resource.ts`
   - Path-based access control (public, protected, private)
   - Prevents direct file access bypassing frontend

##**Backend authorization in Amplify schema is the actual security layer**
- Users can bypass frontend checks by modifying JavaScript
- GraphQL queries and mutations enforce real authorization
- **Workbook has no frontend permission blocking** - students need access to complete assignments
- Backend prevents unauthorized grade creation/updates via GraphQL `@auth` directivesmprove UX only
- Backend authorization in Amplify schema is the actual security layer
- Users can bypass frontend checks by modifying JavaScript
- GraphQL queries and mutations enforce real authorization

## Future Enhancements

1. **Section-Based Access**
   - Check `readableGroups`/`writableGroups` fields
   - Support dynamic section-based permissions

2. **Assignment Permissions**
   - Check if assignment is published
   - Verify user is in assigned section

3. **Granular Permissions**
   - Read-only vs. edit permissions
   - Different errors for different permission levels

4. **Permission Caching**
   - Cache permission check results
   - Reduce permission calculation overhead

## Related Files

- Component: `src/components/PermissionErrorOverlay.jsx`
- Stories: `src/components/PermissionErrorOverlay.stories.jsx`
- Auth Context: `src/context/authContext.jsx`
- Unit Context: `src/context/unitContext.jsx`
- Unit Editor Page: `pages/unit/[id].jsx`
- Workbook Page: `pages/workbook/[id].jsx`
- Translations: `public/locales/en/components.json`
- GraphQL Schema: `amplify/data/resource.ts`
- Storage Config: `amplify/storage/resource.ts`

## Troubleshooting

### Permission Error Not Showing on Unit Editor

1. Check browser console for errors
2. Verify user is authenticated (`AuthContext.user` exists)
3. Verify unit data is loading (`UnitContext.unit` is set)
4. Check `session.groups` in console
5. Verify translation keys are loaded
6. Check page is calling `checkUnitEditPermission()`

### Permission Error Showing Incorrectly on Unit Editor

1. Verify unit `owner` field matches user ID
2. Check user's Cognito groups in console
3. Review unit `status` field (PUBLISHED vs. DRAFT)
4. Check `checkUnitEditPermission` logic in UnitContext
5. Verify `session.groups` contains expected group names

### Workbook Not Accessible

1. Verify user is signed in (MyAuth wrapper handles redirect to login)
2. Workbook should render for any authenticated user
3. If you see blank screen, check browser console for errors
4. Verify UnitContext is loading unit data successfully
5. **Workbook must NOT have any permission error overlays**
6. If grade creation fails, check GraphQL error in network tab (backend auth)

### Groups Not Loading

1. Verify `fetchAuthSession` returns `accessToken`
2. Check `accessToken.payload['cognito:groups']` in console
3. Ensure user is assigned to Cognito groups in AWS Console
4. Clear browser cache and sign in again

### Students Can't Complete Assignments (Workbook)

1. **Verify workbook page has ZERO permission checking code**
2. Check that no `PermissionErrorOverlay` is imported or rendered
3. Verify no calls to any permission check functions
4. Check Grade model `@auth` rules in `amplify/data/resource.ts`
5. Verify student can view workbook UI (if not, it's a loading/context issue)
6. If grade save fails, check browser network tab for GraphQL mutation errors
7. Review Grade model owner/group authorization rules
8. Ensure student is in appropriate Cognito groups if group auth is used

## Implementation Checklist

- [x] Create PermissionErrorOverlay component
- [x] Update AuthContext to expose groups
- [x] Add permission checking to UnitContext
- [x] Update unit editor page
- [x] Update workbook page
- [x] Add translations
- [x] Create Storybook stories
- [x] Document implementation
- [ ] Add Cypress E2E tests
- [ ] Add unit tests for permission logic
- [ ] Test on staging environment

---

**Author**: GitHub Copilot  
**Date**: March 11, 2026  
**Status**: Implementation Complete, Testing Pending
