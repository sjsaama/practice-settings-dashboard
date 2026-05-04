export const DELETE_CONSULTS_SETTING_ID = 25;
export const EHR_PULL_LOOK_AHEAD_SETTING_ID = 26;
export const LOCAL_CACHE_WINDOW_SETTING_ID = 27;
export const MAX_WINDOW_DAYS = 14;

const DAY_PATTERN = /^-?(\d+)\s+day(s)?$/i;
const DELETE_PATTERN = /^(\d+)\s+(day|days|week|weeks|month|months)$/i;

export const parseDeleteConsultsToDays = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'never' || normalized === 'custom') return null;

  const match = normalized.match(DELETE_PATTERN);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (unit.startsWith('day')) return amount;
  if (unit.startsWith('week')) return amount * 7;
  if (unit.startsWith('month')) return amount * 30;
  return null;
};

export const parseDayValue = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(DAY_PATTERN);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
};

export const getLookBackCapDays = (deleteConsultsValue, maxSupportedDays = 14) => {
  const derivedDays = parseDeleteConsultsToDays(deleteConsultsValue);
  if (!Number.isFinite(derivedDays)) return null;
  return Math.max(1, Math.min(maxSupportedDays, derivedDays));
};

export const formatDayLabel = (dayCount) => {
  const normalized = Math.max(1, Number(dayCount) || 1);
  return `${normalized} day${normalized === 1 ? '' : 's'}`;
};

export const buildDayOptions = (maxDays = MAX_WINDOW_DAYS) => (
  Array.from({ length: Math.max(1, maxDays) }, (_, idx) => formatDayLabel(idx + 1))
);

export const filterLookBackOptionsByCap = (options, capDays) => {
  if (!Array.isArray(options)) return [];
  if (!Number.isFinite(capDays)) return options;
  return options.filter((option) => {
    const dayCount = parseDayValue(option);
    return Number.isFinite(dayCount) && dayCount <= capDays;
  });
};

export const clampLookBackValueToCap = (value, options, capDays) => {
  if (!Array.isArray(options) || options.length === 0) return value;
  const allowedOptions = filterLookBackOptionsByCap(options, capDays);
  const fallbackOptions = allowedOptions.length > 0 ? allowedOptions : options;
  if (fallbackOptions.includes(value)) return value;
  return fallbackOptions[fallbackOptions.length - 1];
};

export const clampRangeSelectorValue = (value, options, fallback) => {
  if (!Array.isArray(options) || options.length === 0) return fallback;
  if (typeof value === 'string' && options.includes(value)) return value;
  return fallback && options.includes(fallback) ? fallback : options[0];
};

export const getCacheWindowBounds = ({
  deleteConsultsValue,
  ehrLookAheadValue,
  maxDays = MAX_WINDOW_DAYS
}) => {
  const maxAheadDays = clampRangeSelectorValue(
    ehrLookAheadValue,
    buildDayOptions(maxDays),
    formatDayLabel(Math.min(8, maxDays))
  );
  const maxAhead = parseDayValue(maxAheadDays) || Math.min(8, maxDays);
  const maxBack = getLookBackCapDays(deleteConsultsValue, maxDays) || maxDays;
  return {
    maxAheadDays: maxAhead,
    maxBackDays: maxBack
  };
};

export const normalizeCacheWindowValue = (rawValue, bounds) => {
  const safeBounds = {
    maxAheadDays: Math.max(1, bounds?.maxAheadDays || 1),
    maxBackDays: Math.max(1, bounds?.maxBackDays || 1)
  };
  const next = (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue))
    ? rawValue
    : {};
  const ahead = parseDayValue(next.aheadDays) || safeBounds.maxAheadDays;
  const back = parseDayValue(next.backDays) || Math.min(7, safeBounds.maxBackDays);
  return {
    aheadDays: formatDayLabel(Math.min(Math.max(1, ahead), safeBounds.maxAheadDays)),
    backDays: formatDayLabel(Math.min(Math.max(1, back), safeBounds.maxBackDays))
  };
};
