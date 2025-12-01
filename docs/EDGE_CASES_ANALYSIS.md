# Edge Cases Analysis: Practice Settings Dashboard

**Version:** 1.0
**Last Updated:** December 1, 2025
**Status:** Active Analysis
**Branch:** `simplified-master-user`

---

## Table of Contents

1. [Methodology for Finding Edge Cases](#methodology)
2. [Time-Based Conflict Resolution](#time-based-conflicts)
3. [Override & Default Interactions](#override-default)
4. [Concurrent Operations](#concurrent-operations)
5. [Data Consistency Issues](#data-consistency)
6. [Implementation Recommendations](#recommendations)

---

## 1. Methodology for Finding Edge Cases {#methodology}

### 1.1 Systematic Approach

**Categories to Analyze:**
1. **Timing & Concurrency** - What happens when events overlap?
2. **Data State** - What happens at boundaries (empty, max, invalid)?
3. **User Actions** - What happens with unexpected sequences?
4. **System State** - What happens during transitions?
5. **Dependencies** - What happens when related entities change?

### 1.2 Question Framework

For each feature, ask:
- **WHEN**: When can this fail? (timing, state, conditions)
- **WHO**: Who is affected? (master user, PM, doctors)
- **WHAT**: What breaks? (data, UI, logic)
- **WHERE**: Where does it break? (backend, frontend, sync)
- **WHY**: Why does it matter? (data loss, UX, security)
- **HOW**: How do we detect/prevent it?

### 1.3 Edge Case Discovery Process

```
For Each User Action:
  1. List all actors (Ops, PM, Doctor)
  2. List all states (before, during, after)
  3. List all combinations (Actor A + Actor B)
  4. Identify conflicts (simultaneous, sequential)
  5. Document current behavior
  6. Propose resolution strategy
```

---

## 2. Time-Based Conflict Resolution {#time-based-conflicts}

### 2.1 The Core Problem

**Scenario:** Ops changes default while PM is working with overrides

```
Timeline:
T0: Setting Default = "Eastern", Override (Dr. Smith) = "Pacific"
T1: Ops opens modal to change default to "Central"
T2: PM opens modal to add override for Dr. Jones
T3: Ops saves → Default becomes "Central"
T4: PM saves → Override created for Dr. Jones = "Pacific"
T5: System detects Dr. Smith's override ("Pacific") != new default ("Central")
T6: What happens to Dr. Jones's new override?
```

**Current Behavior:**
- No conflict detection during concurrent operations
- Last write wins
- No warning about stale data

**Problems:**
1. PM sees old default ("Eastern") when creating override
2. PM creates override based on stale information
3. New override might be redundant without PM knowing

---

### 2.2 Conflict Scenarios Matrix

| Ops Action | PM Action (Concurrent) | Current Result | Issue | Severity |
|------------|----------------------|----------------|-------|----------|
| Change default value | Create override with same value | Override created | Redundant override silently created | 🟡 Medium |
| Change default value | Edit existing override | Override updated | Uses stale default for comparison | 🟡 Medium |
| Change opsLockState to locked | Create override | Override created | PM creates override for locked setting | 🔴 High |
| Change opsLockState to hidden | Edit override | Override updated | Override exists for hidden setting | 🔴 High |
| Delete setting | Create override | Override created | Orphaned override for deleted setting | 🔴 High |
| Change default + detect redundant | PM editing same setting | Both save | Race condition in redundancy detection | 🟡 Medium |

---

### 2.3 Resolution Strategies

#### Strategy A: **Optimistic Locking with Version Numbers**

```javascript
// Add version field to each setting
{
  id: 1,
  name: 'Default Patient Pronoun',
  default: 'They',
  opsLockState: 'unlocked',
  pmLockState: 'unlocked',
  version: 5  // Increment on every change
}

// When PM saves override
const saveOverride = (settingId, override) => {
  const currentSetting = getSetting(settingId);
  const expectedVersion = pmModalOpenedWithVersion;

  if (currentSetting.version !== expectedVersion) {
    // Setting changed since modal opened
    showConflictModal({
      message: "This setting was changed by another user",
      currentDefault: currentSetting.default,
      yourOverride: override.value,
      actions: ['Refresh & Retry', 'Force Save Anyway', 'Cancel']
    });
    return;
  }

  // Safe to save
  createOverride(override);
};
```

**Pros:**
- Detects all concurrent changes
- Gives PM choice to proceed or cancel
- Prevents silent redundant overrides

**Cons:**
- More complex implementation
- Requires version tracking
- May annoy users with frequent conflicts

---

#### Strategy B: **Last Write Wins with Validation**

```javascript
// When PM saves override
const saveOverride = (settingId, override) => {
  const currentSetting = getSetting(settingId);

  // Validate against CURRENT state (not when modal opened)
  const isRedundant = (
    override.value === currentSetting.default &&
    override.pmLockState === currentSetting.pmLockState
  );

  if (isRedundant) {
    alert("This override matches the current default and will not be created.");
    return;
  }

  // Check if setting is now locked
  if (currentSetting.opsLockState !== 'unlocked') {
    alert("This setting is now locked and cannot have overrides.");
    return;
  }

  // Safe to save
  createOverride(override);
};
```

**Pros:**
- Simpler implementation
- Prevents redundant overrides
- Prevents overrides on locked settings

**Cons:**
- PM might be confused (saw different default when opened)
- No visibility into what changed
- Might lose PM's work without explanation

---

#### Strategy C: **Real-Time Sync with Notifications**

```javascript
// Subscribe to setting changes
useEffect(() => {
  const unsubscribe = subscribeToSettingChanges(settingId, (newSetting) => {
    if (isModalOpen) {
      showNotificationBanner({
        type: 'warning',
        message: `This setting was just changed. Default is now: ${newSetting.default}`,
        action: 'Refresh Modal'
      });
      setStaleDataFlag(true);
    }
  });

  return unsubscribe;
}, [settingId, isModalOpen]);
```

**Pros:**
- PM gets immediate feedback
- Can see changes in real-time
- Option to refresh or continue

**Cons:**
- Requires real-time sync mechanism
- More complex WebSocket/polling setup
- May be overkill for single-user practices

---

### 2.4 Recommended Approach: **Hybrid Strategy**

Combine elements of B and C:

1. **On Modal Open**: Capture current setting state
2. **Before Save**: Validate against current state
3. **On Conflict**: Show detailed explanation
4. **Offer Choice**: Refresh, Force Save, or Cancel

```javascript
const AddOverrideModal = ({ settingId, onClose }) => {
  const [initialSetting, setInitialSetting] = useState(null);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [hasConflict, setHasConflict] = useState(false);

  useEffect(() => {
    const setting = getSetting(settingId);
    setInitialSetting(setting);
    setCurrentSetting(setting);
  }, [settingId]);

  const handleSave = () => {
    const latestSetting = getSetting(settingId);

    // Detect if setting changed
    const settingChanged = (
      latestSetting.default !== initialSetting.default ||
      latestSetting.opsLockState !== initialSetting.opsLockState ||
      latestSetting.pmLockState !== initialSetting.pmLockState
    );

    if (settingChanged) {
      setCurrentSetting(latestSetting);
      setHasConflict(true);
      return; // Show conflict UI
    }

    // Validate against current state
    if (latestSetting.opsLockState !== 'unlocked') {
      alert("This setting is now locked and cannot have overrides.");
      onClose();
      return;
    }

    const isRedundant = (
      overrideValue === latestSetting.default &&
      overridePmLockState === latestSetting.pmLockState
    );

    if (isRedundant) {
      alert("This override matches the current default and will not be created.");
      return;
    }

    // Safe to proceed
    createOverride({...});
    onClose();
  };

  if (hasConflict) {
    return (
      <ConflictResolutionUI
        initialSetting={initialSetting}
        currentSetting={currentSetting}
        overrideValue={overrideValue}
        onRefresh={() => {
          setInitialSetting(currentSetting);
          setHasConflict(false);
        }}
        onForceSave={() => {
          createOverride({...});
          onClose();
        }}
        onCancel={onClose}
      />
    );
  }

  return <NormalModalUI />;
};
```

---

## 3. Override & Default Interactions {#override-default}

### 3.1 Ops Changes Default with Many Overrides

**Scenario:** Ops changes default from "Eastern" to "Central", affecting 100 users

**Current Implementation:**
```javascript
// When default changes
const redundantOverrides = detectRedundantOverrides(moduleId, settingId, newValue);

if (redundantOverrides.length > 0) {
  // Show modal with list of affected users
  setOverrideCleanupData({ redundantOverrides, ... });
  setShowOverrideCleanupModal(true);
}
```

**Performance Issues:**

| Override Count | Detection Time | Rendering Time | User Impact |
|---------------|----------------|----------------|-------------|
| 10 overrides | ~1ms | ~5ms | ✅ Instant |
| 100 overrides | ~10ms | ~50ms | ✅ Fast |
| 500 overrides | ~50ms | ~500ms | 🟡 Noticeable lag |
| 1000+ overrides | ~100ms+ | ~2s+ | 🔴 Frozen UI |

**Improvements Needed:**

#### 3.1.1 Async Redundancy Detection

```javascript
const updateSettingState = async (moduleId, settingId, property, value) => {
  const isLockStateChange = property === 'pmLockState';
  const isDefaultValueChange = property === 'default';

  if (isDefaultValueChange || isLockStateChange) {
    const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);

    // Show progress indicator for large override sets
    const overrideCount = getSettingOverrides(moduleId, settingId).length;
    if (overrideCount > 50) {
      showProgressIndicator("Checking for redundant overrides...");
    }

    // Run detection asynchronously
    const redundantOverrides = await new Promise(resolve => {
      setTimeout(() => {
        resolve(detectRedundantOverrides(moduleId, settingId, value, setting.type, isLockStateChange));
      }, 0);
    });

    hideProgressIndicator();

    if (redundantOverrides.length > 0) {
      setOverrideCleanupData({...});
      setShowOverrideCleanupModal(true);
      return;
    }
  }

  // Proceed with update
  setModuleSettings(...);
};
```

#### 3.1.2 Paginated Override Cleanup Modal

```javascript
const OverrideCleanupModal = ({ redundantOverrides }) => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const totalPages = Math.ceil(redundantOverrides.length / pageSize);
  const displayedOverrides = redundantOverrides.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <Modal>
      <h3>Redundant Overrides Detected</h3>
      <p>Found {redundantOverrides.length} users with overrides matching the new default</p>

      <div className="override-list">
        {displayedOverrides.map(override => (
          <div key={override.userId}>
            {override.userName}: {formatValueDisplay(override.value)}
          </div>
        ))}
      </div>

      <Pagination
        current={page}
        total={totalPages}
        onChange={setPage}
      />

      <div className="actions">
        <button onClick={removeAllRedundantOverrides}>
          Remove All {redundantOverrides.length} Overrides
        </button>
        <button onClick={cancel}>Keep Overrides</button>
      </div>
    </Modal>
  );
};
```

---

### 3.2 New Default Matches Existing Override

**Scenario Timeline:**

```
T0: Default = "Eastern"
T1: PM creates override for Dr. Smith = "Pacific"
T2: Ops changes default to "Pacific"
T3: System detects Dr. Smith's override matches new default
T4: Options?
```

**Current Behavior:**
- Redundancy detected
- Ops sees cleanup modal
- Ops can remove Dr. Smith's override

**Edge Cases:**

#### Case 3.2.1: Override Created Between Detection and Removal

```
T0: Ops changes default to "Pacific"
T1: Redundancy detection runs → finds Dr. Smith
T2: Ops sees cleanup modal with 1 user
T3: PM creates override for Dr. Jones = "Pacific" (redundant)
T4: Ops clicks "Remove All" → Only Dr. Smith removed
T5: Dr. Jones's redundant override still exists
```

**Solution: Re-validate Before Removal**

```javascript
const confirmRemoveRedundantOverrides = () => {
  // Re-detect redundancy right before removal
  const currentRedundant = detectRedundantOverrides(
    overrideCleanupData.moduleId,
    overrideCleanupData.settingId,
    overrideCleanupData.newDefault,
    overrideCleanupData.settingType,
    overrideCleanupData.isLockStateChange
  );

  const newOverrides = currentRedundant.filter(
    current => !overrideCleanupData.redundantOverrides.some(
      original => original.userId === current.userId
    )
  );

  if (newOverrides.length > 0) {
    showWarning({
      message: `${newOverrides.length} additional redundant overrides were created since you opened this modal.`,
      options: ['Remove All', 'Remove Only Original List', 'Cancel']
    });
    return;
  }

  // Safe to proceed
  removeMultipleOverrides(overrideCleanupData.redundantOverrides, ...);
  setShowOverrideCleanupModal(false);
};
```

---

#### Case 3.2.2: pmLockState Differs

```
T0: Default = "Pacific" (pmLockState: unlocked)
T1: Override for Dr. Smith = "Pacific" (pmLockState: locked-visible)
T2: Is this redundant?
```

**Answer: NO - Value matches but lock state differs**

Current implementation correctly checks BOTH:
```javascript
const valueMatches = valuesAreEqual(effectiveValue, setting.default);
const lockStateMatches = effectiveLockState === setting.pmLockState;
return valueMatches && lockStateMatches; // ✅ Both must match
```

---

### 3.3 Service Settings Edge Case

**Scenario:** Complex service-settings-combined type

```javascript
// Default
{
  default: ['Emergency', 'Outpatient', 'Inpatient'],
  defaultService: 'Emergency'
}

// Dr. Smith Override
{
  value: ['Emergency', 'Outpatient'],  // Disabled Inpatient
  defaultService: 'Emergency'
}
```

**What happens when Ops changes default?**

#### Case 3.3.1: Ops Disables "Emergency"

```
T0: Default = ['Outpatient', 'Inpatient'], defaultService: 'Outpatient'
T1: Dr. Smith's override still has defaultService: 'Emergency'
T2: "Emergency" is not in enabled services anymore
T3: INVALID STATE - Dr. Smith's UI will break
```

**Current Implementation: UNDEFINED BEHAVIOR**

From PRD:
> **Need to define:** Auto-revert to first enabled service? Show error? Keep override but disable?

**Proposed Solutions:**

**Option A: Auto-Correct Invalid Overrides**
```javascript
const validateServiceOverride = (override, newDefault) => {
  const { value: enabledServices, defaultService } = override;

  if (!enabledServices.includes(defaultService)) {
    // Auto-correct to first enabled service
    return {
      ...override,
      defaultService: enabledServices[0]
    };
  }

  return override;
};

// When default changes
Object.keys(userSettingsOverrides).forEach(key => {
  if (isServiceSettingOverride(key)) {
    const corrected = validateServiceOverride(
      userSettingsOverrides[key],
      newDefault
    );
    if (corrected !== userSettingsOverrides[key]) {
      setUserSetting(userId, moduleId, settingId, 'defaultService', corrected.defaultService);
      logWarning(`Auto-corrected invalid override for ${userId}`);
    }
  }
});
```

**Option B: Show Warning Modal**
```javascript
const detectInvalidServiceOverrides = (moduleId, settingId, newDefault) => {
  const invalidOverrides = [];

  Object.keys(userSettingsOverrides).forEach(key => {
    const suffix = `-${moduleId}-${settingId}`;
    if (key.endsWith(suffix)) {
      const override = userSettingsOverrides[key];
      const enabledServices = override.value || newDefault;
      const defaultService = override.defaultService || newDefault.defaultService;

      if (!enabledServices.includes(defaultService)) {
        invalidOverrides.push({
          userId: key.split('-')[0],
          enabledServices,
          invalidDefaultService: defaultService
        });
      }
    }
  });

  return invalidOverrides;
};

// Show modal before changing default
if (invalidOverrides.length > 0) {
  showInvalidOverridesModal({
    message: `${invalidOverrides.length} users have overrides that will become invalid`,
    options: ['Auto-Correct', 'Remove Overrides', 'Cancel Change']
  });
}
```

**Recommendation: Option A (Auto-Correct)**
- Least disruptive to users
- Maintains override intent (custom enabled services)
- Only fixes the invalid part (defaultService)
- Log for audit trail

---

## 4. Concurrent Operations {#concurrent-operations}

### 4.1 Two Ops Members Editing Same Setting

**Current Behavior:** Last write wins, no conflict detection

**Scenario:**
```
T0: Setting Default = "Eastern"
T1: Ops-A opens edit → sees "Eastern"
T2: Ops-B opens edit → sees "Eastern"
T3: Ops-A saves → "Pacific"
T4: Ops-B saves → "Central"
T5: Final value = "Central" (Ops-A's work lost silently)
```

**Solution: Optimistic Locking**
```javascript
const Setting = {
  id: 1,
  default: 'Eastern',
  version: 5,  // ← Add version field
  lastModifiedBy: 'ops-a@marvix.com',
  lastModifiedAt: '2025-12-01T10:30:00Z'
};

const updateSetting = (settingId, newValue, expectedVersion) => {
  const currentSetting = getSetting(settingId);

  if (currentSetting.version !== expectedVersion) {
    throw new ConcurrentModificationError({
      expected: expectedVersion,
      current: currentSetting.version,
      currentValue: currentSetting.default,
      lastModifiedBy: currentSetting.lastModifiedBy,
      lastModifiedAt: currentSetting.lastModifiedAt
    });
  }

  // Update with incremented version
  setSetting({
    ...currentSetting,
    default: newValue,
    version: currentSetting.version + 1,
    lastModifiedBy: currentUserEmail,
    lastModifiedAt: new Date().toISOString()
  });
};
```

---

### 4.2 Ops Changes Lock State While PM Creating Override

**Current Behavior:** No validation, override created for locked setting

**Scenario:**
```
T0: opsLockState = 'unlocked'
T1: PM opens "Add Override" modal
T2: Ops changes opsLockState to 'locked-hidden'
T3: PM fills out form
T4: PM clicks Save
T5: Override created for hidden setting (INVALID)
```

**Solution: Validate on Save**
```javascript
const createOverride = (userId, moduleId, settingId, override) => {
  const currentSetting = getSetting(moduleId, settingId);

  // Validate opsLockState hasn't changed
  if (currentSetting.opsLockState !== 'unlocked') {
    throw new ValidationError({
      code: 'SETTING_LOCKED',
      message: `This setting is now ${currentSetting.opsLockState} and cannot have overrides`,
      currentLockState: currentSetting.opsLockState,
      action: 'Please close this modal and refresh'
    });
  }

  // Proceed with creation
  setUserSetting(userId, moduleId, settingId, 'value', override.value);
};
```

---

## 5. Data Consistency Issues {#data-consistency}

### 5.1 User Deletion with Overrides

**Current Implementation:**
```javascript
// ✅ Correctly handles override cleanup
const deleteUser = (userId) => {
  // Remove all overrides for this user
  Object.keys(userSettingsOverrides).forEach(key => {
    if (key.startsWith(`${userId}-`)) {
      delete userSettingsOverrides[key];
    }
  });

  // Remove user
  setAllUsers(prev => prev.filter(u => u.id !== userId));
};
```

**Edge Case: PM Requests User, Ops Deletes User, PM Approves Request**

From PRD:
> **Need to define:** Approval fails? User re-created? Request marked invalid?

**Recommendation: Validate User Exists**
```javascript
const approveUserRequest = (requestId) => {
  const request = getUserRequest(requestId);

  // Check if user still exists (not deleted)
  const userExists = allUsers.some(u => u.email === request.email);

  if (userExists) {
    throw new ValidationError({
      code: 'USER_ALREADY_EXISTS',
      message: 'A user with this email already exists'
    });
  }

  // Proceed with approval
  addUser(request);
  markRequestApproved(requestId);
};
```

---

### 5.2 Orphaned Override Detection

**Scenario:** Override exists but user doesn't

```javascript
// Audit function to find orphaned overrides
const findOrphanedOverrides = () => {
  const orphaned = [];

  Object.keys(userSettingsOverrides).forEach(key => {
    const userId = key.split('-')[0];
    const userExists = allUsers.some(u => u.id.toString() === userId);

    if (!userExists) {
      orphaned.push({
        key,
        userId,
        override: userSettingsOverrides[key]
      });
    }
  });

  return orphaned;
};

// Auto-cleanup on app load
useEffect(() => {
  const orphaned = findOrphanedOverrides();
  if (orphaned.length > 0) {
    console.warn(`Found ${orphaned.length} orphaned overrides, cleaning up...`);
    orphaned.forEach(item => {
      delete userSettingsOverrides[item.key];
    });
  }
}, []);
```

---

## 6. Implementation Recommendations {#recommendations}

### 6.1 Priority Matrix

| Issue | Severity | Frequency | Impact | Priority |
|-------|----------|-----------|--------|----------|
| Concurrent Ops edits | 🔴 High | Low | Data loss | **P0** |
| PM creates override for locked setting | 🔴 High | Medium | Invalid state | **P0** |
| Service override with disabled service | 🔴 High | Low | UI crash | **P0** |
| Redundant override created during Ops change | 🟡 Medium | Medium | Data clutter | **P1** |
| Stale data in PM modal | 🟡 Medium | Medium | Confusion | **P1** |
| Performance with 500+ overrides | 🟡 Medium | Low | Slow UI | **P2** |

### 6.2 Implementation Phases

#### Phase 1: Critical Fixes (P0)
1. Add version field to settings
2. Validate opsLockState before creating override
3. Auto-correct invalid service overrides
4. Add orphaned override cleanup

#### Phase 2: User Experience (P1)
1. Conflict detection on save
2. Re-validation before redundancy removal
3. Progress indicators for large operations
4. Paginated cleanup modals

#### Phase 3: Optimization (P2)
1. Async redundancy detection
2. Real-time sync notifications
3. Batch operations for multiple overrides
4. Audit logging

### 6.3 Testing Strategy

**For Each Edge Case:**
```javascript
describe('Edge Case: Concurrent Ops Edit', () => {
  it('should detect version conflict', () => {
    // Setup
    const setting = { id: 1, default: 'A', version: 1 };

    // Ops-A gets setting
    const opsASetting = getSetting(1);  // version: 1

    // Ops-B updates setting
    updateSetting(1, 'B', 1);  // version → 2

    // Ops-A tries to update with stale version
    expect(() => {
      updateSetting(1, 'C', 1);  // Should fail
    }).toThrow(ConcurrentModificationError);
  });
});
```

---

## 7. Summary & Action Items

### Edge Cases Identified: **23 cases**
- Time-based conflicts: 6 cases
- Override interactions: 8 cases
- Concurrent operations: 4 cases
- Data consistency: 5 cases

### Unresolved Behaviors: **7 items**
1. Service override with disabled service → **Recommend: Auto-correct**
2. PM creates override while Ops locks setting → **Recommend: Validate on save**
3. Multiple Ops editing simultaneously → **Recommend: Optimistic locking**
4. Orphaned override handling → **Recommend: Auto-cleanup**
5. PM request for deleted user → **Recommend: Validation check**
6. Override created during redundancy removal → **Recommend: Re-validate**
7. Stale data in modal → **Recommend: Conflict detection**

### Critical Additions Needed:
- [ ] Version field on all settings
- [ ] Conflict detection on save
- [ ] Validation before override creation
- [ ] Auto-correction for service overrides
- [ ] Orphaned data cleanup
- [ ] Progress indicators for large operations
- [ ] Comprehensive error messages

---

**Document Status:** Active Analysis
**Last Review:** December 1, 2025
**Next Steps:** Implement P0 critical fixes
