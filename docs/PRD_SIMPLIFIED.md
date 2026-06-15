# Product Requirements Document: Simplified Practice Settings Dashboard

**Version:** 1.3
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
- `docs/ACCESS_INHERITANCE_RULES.md` → "Override/default case matrix (PM perspective)" for the full lock-state combination matrix and "matches default" popup rules.
- `docs/OVERRIDE_DEFAULT_CASE_MATRIX.md` for the standalone version of the same matrix.

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
- ❌ Cannot create/edit/remove doctor overrides (read-only override visibility only)

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
- Cannot edit default values where `opsLockState: 'locked-visible'` (PM may only set lock state to `locked-visible` or `locked-hidden`)
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

| Value | PM Can See | PM Can Edit Default | PM Can Change Lock State | PM Can Create Overrides | Use Case |
|-------|-----------|---------------------|--------------------------|------------------------|----------|
| **unlocked** 👁️ | ✅ Yes | ✅ Yes | ✅ Yes (all) | ✅ Yes | Practice-customizable (timezone, pronouns) |
| **locked-visible** 🔒 | ✅ Yes | ❌ No | ✅ Yes (`locked-visible` / `locked-hidden` only) | ❌ No (value overrides), Can show/hide the settings | Organization standards, compliance |
| **locked-hidden** 👁️‍🗨️ | ❌ No | ❌ No | ❌ No | ❌ No | Sensitive configs, billing, technical |

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
1. If `opsLockState: 'locked-visible'` → PM cannot change default, but can only tighten lock state (`locked-visible` or `locked-hidden`)
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
- Related controls are disabled when prerequisite toggle conditions are not met.
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
This section is kept for reference, but `order-list` (drag & drop) and `range-selector` types are not present in the current seeded configuration.

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
- Cannot create, edit, or remove user overrides
- Can view override summaries in read-only mode for audit/review
- Can only manage setting defaults and `opsLockState`
- Rollout migration clears existing stored overrides once per practice

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
- Permission gating rules:
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
        required: false // optional
      }
    ]
  }
}
```

---

### 6.1 Note Settings
**Purpose:** Settings that affect notes and documents

**Settings (6):**
1. Default Patient Pronoun (dropdown)
2. Patient Name (dropdown)
3. Default Visit Type (dropdown)
4. Default Note View (dropdown)
5. Capture Dictation Separately (toggle)
6. Skip empty sections in Note (toggle)

**Override Support:** ✅ Yes

---

### 6.2 Controls
**Purpose:** General practice settings

**Settings (7):**
1. Timezone (dropdown)
2. 2-factor Authentication (toggle)
3. Email Delivery Mode (`email-delivery-combined`) - send note + send transcript together
4. Play Recording Consent Disclaimer (toggle)
5. Delete Consults (dropdown)
6. EHR Pull Look ahead window (`range-selector`) - future appointment pull window from EHR
7. Local cache window (`cache-window-combined`) - local DB look-ahead/look-back window constrained within EHR pull bounds

**Override Support:** ✅ Yes

---

### 6.3 E/M Settings
**Purpose:** Evaluation & Management code settings

**Settings (2):**
1. Service Settings (service-settings-combined)
2. Enable Preventive Medicine Service (toggle)

**Override Support:** ✅ Yes

---

### 6.4 EHR Settings - AMD
**Purpose:** AMD EHR integration settings

**Settings (5):**
1. Appointment Type Allowlist (keyword-list) - appointment types that will be pulled from EHR
2. Appointment Type Blocklist (keyword-list) - appointment types that will not be pulled from EHR
3. Daily appointment sync time (time-multiselect)
4. Allow repeat note push (toggle)
5. Push to EHR automatically (toggle) - when enabled, note is pushed as soon as it is processed

**Override Support:** ✅ Yes

---

### 6.5 EHR Settings - Athena
**Purpose:** Athena EHR integration settings

**Settings (6):**
1. Athena Embedded Mode (`athena-embedded-combined`: Enable / Enable + Pull / Disable)
2. Appointment Type Allowlist (keyword-list) - appointment types that will be pulled from EHR
3. Appointment Type Blocklist (keyword-list) - appointment types that will not be pulled from EHR
4. Daily appointment sync time (time-multiselect)
5. Allow repeat note push (toggle)
6. Push to EHR automatically (toggle) - when enabled, note is pushed as soon as it is processed

**Override Support:** ✅ Yes

---

### 6.6 Teleconsult Settings
**Purpose:** Google Calendar & Zoom integration

**Settings (2):**
1. Google Calendar (google-signin)
2. Zoom (zoom-check)

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
- User override management (PM only)
- For `note-settings` and all `ehr-settings-*` modules, PM default access is configured via split controls:
  - `Visibility` (`Show` / `Hide`)
  - `Editability` (`Editable` / `Not editable`, shown only when visibility is `Show`)

**Input Control:** Varies by setting type (see Section 4)

**User Overrides Section:**
- Visible for PM when setting `opsLockState` is `unlocked` or `locked-visible`
- Visible for Ops as read-only summary
- Shows list of users with custom values
- "+ Add Override" button (PM only; under `locked-visible` PM can only adjust override visibility / lock state)
- Each override shows: user name, value, and remove action (remove action only when `opsLockState` is `unlocked`)
- For Controls `email-delivery-combined` (Email Delivery Mode), a single override entry point configures both `sendNote` and `sendTranscript` together.
- For `note-settings` and all `ehr-settings-*` modules, the Add Override flow uses split `Visibility` + `Editability` controls (same semantics as default-level access controls).

---

### 7.4 Add Override Modal

**Fields:**
1. Setting name (read-only display)
2. Practice default (read-only display)
3. Select user (dropdown)
4. Custom value (input matching setting type)
5. Lock state (dropdown for pmLockState)
6. For Email Delivery Mode (`email-delivery-combined`), the modal also configures `sendNote` and `sendTranscript` together in the same flow.

**Validation:**
- Cannot create override if BOTH value AND pmLockState match default
- Shows alert if trying to create redundant override
- For Email Delivery Mode, save is rejected only when both `sendNote` and `sendTranscript` (with lock state) match their defaults.

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

### 7.6 User Management Actions

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
   - If `locked-visible`: PM sees, but defaults are read-only; PM may only adjust lock state (`pmLockState`) / override visibility
   - If `locked-hidden`: PM doesn't see at all
   - If `unlocked`: PM has full control

2. **pmLockState Independence:**
   - Each override has independent pmLockState
   - Changing default's pmLockState doesn't affect override pmLockStates
   - PM can set different pmLockStates for different users

3. **Cascading Locks:**
   - `opsLockState: locked-visible` → PM cannot edit defaults or create value overrides; PM may only tighten `pmLockState` / override visibility
   - `opsLockState: locked-hidden` → PM cannot see or change `pmLockState`
   - `opsLockState: unlocked` → PM can manage overrides (value + `pmLockState`)
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

### 8.3 Service Settings Rules

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
    ├─> Edit pmLockState (if opsLockState: unlocked; or tighten lock state if opsLockState: locked-visible)
    │      └─> Updates setting.pmLockState
    │      └─> Doctors see new lock state
    │      └─> Checks for redundant overrides
    │
    └─> Manage User Overrides (if opsLockState: unlocked; or restrict visibility if opsLockState: locked-visible)
           ├─> Create Override (unlocked only)
           │      └─> Validates not redundant
           │      └─> Stores override with pmLockState
           │
           ├─> Edit Override (value unlock-only; locked-visible only adjusts pmLockState)
           │      └─> Updates override value or pmLockState
           │      └─> Independent of default
           │
           └─> Delete Override (unlocked only)
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
| **User override for service settings has no enabled services** | Save is blocked with validation (`Please select at least one enabled service`). |
| **User sets a default service that is not enabled** | Save is blocked with validation (`Default service must be one of the enabled services`). |
| **Default service is missing while service override is visible** | Save is blocked with validation (`Please select a default service`). |

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
| **Setting is `opsLockState: locked-visible`** | PM can see the setting but cannot edit default/defaultService values. PM can only tighten lock state (`locked-visible` or `locked-hidden`) and can only apply lock restrictions on overrides. |
| **Setting is `opsLockState: locked-hidden`** | PM cannot see or manage the setting/overrides. |
| **Setting is `opsLockState: unlocked`** | PM can edit defaults and manage overrides (value + lock state). |

## 11. Performance Considerations

Performance expectations are tracked as product constraints:
- Large override sets should remain usable with clear progress/feedback.
- High-impact operations should communicate status during processing.
- Long data/sync windows should show user-facing warnings where relevant.

---

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
- **Service Settings**: Complex setting type with enabled services + default service
- **Linked Assignment**: Relationship linking an assignee (primary/secondary) to a doctor with an assignment type (`assistant` or `coverage`)

---

**Document Status:** Active
**Last Review:** March 23, 2026
**Next Review:** April 2026

---
