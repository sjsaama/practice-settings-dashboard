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
        name: 'Default Patient Pronoun',
        type: 'dropdown',
        options: ['He', 'She', 'They'],
        default: 'They',
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: ''
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
    name: 'EHR Settings - AMD',
    subtitle: 'Settings that control AMD EHR integration and synchronization',
    settings: [
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
        subtext: 'Times shown in selected timezone (30min increments). Max 6 times'
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
        subtext: 'Automatically push completed notes to EHR system'
      },
      {
        id: 78,
        name: 'Appointment Allowlist',
        type: 'keyword-list',
        options: [
          'Initial Consultation',
          'Follow-up',
          'Annual Checkup',
          'Routine Checkup',
          'Physical Examination',
          'Lab Results Review'
        ],
        default: [],
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Add appointment words/phrases to show. If none are added, all types are shown.'
      }
    ]
  },
  'ehr-settings-athena': {
    name: 'EHR Settings - Athena',
    subtitle: 'Settings that control Athena EHR integration and synchronization',
    settings: [
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
        subtext: 'Times shown in selected timezone (30min increments). Max 6 times'
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
        subtext: 'Automatically push completed notes to EHR system'
      },
      {
        id: 89,
        name: 'Appointment Allowlist',
        type: 'keyword-list',
        options: [
          'Initial Consultation',
          'Follow-up',
          'Annual Checkup',
          'Routine Checkup',
          'Physical Examination',
          'Lab Results Review'
        ],
        default: [],
        opsLockState: 'unlocked', // Ops controls PM access
        pmLockState: 'unlocked',  // PM controls doctor access
        subtext: 'Add appointment words/phrases to show. If none are added, all types are shown.'
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
  }
};
