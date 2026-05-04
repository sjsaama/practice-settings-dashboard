# Override/Default Case Matrix (PM Perspective)

This document is the canonical reference for lock-state combinations between practice defaults and doctor overrides, and for "override matches default" behavior.

## Term mapping

- `hide`
- `show + editable`
- `show + uneditable`

## Case A: Setting editable by PM (Ops `opsLockState = unlocked`)

PM default (`setting.pmLockState`) can be any of:
- `hide`
- `show + editable`
- `show + uneditable`

PM override (`override.pmLockState`) can be any of:
- `hide`
- `show + editable`
- `show + uneditable`

| PM Default State | Override State | Allowed | Result |
|---|---|---|---|
| `hide` | `hide` | Yes | Redundant (matches default) |
| `hide` | `show + editable` | Yes | Meaningful override |
| `hide` | `show + uneditable` | Yes | Meaningful override |
| `show + editable` | `hide` | Yes | Meaningful override |
| `show + editable` | `show + editable` | Yes | Redundant (matches default) |
| `show + editable` | `show + uneditable` | Yes | Meaningful override |
| `show + uneditable` | `hide` | Yes | Meaningful override |
| `show + uneditable` | `show + editable` | Yes | Meaningful override |
| `show + uneditable` | `show + uneditable` | Yes | Redundant (matches default) |

## Case B: Setting not editable by PM (Ops `opsLockState = locked-visible`)

PM default (`setting.pmLockState`) can only be:
- `hide`, or
- `show + uneditable`

PM override (`override.pmLockState`) can only be:
- `hide`, or
- `show + uneditable`

`show + editable` is disallowed in this branch.

| PM Default State | Override State | Allowed | Result |
|---|---|---|---|
| `hide` | `hide` | Yes | Redundant (matches default) |
| `hide` | `show + uneditable` | Yes | Meaningful override |
| `show + uneditable` | `hide` | Yes | Meaningful override |
| `show + uneditable` | `show + uneditable` | Yes | Redundant (matches default) |

## Case C: Setting unavailable to PM (Ops `opsLockState = locked-hidden`)

- PM cannot see the setting.
- PM cannot set default state or create/update overrides for that setting.
- Existing overrides are removed when transitioning to this state.

## Redundant override rules

An override must be meaningful.

If overriding results in the same effective tuple as defaults, the override is redundant and should not be created or kept.

Standard settings:
- practice default tuple: `(default, pmLockState)`
- override tuple: `(overrideValue, overridePmLockState)`
- if both components match, override is redundant

`service-settings-combined`:
- tuple includes `(enabledServices, defaultService, pmLockState)`
- all components must match to be considered redundant

## "Matches default" popup behavior

- If PM attempts to create/keep an override with the same effective tuple as defaults, show the informational popup.
- For standard settings, compare `(default, pmLockState)`.
- For `service-settings-combined`, compare `(enabledServices, defaultService, pmLockState)`.
- For lock-state-only changes, a matching `pmLockState` is redundant when value/defaultService also match effective defaults.
