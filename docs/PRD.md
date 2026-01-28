# Product Requirements Document: Practice Settings Dashboard

**Version:** 2.1
**Last Updated:** November 28, 2025
**Status:** Active Development

---

## 1. Overview

### Purpose
A dual-role healthcare settings management system that allows:
- **Operations team** to configure and approve practice settings
- **Practice Managers** to manage practice-wide settings and user accounts

### Target Users
- **Operations Members**: Configure practices, control access, manage settings
- **Operations Approvers**: Review and approve practice configurations
- **Practice Managers**: Manage settings, users, and overrides within their practice

---

## 2. Core Features

### 2.1 Dual-Role System

**Operations (Ops) Role:**
- Configure practice settings before PM access
- Control what PMs can see/edit (lock/hide settings)
- Submit practices for approval
- Monitor practice usage metrics
- Modify active practices (with approval workflow)

**Operations Approver Role:**
- Review initial practice setups
- Review changes to active practices
- Approve/reject configurations
- Grant PM access to practices

**Practice Manager (PM) Role:**
- Configure practice-wide default settings
- Manage users (doctors, staff)
- Create user-specific overrides
- Control user permissions
- Control what doctors can see/edit (lock/hide settings for individual users)

### 2.2 Single Source of Truth

- Both Ops and PM views share the same settings data (SettingsContext)
- Changes in one view instantly appear in the other
- No data duplication or sync issues
- Real-time updates across roles

### 2.3 Settings System

**45+ Settings across 6 modules:**
1. **Note Settings**: Patient pronouns, note views, dictation
2. **Controls**: Timezone, authentication, email settings
3. **E/M Settings**: Service types, preventive medicine
4. **EHR Settings - AMD**: Appointments, sync, auto-creation
5. **EHR Settings - Athena**: Athena EHR integration
6. **Teleconsult Settings**: Google Calendar, Zoom integration

**Setting Types:**
- Toggle (On/Off)
- Dropdown (single selection)
- Multiselect (multiple selections)
- Order list (drag-and-drop)
- Custom integrations (Google, Zoom)

### 2.4 Two-Level Access Control System

**Access Levels (Organizational Hierarchy):**
- **Ops** (Operations) → Top level
- **PM** (Practice Manager) → Middle level
- **Doctors/Users** → Bottom level

**Lock States (Control Visibility and Editability):**
- **Unlocked**: Can view AND edit
- **Locked-Visible**: Can view but NOT edit (read-only)
- **Locked-Hidden**: Cannot see at all (invisible)

**Two-Level Lock System:**

Every setting has **TWO** independent lock state fields:

1. **opsLockState** (Ops → PM Access Control):
   - Controls what PM can see and edit
   - Set by Operations team
   - Options: `unlocked`, `locked-visible`, `locked-hidden`

2. **pmLockState** (PM → Doctor Access Control):
   - Controls what individual doctors can see and edit
   - Set by Practice Manager
   - Only available if Ops has set `opsLockState: 'unlocked'`
   - Options: `unlocked`, `locked-visible`, `locked-hidden`
Add t
**Example Scenarios:**

