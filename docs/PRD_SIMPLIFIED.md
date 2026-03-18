# Product Requirements Document: Simplified Practice Settings Dashboard

**Version:** 1.0
**Last Updated:** December 1, 2025
**Status:** Active Development
**Branch:** `simplified-master-user`

---

## 1. Overview

### Purpose
A simplified dual-role healthcare settings management system with:
- **Master User (Ops)**: Configure default settings and control PM access
- **Practice Manager (PM)**: Manage practice-wide settings and user-specific overrides

### Key Simplification
No separate Ops dashboard - just a master user email that can edit defaults and control PM access via lock states within the PM dashboard interface.

### Implementation Reference
For the canonical rules (Ops vs PM permissions, inheritance, and overrides), see:
- `docs/ACCESS_INHERITANCE_RULES.md`

---

## 2. User Roles & Permissions

### 2.1 Master User (Ops)

**Email:** `ops@marvix.com`

**Can Access:**
- ✅ Settings view (all 6 modules)
- ✅ User Management
- ✅ Retrieve Deleted Consults

**Can Edit:**
- ✅ Default values for all settings
- ✅ **opsLockState** (controls what PM can see/edit)

**User Overrides (Doctor-level):**
- ✅ Can create/edit doctor overrides **only when** `opsLockState: 'unlocked'`

**Purpose:**
- Set organization-wide defaults
- Control which settings PM can modify
- Hide sensitive configurations from PM

---

### 2.2 Practice Manager (PM)

**Email:** `pm@practice.com` (or any other email)

**Can Access:**
- ✅ Settings view (all 6 modules)
- ✅ User Management
- ✅ Retrieve Deleted Consults
- ✅ User Overrides section

**Can Edit:**
- ✅ Default values (for settings where `opsLockState: 'unlocked'`)
- ✅ **pmLockState** (controls what doctors can see/edit)
- ✅ User-specific overrides

**Restrictions:**
- Cannot edit settings where `opsLockState: 'locked-visible'`
- Cannot see settings where `opsLockState: 'locked-hidden'`

**Purpose:**
- Customize practice-wide defaults
- Create user-specific overrides
- Control individual doctor access to settings

---

## 3. Two-Level Lock State System

### 3.1 Lock States

Every setting has **TWO independent lock state fields:**

```javascript
{
  opsLockState: 'unlocked' | 'locked-visible' | 'locked-hidden',  // Ops → PM
  pmLockState: 'unlocked' | 'locked-visible' | 'locked-hidden'    // PM → Doctors
}
```

### 3.2 opsLockState (Ops Controls PM Access)

| Value | PM Can See | PM Can Edit | PM Can Create Overrides | Use Case |
|-------|-----------|-------------|------------------------|----------|
| **unlocked** 👁️ | ✅ Yes | ✅ Yes | ✅ Yes | Practice-customizable (timezone, pronouns) |
| **locked-visible** 🔒 | ✅ Yes | ❌ No | ❌ No | Organization standards, compliance |
| **locked-hidden** 👁️‍🗨️ | ❌ No | ❌ N/A | ❌ N/A | Sensitive configs, billing, technical |

**Set By:** Master User (Ops)
**Affects:** PM access to settings

---

### 3.3 pmLockState (PM Controls Doctor Access)

| Value | Doctor Can See | Doctor Can Edit | When to Use |
|-------|---------------|----------------|-------------|
| **unlocked** 👁️ | ✅ Yes | ✅ Yes | User-customizable settings |
| **locked-visible** 🔒 | ✅ Yes | ❌ No | View-only for consistency |
| **locked-hidden** 👁️‍🗨️ | ❌ No | ❌ N/A | Hide from specific users |

**Set By:** Practice Manager (PM)
**Affects:** Individual doctor access to settings

---

### 3.4 Cascading Lock Behavior

```
Ops (opsLockState) → PM (pmLockState) → Doctors
```

