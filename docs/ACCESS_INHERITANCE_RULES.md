# Access, Inheritance, and Overrides (Ops vs PM)

This document defines the **behavioral rules** for settings access, lock states, and doctor-level overrides from both the **Ops (Master)** and **PM** perspectives.

## Concepts

### Roles
- **Ops (Master user)**: selected explicitly in auth flow (`Ops` tab), then validated against `opsPracticeAccess`
- **PM (Practice Manager)**: selected explicitly in auth flow (`PM` tab), then validated against `pmPracticeBinding`
- **Doctors (end users)**: do **not** log into this dashboard; they inherit settings downstream

### Per-setting fields
Each setting has:
- **`default`**: practice-wide default value
- **`opsLockState`**: controls **PM's** visibility/editing rights (Ops → PM)
- **`pmLockState`**: controls **doctor** visibility/editing rights (PM → Doctor)

Allowed lock values:
- `unlocked`
- `locked-visible`
- `locked-hidden`

### Doctor override record (per doctor, per setting)
An override can store:
- `value` (doctor-specific value)
- `pmLockState` (doctor-specific lock state)
- `defaultService` (only for `service-settings-combined`)

## Inheritance model (what doctors get)

For a doctor and a setting:
1. Start with practice defaults:
   - value = `setting.default`
   - lock = `setting.pmLockState`
2. If a doctor override exists, apply it:
   - if override has `value`, it replaces `setting.default`
   - if override has `pmLockState`, it replaces `setting.pmLockState`
   - for `service-settings-combined`, `defaultService` may also be overridden

## Ops → PM access rules (`opsLockState`)

These rules apply to **PM behavior only**. Ops is not restricted by `opsLockState`.

### `opsLockState = locked-hidden`
- **PM**: does not see the setting at all (fully invisible)
- **Ops**: can still see and edit the setting
- **Override cleanup**: when Ops changes a setting from `opsLockState: unlocked` → `locked-hidden`, the system warns and removes all existing doctor overrides for that setting (so there are no hidden-but-still-effective overrides).

### `opsLockState = locked-visible`
- **PM**: sees the setting with **lock-state-only access**
  - cannot change `default`
  - cannot change `defaultService`
  - can only change `pmLockState` between `locked-visible` and `locked-hidden`
  - for doctor overrides, can only set override `pmLockState` to `locked-visible` or `locked-hidden`
- **Ops**: can still see and edit the setting

### `opsLockState = unlocked`
- **PM**: normal access
  - can change `default`
  - can change `pmLockState`
  - can create/edit doctor overrides
- **Ops**: normal access

## PM → Doctor access rules (`pmLockState`)

This controls what doctors can see/change in the downstream doctor experience:
- `unlocked`: doctor can see and change the setting
- `locked-visible`: doctor can see but cannot change
- `locked-hidden`: doctor cannot see the setting

## Override constraints (no redundant overrides)

An override must be meaningful:
- If overriding would result in the exact same tuple as practice defaults, the override must not be created/kept.

Standard settings:
- practice default tuple: `(default, pmLockState)`
- override tuple: `(overrideValue, overridePmLockState)`
- if both components match, override is redundant → block/remove

`service-settings-combined`:
- tuple includes `(enabledServices, defaultService, pmLockState)`
- all components must match to be considered redundant

## PM dead-end recovery: Request Ops restore

To avoid dead-end friction when PM applies additional restrictions:
- PM can submit a **Request Ops restore** from setting/override surfaces.
- Requests are stored per practice with:
  - `requestId`, `createdAt`, `createdByEmail`
  - `moduleId`, `settingId`, optional `targetUserId`
  - `scope` (`default` or `override`)
  - `currentState`, `requestedState`
  - `reason`
  - `status` (`open`, `resolved`, `dismissed`)
- Ops sees pending requests in a lightweight queue and can:
  - **Apply restore** (unlocks Ops lock for the target setting)
  - **Dismiss** request

## Ops overrides (current simplification)

Ops (Master) cannot create, edit, or remove doctor overrides.

- Ops can review override summaries in read-only mode.
- Ops is responsible for defaults and `opsLockState`.

## Authentication and session model (implemented)

- Sign-in uses email + password + MFA.
- Demo password is currently `marvix`.
- After MFA:
  - PM is auto-bound to exactly one practice via `pmPracticeBinding`.
  - Ops is assigned practices from `opsPracticeAccess`; if multiple are available, Ops selects one.
- If Ops is active for a practice, PM can still access the dashboard but is restricted to read-only mode until Ops session ends.
- Session is stored in local storage key `practiceSettingsDashboard.authSession` with:
  - `email`
  - `role` (`pm` or `ops`)
  - `practiceId`
  - `practiceName`
  - `authenticatedAt`

## Linked assignments (prototype)

- PM/Ops can create linked assignments from a primary doctor to:
  - a secondary user, or
  - another primary doctor.
- Supported assignment types:
  - `assistant`
  - `coverage`
- Conflict prevention is scoped to duplicate tuple detection:
  - same assignee + same doctor + same assignment type is blocked.

## Persistence (current behavior)
- Practice settings are persisted per practice:
  - `practiceSettingsDashboard.moduleSettings.<practiceId>`
- Doctor overrides are persisted per practice:
  - `practiceSettingsDashboard.userSettingsOverrides.<practiceId>`
- Linked assignments are persisted per practice:
  - `practiceSettingsDashboard.linkedAccounts.<practiceId>`
- Auth session is persisted separately:
  - `practiceSettingsDashboard.authSession`

