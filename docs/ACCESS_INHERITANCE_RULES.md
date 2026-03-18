# Access, Inheritance, and Overrides (Ops vs PM)

This document defines the **behavioral rules** for settings access, lock states, and doctor-level overrides from both the **Ops (Master)** and **PM** perspectives.

## Concepts

### Roles
- **Ops (Master user)**: logs into this dashboard as `ops@marvix.com`
- **PM (Practice Manager)**: logs into this dashboard as any other email
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

### `opsLockState = locked-visible`
- **PM**: sees the setting but is **read-only**
  - cannot change `default`
  - cannot change `pmLockState`
  - cannot create/edit doctor overrides for that setting
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

## Ops overrides (current simplification)

Ops (Master) can use the same doctor override system, but **only** when the setting is `opsLockState = unlocked` (same constraint as PM for simplicity).

## Persistence (current behavior)
- Practice settings state (including `opsLockState`) is persisted locally so Ops changes apply across sessions/tabs.
- Doctor overrides are currently in-memory only unless explicitly persisted.