| opsLockState | pmLockState | PM Can | Doctor Can |
|-------------|-------------|---------|------------|
| unlocked | unlocked | Edit | Edit |
| unlocked | locked-visible | Edit | View only |
| unlocked | locked-hidden | Edit | Not see |
| locked-visible | * | View only | N/A (PM can't control) |
| locked-hidden | * | Not see | Not see |

**Cascading Rules:**
- If Ops locks/hides a setting, PM cannot change it or control doctor access
- PM can only set `pmLockState` for settings where `opsLockState: 'unlocked'`
- Doctor-level overrides respect the `pmLockState` set by PM

### 2.5 User Override System

**How Overrides Work:**
- User-specific values that override practice defaults
- PM creates overrides for individual users
- Overrides are independent of default changes
- Changing default does NOT affect users with overrides
- Each override can have its own `pmLockState` (PM controls doctor access)

**Example:**
```
Default Timezone: Eastern (pmLockState: unlocked)
Dr. Smith Override: Pacific (pmLockState: locked-visible)

If default changes to Central:
- Dr. Smith: Pacific (unchanged, can view but not edit)
- Other users: Central (new default, can edit)
```

**Override Lock States:**
- PM can set individual lock states for each user override
- Example: Dr. Smith's timezone can be locked while Dr. Jones's timezone is unlocked
- This allows fine-grained control over individual doctor settings

### 2.6 Practice Workflow States

**Initial Setup:**
```
IN_SETUP → PENDING_APPROVAL → ACTIVE
```

**Modification Flow:**
```
ACTIVE → LOCKED_FOR_CHANGES → PENDING_RE_APPROVAL → ACTIVE
```

**States:**
- **IN_SETUP**: Ops member configuring
- **PENDING_APPROVAL**: Awaiting initial approval
- **ACTIVE**: Live, PM has access
- **LOCKED_FOR_CHANGES**: Ops modifying active practice
- **PENDING_RE_APPROVAL**: Modified practice awaiting approval

### 2.7 Usage Metrics (Ops View)

**Metrics per Practice:**
- Total Users
- Daily Active Users (DAU)
- Notes Created Today
- Notes Created This Month

**Purpose:**
- Monitor practice engagement
- Track adoption
- Identify issues
- Support decisions

### 2.8 User Management

**User Types:**
- **Doctors**: Primary users, can have overrides
- **Secondary Accounts**: Support staff with configurable permissions

**Permissions (configurable per user):**
- **Create Consults**: Can create consult cards
- **Generate Notes**: Can generate notes (requires Create Consults)
- **Edit Generated Notes**: Can edit generated notes (requires Generate Notes)
- **Push to EHR**: Can push notes to EHR (requires both Generate and Edit Notes)

**Permission Dependencies:**
- Permissions have hierarchical dependencies
- Disabling a parent permission auto-disables dependent permissions
- Example: Disabling "Generate Notes" also disables "Edit Notes" and "Push to EHR"

---

## 3. Business Rules

### 3.1 Two-Level Access Control
**Ops-Level Control (opsLockState):**
- `locked-visible` settings cannot be modified by PM (view-only)
- `locked-hidden` settings are invisible to PM
- Ops can change `opsLockState` anytime
- PM sees only settings with `opsLockState: unlocked` or `locked-visible`

**PM-Level Control (pmLockState):**
- PM can only set `pmLockState` for settings where `opsLockState: unlocked`
- `locked-visible` settings cannot be modified by doctors (view-only)
- `locked-hidden` settings are invisible to doctors
- PM can change `pmLockState` anytime for unlocked settings
- Doctors see only settings where PM has not hidden them

### 3.2 Override Behavior
- Overrides take precedence over defaults
- Default changes don't affect overridden users
- Deleting override reverts user to default
- Each user can have one override per setting
- Each override has its own `pmLockState` independent of the default setting's lock state
- Changing default's `pmLockState` does NOT affect existing overrides' lock states

### 3.3 Approval Workflow
- Initial setups require approval before PM access
- Changes to active practices require re-approval
- Locking practice blocks PM access immediately
- Approval restores PM access
- Rejection returns practice to IN_SETUP

### 3.4 Service Settings

**Service-Settings-Combined Type:**
- Special setting type combining enabled services + default service selection
- Controls which services are enabled for the practice
- Sets which service is selected by default

**Structure:**
- **Enabled Services**: List of services available (multiselect)
- **Default Service**: The pre-selected service from enabled list
- **opsLockState**: Ops controls PM access
- **pmLockState**: PM controls doctor access

**Behavior:**
- Default service must be one of the enabled services
- If enabled services change, default service is validated
- User overrides can customize both enabled services AND default service for specific users
- Lock states work the same as other settings (two-level system)

---

## 4. Technical Requirements

### 4.1 Technology Stack
- React 18.2.0
- React Context API (state management)
- Tailwind CSS (styling)
- Lucide React (icons)
- Create React App (build tool)

### 4.2 Architecture
- Single Source of Truth (SettingsContext)
- Shared context between Ops and PM views
- Real-time synchronization
- No data duplication

### 4.3 Data Structures

**Practice Object:**
```javascript
{
  id, name, type, opsState,
  pmName, pmEmail,
  settingsCount, lockedSettings, unlockedSettings, hiddenSettings,
  metrics: { totalUsers, dailyActiveUsers, notesCreatedToday, notesCreatedThisMonth },
  pendingChanges: [{ settingName, oldValue, newValue }]
}
```

**Setting Object:**
```javascript
{
  id, name, type, options, default,
  opsLockState, // 'unlocked', 'locked-visible', 'locked-hidden' (Ops → PM)
  pmLockState,  // 'unlocked', 'locked-visible', 'locked-hidden' (PM → Doctor)
  userOverrides: [{ userId, value, pmLockState }]
}
```

**User Object:**
```javascript
{
  id, name, email, role, // 'Doctor' or 'Secondary Account'
  permissions: {
    createConsults: boolean,      // Can create consult cards
    canGenerateNotes: boolean,    // Can generate notes
    editGeneratedNotes: boolean,  // Can edit generated notes
    pushToEHR: boolean           // Can push notes to EHR
  }
}
```

---

## 5. User Flows

### 5.1 Ops: New Practice Setup
1. Create practice (IN_SETUP)
2. Configure all settings
3. Set access controls (lock/hide)
4. Submit for approval (PENDING_APPROVAL)
5. Approver reviews
6. Approved → ACTIVE, PM gets access

### 5.2 Ops: Modify Active Practice
1. Lock practice (LOCKED_FOR_CHANGES)
2. Make changes
3. Submit for re-approval (PENDING_RE_APPROVAL)
4. Approver reviews changes
5. Approved → ACTIVE, PM access restored

### 5.3 PM: Set User Override
1. Navigate to setting
2. Click "User Overrides"
3. Select user
4. Set custom value
5. (Optional) Set lock state for this user's override
6. Save override
7. User now uses override instead of default
8. User sees override with the specified lock state

### 5.4 PM: Change Default
1. Navigate to setting
2. Change default value
3. Auto-saved
4. Users without overrides see new default
5. Users with overrides keep custom values

---

## 6. Edge Cases

### 6.1 Default Change with Existing Overrides
- **Issue**: What happens when default changes but users have overrides?
- **Solution**: Users with overrides keep their values, unaffected by default change

### 6.2 Lock State Change on Active Practice
- **Issue**: Ops changes `opsLockState` while practice is active
- **Solution**: PM view updates immediately, setting becomes locked/unlocked for PM
- **Note**: PM's `pmLockState` settings for doctors remain unchanged unless PM modifies them

### 6.3 Service Setting Override Behavior
- **Issue**: Service-settings-combined default changes (enabled services or default service)
- **Solution**: User overrides with custom service configurations remain unchanged

### 6.4 User Deletion with Overrides
- **Issue**: User deleted but has overrides
- **Solution**: Overrides are deleted with user

### 6.5 Practice Locked During PM Session
- **Issue**: PM is using practice when Ops locks it
- **Solution**: PM receives notification, access blocked immediately

### 6.6 PM Lock State Change with Existing Doctor Overrides
- **Issue**: PM changes default `pmLockState` but doctors have overrides with different lock states
- **Solution**: Each override maintains its own `pmLockState` independent of the default's lock state
- **Example**: Default has `pmLockState: unlocked`, PM changes to `locked-visible`. Dr. Smith's override remains with its original `pmLockState`

---

## 7. Success Metrics

### KPIs
- Practice setup time: < 30 minutes
- Approval turnaround: < 24 hours
- Settings modification time: < 5 minutes
- User satisfaction: > 4.5/5
- Settings-related support tickets: < 3%

---

## 8. Future Enhancements

- Audit log for all settings changes
- Bulk practice import/export
- Custom approval workflows
- Practice templates
- Advanced metrics dashboard
- Mobile app support
- Multi-language support
- Integration with more EHR systems

---

## 9. Glossary

- **PM**: Practice Manager
- **Ops**: Operations team member
- **Access Level**: Organizational hierarchy (Ops → PM → Doctors)
- **Lock State**: Control mechanism for visibility and editability (unlocked/locked-visible/locked-hidden)
- **opsLockState**: Lock state controlling PM's access to a setting (set by Ops)
- **pmLockState**: Lock state controlling doctor's access to a setting (set by PM)
- **Override**: User-specific setting value
- **Default**: Practice-wide setting value
- **Cascading Lock**: When Ops locks a setting, PM cannot control doctor access to it
- **DAU**: Daily Active Users
- **EHR**: Electronic Health Record
- **E/M**: Evaluation and Management codes

---

**Document Status:** Active
**Last Review:** November 28, 2025
**Next Review:** December 2025

---

## Changelog

### Version 2.1 (November 28, 2025)
- **Major Update**: Implemented two-level lock system
- Clarified terminology: "Access Levels" (organizational hierarchy) vs "Lock States" (control mechanism)
- Added `opsLockState` (Ops → PM control) and `pmLockState` (PM → Doctor control)
- Updated all sections to reflect two-level system
- Added cascading lock behavior documentation
- Added edge case for PM lock state changes with existing overrides
- Updated data structures to include both lock state fields
