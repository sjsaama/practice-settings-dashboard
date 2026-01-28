# Ops System - Complete Design Specification

**Version**: 1.0
**Date**: November 24, 2025
**Status**: Design Complete - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Ops Team Structure](#ops-team-structure)
4. [Practice State Machine](#practice-state-machine)
5. [Workflows](#workflows)
6. [Lock States & Access Control](#lock-states--access-control)
7. [Email Notification System](#email-notification-system)
8. [Data Structures](#data-structures)
9. [Implementation Plan](#implementation-plan)
10. [Clarification Questions](#clarification-questions)

---

## Overview

### Purpose
Enable Ops team to configure practice settings during onboarding with approval workflow, while controlling PM access through a 2-level hierarchy.

### Key Requirements
1. ✅ **PM Access Control**: Pause PM access when Ops making changes
2. ✅ **Lock States**: Three levels (unlocked, locked-visible, locked-hidden)
3. ✅ **Approval Workflow**: One designated approver must approve all changes [Rashie]
4. ✅ **Email Notifications**: Email-only (web portal, no in-app)
5. ✅ **Audit Trail**: Full logging of all actions
6. ✅ **User Model**: Users never access portal, PM creates user-specific settings

---

## System Architecture

### 2-Level Hierarchy

```
┌─────────────────────────────────────────┐
│         Level 1: OPS TEAM               │
│  • 4 team members (1 approver)          │
│  • Sets practice-wide defaults          │
│  • Controls lock states                 │
│  • Triggers approval workflow           │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    Level 2: PRACTICE MANAGER (PM)       │
│  • Views settings based on Ops locks    │
│  • Modifies unlocked settings           │
│  • Creates user-specific settings       │
│  • Access blocked during Ops changes    │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         USERS (No Portal Access)        │
│  • Doctors, nurses, staff               │
│  • Receive settings in their app        │
│  • Can change IF PM allows              │
│  • No visibility to "locked" concept    │
└─────────────────────────────────────────┘
```

**IMPORTANT**: Users never access the settings portal. PM creates user-specific settings for them.

---

## Ops Team Structure

### Team Composition

```javascript
const opsTeam = {
  members: [
    {
      id: 'ops-001',
      email: 'alice@company.com',
      role: 'ops-member',
      canEdit: true,
      canApprove: false
    },
    {
      id: 'ops-002',
      email: 'bob@company.com',
      role: 'ops-member',
      canEdit: true,
      canApprove: false
    },
    {
      id: 'ops-003',
      email: 'carol@company.com',
      role: 'ops-member',
      canEdit: true,
      canApprove: false
    },
    {
      id: 'ops-004',
      email: 'david@company.com',
      role: 'ops-approver',  // DESIGNATED APPROVER
      canEdit: true,
      canApprove: true
    }
  ]
};
```

### Roles

| Role | Can View | Can Edit | Can Approve | Can Lock Practice |
|------|----------|----------|-------------|-------------------|
| ops-member | ✅ All | ✅ When locked | ❌ | ✅ |
| ops-approver | ✅ All | ✅ When locked | ✅ | ✅ |

---

## Practice State Machine

### States

```
CREATED
  ↓
IN_SETUP (Ops configuring)
  ↓
PENDING_APPROVAL (Awaiting approver)
  ↓
APPROVED/ACTIVE (PM can access)
  ↓
LOCKED_FOR_CHANGES (Ops editing)
  ↓
PENDING_RE_APPROVAL (Awaiting approver)
  ↓
APPROVED/ACTIVE (Changes live)
```

### State Definitions

| State | PM Access | Ops Access | Users (App) |
|-------|-----------|------------|-------------|
| CREATED | ❌ None | ✅ Full | Continue existing |
| IN_SETUP | ❌ None | ✅ Full | Continue existing |
| PENDING_APPROVAL | ❌ None | 👁️ Read-only | Continue existing |
| ACTIVE | ✅ Filtered by locks | 👁️ Read-only | ✅ Normal |
| LOCKED_FOR_CHANGES | ❌ Blocked | ✅ Full | Continue existing |
| PENDING_RE_APPROVAL | ❌ Blocked | 👁️ Read-only | Continue existing |

---

## Workflows

### Workflow 1: Initial Practice Setup

```
1. Practice Created → State: CREATED
   ↓
2. Ops Member Opens Practice → State: IN_SETUP
   ↓
3. Ops Configures All Settings
   • Set default values
   • Set lock states (unlocked/locked-visible/locked-hidden)
   ↓
4. Ops Clicks "Complete Setup" → State: PENDING_APPROVAL
   ↓
5. Email Sent to All Ops Team
   • Subject: "Practice Setup Complete - Review Required"
   • Recipients: All 4 Ops members
   • Note: Only approver can approve
   ↓
6. Approver Reviews Configuration
   ↓
7a. If Approved → State: ACTIVE
    • PM gets access
    • Confirmation email sent

7b. If Rejected → State: IN_SETUP
    • Rejection email with feedback
    • Ops member makes corrections
    • Returns to step 4
```

### Workflow 2: Modifying Active Practice

```
1. Active Practice → State: ACTIVE
   ↓
2. Ops Member Clicks "Lock for Changes"
   • State: ACTIVE → LOCKED_FOR_CHANGES
   • PM access immediately blocked
   • Blocking overlay shown to PM
   ↓
3. Ops Member Modifies Settings
   • Change values
   • Change lock states
   • All changes logged
   ↓
4. Ops Clicks "Submit Changes" → State: PENDING_RE_APPROVAL
   ↓
5. Email Sent to All Ops Team
   • Subject: "Practice Changes Submitted - Review Required"
   • Shows change diff
   • PM access still blocked
   ↓
6. Approver Reviews Changes
   ↓
7a. If Approved → State: ACTIVE
    • Changes go live
    • PM access restored
    • Notification email sent

7b. If Rejected → State: ACTIVE
    • Changes discarded
    • Previous settings remain
    • PM access restored
    • Rejection email sent
```

---

## Lock States & Access Control

### Three Lock States

| Ops Lock State | PM View | PM Edit Default | PM Create User-Specific | User Can Change |
|----------------|---------|-----------------|-------------------------|-----------------|
| **unlocked** | ✅ Yes | ✅ Yes | ✅ Yes | 🔒 If PM allows |
| **locked-visible** | ✅ Yes | ❌ No | ✅ Yes | 🔒 If PM allows |
| **locked-hidden** | ❌ No | ❌ No | ❌ No | ❌ Applied silently |

### PM Dashboard Filtering

```javascript
function getVisibleSettingsForPM(modules, practiceState) {
  // If practice locked, show nothing
  if (['LOCKED_FOR_CHANGES', 'PENDING_APPROVAL', 'PENDING_RE_APPROVAL']
      .includes(practiceState)) {
    return [];
  }

  // Filter out locked-hidden settings
  const filtered = {};
  Object.keys(modules).forEach(moduleId => {
    const module = modules[moduleId];
    const visible = module.settings.filter(s =>
      s.opsLockState !== 'locked-hidden'
    );

    if (visible.length > 0) {
      filtered[moduleId] = { ...module, settings: visible };
    }
  });

  return filtered;
}
```

### Access Control Matrix

| Action | Ops Member | Approver | PM | Users |
|--------|------------|----------|-----|-------|
| View all settings | ✅ Yes | ✅ Yes | 🔒 Filtered | N/A |
| Edit practice defaults | ✅ When locked | ✅ When locked | 🔒 Unlocked only | N/A |
| Create user-specific | ❌ No | ❌ No | ✅ Yes | N/A |
| Change own value | N/A | N/A | N/A | 🔒 If PM allows |
| Approve changes | ❌ No | ✅ Yes | ❌ No | N/A |
| Lock practice | ✅ Yes | ✅ Yes | ❌ No | N/A |

---

## Email Notification System

### Email Templates

#### 1. Setup Complete - Review Required

**Recipients**: All Ops team
**Sent When**: Ops completes initial setup

```
Subject: Practice Setup Complete - Review Required: [Practice Name]

Practice: [Practice Name]
Configured by: [Ops Member]
Completed: [Timestamp]

Configuration Summary:
• Total Settings: 45
• Unlocked: 12
• Locked (Visible): 20
• Locked (Hidden): 13

⚠️ Approval Required
Only [Approver Name] can approve this setup.

[Review Configuration Button]
```

#### 2. Changes Submitted - Review Required

**Recipients**: All Ops team
**Sent When**: Ops submits changes to active practice

```
Subject: Practice Changes Submitted - Review Required: [Practice Name]

Practice: [Practice Name]
Changed by: [Ops Member]
Submitted: [Timestamp]

⚠️ PM Access: Currently Blocked

Changes Made:
• 5 settings modified
• 2 lock states changed

[Change Diff Table]

[Review Changes Button]
```

#### 3. Changes Approved - Access Restored

**Recipients**: PM + All Ops team
**Sent When**: Approver approves changes

```
Subject: Practice Settings Updated - Access Restored: [Practice Name]

✅ Changes Approved

Practice: [Practice Name]
Approved by: [Approver Name]

Access has been restored. Changes are now live.

[View Dashboard Button]
```

#### 4. Changes Rejected

**Recipients**: Submitting Ops member (CC: All Ops)
**Sent When**: Approver rejects changes

```
Subject: Practice Changes Rejected - Review Feedback: [Practice Name]

Practice: [Practice Name]
Rejected by: [Approver Name]

Feedback:
[Rejection reason from approver]

Next Steps:
1. Review feedback
2. Make corrections
3. Re-submit changes

Practice is active with previous settings.
```

#### 5. PM Access Blocked

**Recipients**: PM
**Sent When**: Ops locks practice for changes

```
Subject: Practice Access Temporarily Blocked: [Practice Name]

The Ops team is currently updating practice settings.
Your access has been temporarily blocked.

Started: [Timestamp]
Ops Member: [Name]
Estimated Duration: 1-2 hours

You will receive an email when access is restored.
```

#### 6. PM Access Restored

**Recipients**: PM
**Sent When**: Changes approved and practice unlocked

```
Subject: Practice Access Restored: [Practice Name]

✅ Access Restored

Your access has been restored.

Changes Made:
[List of changes visible to PM]

[View Dashboard Button]
```

### Email Configuration

```javascript
// Email service configuration
const emailConfig = {
  provider: 'sendgrid',  // or 'smtp'

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: 'noreply@marvix.com',
    fromName: 'Marvix Practice Settings'
  },

  opsTeam: {
    allMembers: [
      'alice@company.com',
      'bob@company.com',
      'carol@company.com',
      'david@company.com'
    ],
    approverEmail: 'david@company.com'
  },

  options: {
    enableEmailSending: true,
    retryFailedEmails: true,
    maxRetries: 3
  }
};
```

---

## Data Structures

### Practice

```javascript
{
  id: 'practice-123',
  name: 'Downtown Cardiology',
  type: 'Cardiology',

  // Ops state management
  opsState: 'ACTIVE',
  opsCreatedBy: 'ops-001',
  opsLastModifiedBy: 'ops-002',
  opsApprovedBy: 'ops-004',
  opsApprovedAt: '2025-11-20T10:00:00Z',

  // Lock tracking
  lockedForChangesAt: null,
  lockedBy: null,

  // Pending changes (during approval)
  pendingChanges: [],

  // PM info
  pmId: 'pm-123',
  pmEmail: 'john@clinic.com',
  pmAccessBlocked: false,

  // Settings modules
  modules: {
    appointments: {
      title: 'Appointment Scheduling',
      settings: [...]
    }
  }
}
```

### Setting

```javascript
{
  id: 'appt-duration',
  name: 'Default Appointment Duration',
  type: 'dropdown',
  default: '30 minutes',
  options: ['15 minutes', '30 minutes', '45 minutes', '60 minutes'],

  // OPS-CONTROLLED lock state
  opsLockState: 'unlocked',  // or 'locked-visible' or 'locked-hidden'

  // PM-level lock (for user-specific settings)
  lockState: 'unlocked',  // PM can set this for unlocked opsLockState

  subtext: 'Default duration for new appointments',

  // Audit
  lastModifiedBy: 'ops-001',
  lastModifiedAt: '2025-11-20T10:00:00Z'
}
```

### User-Specific Setting (Created by PM)

```javascript
{
  userId: 'user-123',
  userName: 'Dr. Sarah Johnson',
  practiceId: 'practice-123',
  moduleId: 'appointments',
  settingId: 'appt-duration',

  // PM sets this value for the user
  value: '45 minutes',

  // Can user change it? (PM decision)
  pmLockState: 'locked',  // 'locked' or 'unlocked'

  // Created by PM, not user
  createdBy: 'pm-001',
  createdAt: '2025-11-24T10:00:00Z'
}
```

### Audit Log Entry

```javascript
{
  id: 'audit-12345',
  timestamp: '2025-11-24T10:30:00Z',
  practiceId: 'practice-123',

  actor: {
    id: 'ops-001',
    name: 'Alice Johnson',
    role: 'ops-member'
  },

  eventType: 'SETTING_CHANGED',

  resource: {
    moduleId: 'appointments',
    settingId: 'appt-duration',
    settingName: 'Default Appointment Duration'
  },

  changes: {
    field: 'value',
    oldValue: '30 minutes',
    newValue: '45 minutes'
  },

  context: {
    practiceState: 'LOCKED_FOR_CHANGES',
    ipAddress: '192.168.1.100'
  }
}
```

### Event Types for Audit Trail

- `PRACTICE_CREATED`
- `PRACTICE_STATE_CHANGED`
- `PRACTICE_LOCKED`
- `PRACTICE_UNLOCKED`
- `SETTING_CHANGED`
- `LOCK_STATE_CHANGED`
- `OPS_LOCK_STATE_CHANGED`
- `USER_SPECIFIC_SETTING_CREATED`
- `USER_SPECIFIC_SETTING_MODIFIED`
- `APPROVAL_REQUESTED`
- `APPROVED`
- `REJECTED`
- `EMAIL_SENT`
- `PM_ACCESS_BLOCKED`
- `PM_ACCESS_RESTORED`

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Ops team data structure
- [ ] Practice state machine
- [ ] Role-based access control
- [ ] Ops dashboard shell
- [ ] Practice locking mechanism

### Phase 2: Settings Configuration (Week 3)
- [ ] Add `opsLockState` to setting schema
- [ ] Lock state UI in Ops view
- [ ] Setting configuration interface
- [ ] Validation for required settings

### Phase 3: Approval Workflow (Week 4)
- [ ] Approval UI for approver
- [ ] Change diff visualization
- [ ] Approval/rejection actions
- [ ] Rejection feedback form
- [ ] State transitions

### Phase 4: PM Access Control (Week 5)
- [ ] PM view filtering based on `opsLockState`
- [ ] Blocking overlay for locked practices
- [ ] Filter user-specific setting creation
- [ ] Hide locked-hidden settings

### Phase 5: Email Notifications (Week 6)
- [ ] Email service integration (SendGrid/SMTP)
- [ ] Implement 6 email templates
- [ ] Email sending logic for all events
- [ ] Delivery tracking

### Phase 6: Audit Trail (Week 7)
- [ ] Audit log database schema
- [ ] Event logging for all actions
- [ ] Audit log query API
- [ ] Audit log viewer UI
- [ ] Export functionality

### Phase 7: Testing & Polish (Week 8)
- [ ] End-to-end workflow testing
- [ ] Security testing
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Bug fixes

**Total Estimated Time**: 8 weeks

---

## Clarification Questions

### Confirmed Decisions ✅

1. PM Access During Ops Changes: **PAUSE/LOCK**
2. Override Permissions: **Unlocked & locked-visible only**
3. Locked-Hidden: **Not shown to PM**
4. Notifications: **Email only**
5. Audit Trail: **Required**
6. User Access: **No portal access**

### Questions Needing Answers

#### Q1: PM Access During Pending Re-Approval

When changes are submitted and awaiting approval:

**Option A**: Complete Lockout
- PM cannot log in at all

**Option B**: Read-Only Access
- PM can view but not change

**Option C**: Continue With Old Values
- PM works normally with pre-approval settings

**Which option?** _______

---

#### Q3: Ops Team Concurrent Editing

**Option A**: First-Win (No Locking)
- Second person overwrites first person's changes (dangerous)

**Option B**: Edit Locking
- Practice locked to first editor
- Second person cannot edit until finished

**Option C**: Show Warning
- Both can edit, warning on save about conflicts

**Which option?** _______

---

#### Q4: Email Distribution List Management

**Option A**: Fixed List in Code
```javascript
const OPS_TEAM = ['ops1@company.com', 'ops2@company.com', ...];
```

**Option B**: Configurable in Admin Panel
- Ops admin can add/remove via UI

**Which option?** _______

---

#### Q5: Multiple Practices - Approval Efficiency

**Option A**: Approve Each Individually
- 10 practices = 10 separate approval sessions

**Option B**: Batch Review & Approve
- Select multiple, click "Approve Selected" once

**Which option?** _______ (or both)

---

#### Q6: Approval Rejection

**Can approver REJECT changes?** _______ (Yes/No)

If Yes:
- What happens after rejection? _______
- Can approver add rejection notes? _______
- Does Ops member get notified? _______

---

#### Q7: Practice Creation - Who Creates?

**Option A**: Ops Team Creates Practice
- Ops clicks "New Practice", enters details

**Option B**: Auto-Created from External System
- Sales/admin system creates, Ops configures

**Option C**: Both

**Which scenario?** _______

---

#### Q8: Approval Time SLA

**Scenario A**: Emergency/Urgent
- Need approval within 2-4 hours
- Escalation if delayed

**Scenario B**: Standard
- 24-48 hour approval window fine

**Scenario C**: Varies
- Need priority flag system

**Which scenario?** _______

---

#### Q9: PM Notification of Changes

**Option A**: Silent Update
- PM discovers changes when logging in

**Option B**: Email Notification
- PM gets email listing changes

**Option C**: Login Banner
- Banner on login with "View Changes" link

**Which option?** _______ (or combination)

---

#### Q10: Historical Approval Records

**Retention policy?**
- Keep forever
- Keep last 12 months
- Keep last 50 approvals
- Keep as long as practice active

**Which?** _______

---

#### Q11: Ops Member Leaving - Practice Ownership

**Options**:
- No concept of ownership - any Ops can edit any practice
- Practices auto-assigned to another Ops member
- Need explicit "transfer ownership" process

**How to handle?** _______

---

#### Q12: Template System

**Do you want practice templates?** _______ (Yes/No)

If Yes:
- Predefined templates for common practice types
- Click "Apply Cardiology Template"
- Can save custom templates

---

#### Q13: Default Lock State

When configuring new practice, what's the DEFAULT lock state?

**Options**:
- Start all as 'unlocked'
- Start all as 'locked-visible'
- Start all as 'locked-hidden'
- Different defaults per module

**Default lock state?** _______

---

#### Q14: Ops Dashboard - Practice Filtering

**Essential filters** (check all that apply):
- [ ] Pending my approval
- [ ] Pending setup
- [ ] My practices (created by me)
- [ ] Recently modified
- [ ] By practice name (search)
- [ ] By specialty type
- [ ] By region/location
- [ ] By creation date range

---

#### Q15: Practice "Go Live" vs "Active"

**Scenario A**: Approved = Live
- Once approved, practice immediately active

**Scenario B**: Approved → Staging → Live
- Ops approves → PM configures → separate "Go Live" action

**Which model?** _______

---

## File Structure

```
src/
├── components/
│   ├── ops/
│   │   ├── OpsDashboard.jsx
│   │   ├── PracticeSetup.jsx
│   │   ├── ApprovalReview.jsx
│   │   └── ChangeDiffViewer.jsx
│   └── modals/
│       ├── LockPracticeModal.jsx
│       └── ApprovalConfirmModal.jsx
│
├── services/
│   ├── opsService.js
│   ├── approvalService.js
│   ├── emailService.js
│   └── auditService.js
│
├── utils/
│   ├── opsPermissions.js
│   └── stateMachine.js
│
└── config/
    └── emailConfig.js
```

---

## Security Considerations

1. **Authentication**
   - 2FA required for all Ops members
   - Session timeout: 30 minutes
   - Audit all login attempts

2. **Authorization**
   - Verify role on every action
   - Cannot spoof approver role
   - Token-based authorization

3. **Data Protection**
   - Immutable audit logs
   - Cryptographic signatures
   - No sensitive data in emails

4. **State Validation**
   - Validate all state transitions server-side
   - Prevent unauthorized changes
   - Auto-unlock after 2 hours inactivity

---

## Success Metrics

### Operational Efficiency
- Average time from creation to approval: < 2 hours
- Average time for change approval: < 1 hour
- First-review approval rate: > 90%

### System Reliability
- PM access blocking success: 100%
- Email delivery rate: > 99%
- Audit log completeness: 100%

### User Satisfaction
- Ops team satisfaction: > 4/5
- PM understanding of lock states: > 90%
- Approver confidence: > 4/5

---

**Status**: Design complete. Awaiting answers to 14 clarification questions before implementation.

**Total Documentation**: ~600 lines (consolidated from 2,960 lines)

*Document Created: November 24, 2025*