**Rules:**
1. If `opsLockState: 'locked-visible'` → PM cannot change default or pmLockState
2. If `opsLockState: 'locked-hidden'` → PM cannot see setting at all
3. If `opsLockState: 'unlocked'` → PM can set pmLockState for doctors
4. PM can only control pmLockState for settings where opsLockState is unlocked

---

## 4. Setting Types & Categories

### 4.1 Simple Input Types

#### **Toggle** (Boolean On/Off)
- **UI:** Toggle switch (Green = True, Gray = False)
- **Data:** `options: ['True', 'False']`, `default: 'True' | 'False'`
- **Examples:**
  - Capture Dictation Separately
  - Always Use Default Visit Type
  - Auto Create Consults

**Behavior:**
- Single click toggles value
- Dependent settings disabled when parent = False
- Can have subtexts for each option

---

#### **Dropdown** (Single Selection)
- **UI:** Select dropdown menu
- **Data:** `options: [...]`, `default: one option`
- **Examples:**
  - Default Patient Pronoun (He/She/They)
  - Patient Name (As Entered/Infer from Audio/"The Patient")
  - Default Visit Type (First Visit/Follow up)

**Behavior:**
- Select one option from list
- Can have option-specific subtexts
- Default value must be in options array

---

### 4.2 Multi-Selection Types

#### **Multiselect** (Multiple Checkboxes)
- **UI:** Checkbox list
- **Data:** `options: [...]`, `default: [...array...]`
- **Examples:**
  - Sections to Include (HPI, Physical Exam, Assessment, Plan, etc.)

**Behavior:**
- Select 0 to N options
- Default is array of selected options
- All/none selected are both valid states

---

#### **Time Multiselect** (Time Grid)
- **UI:** Grid of time buttons (max 6 selections)
- **Data:** `options: [...times...]`, `default: [...max 6 times...]`
- **Examples:**
  - Auto Sync Times (00:00, 06:00, 12:00, 18:00)

**Behavior:**
- Visual grid layout
- Maximum 6 selections
- Empty = valid (no auto-sync)
- Each time is a button

---

### 4.3 Ordering & Sequence Types

#### **Order List** (Drag & Drop)
- **UI:** Draggable list with arrows
- **Data:** `options: [...all items...]`, `default: [...ordered array...]`
- **Examples:**
  - Section Order (determines note structure order)

**Behavior:**
- Drag items to reorder
- Up/down arrow buttons
- Single item list = no reorder possible
- Can add items from available options

---

#### **Range Selector** (Time Range Dropdown)
- **UI:** Dropdown + visual indicator
- **Data:** `options: ['1 day', '30 days']`, `default: '7 days'`
- **Examples:**
  - Auto Delete Old Consults (1-90 days)
  - Appointment Sync Range (1-30 days)

**Behavior:**
- Select range from dropdown
- Visual representation of selected range
- Used for EHR sync and data retention
- Long ranges (90 days) may impact performance

---

### 4.4 Special/Complex Types

#### **Service Settings Combined**
- **UI:** Checkboxes (enabled services) + Dropdown (default service)
- **Data:**
  ```javascript
  {
    default: ['Emergency', 'Outpatient', 'Inpatient'], // enabled services
    defaultService: 'Emergency' // default selected service
  }
  ```
- **Examples:**
  - Available Service Types

**Behavior:**
- **Enabled Services:** Which services are available (multiselect)
- **Default Service:** Pre-selected service from enabled list
- **Validation:** defaultService must be in enabled services array
- **Minimum:** Must keep at least 1 service enabled
- **Auto-correct:** If defaultService not in enabled, auto-selects first enabled

**Edge Cases:**
- Disable all services → Prevented (minimum 1)
- User override has disabled service → **Needs definition**
- PM has 10 overrides with service X, Ops disables X → **Needs definition**

---

