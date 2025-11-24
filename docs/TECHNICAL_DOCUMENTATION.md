# Practice Settings Dashboard - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Structures](#data-structures)
4. [Key Components](#key-components)
5. [Validation System](#validation-system)
6. [Override Management](#override-management)
7. [API Reference](#api-reference)
8. [Testing Guide](#testing-guide)

---

## System Overview

The Practice Settings Dashboard is a React-based application for managing healthcare practice settings with user-specific overrides. It implements a set-theory-based override system ensuring no redundant configurations exist.

### Key Features
- ✅ Practice-wide default settings management
- ✅ User-specific override system
- ✅ Lock state management (unlocked, locked-visible, locked-hidden)
- ✅ Automatic redundancy detection and cleanup
- ✅ Creation-time validation to prevent matching overrides
- ✅ Support for multiple setting types (toggles, dropdowns, multiselect, etc.)
- ✅ Service settings with enabled services + default service

### Technology Stack
- **Frontend**: React 18.2.0
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Create React App

---

## Architecture

### Core Principle

**An override should ONLY exist when it differs from the practice defaults.**

For standard settings:
- Override = `{value, lockState}` where **BOTH** differ from defaults OR at least one differs
- When defaults change, check if override matches new defaults
- If both match → Remove override (redundant)

For service-settings-combined:
- Override = `{enabledServices, defaultService, lockState}` where at least one component differs
- All three components must match for the override to be considered redundant

### Set Theory Model

```
Default Set (D):        {value, lockState}
Override Set (O):       {value, lockState}

Valid Override:   O ≠ D  (at least one component differs)
Invalid Override: O == D (all components match)

Constraint: ∀ user overrides O_user, O_user ≠ D
```

### System Flow

```
┌─────────────────────────────────────────────┐
│            USER ACTIONS                     │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
   ┌────▼────────┐          ┌──────▼────────┐
   │   Create    │          │    Modify     │
   │  Override   │          │   Defaults    │
   └────┬────────┘          └──────┬────────┘
        │                          │
        │ Validation               │ Detection
        │                          │
   ┌────▼──────────────┐    ┌──────▼────────────────┐
   │  Check if matches │    │ Find matching         │
   │  defaults         │    │ overrides             │
   └────┬──────────────┘    └──────┬────────────────┘
        │                          │
     ┌──▼──┐                  ┌────▼────┐
     │Block│                  │ Confirm │
     └─────┘                  └────┬────┘
                                   │
                            ┌──────▼──────┐
                            │   Remove    │
                            │  Overrides  │
                            └─────────────┘
```

---

## Data Structures

### Setting Object

```javascript
{
  id: number,              // Unique identifier
  name: string,            // Display name
  type: string,            // 'toggle', 'dropdown', 'multiselect', etc.
  options: array,          // Available options (for dropdowns, etc.)
  default: any,            // Default value
  defaultService: string,  // For service-settings-combined only
  lockState: string,       // 'unlocked', 'locked-visible', 'locked-hidden'
  subtext: string,         // Help text
  dependsOn: object,       // Optional dependency configuration
  subtexts: object         // Conditional help texts
}
```

### Override Object

```javascript
{
  value: any,              // Override value (undefined if not overridden)
  lockState: string,       // Override lock state (undefined if not overridden)
  defaultService: string   // For service-settings-combined only
}
```

### Storage Key Format

```javascript
// User setting overrides are stored with composite keys:
`${userId}-${moduleId}-${settingId}`

// Example: "1-email-22" for user 1, email module, setting 22
```

---

## Key Components

### 1. PracticeSettingsDashboard (Main Component)

**Location**: `src/PracticeSettingsDashboard.jsx`

**Responsibilities**:
- Manages all state (settings, overrides, users, modals)
- Coordinates validation and override operations
- Renders all UI components

**Key State Variables**:
```javascript
const [moduleSettings, setModuleSettings] = useState({})
const [userSettingsOverrides, setUserSettingsOverrides] = useState({})
const [selectedUser, setSelectedUser] = useState(null)
const [showAddOverrideModal, setShowAddOverrideModal] = useState(false)
const [showOverrideCleanupModal, setShowOverrideCleanupModal] = useState(false)
```

### 2. SettingRow Component

**Location**: `src/PracticeSettingsDashboard.jsx` (lines 2530+)

**Responsibilities**:
- Renders individual setting rows
- Handles inline value/lock state changes
- Triggers validation on user changes
- Supports both practice defaults and user overrides

### 3. AddOverrideModal Component

**Location**: `src/PracticeSettingsDashboard.jsx` (lines 1308+)

**Responsibilities**:
- Allows adding new user overrides
- Validates before saving
- Shows inline error messages for validation failures
- Handles all setting types including service-settings-combined

**Key Features**:
- User selection dropdown
- Setting value input (type-specific)
- Lock state selector
- Inline validation error display
- Auto-clears error on user input

### 4. OverrideCleanupModal Component

**Location**: `src/PracticeSettingsDashboard.jsx` (lines 1091+)

**Responsibilities**:
- Shows users affected when defaults change
- Lists overrides that will be removed
- Confirms before removing redundant overrides

---

## Validation System

### Overview

The validation system prevents creation of overrides that match practice defaults. It operates at multiple checkpoints:

1. **AddOverrideModal** - Validates before save, shows inline error
2. **Inline Value Changes** - Validates during user interaction, shows browser alert
3. **Inline Lock Changes** - Validates during user interaction, shows browser alert

### Validation Functions

#### `doesOverrideMatchDefault(userId, moduleId, settingId, newValue, newLockState, newDefaultService)`

**Location**: Lines 212-234

**Purpose**: Checks if a potential override would match the practice defaults

**Parameters**:
- `userId` - User ID to check
- `moduleId` - Module identifier
- `settingId` - Setting identifier
- `newValue` - Proposed override value (undefined to use current)
- `newLockState` - Proposed lock state (undefined to use current)
- `newDefaultService` - For service-settings-combined only

**Returns**: `boolean` - True if override matches defaults

**Algorithm**:
```javascript
1. Get setting configuration
2. Get current override (if exists)
3. Calculate effective value (new || current || default)
4. Calculate effective lock state (new || current || default)
5. Compare effective value with default (using valuesAreEqual)
6. Compare effective lock state with default
7. For service-settings-combined:
   a. Calculate effective default service
   b. Compare with default service
   c. Return true only if ALL THREE match
8. For other types:
   a. Return true only if BOTH value and lock match
```

### Helper Functions

#### `valuesAreEqual(value1, value2)`

**Location**: `src/utils/validationHelpers.js`

**Purpose**: Compare two values, handling arrays properly

**Implementation**:
```javascript
- If both are arrays: Sort and JSON stringify for comparison
- Otherwise: Use strict equality (===)
```

#### `formatLockStateDisplay(lockState)`

**Location**: `src/utils/validationHelpers.js`

**Purpose**: Convert lock state to user-friendly string

**Mapping**:
- `unlocked` → "Unlocked"
- `locked-visible` → "Locked (Visible)"
- `locked-hidden` → "Locked (Hidden)"

#### `formatValueDisplay(value)`

**Location**: `src/utils/validationHelpers.js`

**Purpose**: Format values for display

**Implementation**:
- Arrays: Join with ", "
- Primitives: Convert to string

#### `getMatchingOverrideAlertMessage(value, lockState)`

**Location**: `src/utils/validationHelpers.js`

**Purpose**: Generate consistent error messages

**Returns**: Multi-line string with formatted error details

---

## Override Management

### Creating Overrides

**Flow**:
```
1. User opens AddOverrideModal
2. User selects target user
3. User sets override value and lock state
4. User clicks "Add Override"
5. System validates (doesOverrideMatchDefault)
6. If valid: Save override
7. If invalid: Show inline error, block save
```

**Code Location**: Lines 1308-1832 (AddOverrideModal)

### Detecting Redundant Overrides

#### `detectRedundantOverrides(moduleId, settingId, newDefaultValue, settingType, isLockStateChange)`

**Location**: Lines 114-156

**Purpose**: Find overrides that match new defaults when practice defaults change

**Algorithm**:
```javascript
1. Get setting configuration
2. Iterate through all user overrides for this setting
3. For each override:
   a. Calculate new default value/lock state
   b. Get override's current value/lock state
   c. Use valuesAreEqual to compare value
   d. Compare lock states
   e. If BOTH match: Add to redundant list
4. Return list of redundant overrides with user details
```

**Returns**: Array of objects:
```javascript
[{
  userId: string,
  userName: string,
  value: any,
  lockState: string
}]
```

### Removing Overrides

#### `removeMultipleOverrides(overridesToRemove, moduleId, settingId)`

**Location**: Lines 168-179

**Purpose**: Remove multiple overrides at once (used after cleanup confirmation)

**Implementation**:
```javascript
1. Clone userSettingsOverrides state
2. For each override in list:
   a. Build composite key: ${userId}-${moduleId}-${settingId}
   b. Delete entry from cloned state
3. Update state with cleaned object
```

#### `removeUserSetting(userId, moduleId, settingId)`

**Location**: Lines 97-110

**Purpose**: Remove a single user override

**Implementation**:
```javascript
1. Build composite key
2. Clone userSettingsOverrides
3. Delete entry
4. Update state
```

### Cleanup Workflow

```
1. PM changes practice default value/lock state
   ↓
2. updateSettingState() is called
   ↓
3. detectRedundantOverrides() finds matches
   ↓
4. If matches found:
   a. Show OverrideCleanupModal
   b. List affected users
   c. Wait for confirmation
   ↓
5. On confirm:
   a. removeMultipleOverrides()
   b. Update practice default
   c. Close modal
   ↓
6. On cancel:
   a. Don't change anything
   b. Close modal
```

---

## API Reference

### Core Functions

#### `setUserSetting(userId, moduleId, settingId, property, value)`

**Purpose**: Create or update a user override

**Parameters**:
- `userId` - Target user ID
- `moduleId` - Module identifier
- `settingId` - Setting identifier
- `property` - 'value', 'lockState', or 'defaultService'
- `value` - New value for the property

**Side Effects**: Updates `userSettingsOverrides` state

---

#### `getUserSetting(userId, moduleId, settingId)`

**Purpose**: Retrieve a user's override for a specific setting

**Parameters**:
- `userId` - User ID
- `moduleId` - Module identifier
- `settingId` - Setting identifier

**Returns**: Override object or undefined

---

#### `getSettingOverrides(moduleId, settingId)`

**Purpose**: Get all user overrides for a specific setting

**Parameters**:
- `moduleId` - Module identifier
- `settingId` - Setting identifier

**Returns**: Array of override objects with user details

---

#### `updateSettingState(moduleId, settingId, property, value)`

**Purpose**: Update practice-wide default value or lock state

**Parameters**:
- `moduleId` - Module identifier
- `settingId` - Setting identifier
- `property` - 'default' or 'lockState'
- `value` - New value

**Side Effects**:
- May trigger override cleanup detection
- May show OverrideCleanupModal
- Updates `moduleSettings` state

---

## Testing Guide

### Manual Testing Checklist

#### Override Creation Validation

- [ ] Try creating override with same value and lock state as default → Should block with error
- [ ] Try creating override with different value, same lock → Should allow
- [ ] Try creating override with same value, different lock → Should allow
- [ ] Try creating override with different value and lock → Should allow
- [ ] For service-settings-combined: Verify all three components checked

#### Override Cleanup

- [ ] Change default value → Should detect matching overrides
- [ ] Change lock state → Should detect matching overrides
- [ ] Confirm cleanup → Overrides should be removed
- [ ] Cancel cleanup → Nothing should change

#### Inline Error Messages

- [ ] Error appears in modal when validation fails
- [ ] Error clears when user changes any input
- [ ] Error clears when modal closes
- [ ] Error message is readable and informative

### Test Scenarios

#### Scenario 1: Simple Override Creation
```
Setup:
- Practice default: {value: "They", lockState: "unlocked"}

Test:
- Select user
- Set value: "They"
- Set lock: "unlocked"
- Click "Add Override"

Expected: Error message shown, save blocked
```

#### Scenario 2: Partial Match (Value)
```
Setup:
- Practice default: {value: "They", lockState: "unlocked"}

Test:
- Select user
- Set value: "They"
- Set lock: "locked-visible"
- Click "Add Override"

Expected: Override created successfully
```

#### Scenario 3: Default Change Cleanup
```
Setup:
- Practice default: {value: "They", lockState: "unlocked"}
- User A override: {value: "He", lockState: "unlocked"}
- User B override: {value: "They", lockState: "locked-visible"}

Test:
- Change practice default value to "He"

Expected:
- Modal shows User A will be affected
- After confirmation, User A override removed
- User B override remains
```

#### Scenario 4: Service Settings Combined
```
Setup:
- Default: {enabledServices: ["Outpatient"], defaultService: "Outpatient", lockState: "unlocked"}

Test:
- Select user
- Set enabled: ["Outpatient"]
- Set default: "Outpatient"
- Set lock: "unlocked"

Expected: Error, all three match default
```

---

## Common Issues and Solutions

### Issue: Override Not Being Blocked

**Symptom**: User can create override matching defaults

**Possible Causes**:
1. Validation not called before save
2. Array comparison not working correctly
3. Service-settings-combined missing defaultService check

**Solution**:
- Check `doesOverrideMatchDefault` is called before `setUserSetting`
- Verify `valuesAreEqual` handles arrays with `.sort()`
- For service-settings-combined, ensure `newDefaultService` parameter passed

---

### Issue: Cleanup Not Detecting Overrides

**Symptom**: Modal doesn't show when changing defaults

**Possible Causes**:
1. `detectRedundantOverrides` not called
2. `isLockStateChange` parameter incorrect
3. Comparison logic error

**Solution**:
- Verify `updateSettingState` calls `detectRedundantOverrides`
- Check `isLockStateChange` flag is set correctly
- Debug comparison logic with console.logs

---

### Issue: Error Message Not Clearing

**Symptom**: Validation error persists after user changes input

**Possible Causes**:
1. useEffect dependencies missing
2. State not updating
3. Effect condition wrong

**Solution**:
- Check useEffect dependencies include all relevant state
- Verify `setValidationError('')` is called
- Ensure `if (validationError)` condition works correctly

---

## Performance Considerations

### State Updates

- Override storage uses composite keys for O(1) lookup
- `detectRedundantOverrides` iterates all overrides: O(n) where n = total overrides
- Validation checks are O(1) for single override

### Optimization Opportunities

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Callback Optimization**: Use `useCallback` for event handlers
3. **Component Splitting**: Extract large components to reduce re-renders
4. **Virtual Scrolling**: For large lists of settings/users

---

## Security Considerations

### Data Validation

- All user input should be validated before storage
- Lock states restrict editing capabilities
- Override validation prevents data inconsistency

### Access Control

- Lock states: `locked-hidden` prevents viewing/editing
- Lock states: `locked-visible` allows viewing, prevents editing
- Lock states: `unlocked` allows full access

---

## Future Enhancements

### Planned Features

1. **Bulk Operations**: Apply override to multiple users at once
2. **Override Templates**: Save common override configurations
3. **Audit Trail**: Track who changed what and when
4. **Import/Export**: Bulk import/export of settings
5. **Dependency Management**: Better handling of dependent settings
6. **Search/Filter**: Search settings and overrides
7. **Undo/Redo**: Support undo for changes

### Technical Debt

1. **Component Extraction**: Split PracticeSettingsDashboard into smaller components
2. **Type Safety**: Add TypeScript for better type checking
3. **Testing**: Add unit and integration tests
4. **Error Handling**: More robust error handling and user feedback
5. **API Integration**: Connect to backend API for persistence

---

*Last Updated: November 24, 2025*
*Version: 2.0*
