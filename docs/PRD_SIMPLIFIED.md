# Product Requirements Document: Simplified Practice Settings Dashboard

**Version:** 1.2
**Last Updated:** March 23, 2026
**Status:** Active Development
**Branch:** `simplified-master-user`

---

## 1. Overview

### Purpose
A simplified dual-role healthcare settings management system with:
- **Master User (Ops)**: Configure default settings and control PM access
- **Practice Manager (PM)**: Manage practice-wide settings and user-specific overrides

### Key Simplification
No separate Ops dashboard. Ops and PM use the same dashboard surface, with role-specific permissions enforced through lock states.

### Implementation Reference
For the canonical rules (Ops vs PM permissions, inheritance, and overrides), see:
- `docs/ACCESS_INHERITANCE_RULES.md`

---

## 2. User Roles & Permissions

### 2.1 Master User (Ops)

**Demo Access Pattern:**
- Role selected explicitly on login (`Ops` tab)
- Valid demo Ops email must exist in `opsPracticeAccess`
- Current seeded Ops email: `ops@marvix.ai`

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

**Demo Access Pattern:**
- Role selected explicitly on login (`PM` tab)
- PM email must be present in `pmPracticeBinding`
- Current seeded PM emails:
  - `a@sunrise.hp`
  - `a@manipal.hp`

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

Every setting has two lock controls:
- `opsLockState` (Ops -> PM access)
- `pmLockState` (PM -> Doctor access)

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
- **Examples:**
  - Capture Dictation Separately
  - Always Use Default Visit Type
  - Auto Create Consults

**Behavior:**
- User turns setting on/off with one action.
- If a dependent setting relies on this toggle, that dependent setting is disabled when prerequisite conditions are not met.
- Lock-state rules still apply (Ops/PM may see or edit based on lock configuration).

---

#### **Dropdown** (Single Selection)
- **Examples:**
  - Default Patient Pronoun (He/She/They)
  - Patient Name (As Entered/Infer from Audio/"The Patient")
  - Default Visit Type (First Visit/Follow up)

**Behavior:**
- User selects one value from predefined options.
- Selected value becomes the practice default unless a user-specific override exists.
- Optional helper text can explain option intent.

---

### 4.2 Multi-Selection Types

#### **Multiselect** (Multiple Checkboxes)
- **Examples:**
  - Sections to Include (HPI, Physical Exam, Assessment, Plan, etc.)

**Behavior:**
- User can select multiple options.
- Selection controls what is included downstream for non-overridden users.
- Empty selection is allowed when business rules for that setting permit it.

---

#### **Time Multiselect** (Time Grid)
- **Examples:**
  - Auto Sync Times (00:00, 06:00, 12:00, 18:00)

**Behavior:**
- User chooses one or more scheduled times for an automated action.
- Maximum selection cap is enforced.
- No selection means the automation does not run on schedule.

---

### 4.3 Ordering & Sequence Types

#### **Order List** (Drag & Drop)
- **Examples:**
  - Section Order (determines note structure order)

**Behavior:**
- User controls output order by reordering items.
- New order applies as the default for users without overrides.
- Reordering is only available when there is more than one item.

---

#### **Range Selector** (Time Range Dropdown)
- **Examples:**
  - Auto Delete Old Consults (1-90 days)
  - Appointment Sync Range (1-30 days)

**Behavior:**
- User chooses a bounded range (for retention/sync windows).
- Range choice determines operational behavior for that module.
- Product may surface warnings for high-impact ranges.

---

### 4.4 Special/Complex Types

#### **Service Settings Combined**
- **Examples:**
  - Available Service Types

**Behavior:**
- User enables available services and chooses one default service.
- At least one service must remain enabled at all times.
- Default service must be one of the enabled services.
- When Ops/PM changes service availability, impacted overrides are reviewed and reconciled with user confirmation.

---

#### **Google Sign-in** (OAuth Integration)
- **Examples:**
  - Google Calendar Integration

**Behavior:**
- User initiates Google connection from the setting row.
- Setting shows connected/disconnected account status.
- If connection expires or fails, user is prompted to reconnect.

---

#### **Zoom Check** (OAuth Integration)
- **Examples:**
  - Zoom App Integration

**Behavior:**
- User connects or disconnects Zoom from the setting row.
- Setting shows whether integration is active.
- Integration availability is treated as account/system state, not a free-form setting value.

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

**Master User (Ops) Current Prototype Behavior:**
- Can access the same override modal flow as PM for settings with `opsLockState: 'unlocked'`
- Can create and remove overrides for those unlocked settings
- Cannot add overrides when `opsLockState` is not `unlocked`

---

### 5.5 Linked Assignments (Prototype)

- PM/Ops can create linked assignments from a primary doctor to either:
  - a secondary user (nurse/assistant/etc.), or
  - another primary doctor (coverage/assistant scenarios).