#### **Google Sign-in** (OAuth Integration)
- **UI:** Info box + "Sign in with Google" button
- **Data:** `default: boolean` (signed in state)
- **Examples:**
  - Google Calendar Integration

**Behavior:**
- Not editable like normal settings
- Triggers OAuth flow
- Shows connected/disconnected state
- Can sign out (shows confirmation modal)

**Edge Cases:**
- OAuth fails → stays disconnected
- Token expires → requires re-auth
- Multiple users, one Google account → shared calendar

---

#### **Zoom Check** (OAuth Integration)
- **UI:** Info box + "Connect Zoom" button
- **Data:** `default: boolean` (installed state)
- **Examples:**
  - Zoom App Integration

**Behavior:**
- Similar to Google Sign-in
- Checks if Zoom app is installed/connected
- Shows install/uninstall state
- Can disconnect

---

## 5. User Override System

### 5.1 How Overrides Work

**Override Definition:** User-specific setting value that takes precedence over practice default

```javascript
{
  userId: '1',
  value: 'Pacific (America/Los Angeles)', // custom value
  pmLockState: 'locked-visible'           // PM controls doctor access
}
```

**Key Principles:**
1. Overrides are **independent** of default changes
2. Changing default does NOT affect users with overrides
3. Each override has its own `pmLockState`
4. Overrides only exist if value OR pmLockState differs from default

---

### 5.2 Override Independence

**Example:**
```
Default Timezone: Eastern (pmLockState: unlocked)
Dr. Smith Override: Pacific (pmLockState: locked-visible)

If Ops changes default to Central:
- Dr. Smith: Pacific (unchanged, locked-visible)
- Other users: Central (new default, unlocked)
```

---

### 5.3 Redundancy Detection

**When override matches BOTH default value AND default pmLockState:**
- System detects redundancy
- Shows confirmation modal
- Lists affected users
- On confirmation → Auto-removes overrides
- Users revert to default

**Redundancy Rules:**

| Scenario | Is Redundant? | Action |
|----------|---------------|--------|
| Override value ≠ default, pmLockState = default | ❌ No | Keep override |
| Override value = default, pmLockState ≠ default | ❌ No | Keep override |
| Override value = default, pmLockState = default | ✅ Yes | Suggest removal |

---

### 5.4 Override Management

