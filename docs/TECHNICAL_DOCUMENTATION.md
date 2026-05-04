# Practice Settings Dashboard - Technical Documentation

**Last Updated:** March 23, 2026  
**Scope:** Current prototype implementation details

---

## 1. Architecture Overview

The prototype is a React SPA with a gated auth flow and a single dashboard surface shared by Ops and PM roles.

- Entry: `src/App.js`
- Auth flow: `src/components/auth/AuthFlow.jsx`
- Main dashboard surface: `src/PracticeSettingsDashboard.jsx`
- Access policy helpers: `src/utils/accessPolicy.js`
- Session helpers: `src/utils/authSession.js`, `src/utils/masterUserSession.js`
- Appointment allowlist helpers: `src/utils/appointmentAllowlist.js`
- Practice-scoped persistence:
  - `src/utils/moduleSettingsStorage.js`
  - `src/utils/userSettingsOverridesStorage.js`
  - `src/utils/linkedAccountsStorage.js`

The current implementation keeps most UI and state transitions in `PracticeSettingsDashboard.jsx`. This is functional but intentionally identified as technical debt.

---

## 2. Auth and Session Model

### 2.1 Login + MFA

`AuthFlow` implements a three-step process:

1. Credentials (`email`, `password`, selected role tab: `pm` or `ops`)
2. MFA code validation
3. Practice resolution (Ops only when multiple practices are available)

Demo data bindings live in `src/data/practices.js`:

- `opsPracticeAccess` maps Ops users to one or more practices
- `pmPracticeBinding` maps PM users to exactly one practice

### 2.2 Auth Session Persistence

`src/utils/authSession.js` stores session under:

- `practiceSettingsDashboard.authSession`

Stored fields:

- `email`
- `role` (`pm` | `ops`)
- `practiceId`
- `practiceName`
- `authenticatedAt`

### 2.3 Ops Active Session (Runtime Gating)

`src/utils/masterUserSession.js` uses a heartbeat-backed local storage record to coordinate cross-tab and same-practice access behavior.

Current key:

- `masterUserSession`

`App.js` sets/clears this session when role changes:

- Ops session starts heartbeat.
- Non-Ops session clears master session.

`PracticeSettingsDashboard` consumes this state to render PM as read-only when an Ops user is active.

---

## 3. Data Model

### 3.1 Settings Object

Each setting record uses current dual-lock fields:

```javascript
{
  id: number,
  name: string,
  type: string,
  options?: any[],
  default: any,
  opsLockState: 'unlocked' | 'locked-visible' | 'locked-hidden',
  pmLockState: 'unlocked' | 'locked-visible' | 'locked-hidden',
  defaultService?: string,   // service-settings-combined only
  subtext?: string,
  subtexts?: Record<string, string>
}
```

### 3.2 User Override Object

Per user/module/setting override values are stored as:

```javascript
{
  value?: any,
  pmLockState?: 'unlocked' | 'locked-visible' | 'locked-hidden',
  defaultService?: string
}
```

Composite in-memory key format:

```javascript
`${userId}-${moduleId}-${settingId}`
```

### 3.3 Linked Assignment Record

Linked assignments normalize both legacy and current fields through helper functions in `src/utils/linkedAssignments.js`.

Canonical fields in new records:

```javascript
{
  linkId: string,
  assigneeUserId: string | number,
  assigneeType: 'primary' | 'secondary',
  assignmentType: 'assistant' | 'coverage',
  linkedToDoctorId: string | number,
  linkedToDoctorName: string
}
```

### 3.4 EHR Appointment Pull Filters

Each EHR module now carries both pull-filter settings:

- `Appointment Type Allowlist`
- `Appointment Type Blocklist`

Behavior:

- Both values are stored in each setting's `default` as `string[]`.
- `Appointment Type Allowlist`: appointment types that will be pulled from EHR.
- `Appointment Type Blocklist`: appointment types that will not be pulled from EHR.
- If an appointment type exists in both lists, blocklist takes precedence.
- Empty allowlist means unrestricted unless blocked.
- Existing allowlist filtering is centralized in `src/utils/appointmentAllowlist.js`.

### 3.5 EHR Sync and Push Controls

Each EHR module includes:

- `Daily appointment sync time` (`time-multiselect`)
- `Push to EHR automatically` (`toggle`)

Push behavior:

- When `Push to EHR automatically` is enabled, note is pushed to EHR immediately after processing.

### 3.6 Athena Embedded Combined Setting

Athena embedded behavior is represented as a single combined setting (`id: 84`, type `athena-embedded-combined`) with object value:

```javascript
{
  enableEmbeddedApp: 'Yes' | 'No',
  autoPullInEmbeddedApp: 'Yes' | 'No'
}
```

UI modes are presented as:

- `Enable` -> `{ enableEmbeddedApp: 'Yes', autoPullInEmbeddedApp: 'No' }`
- `Enable + Pull` -> `{ enableEmbeddedApp: 'Yes', autoPullInEmbeddedApp: 'Yes' }`
- `Disable` -> `{ enableEmbeddedApp: 'No', autoPullInEmbeddedApp: 'No' }`

### 3.7 EHR Pull vs Local Cache Windows (Controls)

Controls now separate EHR pull scope from local cache scope:

- EHR pull window:
  - Look ahead is a dedicated `range-selector` setting (`id: 26`).
  - Look back is derived from `Delete Consults` (`id: 25`).
