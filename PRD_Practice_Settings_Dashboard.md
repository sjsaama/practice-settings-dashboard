# Product Requirements Document: Practice Settings Dashboard

## 1. Overview

**Product Name:** Marvix Practice Settings Dashboard
**Version:** 1.0
**Last Updated:** November 13, 2025
**Document Owner:** Product Team

### Purpose
A comprehensive settings management system for medical practices that allows practice managers to configure practice-wide settings, manage user accounts with role-based permissions, and control teleconsult integrations.

### Target Users
- Primary Users: Practice Managers/Administrators
- Secondary Users: Medical staff with limited permissions (Nurses, Lab Technicians, Medical Assistants, etc.)

---

## 2. Core Features

### 2.1 User Account Management

#### 2.1.1 Account Types
- **Primary Account:** Full access to all settings and configurations
- **Secondary Accounts:** Limited access based on assigned permissions
  - Cost: $50/month per secondary account
  - Custom roles supported (not limited to predefined options)

#### 2.1.2 Add Secondary Account Flow
**Requirements:**
- Full name input (required)
- Role selection with custom role support (required)
  - Predefined suggestions: Nurse, Lab Technician, Medical Assistant, Phlebotomist, Radiology Technician
  - Allow free-text entry for custom roles
  - Use datalist for suggestion dropdown
- Email input (required)
- Phone number input (required)
- Cost notification banner displayed prominently:
  - "Each secondary account costs **$50 per month**. This will be added to your monthly subscription."
  - Blue info banner with icon

#### 2.1.3 Secondary User Permissions
Configurable permissions per secondary user:
- View Appointments
- Edit Appointments
- View Patient Records
- Edit Patient Records
- View Reports
- Edit Settings (limited)
- Manage Billing
- View Billing

#### 2.1.4 Link Secondary Users to Primary Doctors

**Functionality:**
- Link secondary users to specific doctors for a defined time period
- Required fields when linking:
  - Select secondary user (from existing accounts)
  - Start date
  - End date
- No permission selection during linking (permissions are pre-configured per user)

**Display Requirements:**

*For Primary Users:*
- "Currently Linked Accounts" section showing:
  - Linked user name, role, email
  - Start date (formatted: Month Day, Year)
  - End date (formatted: Month Day, Year)
  - Duration in days (calculated automatically)
  - Unlink button

*For Secondary Users:*
- "Linked to Doctors" section in Permissions view showing:
  - Doctor name
  - Start date
  - End date
  - Duration in days
  - Ordered by start date (earliest first)

---

### 2.2 Settings Modules

#### 2.2.1 Control Settings
General practice control settings including:

**Key Settings:**
- **Delete Consults** (Dropdown)
  - Options: 1-6 days, 1-3 weeks, 1-4 months, Never
  - Default: 1 month
  - Purpose: Auto-delete old consults after specified period

- **Appointments Order** (Order List - Drag to reorder)
  - Options: Today, Tomorrow, Yesterday, Day After Tomorrow
  - Default order: Today, Tomorrow, Yesterday
  - Purpose: Define order in "Link Appointment" popup

#### 2.2.2 E/M (Evaluation and Management) Settings

**Key Settings:**
- **Enabled Service Settings** (ID: 41) - Multiselect
  - Options: E/M service codes (99202, 99203, 99204, etc.)
  - Minimum 1 selection required
  - Cannot uncheck an option that is currently set as default in setting 42

- **Default Service Setting** (ID: 42) - Dropdown
  - Dependency: Must have at least one option selected in setting 41
  - Options populated from selections in setting 41
  - **Must NOT be greyed out** (remain fully visible/interactive)
  - Enabled when setting 41 has at least one selection

#### 2.2.3 Teleconsult Settings

**Google Calendar Integration:**
- Visibility: Only for users who signed up with "Google Calendar" as EHR
- States:
  - Not signed in: Show "Sign in with Google" button with Google logo
  - Signed in: Show connected status with "Sign Out" button
- Sign-out flow: Show confirmation modal with warning message
- Subtext: "This option is only visible to users who have signed up for 'Google Calendar' as EHR."

**Zoom Integration:**
- Check if Marvix app is installed via Zoom Marketplace
- States:
  - Not installed: Show "Not Installed" badge with link to Zoom Marketplace
  - Installed: Show "Installed" badge with connected checkmark
- Note: Consults via Zoom are not linked to appointments - new consult is created
- Subtext: "Connect Marvix app via Zoom marketplace. Consults via Zoom are not linked to an appointment - new consult is created."

---

## 3. Technical Requirements

### 3.1 Technology Stack
- **Frontend Framework:** React 18.2.0
- **UI Components:** Custom components with Tailwind-style classes
- **Icons:** lucide-react (v0.263.1)
- **Build Tool:** react-scripts 5.0.1

