# Settings Override System - Architecture Documentation

## Overview

This document describes the architecture of the Settings Override System using set theory principles. The system manages practice-wide default settings and user-specific overrides, ensuring no redundant configurations exist.

## Core Principle

**An override should ONLY exist when it differs from BOTH the default value AND default lock state.**

- Override = A set of (value, lockState) that **BOTH** differ from defaults
- When either the default value OR lock state changes, check if the override's **BOTH properties** now match the new defaults
- If BOTH match → Remove the entire override (it's redundant)
- If only ONE matches → Keep the override (it's still meaningful)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SETTINGS ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DEFAULT SET (Practice-Wide)                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  D = {value, lockState}                                   │  │
│  │                                                            │  │
│  │  Example:                                                  │  │
│  │  D = {"They", "unlocked"}                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Users inherit defaults
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  USER OVERRIDE SET (Per User)                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  O_user = {value, lockState}                              │  │
│  │                                                            │  │
│  │  CONSTRAINT: O_user ≠ D                                   │  │
│  │  (Override must differ from default)                      │  │
│  │                                                            │  │
│  │  Valid Override Examples:                                 │  │
│  │  ✓ O₁ = {"He", "unlocked"}      ← value differs           │  │
│  │  ✓ O₂ = {"They", "locked"}      ← lockState differs       │  │
│  │  ✓ O₃ = {"She", "locked"}       ← both differ             │  │
│  │                                                            │  │
│  │  Invalid Override:                                        │  │
│  │  ✗ O₄ = {"They", "unlocked"}    ← same as D, redundant!  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  WHEN DEFAULT CHANGES: D → D'                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Step 1: Calculate new default set                        │  │
│  │  D' = {new_value, new_lockState}                          │  │
│  │                                                            │  │
│  │  Step 2: Check all overrides                              │  │
│  │  For each user override O_user:                           │  │
│  │    IF O_user == D' THEN                                   │  │
│  │      REMOVE override (now redundant)                      │  │
│  │    ELSE                                                    │  │
│  │      KEEP override (still differs)                        │  │
│  │    END IF                                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Set Theory Analysis

### For Toggles (2 options)

```
Value Domain: V = {True, False}
Lock Domain:  L = {unlocked, locked-visible, locked-hidden}

Total Possible Combinations: |V × L| = 2 × 3 = 6

Example - "Send Note on Email" Toggle:
─────────────────────────────────────────
Current State:
  D = {False, unlocked}

All Possible Override Sets:
  O₁ = {True, unlocked}         ← differs in value
  O₂ = {False, locked-visible}  ← differs in lock
  O₃ = {False, locked-hidden}   ← differs in lock
  O₄ = {True, locked-visible}   ← differs in both
  O₅ = {True, locked-hidden}    ← differs in both

If PM changes: D → D' = {True, unlocked}
  ✓ Keep: O₂, O₃, O₄, O₅ (all differ from D')
  ✗ Remove: O₁ (matches D' exactly)
```

### For Dropdowns (n options)

```
Value Domain: V = {option₁, option₂, ..., optionₙ}
Lock Domain:  L = {unlocked, locked-visible, locked-hidden}

Total Possible Combinations: |V × L| = n × 3

Example - "Default Patient Pronoun" Dropdown:
─────────────────────────────────────────────────
Current State:
  D = {"They", unlocked}

Value Domain: V = {He, She, They}
Lock Domain:  L = {unlocked, locked-visible, locked-hidden}

Total combinations: 3 × 3 = 9

User Overrides:
  User A: O_A = {"He", unlocked}
  User B: O_B = {"They", locked-visible}
  User C: O_C = {"She", unlocked}
  User D: O_D = {"He", locked-visible}

Scenario 1: PM changes value
  D → D' = {"He", unlocked}

  Check each override:
    O_A = {"He", unlocked} == D'  → REMOVE ✗
    O_B = {"They", locked-visible} ≠ D' → KEEP ✓
    O_C = {"She", unlocked} ≠ D'  → KEEP ✓
    O_D = {"He", locked-visible} ≠ D' → KEEP ✓

Scenario 2: PM changes lock state
  D → D' = {"They", locked-visible}

  Check each override:
    O_A = {"He", unlocked} ≠ D' → KEEP ✓
    O_B = {"They", locked-visible} == D' → REMOVE ✗
    O_C = {"She", unlocked} ≠ D' → KEEP ✓
    O_D = {"He", locked-visible} ≠ D' → KEEP ✓

Scenario 3: PM changes BOTH
  D → D' = {"She", locked-hidden}

  Check each override:
    O_A = {"He", unlocked} ≠ D' → KEEP ✓
    O_B = {"They", locked-visible} ≠ D' → KEEP ✓
    O_C = {"She", unlocked} ≠ D' → KEEP ✓
    O_D = {"He", locked-visible} ≠ D' → KEEP ✓
```

---

## State Transition Diagram

```
                    ┌──────────────────┐
                    │   PM ACTION:     │
                    │  Change Default  │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  detectRedundantOverrides│
              │                          │
              │  For all users:          │
              │  Find O_user where       │
              │  O_user == D'            │
              └──────────┬───────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         ┌──────▼──────┐   ┌─────▼──────┐
         │ Matches     │   │ No matches │
         │ Found       │   │ Found      │
         └──────┬──────┘   └─────┬──────┘
                │                │
                │                │
         ┌──────▼──────┐        │
         │Show Modal:  │        │
         │List users   │        │
         │to be removed│        │
         └──────┬──────┘        │
                │                │
      ┌─────────┴────────┐      │
      │                  │      │
┌─────▼──────┐  ┌────────▼──────▼────┐
│ PM Cancels │  │ PM Confirms /       │
│            │  │ Auto-proceed        │
└─────┬──────┘  └────────┬────────────┘
      │                  │
      │         ┌────────▼────────┐
      │         │ Remove overrides│
      │         │ Update D → D'   │
      │         └────────┬────────┘
      │                  │
      └─────────┬────────┘
                │
                ▼
         ┌──────────────┐
         │  New State:  │
         │  D' active   │
         │  Clean list  │
         └──────────────┘
```

---

## Implementation

### Type Definitions

```javascript
// SET DEFINITIONS
type Value = string | string[] | boolean;
type LockState = 'unlocked' | 'locked-visible' | 'locked-hidden';

// A setting configuration is a 2-tuple
type SettingSet = [Value, LockState];

// DEFAULT SET (practice-wide)
const D: SettingSet = [defaultValue, defaultLockState];

// USER OVERRIDE SET (per user, per setting)
const O_user: SettingSet = [overrideValue, overrideLockState];
```

### Core Constraint

```javascript
// CONSTRAINT: Override exists only if it differs from default
const isValidOverride = (O: SettingSet, D: SettingSet): boolean => {
  return !isEqual(O, D);  // O ≠ D
};
```

### Cleanup Logic

```javascript
// CLEANUP LOGIC: When default changes D → D'
const detectRedundantOverrides = (D_new: SettingSet) => {
  const redundant = [];

  for (const user of allUsers) {
    const O_user = getUserOverride(user);
    if (O_user && isEqual(O_user, D_new)) {
      // O_user == D_new, so override is now redundant
      redundant.push(user);
    }
  }

  return redundant;
};
```

### Equality Check

```javascript
// EQUALITY CHECK
const isEqual = (set1: SettingSet, set2: SettingSet): boolean => {
  const [value1, lock1] = set1;
  const [value2, lock2] = set2;

  // Compare both components
  const valueEquals = Array.isArray(value1) && Array.isArray(value2)
    ? JSON.stringify(value1.sort()) === JSON.stringify(value2.sort())
    : value1 === value2;

  const lockEquals = lock1 === lock2;

  return valueEquals && lockEquals;  // BOTH must match
};
```

---

## Benefits

This set-based architecture ensures:

1. ✅ **No redundant overrides** - O ≠ D always
2. ✅ **Clean state** - Only meaningful differences stored
3. ✅ **Efficient cleanup** - Set equality check on default changes
4. ✅ **Simple validation** - Can't create O where O == D
5. ✅ **Atomic operations** - Entire overrides removed or kept as a unit
6. ✅ **Clear semantics** - Easy to understand and reason about

---

## File Location

Implementation: `/Users/shilpijain/Downloads/Marvix_setting/src/PracticeSettingsDashboard.jsx`

### Key Functions

**Override Management:**
- `detectRedundantOverrides()` - Lines 112-166
  - Detects overrides that match new defaults when defaults change
  - Used for automatic cleanup
- `removeMultipleOverrides()` - Lines 168-179
  - Removes multiple overrides at once
  - Used after cleanup confirmation
- `doesOverrideMatchDefault()` - Lines 181-203
  - Validates if a potential override would match defaults
  - Used for creation-time validation

**State Management:**
- `updateSettingState()` - Lines 636-681
  - Updates practice-wide default values/lock states
  - Triggers override cleanup detection

**UI Components:**
- `OverrideCleanupModal` - Lines 1053-1213
  - Shows affected users when defaults change
  - Confirms before removing redundant overrides

**Validation Hooks:**
- Value change validation - Lines 2522-2529
- Lock state change validation - Lines 3122-3132

---

## Validation on Override Creation

**Status: ✅ IMPLEMENTED**

The system now actively prevents users from creating overrides that match the practice defaults.

### Implementation

```javascript
// Helper function to check if an override set matches the default set (Lines 181-203)
const doesOverrideMatchDefault = (userId, moduleId, settingId, newValue, newLockState) => {
  const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
  if (!setting) return false;

  const currentOverride = getUserSetting(userId, moduleId, settingId);

  // Determine the effective values for this potential override
  const effectiveValue = newValue !== undefined
    ? newValue
    : (currentOverride?.value !== undefined ? currentOverride.value : setting.default);
  const effectiveLockState = newLockState !== undefined
    ? newLockState
    : (currentOverride?.lockState !== undefined ? currentOverride.lockState : setting.lockState);

  // Check if BOTH value and lock state match the defaults
  let valueMatches = false;
  if (Array.isArray(effectiveValue) && Array.isArray(setting.default)) {
    valueMatches = JSON.stringify(effectiveValue.sort()) === JSON.stringify(setting.default.sort());
  } else {
    valueMatches = effectiveValue === setting.default;
  }

  const lockStateMatches = effectiveLockState === setting.lockState;

  return valueMatches && lockStateMatches;  // Both must match
};
```

### Validation Points

**1. Value Changes (Lines 2522-2529)**
```javascript
// Before creating value override, check if resulting set matches defaults
const wouldMatchDefault = doesOverrideMatchDefault(
  targetUserId,
  moduleId,
  setting.id,
  newValue,      // New value
  undefined      // Keep existing/default lock state
);

if (wouldMatchDefault) {
  alert(`Cannot create an override that matches the practice default.

This setting would have:
• Value: ${newValue}
• Lock State: ${lockState}

Which is the same as the practice-wide default. An override must differ from the default.`);
  return;  // Prevent override creation
}
```

**2. Lock State Changes (Lines 3122-3132)**
```javascript
// Before creating lock state override, check if resulting set matches defaults
const wouldMatchDefault = doesOverrideMatchDefault(
  userId,
  moduleId,
  setting.id,
  undefined,     // Keep existing/default value
  newLockState   // New lock state
);

if (wouldMatchDefault) {
  // Show alert with clear explanation
  alert('Cannot create override that matches default...');
  return;  // Prevent override creation
}
```

### User Experience Examples

**Example 1: Attempting to Create Matching Override**
```
User Action: Change "Default Pronoun" to "They" with "Unlocked"
Practice Default: {"They", "unlocked"}

Result: ❌ BLOCKED
Alert: "Cannot create an override that matches the practice default.

This setting would have:
• Value: They
• Lock State: Unlocked

Which is the same as the practice-wide default. An override must differ from the default."
```

**Example 2: Gradual Change to Match Default**
```
Practice Default: {"They", "unlocked"}
Current Override: {"He", "locked-visible"}

Step 1: User changes value to "They"
  Result: ✅ ALLOWED (lock still differs)
  Override: {"They", "locked-visible"}

Step 2: User tries to change lock to "unlocked"
  Result: ❌ BLOCKED
  Alert: "Cannot create override... would match default"
```

**Example 3: Partial Match is OK**
```
Practice Default: {"They", "unlocked"}

User Action: Set value = "They" with lock = "locked-visible"
Result: ✅ ALLOWED (lock differs from default)
```

### Key Features

1. ✅ **Proactive Validation** - Prevents bad data before it's created
2. ✅ **Complete Set Check** - Validates both value AND lock state together
3. ✅ **Handles Partial Overrides** - Correctly evaluates when user only has value or lock override
4. ✅ **Clear Feedback** - Alert explains exactly why the override is blocked
5. ✅ **Consistent Logic** - Uses same set equality principles as cleanup logic

---

## Future Considerations

### Dependent Settings

For settings with dependencies (e.g., "Send Transcript in Email" depends on "Send Note on Email"), special handling may be needed to ensure consistency across related overrides when the parent setting changes.

**Example Scenario:**
- Setting A: "Send Note on Email" (parent)
- Setting B: "Send Transcript in Email" (depends on A)
- If A is disabled at practice level, what happens to user overrides of B?

**Potential Strategies:**
1. Cascade deletion - Remove child overrides when parent is disabled
2. Preserve overrides - Keep child overrides but disable them temporarily
3. Warn user - Show modal listing affected dependent setting overrides

This remains an area for future enhancement as the system evolves.

---

## Recent Updates (November 24, 2025)

### 1. Refactored Helper Functions

**Status: ✅ COMPLETED**

All validation and formatting helper functions have been extracted to a dedicated utilities module for better maintainability and reusability.

**Location**: `src/utils/validationHelpers.js`

**Exported Functions**:
- `valuesAreEqual(value1, value2)` - Array-safe value comparison
- `formatLockStateDisplay(lockState)` - User-friendly lock state formatting
- `formatValueDisplay(value)` - Value formatting for display
- `getMatchingOverrideAlertMessage(value, lockState)` - Consistent error messages

**Benefits**:
- ✅ Single source of truth for validation logic
- ✅ Eliminated ~100 lines of duplicated code
- ✅ Easier to test and maintain
- ✅ Consistent behavior across all validation points

---

### 2. Service-Settings-Combined Enhancement

**Status: ✅ COMPLETED**

Enhanced validation for service-settings-combined type to check all three components: enabled services, default service, AND lock state.

**Changes**:
- Updated `doesOverrideMatchDefault()` to accept `newDefaultService` parameter (line 212)
- Added special handling for service-settings-combined type (lines 227-231)
- Now validates ALL THREE components before allowing override creation

**Example**:
```javascript
// Service-settings-combined override is only valid if at least ONE differs:
Override: {
  enabledServices: ["Outpatient", "Inpatient"],  // Component 1
  defaultService: "Outpatient",                   // Component 2
  lockState: "unlocked"                           // Component 3
}

Default: {
  enabledServices: ["Outpatient"],
  defaultService: "Outpatient",
  lockState: "unlocked"
}

// Override valid because enabledServices differs
```

---

### 3. Inline Error Messages in AddOverrideModal

**Status: ✅ COMPLETED**

Replaced browser alert() popups with inline error messages for better UX.

**Implementation**:
- Added `validationError` state (line 1313)
- Error displays inline in modal with red styling (lines 1798-1812)
- Auto-clears when user modifies any input (lines 1327-1333)
- Resets on modal close (lines 1407, 1418)

**User Experience**:
- ❌ Before: Disruptive browser alert popup
- ✅ After: Non-blocking inline error message
- ✅ Error visible alongside form inputs
- ✅ Professional, consistent UI
- ✅ Automatic error clearing on user interaction

**Visual Design**:
```
┌────────────────────────────────────────┐
│ [X] Cannot create matching override   │
│                                        │
│ This setting would have:               │
│ • Value: They                          │
│ • Lock State: Unlocked                 │
│                                        │
│ Which is the same as practice default  │
└────────────────────────────────────────┘
  [Cancel]                    [Add Override]
```

---

### 4. Code Organization

**Status: ✅ COMPLETED**

**New File Structure**:
```
src/
├── utils/
│   └── validationHelpers.js     # Extracted helper functions
├── components/
│   └── (future component extraction)
└── PracticeSettingsDashboard.jsx # Main component

docs/
├── TECHNICAL_DOCUMENTATION.md    # Comprehensive technical guide
└── (developer guides)

ARCHITECTURE.md                   # This file
README.md                          # User-facing documentation
```

**Documentation**:
- ✅ Comprehensive technical documentation created
- ✅ Architecture documentation updated
- ✅ Helper functions properly documented with JSDoc
- ✅ Code examples and test scenarios included

---

## Implementation Status Summary

| Feature | Status | Location |
|---------|--------|----------|
| Override Creation Validation | ✅ Complete | Lines 212-234, 1380-1382, 2557-2562, 3169-3174 |
| Override Cleanup Detection | ✅ Complete | Lines 114-156 |
| Redundant Override Removal | ✅ Complete | Lines 168-179 |
| Service-Settings Validation | ✅ Complete | Lines 227-231, 1370 |
| Inline Error Messages | ✅ Complete | Lines 1313, 1798-1812 |
| Helper Function Extraction | ✅ Complete | src/utils/validationHelpers.js |
| Array Comparison Logic | ✅ Complete | valuesAreEqual() |
| Technical Documentation | ✅ Complete | docs/TECHNICAL_DOCUMENTATION.md |

---

## Known Limitations

1. **Large Component File**: PracticeSettingsDashboard.jsx is ~3800 lines. Consider extracting:
   - Modal components
   - Setting type renderers
   - User management sections

2. **No Type Safety**: JavaScript without TypeScript
   - Consider adding TypeScript for better type checking
   - Would catch type errors at compile time

3. **No Unit Tests**: No automated test coverage
   - Add Jest/React Testing Library tests
   - Test validation logic independently

4. **No Backend Integration**: All data stored in React state
   - Will be lost on page refresh
   - Need API integration for persistence

5. **Performance**: detectRedundantOverrides iterates all overrides
   - O(n) complexity where n = total overrides
   - Consider indexing or caching for large datasets

---

## Future Roadmap

### Phase 1: Code Quality (Short Term)
- [ ] Extract components from main file
- [ ] Add PropTypes or TypeScript
- [ ] Add unit tests for validation logic
- [ ] Add integration tests for override flow

### Phase 2: Features (Medium Term)
- [ ] Bulk operations (multi-user override)
- [ ] Override templates
- [ ] Search and filter functionality
- [ ] Undo/redo support

### Phase 3: Enterprise (Long Term)
- [ ] Backend API integration
- [ ] Audit trail and history
- [ ] Role-based access control
- [ ] Import/export functionality
- [ ] Advanced dependency management

---

*Generated: 2025-11-24*
*Updated: 2025-11-24 - Added validation, refactoring, and inline errors*
