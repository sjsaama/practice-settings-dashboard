export const APPOINTMENT_PULL_FILTER_SETTING_NAME = 'Appointment Type Pull Filter';
export const APPOINTMENT_BLOCKLIST_LEGACY_NAME = 'Appointment Type Blocklist';
export const APPOINTMENT_ALLOWLIST_LEGACY_NAME = 'Appointment Type Allowlist';

export const EMPTY_APPOINTMENT_PULL_FILTER = { mode: 'none', types: [] };

export function normalizeAppointmentPullFilter(value, blocklist = [], allowlist = []) {
  if (value && typeof value === 'object' && !Array.isArray(value) && value.mode) {
    const mode = ['none', 'allowlist', 'blocklist'].includes(value.mode) ? value.mode : 'none';
    const types = Array.isArray(value.types) ? value.types : [];
    if (mode === 'none') return { mode: 'none', types: [] };
    return { mode, types };
  }

  const bl = Array.isArray(blocklist) ? blocklist : [];
  const al = Array.isArray(allowlist) ? allowlist : [];
  if (bl.length > 0 && al.length > 0) {
    return { mode: 'blocklist', types: bl };
  }
  if (al.length > 0) return { mode: 'allowlist', types: al };
  if (bl.length > 0) return { mode: 'blocklist', types: bl };
  return { ...EMPTY_APPOINTMENT_PULL_FILTER };
}

export function validateAppointmentPullFilter(config, { strict = false } = {}) {
  const normalized = normalizeAppointmentPullFilter(config);
  if (normalized.mode === 'none') return null;
  if (
    strict &&
    (!Array.isArray(normalized.types) || normalized.types.length === 0)
  ) {
    return 'Add at least one appointment type, or choose No filter.';
  }
  return null;
}

export function formatAppointmentPullFilterDisplay(config) {
  const normalized = normalizeAppointmentPullFilter(config);
  if (normalized.mode === 'none') return 'No filter (pull all types)';
  const label = normalized.mode === 'allowlist' ? 'Allowlist' : 'Blocklist';
  return `${label}: ${normalized.types.join(', ')}`;
}

export function getAppointmentPullFilterSetting(moduleSettings, ehrModuleKey) {
  const settings = moduleSettings?.[ehrModuleKey]?.settings;
  if (!Array.isArray(settings)) return EMPTY_APPOINTMENT_PULL_FILTER;

  const combined = settings.find((s) => s.type === 'appointment-pull-filter-combined');
  if (combined) {
    return normalizeAppointmentPullFilter(combined.default);
  }

  const blocklist = settings.find((s) => s.name === APPOINTMENT_BLOCKLIST_LEGACY_NAME);
  const allowlist = settings.find((s) => s.name === APPOINTMENT_ALLOWLIST_LEGACY_NAME);
  return normalizeAppointmentPullFilter(
    null,
    blocklist?.default,
    allowlist?.default
  );
}

function normalizeType(type) {
  return String(type || '').trim().toLowerCase();
}

export function isAppointmentTypePulled(appointmentType, filterConfig) {
  const filter = normalizeAppointmentPullFilter(filterConfig);
  const normalized = normalizeType(appointmentType);
  if (!normalized) return filter.mode !== 'allowlist';

  if (filter.mode === 'none') return true;
  if (filter.mode === 'blocklist') {
    return !filter.types.some((t) => normalizeType(t) === normalized);
  }
  if (filter.mode === 'allowlist') {
    return filter.types.some((t) => normalizeType(t) === normalized);
  }
  return true;
}

export function filterAppointmentsByPullFilter(items, filterConfig, typeField = 'appointmentType') {
  if (!Array.isArray(items)) return [];
  const filter = normalizeAppointmentPullFilter(filterConfig);
  if (filter.mode === 'none') return items;
  return items.filter((item) => isAppointmentTypePulled(item?.[typeField], filter));
}

// blocklist id -> allowlist id per EHR module (legacy migration)
export const LEGACY_APPOINTMENT_FILTER_PAIRS = {
  'ehr-settings-amd': [121, 122],
  'ehr-settings-athena': [123, 124],
  'ehr-settings-ecw': [100, 101],
  'ehr-settings-athenaflow': [107, 108],
  'ehr-settings-charm': [109, 110],
  'ehr-settings-drchrono': [131, 132],
  'ehr-settings-nereg': [113, 114],
  'ehr-settings-greenway': [115, 116],
  'ehr-settings-veradigm-allscripts': [117, 118],
  'ehr-settings-modmed': [119, 120],
};