- Assignment types:
  - `assistant` (acts as MA/assistant)
  - `coverage` (doctor coverage)
- Required inputs: assignee user + assignment type.
- Conflict rule: prevent duplicates for the same `(assignee, doctor, assignmentType)` tuple.
- Unlink removes only the selected assignment record.
- Linked assignments are shown in:
  - primary doctor view (users assigned to that doctor),
  - assignee view (doctors that selected user is assigned to).

---

### 5.6 Add New User (Doctor / Secondary) - PM/Ops Flow

**Entry Point:**
- User Management > `+ Add User`
- PM and Ops can access this flow.

**Step 1: Select Account Type**
- Primary Account (Doctor)
- Secondary Account (Staff)

**Step 2A: Add Primary Account (Doctor)**
- Required fields:
  - Full name
  - Specialty
  - Email
- Setup methods:
  - **Request New Account**: creates a new doctor account with practice defaults.
  - **Copy from Existing Doctor**: select source doctor, then create new doctor account with copied configuration.
- Validation:
  - All required fields must be present.
  - If "Copy from Existing Doctor" is selected, source doctor selection is required.

**Step 2B: Add Secondary Account (Staff)**
- Required fields:
  - Full name
  - Role
  - Email
- Permission controls:
  - Merge and Link Appointments
  - Create Consults
  - Can Generate Notes
  - Edit Generated Notes
  - Push to EHR
- Permission dependency rules:
  - `Edit Generated Notes` requires `Can Generate Notes`.
  - `Push to EHR` requires both `Can Generate Notes` and `Edit Generated Notes`.
- New secondary accounts are available immediately for linking to doctors.

**Step 3: Create Linked Assignment**
- Triggered from selected primary doctor > `Linked Assignments` > `Add Assignment`.
- Required inputs:
  - Assignee (primary or secondary)
  - Assignment type (`assistant` or `coverage`)
- Validation:
  - Prevent duplicate assignment for same `(assignee, doctor, assignmentType)` tuple.

**Post-Create / Post-Link Behavior**
- New doctor or secondary user appears immediately in User Management.
- Linked assignment appears in:
  - primary doctor view (assigned users),
  - assignee view (linked doctors).
- Unlink removes only the selected assignment record.

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

### 7.0 Authentication Flow (Implemented)

The app starts with a dedicated authentication flow before the dashboard renders.

**Step 1: Sign in**
- User chooses `PM` or `Ops` via tab selector.
- User enters email + password.
- Demo password is currently `marvix`.
- Login validation:
  - Ops: email must exist in `opsPracticeAccess`.
  - PM: email must exist in `pmPracticeBinding`.

**Step 2: MFA**
- A 6-digit code is generated and required for sign-in completion.
- Demo UI shows the generated code.
- Resend code regenerates and replaces the previous code.

**Step 3: Practice Resolution**
- PM: auto-bound to one practice from `pmPracticeBinding`.
- Ops:
  - If exactly one practice is accessible, login completes directly.
  - If multiple practices are accessible, user selects one.

**Step 4: Runtime Access Gating (Post-login)**
- If an Ops session is active in the same practice:
  - PM can still open dashboard, but write actions are disabled (read-only mode).
  - PM sees active Ops context.
- If another Ops user is already active:
  - incoming Ops user is blocked until the active Ops session ends or becomes stale.
- Session state is propagated across tabs via storage/events.

### 7.1 Header

**Elements:**
- Practice Management Dashboard title
- Authenticated user context (email/role/practice)
- Logout action

**Note:**
- Runtime user switching in header is no longer the primary role switch path.
- Role selection now happens at login.

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

**For each setting row:**
- Setting label and contextual help text
- Ops lock-state badge display (read-only indicator for current `opsLockState`)
- Default value control
- User override management (PM and Ops, where permitted)

**Current prototype note:**
- The extracted row component currently surfaces default-value controls and override management.
- Full inline lock dropdown controls are not currently rendered in the row in this prototype pass.

**Input Control:** Varies by setting type (see Section 4)

**User Overrides Section:**
- Visible for PM and Ops when setting `opsLockState` is `unlocked`
- Shows list of users with custom values
- "+ Add Override" button
- Each override shows: user name, value, and remove action

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

### 7.6 User Management Actions (Prototype)

**Manage Access Actions:**
- Suspend Account
- Reset PIN

**Linked Assignment Actions:**
- Add assignment (primary/secondary assignee)
- Select assignment type (`assistant` or `coverage`)
- Unlink assignment from doctor view

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

