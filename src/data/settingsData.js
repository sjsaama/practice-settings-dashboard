/**
 * Settings Data Module
 *
 * This file contains the complete settings configuration for the Practice Settings Dashboard.
 * It defines all available settings modules and their respective settings, including:
 * - Note Settings
 * - Controls
 * - E/M Settings
 * - EHR Settings (AMD & Athena)
 * - Teleconsult Settings
 *
 * Each setting includes:
 * - id: Unique identifier
 * - name: Display name
 * - type: Control type (dropdown, toggle, multiselect, etc.)
 * - options: Available options for the setting
 * - default: Default value
 * - opsLockState: Ops user control over PM access
 * - pmLockState: PM control over doctor access
 * - subtext/subtexts: Help text for the setting
 */

/**
 * Settings modules configuration object
 * Contains all settings organized by module
 *
 * @constant {Object}
 */
export const settingsModules = {
  'note-settings': {
    name: 'Note Settings',
    subtitle: 'Settings that affect your notes and other documents',
    settings: [
      {
        id: 1,
        name: 'Patient Pronoun in Generated Notes',
        type: 'dropdown',
        options: ['He', 'She', 'They'],
        default: 'They',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Used when generating notes so pronoun references stay consistent when context is unclear.'
      },
      {
        id: 2,
        name: 'Patient Name',
        type: 'dropdown',
        options: ['As Entered', 'Infer from Audio', '"The Patient"'],
        default: 'As Entered',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'As Entered': 'AI will use the entered patient name',
          'Infer from Audio': 'AI will infer the patient name from the audio',
          '"The Patient"': 'AI will refer to the patient as "The patient"'
        }
      },
      {
        id: 3,
        name: 'Default Visit Type',
        type: 'dropdown',
        options: ['First Visit', 'Follow up'],
        default: 'Follow up',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: ''
      },
      {
        id: 4,
        name: 'Default Note View',
        type: 'dropdown',
        options: ['Section View', 'Full Note View'],
        default: 'Full Note View',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'Section View': 'By default, notes will open in Section View, each section in its own text box',
          'Full Note View': 'By default, notes will open in Full Note View, everything in a single text box'
        }
      },
      {
        id: 5,
        name: 'Capture Dictation Separately',
        type: 'toggle',
        options: ['True', 'False'],
        default: 'False',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'True': 'A new section "Verbatim Dictation" will be inserted in the note',
          'False': 'Enable to insert a new section "Verbatim Dictation" to capture all dictation'
        }
      },
      {
        id: 6,
        name: 'Skip empty sections in Note',
        type: 'toggle',
        options: ['True', 'False'],
        default: 'True',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'True': '',
          'False': 'Enable to hide empty sections in your notes'
        }
      }
    ]
  },
  'controls': {
    name: 'Controls',
    subtitle: 'Settings that affect app behaviour',
    settings: [
      {
        id: 20,
        name: 'Timezone',
        type: 'dropdown',
        options: [
          'Eastern (America/New York)',
          'Central (America/Chicago)',
          'Mountain (America/Denver)',
          'Pacific (America/Los Angeles)'
        ],
        default: 'Eastern (America/New York)',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: '',
        required: true
      },
      {
        id: 21,
        name: '2-factor Authentication',
        type: 'toggle',
        options: ['True', 'False'],
        default: 'False',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'True': 'You will receive an OTP on email for every login in addition to your access code',
          'False': 'Enable to receive an OTP on email for every login in addition to your access code'
        }
      },
      {
        id: 22,
        name: 'Email Delivery',
        type: 'email-delivery-combined',
        options: ['True', 'False'],
        default: {
          sendNote: 'False',
          sendTranscript: 'False'
        },
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Enable only if your email complies with Privacy and Data Protection laws',
        requiresAttestation: true
      },
      {
        id: 24,
        name: 'Play Recording Consent Disclaimer',
        type: 'toggle',
        options: ['True', 'False'],
        default: 'False',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'True': 'Recording consent disclaimer will play every time a new consult is started',
          'False': 'Enable to play a recording consent disclaimer before every consult'
        }
      },
      {
        id: 25,
        name: 'Delete Consults',
        type: 'dropdown',
        options: [
          '1 day', '2 days', '3 days', '4 days', '5 days', '6 days',
          '1 week', '2 weeks', '3 weeks',
          '1 month', '2 months', '3 months', '4 months',
          'Custom',
          'Never'
        ],
        default: '1 month',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: ''
      },
      {
        id: 26,
        name: 'EHR Pull Look ahead window',
        type: 'range-selector',
        options: [
          '1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days',
          '8 days', '9 days', '10 days', '11 days', '12 days', '13 days', '14 days'
        ],
        default: '8 days',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Defines the future window from which appointments are pulled from EHR.'
      },
      {
        id: 27,
        name: 'Local cache window',
        type: 'cache-window-combined',
        options: [],
        default: {
          aheadDays: '8 days',
          backDays: '7 days'
        },
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Defines local DB cache window; this must stay within EHR pull window.'
      }
    ]
  },
  'em-settings': {
    name: 'E/M Settings',
    subtitle: 'Settings that affect E/M codes',
    settings: [
      {
        id: 41,
        name: 'Service Settings',
        type: 'service-settings-combined',
        options: ['Outpatient', 'Inpatient', 'Emergency Services', 'Home Services', 'Nursing Facilities'],
        default: ['Outpatient'], // enabled services
        defaultService: 'Outpatient', // default service
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Configure which service settings are available and set the default.'
      },
      {
        id: 43,
        name: 'Enable Preventive Medicine Service',
        type: 'toggle',
        options: ['True', 'False'],
        default: 'False',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtexts: {
          'True': '',
          'False': 'Enable to see Preventive Visit (eg. Annual check up) as a consult option for E/M codes'
        }
      }
    ]
  },
  'ehr-settings-amd': {
    name: 'EHR Settings - AdvancedMD',
    subtitle: 'Settings that control AMD EHR integration and synchronization',
    settings: [
      {
        id: 90,
        name: 'First-Visit Appointment Types',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Add appointment types that should be classified as first visits.'
      },
      {
        id: 91,
        name: 'Follow-Up Appointment Types',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Add appointment types that should be classified as follow-up visits.'
      },
      {
        id: 121,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 73,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 76,
        name: 'Allow repeat note push',
        type: 'toggle',
        options: ['Yes', 'No'],
        default: 'Off',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Allow pushing updated notes to EHR more than once'
      },
      {
        id: 77,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      },
      
    ]
  },
  'ehr-settings-athena': {
    name: 'EHR Settings - AthenaOne',
    subtitle: 'Settings that control Athena EHR integration and synchronization',
    settings: [
      {
        id: 94,
        name: 'First-Visit Appointment Types',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Add appointment types that should be classified as first visits.'
      },
      {
        id: 95,
        name: 'Follow-Up Appointment Types',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Add appointment types that should be classified as follow-up visits.'
      },
      {
        id: 123,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 84,
        name: 'Enable Athena Embedded App',
        type: 'toggle',
        options: ['Yes', 'No'],
        default: 'No',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Allow users to access the Athena embedded app'
      },
      {
        id: 85,
        name: 'Auto Pull In Embedded App',
        type: 'toggle',
        options: ['Yes', 'No'],
        default: 'No',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        dependency: 84,
        subtext: 'Automatically pull appointment context when opening the embedded app'
      },
      {
        id: 83,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 86,
        name: 'Allow repeat note push',
        type: 'toggle',
        options: ['Yes', 'No'],
        default: 'Off',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Allow pushing updated notes to EHR more than once'
      },
      {
        id: 87,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      },
      
    ]
  },
  'ehr-settings-ecw': {
    name: 'EHR Settings - ECW',
    subtitle: 'Settings that control ECW EHR integration and synchronization',
    settings: [
      {
        id: 98,
        name: 'First-Visit Appointment Types',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Add appointment types that should be classified as first visits.'
      },
      {
        id: 99,
        name: 'Follow-Up Appointment Types',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Add appointment types that should be classified as follow-up visits.'
      },
      {
        id: 100,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 125,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 126,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      },
      {
        id: 102,
        name: 'Cancelled EHR Appointment Statuses',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Statuses that should be interpreted as cancelled.'
      },
      {
        id: 103,
        name: 'Rescheduled EHR Appointment Statuses',
        type: 'keyword-list',
        options: [],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Statuses that should be interpreted as rescheduled.'
      }
    ]
  },
  'ehr-settings-athenaflow': {
    name: 'EHR Settings - Athenaflow',
    subtitle: 'Settings that control Athenaflow-specific behavior',
    settings: [
      {
        id: 104,
        name: 'Ignore Pronoun Info From EHR',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'When enabled, Marvix ignores pronoun values received from Athenaflow EHR.'
      },
      {
        id: 107,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 127,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 128,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-charm': {
    name: 'EHR Settings - Charm',
    subtitle: 'Settings that control Charm EHR integration',
    settings: [
      {
        id: 109,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 129,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 130,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-drchrono': {
    name: 'EHR Settings - DrChrono',
    subtitle: 'Settings that control DrChrono EHR integration',
    settings: [
      {
        id: 131,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 133,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 134,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-nereg': {
    name: 'EHR Settings - Nereg',
    subtitle: 'Settings that control Nereg EHR integration',
    settings: [
      {
        id: 113,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 135,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 136,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-greenway': {
    name: 'EHR Settings - Greenway',
    subtitle: 'Settings that control Greenway EHR integration',
    settings: [
      {
        id: 115,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 137,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 138,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-veradigm-allscripts': {
    name: 'EHR Settings - Veradigm/Allscripts',
    subtitle: 'Settings that control Veradigm/Allscripts EHR integration',
    settings: [
      {
        id: 117,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 139,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 140,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-modmed': {
    name: 'EHR Settings - Modmed',
    subtitle: 'Settings that control Modmed EHR integration',
    settings: [
      {
        id: 119,
        name: 'Appointment Type Pull Filter',
        type: 'appointment-pull-filter-combined',
        options: [],
        default: { mode: 'none', types: [] },
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.'
      },
      {
        id: 141,
        name: 'Daily appointment sync time',
        type: 'time-multiselect',
        options: [
          '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
          '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
          '5:00 PM'
        ],
        default: [],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Set the daily time for pulling appointments from EHR.'
      },
      {
        id: 142,
        name: 'Push to EHR automatically',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'If enabled, the note is pushed to EHR immediately after it is processed.'
      }
    ]
  },
  'ehr-settings-google-meet': {
    name: 'EHR Settings - Google Meet',
    subtitle: 'Settings that control Google Meet meeting bot behavior',
    settings: [
      {
        id: 105,
        name: 'Auto Schedule Meeting Bot',
        type: 'toggle',
        options: ['On', 'Off'],
        default: 'Off',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Automatically schedule the meeting bot for eligible appointments.'
      },
      {
        id: 106,
        name: 'Meeting Bot Name',
        type: 'text',
        options: [],
        default: '',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        subtext: 'Display name used by the meeting bot in Google Meet.'
      }
    ]
  },
  'teleconsult-settings': {
    name: 'Teleconsult Settings',
    subtitle: 'Configure your teleconsult integrations',
    settings: [
      {
        id: 71,
        name: 'Google Calendar',
        type: 'google-signin',
        options: [],
        default: false,
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'This option is only visible to users who have signed up for "Google Calendar" as EHR.'
      },
      {
        id: 72,
        name: 'Zoom',
        type: 'zoom-check',
        options: [],
        default: false,
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Connect Marvix app via Zoom marketplace. Consults via Zoom are not linked to an appointment - new consult is created.'
      }
    ]
  },
  'practice-properties': {
    name: 'Practice Properties',
    subtitle: 'Practice-level properties managed by Ops and Practice Managers',
    settings: [
      {
        id: 121,
        name: 'Org ID',
        type: 'text',
        options: [],
        default: '',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        nonPropagatable: true,
        subtext: 'Unique organization identifier used for this practice.'
      },
      {
        id: 122,
        name: 'Document Types',
        type: 'multiselect',
        options: ['SOAP Note', 'Progress Note', 'Discharge Summary', 'Referral Letter', 'Clinical Summary'],
        default: ['SOAP Note', 'Progress Note'],
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        nonPropagatable: true,
        subtext: 'Defines which document types are enabled at the practice level.'
      },
      {
        id: 123,
        name: 'EHR',
        type: 'dropdown',
        options: ['AdvancedMD', 'AthenaOne', 'ECW', 'Athenaflow', 'Charm', 'DrChrono', 'Nereg', 'Greenway', 'Veradigm/Allscripts', 'Modmed', 'Google Meet'],
        default: 'AthenaOne',
        opsLockState: 'unlocked',
        pmLockState: 'unlocked',
        nonPropagatable: true,
        subtext: 'Primary EHR connected for this practice.'
      }
    ]
  }
};

const MODULE_CAPABILITIES = {
  'note-settings': {
    supportsUserOverrides: true,
    usesVisibilityEditabilityUI: true
  },
  controls: {
    supportsUserOverrides: true,
    usesVisibilityEditabilityUI: false
  },
  'em-settings': {
    supportsUserOverrides: true,
    usesVisibilityEditabilityUI: false
  }
};

export const getModuleCapabilities = (moduleId) => {
  if (MODULE_CAPABILITIES[moduleId]) {
    return MODULE_CAPABILITIES[moduleId];
  }

  if (moduleId?.startsWith('ehr-settings-')) {
    return {
      supportsUserOverrides: true,
      usesVisibilityEditabilityUI: true
    };
  }

  return {
    supportsUserOverrides: false,
    usesVisibilityEditabilityUI: false
  };
};