- Local cache window:
  - Single combined setting (`id: 27`, type `cache-window-combined`) with object value:

```javascript
{
  aheadDays: '8 days',
  backDays: '7 days'
}
```

Constraint rules:

- `local.aheadDays <= ehrPullLookAheadDays`
- `local.backDays <= deleteConsultsDerivedLookBackDays`

Enforcement:

- Bounds are enforced in default controls and override controls.
- On changes to either EHR bound (`Delete Consults` or EHR pull look-ahead), local cache defaults/overrides are normalized to remain valid.

---

## 4. Access Control Rules in Code

Capability-driven UI gating:
- `src/data/settingsData.js` exports `getModuleCapabilities(moduleId)`.
- Capabilities currently define:
  - `supportsUserOverrides`
  - `usesVisibilityEditabilityUI`
- `note-settings` and all `ehr-settings-*` modules now set both flags to `true`, which drives:
  - split `Visibility` + `Editability` controls in `SettingRow`
  - split override access controls in `AddOverrideModal`
  - user override section visibility without hardcoded EHR module allowlists

### 4.1 Ops -> PM

`src/utils/accessPolicy.js`:

- `canPMSeeSetting(setting)`: false when `opsLockState === 'locked-hidden'`
- `canPMEditSetting(setting)`: true only when `opsLockState === 'unlocked'`

`PracticeSettingsDashboard` additionally blocks PM edits when:

- PM is in read-only mode due to active Ops session
- (Legacy) dependency gating would block edits when a dependency is disabled; with current normalization, the seeded dependency rows are merged/removed so this does not apply to active settings

### 4.2 PM -> Doctor

`pmLockState` is applied at default and override levels. Override lock is independent from default lock.

### 4.3 Override Mutation Ownership

- PM is the only role that can create/update/delete user overrides.
- Ops can review override summaries in UI, but override actions are disabled.
- Ops remains responsible for setting defaults and `opsLockState`.

---

## 5. Override Lifecycle

Core behavior in `PracticeSettingsDashboard`:

- Create/update override via in-memory map keyed by `${userId}-${moduleId}-${settingId}`
- Block creation when override equals default tuple
- On default changes (`default` or `pmLockState`), detect redundant overrides
- Show confirmation modal before removing redundant overrides
- Remove only matching redundant entries
- Array defaults/overrides (including multiselect allowlists) use sorted equality via `valuesAreEqual` to avoid false mismatches from selection order
- Field guardrails for email settings (`email-delivery-combined`):
  - block `sendTranscript` override if effective `sendNote` is disabled for that user
  - auto-remove `sendTranscript` override when `sendNote` override is set to disabled
  - UI uses a single override entry from the `email-delivery-combined` setting to capture both fields together

Canonical combination matrix and PM-facing lock-state cases are documented in:

- `docs/ACCESS_INHERITANCE_RULES.md` → "Override/default case matrix (PM perspective)"

For `service-settings-combined`, redundancy check includes:

- `value` (enabled services)
- `pmLockState`
- `defaultService`

One-time rollout migration in `src/utils/userSettingsOverridesStorage.js`:

- First load after deployment clears stored override payload for each practice scope.
- Migration is tracked with a versioned localStorage marker and runs once per practice.

---

## 6. Persistence Keys

All settings/overrides/assignments are practice-scoped:

- Module settings: `practiceSettingsDashboard.moduleSettings.<practiceId>`
- User overrides: `practiceSettingsDashboard.userSettingsOverrides.<practiceId>`
- Linked assignments: `practiceSettingsDashboard.linkedAccounts.<practiceId>`

Auth session is global:

- `practiceSettingsDashboard.authSession`

---

## 7. Cross-Tab Synchronization

The prototype uses:

- `storage` events
- custom event `masterUserSessionChange`

This allows tabs to reflect Ops activity changes and storage updates without full reload.

---

## 8. Known Technical Debt

1. `src/PracticeSettingsDashboard.jsx` is very large and combines concerns (state, business rules, rendering, modals).
2. Rendering logic and business rules are still concentrated in the dashboard component even though seed/config data is now externalized.
3. Prototype user directory mutations (Add User flow) are in-memory only.
4. Linked assignment storage key still uses `linkedAccounts` naming for backward compatibility.

---

## 9. Refactor Status and Remaining Work

### 9.1 Completed in Current Branch

The following cleanup work has been completed:

1. Data extraction into `src/data/*` for seed/config sources.
2. Utility extraction into `src/utils/*` for shared helpers (time options, normalization, service repair, validation, storage helpers).
3. Modal decomposition from `PracticeSettingsDashboard.jsx` into dedicated files under `src/components/dashboard/*`.
4. `SettingRow` extraction into `src/components/dashboard/SettingRow.jsx`.

### 9.2 Remaining Technical Debt

1. `PracticeSettingsDashboard.jsx` still orchestrates most state transitions and cross-feature business logic.
2. Lock-state controls are partially surfaced in `SettingRow` (`pmLockState` is editable inline); `opsLockState` handling still relies on dashboard-level orchestration and modal flows.
3. Behavior-heavy logic would benefit from custom hooks/services:
   - `useOverrideRules`
   - `useSettingsPersistence`
   - `useOpsPmAccess`
4. Unit tests are still needed for:
   - redundancy detection
   - lock state access gates
   - linked assignment duplicate detection