**Ops→PM propagation for dependent settings:**
- If a parent setting is `opsLockState: locked-hidden`, PM should not see the dependent setting either (avoid “orphan” settings).
- If a parent setting is `opsLockState: locked-visible`, PM can see the dependent but cannot edit it (even if the dependent itself is unlocked), because its meaning depends on the parent’s state.
- Dependency enforcement applies to practice defaults: if the parent is not enabled, PM cannot change the dependent default.
- When a dependent setting is disabled by dependency, its lock dropdown is also disabled (to avoid “looks editable but won’t apply” confusion).

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

| Scenario | Expected Behavior |
|----------|-------------------|
| **Ops is active in a practice** | PM can access dashboard in read-only mode; all PM write actions are disabled until Ops session ends. |
| **Ops changes a setting while PM is editing** | Most recent saved change is applied; user sees updated state. |
| **Ops changes lock state while PM is in an override flow** | PM action is blocked if the new lock no longer permits it, with clear error feedback. |
| **Settings change in another tab/session** | UI informs the user and applies or prompts for updates without silently losing in-progress work. |

---

### 10.2 Service Settings Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **User override references a service no longer enabled** | Product flags impacted users and requires confirmation before reconciliation. |
| **User attempts to disable all services** | Product blocks the action and requires at least one enabled service. |
| **Default service is no longer valid** | Product requires/chooses a valid enabled default before save completes. |

---

### 10.3 Override & Default Interactions

| Scenario | Behavior |
|----------|----------|
| **Ops changes default, PM has overrides** | All overrides unchanged, only non-override users see new default |
| **Override matches new default (value + pmLockState)** | Show confirmation modal → Auto-remove on confirm |
| **PM changes default, many overrides affected** | Product provides clear feedback while evaluating/removing redundant overrides |

---

### 10.4 Lock State Changes

| Scenario | Impact |
|----------|--------|
| **opsLockState: unlocked → locked-visible** | PM loses edit access immediately, sees disabled controls. If overrides exist, Ops is prompted to keep them (they reappear on unlock) or remove them now. |
| **opsLockState: unlocked → locked-hidden** | Setting disappears from PM view, and existing doctor overrides for that setting are removed after confirmation |
| **opsLockState: locked → unlocked** | PM regains full access, can create overrides again |

---

### 10.5 Dependent Settings Interactions

| Scenario | Expected Behavior |
|----------|-------------------|
| **Parent setting is locked/hidden by Ops** | Dependent settings follow the same effective PM access constraints to avoid inconsistent UX. |
| **Parent change makes dependent default invalid** | Product requires a valid dependent default and communicates the adjustment. |

## 11. Performance Considerations

Performance expectations are tracked as product constraints:
- Large override sets should remain usable with clear progress/feedback.
- High-impact operations should communicate status during processing.
- Long data/sync windows should show user-facing warnings where relevant.

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

Detailed technical design (data models, persistence keys, and runtime role/session handling) is maintained in:
- `docs/TECHNICAL_DOCUMENTATION.md`

Current prototype persistence scope:
- Persisted (practice-scoped localStorage): module settings, user overrides, linked assignments.
- Session-scoped localStorage: auth session and active master-user heartbeat/session.
- In-memory only: user directory mutations from "Add User" flow (not yet persisted across reloads).

This PRD captures product behavior and acceptance-level requirements only.

---

## 14. Glossary

- **Master User (Ops)**: Elevated-permission role that controls defaults and PM access
- **PM**: Practice Manager, manages practice-wide settings and user overrides
- **opsLockState**: Lock state controlling PM's access to settings (set by Ops)
- **pmLockState**: Lock state controlling doctor's access to settings (set by PM)
- **Override**: User-specific setting value that takes precedence over default
- **Redundant Override**: Override where both value and pmLockState match default
- **Cascading Lock**: When upper-level lock (ops) prevents lower-level control (PM)
- **Dependent Setting**: Setting that is disabled when parent setting = False
- **Service Settings**: Complex setting type with enabled services + default service
- **Linked Assignment**: Relationship linking an assignee (primary/secondary) to a doctor with an assignment type (`assistant` or `coverage`)

---

**Document Status:** Active
**Last Review:** March 23, 2026
**Next Review:** April 2026

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

### Version 1.1 (March 23, 2026)
- Updated auth model to match implemented login + MFA + practice selection flow.
- Replaced email-based role inference with session-based role resolution.
- Documented practice-scoped storage keys for settings, overrides, and linked assignments.

### Version 1.2 (March 23, 2026)
- Streamlined PRD language to focus on product behavior and acceptance-level requirements.
- Kept Setting Types, Data Flow, and Edge Cases as concise product sections.
- Moved implementation-heavy detail to `docs/TECHNICAL_DOCUMENTATION.md`.

### Version 1.3 (March 23, 2026)
- Updated linked-account sections to linked-assignment model (primary/secondary assignees; assistant/coverage types).
- Added post-login runtime access gating behavior for Ops-active sessions.
- Added explicit User Management action flow and prototype persistence scope notes.
