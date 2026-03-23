export const practices = [
  { id: 'sunrise', name: 'Sunrise' },
  { id: 'manipal', name: 'Manipal' }
];

// Demo-only mapping: which practices an Ops user can access.
// In production this should come from the backend via RBAC.
export const opsPracticeAccess = {
  'ops@marvix.ai': ['sunrise', 'manipal']
};

// Demo-only mapping: PM is auto-bound to exactly one practice.
export const pmPracticeBinding = {
  'a@sunrise.hp': 'sunrise',
  'a@manipal.hp': 'manipal'
};