### 3.2 Data Structures

#### Linked Account Object
```javascript
{
  id: string,
  name: string,
  role: string,
  email: string,
  permissions: object,
  linkedToDoctorId: string,
  linkedToDoctorName: string,
  startDate: string (ISO date),
  endDate: string (ISO date)
}
```

#### Setting Object
```javascript
{
  id: number,
  name: string,
  type: string, // 'toggle', 'dropdown', 'multiselect', 'order-list', 'google-signin', 'zoom-check'
  options: array,
  default: any,
  lockState: string, // 'locked', 'unlocked'
  subtext: string,
  dependency?: number // Optional reference to another setting ID
}
```

### 3.3 Setting Types
- **toggle:** On/Off switch (True/False)
- **dropdown:** Single selection from options
- **multiselect:** Multiple selections with checkboxes
- **order-list:** Drag-and-drop reorderable list
- **google-signin:** Custom Google Calendar integration control
- **zoom-check:** Custom Zoom installation status check

### 3.4 Dependency Logic
- Settings can depend on other settings (using `dependency` field)
- Dependent settings must check parent setting state:
  - Toggle dependencies: Check if parent is 'True'
  - Multiselect dependencies: Check if parent has at least one selection (array length > 0)
- Dependent settings remain visible but may have restricted functionality
- For multiselect dependencies: Cannot remove an option that is used as default in dependent setting

---

## 4. User Interface Requirements

### 4.1 Layout Structure
- **Left Sidebar:** User selection and account management
- **Main Content Area:** Settings modules and configuration panels
- **Modal Overlays:** For adding accounts, linking users, confirmations

### 4.2 Visual Design
- Clean, medical-professional aesthetic
- Primary color: Blue (#3B82F6)
- Clear visual hierarchy with sections and cards
- Responsive design for various screen sizes

### 4.3 Interactive Elements
- Hover states on all clickable elements
- Focus states for form inputs
- Loading states for async operations
- Confirmation modals for destructive actions
- Toast notifications for success/error feedback

### 4.4 Accessibility
- Keyboard navigation support
- Clear labels for all form inputs
- Disabled states clearly indicated
- Error messages for validation failures

---

## 5. Business Rules

### 5.1 Account Management
1. Each secondary account costs $50/month
2. Primary accounts have unrestricted access
3. Secondary accounts cannot modify their own permissions
4. Custom roles are allowed (not limited to predefined list)

### 5.2 Linking Rules
1. Secondary users can be linked to multiple primary doctors
2. Links must have valid start and end dates
3. End date must be after start date
4. Date ranges can overlap for the same secondary user
5. Duration is calculated automatically in days

### 5.3 Settings Rules
1. Locked settings cannot be modified by any user
2. Settings with dependencies cannot be enabled until parent setting is enabled
3. For multiselect settings with dependencies:
   - Cannot uncheck options used in dependent settings
   - Must change dependent setting first
4. Setting overrides are user-specific

### 5.4 Teleconsult Rules
1. Google Calendar integration only visible to users with Google Calendar EHR
2. Zoom integration creates new consults (not linked to appointments)
3. Sign-out actions require confirmation

---

## 6. Future Considerations

### Potential Enhancements
- Audit log for settings changes
- Bulk user import/export
- Advanced permission templates
- Setting presets for different practice types
- User activity monitoring
- Integration with additional EHR systems
- Mobile app version
- Multi-language support

---

## 7. Success Metrics

### Key Performance Indicators
- Time to complete initial practice setup: < 15 minutes
- Secondary account creation time: < 2 minutes
- User satisfaction score: > 4.5/5
- Settings modification error rate: < 2%
- Support tickets related to settings: < 5% of total tickets

---

## 8. Glossary

- **EHR:** Electronic Health Record
- **E/M:** Evaluation and Management (medical service codes)
- **Teleconsult:** Remote medical consultation via video
- **Primary User:** Practice manager with full administrative access
- **Secondary User:** Staff member with limited, configured access
- **Service Setting:** Medical billing code configuration

---

## 9. Appendix

### A. Setting IDs Reference
- **25:** Delete Consults
- **41:** Enabled Service Settings (E/M)
- **42:** Default Service Setting (E/M)
- **71:** Google Calendar Integration
- **72:** Zoom Integration / Appointments Order (context-dependent)

### B. Predefined Role Options
- Nurse
- Lab Technician
- Medical Assistant
- Phlebotomist
- Radiology Technician

### C. Permission Types
- View Appointments
- Edit Appointments
- View Patient Records
- Edit Patient Records
- View Reports
- Edit Settings
- Manage Billing
- View Billing

---

**Document Status:** Ready for Development
**Approval Required From:** Product Manager, Engineering Lead, UX Designer
**Next Steps:** Technical design document, Sprint planning, UI mockup review
