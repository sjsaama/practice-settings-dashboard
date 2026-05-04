const APPOINTMENT_ALLOWLIST_SETTING_NAME = 'Appointment Type Allowlist';

export const getAppointmentAllowlist = (moduleSettings, ehrModuleKey) => {
  const settings = moduleSettings?.[ehrModuleKey]?.settings;
  if (!Array.isArray(settings)) return [];

  const allowlistSetting = settings.find(
    (setting) => setting.name === APPOINTMENT_ALLOWLIST_SETTING_NAME
  );
  if (!allowlistSetting) return [];

  return Array.isArray(allowlistSetting.default) ? allowlistSetting.default : [];
};

export const isAppointmentTypeAllowed = (appointmentType, allowlist) => {
  if (!Array.isArray(allowlist) || allowlist.length === 0) return true;
  if (!appointmentType) return false;

  // Keep manual entries resilient to case/whitespace differences.
  const normalizedAppointmentType = String(appointmentType).trim().toLowerCase();
  return allowlist.some((t) => String(t).trim().toLowerCase() === normalizedAppointmentType);
};

export const filterAppointmentsByAllowlist = (
  items,
  allowlist,
  typeField = 'appointmentType'
) => {
  if (!Array.isArray(items)) return [];
  if (!Array.isArray(allowlist) || allowlist.length === 0) return items;

  return items.filter((item) =>
    isAppointmentTypeAllowed(item?.[typeField], allowlist)
  );
};