**PM Can:**
- Create overrides for individual users
- Edit override values
- Edit override pmLockState (independent of default's pmLockState)
- Delete overrides (user reverts to default immediately)

**Master User Cannot:**
- See User Overrides section
- Create overrides
- Edit existing overrides
- (But changing default affects non-override users)

---

## 6. Settings Modules

### Module Structure

```javascript
{
  'module-id': {
    name: 'Module Name',
    subtitle: 'Module description',
    settings: [
      {
        id: 1,
        name: 'Setting Name',
        type: 'dropdown | toggle | multiselect | ...',
        options: [...],
        default: 'value',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'optional description',
        subtexts: { option1: 'description1', ... }, // optional
        required: false, // optional
        dependsOn: { settingId: 5, value: 'True' } // optional
      }
    ]
  }
}
```

---

### 6.1 Note Settings
**Purpose:** Settings that affect notes and documents

**Settings (8):**
1. Default Patient Pronoun (dropdown)
2. Patient Name (dropdown)
3. Default Visit Type (dropdown)
4. Default Note View (dropdown)
5. Capture Dictation Separately (toggle)
6. Always Use Default Visit Type (toggle) - *depends on #3*
7. Sections to Include (multiselect)
8. Available Service Types (service-settings-combined)

**Override Support:** ✅ Yes

---

### 6.2 Controls
**Purpose:** General practice settings

**Settings (11):**
1. Auto Create Consults (toggle)
2. Auto Delete Old Consults (range-selector)
3. Section Order (order-list)
4. Auto Sync Times (time-multiselect)
5. Automatically Send Note (toggle)
6. Automatically Send Note Only if Edited (toggle) - *depends on #5*
7. Automatically Send Only Finalized Note (toggle) - *depends on #5*
8. Timezone (dropdown)
9. Require Secondary Account Link (toggle)
10. Custom Delete Days (range-selector)
11. Inactivity Timeout (dropdown)

**Override Support:** ✅ Yes

---

### 6.3 E/M Settings
**Purpose:** Evaluation & Management code settings

**Settings (3):**
1. Auto-Generate E/M Codes (toggle)
2. Include Preventive Medicine (toggle)
3. Preferred Code Set (dropdown)

**Override Support:** ✅ Yes

---

### 6.4 EHR Settings - AMD
**Purpose:** AMD EHR integration settings

**Settings (4):**
1. Sync Appointments (toggle)
2. Appointment Sync Range (range-selector)
3. Appointment Types (order-list)
4. Auto Sync Times (time-multiselect)

**Override Support:** ✅ Yes

---

### 6.5 EHR Settings - Athena
**Purpose:** Athena EHR integration settings

**Settings (3):**
1. Enable Athena Sync (toggle)
2. Sync Frequency (dropdown)
3. Department Filter (multiselect)

**Override Support:** ✅ Yes

---

### 6.6 Teleconsult Settings
**Purpose:** Google Calendar & Zoom integration

**Settings (2):**
1. Google Calendar Sign-in (google-signin)
2. Zoom App (zoom-check)

**Override Support:** ❌ No (User-only settings)
**Note:** Shows "User Only" badge in module list

---

## 7. UI Components & Behavior

### 7.1 Header

**Elements:**
- Practice Management Dashboard title
- User switcher dropdown (right side):
  - Options: "PM (Practice Manager)", "Ops (Master User)"
  - Shows "MASTER" badge when ops@marvix.com selected

---

### 7.2 Left Navigation

**Elements:**
- Settings (expandable to show modules)
- User Management
- Retrieve Deleted Consults

**Module List:**
- 6 modules shown when Settings expanded
- "User Only" badge on Teleconsult Settings
- Chevron icon on right

---

### 7.3 Settings View

**For Each Setting:**

```
┌─────────────────────────────────────────────────┐
│ Setting Name  [Lock State Dropdown]             │
│ Subtext                                         │
│                                                 │
│ Default: [Input Control]                        │
│                                                 │
│ User Overrides: (only shown for PM)            │
│ ┌─────────────────────────────────────────┐   │
│ │ Dr. Name    Override Value    [Delete]  │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Lock State Dropdown:**
- Master user sees: "Ops Lock" → controls opsLockState
- PM user sees: "PM Lock" → controls pmLockState
- Options: Unlocked, Locked (Visible), Locked (Hidden)

**Input Control:** Varies by setting type (see Section 4)

**User Overrides Section:**
- Only visible to PM user
- Shows list of users with custom values
- "+ Add Override" button
- Each override shows: user name, value, pmLockState badge, delete button

---

### 7.4 Add Override Modal

**Fields:**
1. Setting name (read-only display)
2. Practice default (read-only display)
3. Select user (dropdown)
4. Custom value (input matching setting type)
5. Lock state (dropdown for pmLockState)

**Validation:**
- Cannot create override if BOTH value AND pmLockState match default
- Shows alert if trying to create redundant override

---

### 7.5 Override Cleanup Modal

**Triggered When:**
- Default value changes and redundant overrides detected
- Default pmLockState changes and redundant overrides detected

**Shows:**
- Current default vs new default
- List of users whose overrides will be removed
- Confirmation buttons

**Action:** Remove all redundant overrides on confirmation

---

## 8. Business Rules

### 8.1 Lock State Rules

1. **opsLockState Override:**
   - If `locked-visible`: PM sees but cannot edit
   - If `locked-hidden`: PM doesn't see at all
   - If `unlocked`: PM has full control

2. **pmLockState Independence:**
   - Each override has independent pmLockState
   - Changing default's pmLockState doesn't affect override pmLockStates
   - PM can set different pmLockStates for different users

3. **Cascading Locks:**
   - Ops locks → PM cannot change pmLockState
   - Ops locks → PM cannot create overrides
   - PM locks (on override) → Doctor sees as locked

---

### 8.2 Override Rules

1. **Override Persistence:**
   - Overrides remain unchanged when default changes
   - Deleting override → immediate reversion to default
   - User deletion → all their overrides auto-deleted

2. **Override Validation:**
   - Cannot create override that matches BOTH value AND pmLockState
   - Can create override with same value but different pmLockState
   - Can create override with different value but same pmLockState

3. **Override Priority:**
   ```
   User Override > Practice Default
   ```

---

### 8.3 Dependency Rules

**Dependent Settings:**
- Disabled when parent setting = False
- Grayed out in UI
- Cannot be edited until parent = True

**Examples:**
- "Always Use Default Visit Type" depends on "Default Visit Type"
- "Auto Send Only if Edited" depends on "Auto Send"
- "Auto Send Finalized Only" depends on "Auto Send"

---

### 8.4 Service Settings Rules

1. **Minimum Enabled:** Must keep at least 1 service enabled
2. **Default Service Validation:** Must be in enabled services list
3. **Auto-Correction:** If defaultService not in enabled, auto-select first enabled
4. **Disable Button:** Grayed out when only 1 service left

---

## 9. Data Flow

### 9.1 Master User Actions

```
Master User
    │
    ├─> Edit Default Value
    │      └─> Updates setting.default
    │      └─> All non-override users see new default
    │      └─> Override users unchanged
    │
    └─> Edit opsLockState
           └─> Updates setting.opsLockState
           └─> PM view updates immediately
           └─> locked-visible = read-only for PM
           └─> locked-hidden = invisible to PM
```

---

### 9.2 PM User Actions

```
PM User
    │
    ├─> Edit Default Value (if opsLockState: unlocked)
    │      └─> Updates setting.default
    │      └─> All non-override users see new default
    │      └─> Checks for redundant overrides
    │
    ├─> Edit pmLockState (if opsLockState: unlocked)
    │      └─> Updates setting.pmLockState
    │      └─> Doctors see new lock state
    │      └─> Checks for redundant overrides
    │
    └─> Manage User Overrides (if opsLockState: unlocked)
           ├─> Create Override
           │      └─> Validates not redundant
           │      └─> Stores override with pmLockState
           │
           ├─> Edit Override
           │      └─> Updates override value or pmLockState
           │      └─> Independent of default
           │
           └─> Delete Override
                  └─> Removes override
                  └─> User reverts to default immediately
```

---

## 10. Edge Cases & Scenarios

### 10.1 Concurrent Operations

| Scenario | Risk | Expected Behavior |
|----------|------|------------------|
| **Ops changes default while PM editing** | Race condition | Last write wins, no conflict resolution |
| **Ops locks setting while PM in Add Override modal** | PM loses work | Override creation fails with error |
| **Ops changes opsLockState while PM viewing** | UI out of sync | PM view updates immediately |

---

### 10.2 Service Settings Edge Cases

| Scenario | Risk | Mitigation |
|----------|------|-----------|
| **User override has service now disabled** | Invalid state | **Needs definition:** Auto-revert? Show error? |
| **Disable all services** | Settings broken | System prevents: minimum 1 enabled |
| **defaultService not in enabled** | Invalid state | Auto-correct to first enabled service |

---

### 10.3 Override & Default Interactions

| Scenario | Behavior |
|----------|----------|
| **Ops changes default, PM has overrides** | All overrides unchanged, only non-override users see new default |
| **Override matches new default (value + pmLockState)** | Show confirmation modal → Auto-remove on confirm |
| **PM changes default, 50 overrides affected** | Redundancy detection may be slow, show progress |

---

### 10.4 Lock State Changes

| Scenario | Impact |
|----------|--------|
| **opsLockState: unlocked → locked-visible** | PM loses edit access immediately, sees disabled controls |
| **opsLockState: unlocked → locked-hidden** | Setting disappears from PM view, overrides invisible but active |
| **opsLockState: locked → unlocked** | PM regains full access, can create overrides again |

---

## 11. Performance Considerations

| Scenario | Impact | Mitigation |
|----------|--------|-----------|
| **100+ overrides per setting** | Slow rendering | Paginate override list, lazy load |
| **Redundancy detection on 500 users** | Slow UI | Show progress indicator, async processing |
| **Long range selectors (90 days)** | EHR sync performance | Warn user about performance impact |

---

## 12. Future Enhancements

### Planned Features
- Bulk lock state operations
- Undo/redo for setting changes
- Scheduled changes (apply at specific time)
- Active user warnings (show how many users affected)
- Conflict resolution for concurrent edits
- Override inheritance rules for copied users
- Audit log for all Ops and PM actions
- Setting search and filter
- Export/import settings configuration

---

## 13. Technical Implementation

### 13.1 Setting Data Structure

```javascript
{
  id: 1,
  name: 'Default Patient Pronoun',
  type: 'dropdown',
  options: ['He', 'She', 'They'],
  default: 'They',
  opsLockState: 'unlocked',  // Ops → PM
  pmLockState: 'unlocked',   // PM → Doctors
  subtext: 'Optional description',
  subtexts: {                 // Optional, for option-specific descriptions
    'He': 'Use male pronoun',
    'She': 'Use female pronoun',
    'They': 'Use gender-neutral pronoun'
  },
  required: false,            // Optional
  dependsOn: {                // Optional
    settingId: 3,
    value: 'True'
  }
}
```

---

### 13.2 Override Data Structure

```javascript
{
  'user1-note-settings-1': {
    value: 'She',
    pmLockState: 'locked-visible'
  },
  'user2-controls-20': {
    value: 'Pacific (America/Los Angeles)',
    pmLockState: 'unlocked'
  }
}
```

**Key Format:** `${userId}-${moduleId}-${settingId}`

---

### 13.3 User Data Structure

```javascript
{
  id: 1,
  name: 'Dr. Sarah Johnson',
  type: 'primary',
  specialty: 'Cardiology',
  email: 'sarah.johnson@clinic.com',
  permissions: {
    createConsults: true,
    canGenerateNotes: true,
    editGeneratedNotes: true,
    pushToEHR: true
  }
}
```

---

### 13.4 Role Detection

```javascript
const MASTER_USER_EMAIL = 'ops@marvix.com';
const isMasterUser = () => currentUserEmail === MASTER_USER_EMAIL;
```

---

## 14. Glossary

- **Master User (Ops)**: Email-based elevated permissions user who controls defaults and PM access
- **PM**: Practice Manager, manages practice-wide settings and user overrides
- **opsLockState**: Lock state controlling PM's access to settings (set by Ops)
- **pmLockState**: Lock state controlling doctor's access to settings (set by PM)
- **Override**: User-specific setting value that takes precedence over default
- **Redundant Override**: Override where both value and pmLockState match default
- **Cascading Lock**: When upper-level lock (ops) prevents lower-level control (PM)
- **Dependent Setting**: Setting that is disabled when parent setting = False
- **Service Settings**: Complex setting type with enabled services + default service

---

**Document Status:** Active
**Last Review:** December 1, 2025
**Next Review:** December 2025

---

## Changelog

### Version 1.0 (December 1, 2025)
- Initial PRD for simplified master user system
- Documented two-level lock state system
- Categorized all 8 setting types
- Defined override behavior and redundancy detection
- Documented all 6 settings modules (29 total settings)
- Added edge cases and business rules
- Technical implementation details
