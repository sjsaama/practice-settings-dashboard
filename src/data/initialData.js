/**
 * Initial Data Module
 *
 * This file contains the initial data used by the Practice Settings Dashboard,
 * including user accounts, linked accounts, and deleted consults.
 *
 * This data is used to initialize the state when the application loads.
 */

/**
 * Initial users data - includes both primary and secondary accounts
 *
 * Primary accounts: Doctors with full permissions
 * Secondary accounts: Staff members (nurses, technicians, etc.) with limited permissions
 *
 * @constant {Array<Object>}
 */
export const initialUsers = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    type: 'primary',
    specialty: 'Cardiology',
    email: 'sarah.johnson@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: true
    }
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    type: 'primary',
    specialty: 'Neurology',
    email: 'michael.chen@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: true
    }
  },
  {
    id: 3,
    name: 'Dr. Emily Rodriguez',
    type: 'primary',
    specialty: 'Pediatrics',
    email: 'emily.rodriguez@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: true
    }
  },
  {
    id: 4,
    name: 'Dr. James Wilson',
    type: 'primary',
    specialty: 'Orthopedics',
    email: 'james.wilson@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: true
    }
  },
  {
    id: 5,
    name: 'Dr. Lisa Thompson',
    type: 'primary',
    specialty: 'Dermatology',
    email: 'lisa.thompson@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: true
    }
  },
  {
    id: 'sec1',
    name: 'Lisa Parker',
    type: 'secondary',
    role: 'Nurse',
    email: 'lisa.parker@clinic.com',
    permissions: {
      createConsults: true,
      mergeAndLinkAppointments: false,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    }
  },
  {
    id: 'sec2',
    name: 'Alex Johnson',
    type: 'secondary',
    role: 'Lab Technician',
    email: 'alex.johnson@clinic.com',
    permissions: {
      createConsults: true,
      mergeAndLinkAppointments: false,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    }
  }
];

/**
 * Initial linked accounts data
 * These are secondary accounts linked to primary doctor accounts
 *
 * @constant {Array<Object>}
 */
export const initialLinkedAccounts = [
  {
    id: 'lisa_parker',
    name: 'Lisa Parker, RN',
    role: 'Cardiology Nurse',
    email: 'lisa.parker@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    }
  },
  {
    id: 'jennifer_walsh',
    name: 'Jennifer Walsh',
    role: 'Medical Assistant',
    email: 'jennifer.walsh@clinic.com',
    permissions: {
      createConsults: true,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: false
    }
  }
];

/**
 * Initial linked assignment records used by the dashboard prototype.
 * This mirrors the richer linked-assignment shape used in current UI flows.
 *
 * @constant {Array<Object>}
 */
export const initialLinkedAssignments = [
  {
    linkId: 'link_lisa_seed',
    assigneeUserId: 'lisa_parker',
    assigneeType: 'secondary',
    assignmentType: 'assistant',
    secondaryUserId: 'lisa_parker',
    id: 'lisa_parker',
    name: 'Lisa Parker, RN',
    role: 'Cardiology Nurse',
    email: 'lisa.parker@clinic.com',
    permissions: {
      createConsults: true,
      mergeAndLinkAppointments: false,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    },
    linkedToDoctorId: 1,
    linkedToDoctorName: 'Dr. Sarah Johnson',
    startDate: '2026-03-01',
    endDate: '2026-03-31'
  },
  {
    linkId: 'link_jennifer_seed',
    assigneeUserId: 'jennifer_walsh',
    assigneeType: 'secondary',
    assignmentType: 'assistant',
    secondaryUserId: 'jennifer_walsh',
    id: 'jennifer_walsh',
    name: 'Jennifer Walsh',
    role: 'Medical Assistant',
    email: 'jennifer.walsh@clinic.com',
    permissions: {
      createConsults: true,
      mergeAndLinkAppointments: false,
      canGenerateNotes: true,
      editGeneratedNotes: true,
      pushToEHR: false
    },
    linkedToDoctorId: 2,
    linkedToDoctorName: 'Dr. Michael Chen',
    startDate: '2026-03-05',
    endDate: '2026-04-05'
  }
];

/**
 * Initial deleted consults data
 * Stores information about deleted consultations that can be retrieved
 *
 * @constant {Array<Object>}
 */
export const initialDeletedConsults = [];
