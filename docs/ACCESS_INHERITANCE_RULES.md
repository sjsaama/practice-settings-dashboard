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

UI parity note:
- `note-settings` and all `ehr-settings-*` modules use the same PM-facing split controls:
  - `Visibility` (`Show` / `Hide`)
  - `Editability` (`Editable` / `Not editable` when visible)
- These controls map to the same canonical lock states (`unlocked`, `locked-visible`, `locked-hidden`).

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

## PM override access vs practice default (implemented)

When PM creates or edits a **user override**, allowed override `pmLockState` depends on the **practice default** `pmLockState`:

| Practice default (doctor) | Allowed override access | Notes |
|---|---|---|
| `unlocked` (editable) | `locked-visible`, `locked-hidden` only | Override cannot stay **editable** — user would change the value themselves. Default in UI: **not editable**. Value overrides auto-save as not editable. |
| `locked-visible` or `locked-hidden` | `unlocked`, `locked-visible`, `locked-hidden` | PM may **loosen** one user to editable even when practice is not. |

Enforced in:
- `src/utils/overrideLockRules.js`
- `AddOverrideModal` (access options + save)
- `SettingRow` inline override confirm (`forcePmLockState`)

## Override/default case matrix (PM perspective)

This section is the canonical matrix for the "override matches default" behavior.
Standalone reference: `docs/OVERRIDE_DEFAULT_CASE_MATRIX.md`

### Terminology mapping

- `hidden` = `locked-hidden`
- `show + editable` = `unlocked`
- `show + not editable` = `locked-visible`

### Case A: Setting editable by PM (Ops `opsLockState = unlocked`)

PM default (`setting.pmLockState`) can be any of:
- `locked-hidden`
- `unlocked`
- `locked-visible`

PM override (`override.pmLockState`) when practice default is **not** doctor-editable can be any of:
- `locked-hidden`
- `unlocked`
- `locked-visible`

When practice default **is** doctor-editable (`unlocked`), override access is only `locked-visible` or `locked-hidden` (see section above).

| PM Default State | Override State | Allowed | Result |
|---|---|---|---|
| `locked-hidden` (hidden) | `locked-hidden` (hidden) | ❌ | Redundant (matches default) |
| `locked-hidden` (hidden) | `unlocked` (show + editable) | ✅ | Meaningful override |
| `locked-hidden` (hidden) | `locked-visible` (show + not editable) | ✅ | Meaningful override |
| `unlocked` (show + editable) | `locked-hidden` (hidden) | ✅ | Meaningful override |
| `unlocked` (show + editable) | `unlocked` (show + editable) | ❌ | Not offered (redundant; user can edit practice value) |
| `unlocked` (show + editable) | `locked-visible` (show + not editable) | ✅ | Meaningful override |
| `locked-visible` (show + not editable) | `locked-hidden` (hidden) | ✅ | Meaningful override |
| `locked-visible` (show + not editable) | `unlocked` (show + editable) | ✅ | Meaningful override |
| `locked-visible` (show + not editable) | `locked-visible` (show + not editable) |  ❌  | Redundant (matches default) |

### Case B: Setting not editable by PM (Ops `opsLockState = locked-visible`)

PM default (`setting.pmLockState`) can only be:
- `locked-hidden` (hidden), or
- `locked-visible` (show + not editable)

PM override (`override.pmLockState`) can only be:
- `locked-hidden` (hidden), or
- `locked-visible` (show + not editable)

`unlocked` (show + editable) is disallowed in this branch.

| PM Default State | Override State | Allowed | Result |
|---|---|---|---|
| `locked-hidden` (hidden) | `locked-hidden` (hidden) |  ❌  | Redundant (matches default) |
| `locked-hidden` (hidden) | `locked-visible` (show + not editable) | ✅ | Meaningful override |
| `locked-visible` (show + not editable) | `locked-hidden` (hidden) | ✅ | Meaningful override |
| `locked-visible` (show + not editable) | `locked-visible` (show + not editable) |  ❌  | Redundant (matches default) |

### Case C: Setting hidden from PM (Ops `opsLockState = locked-hidden`)

- PM cannot see the setting.
- PM cannot set default state or create/update overrides for that setting.
- Existing overrides are removed on transition to this state (with warning/confirmation in the flow).

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

### "Matches default" popup behavior

- If PM attempts to create or keep an override with the same effective tuple as defaults, show the informational message and block/clean up the redundant override.
- For standard settings, compare `(default, pmLockState)`.
- For `service-settings-combined`, compare `(enabledServices, defaultService, pmLockState)`.
- For lock-state-only changes, a matching `pmLockState` is enough to be redundant when value/defaultService also match effective defaults.



