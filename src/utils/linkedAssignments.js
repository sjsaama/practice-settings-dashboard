export function getAssignmentAssigneeId(assignment) {
  return String(assignment?.assigneeUserId ?? assignment?.secondaryUserId ?? assignment?.id ?? '');
}

export function getAssignmentType(assignment) {
  return assignment?.assignmentType || 'assistant';
}

export function getAssignmentAssigneeType(assignment) {
  return assignment?.assigneeType || 'secondary';
}

export function isDuplicateAssignment(existingAssignments, { assigneeUserId, doctorId, assignmentType }) {
  const targetAssigneeId = String(assigneeUserId);
  const targetDoctorId = String(doctorId);
  return existingAssignments.some((assignment) => {
    const existingAssigneeId = getAssignmentAssigneeId(assignment);
    const existingDoctorId = String(assignment?.linkedToDoctorId ?? '');
    const existingType = getAssignmentType(assignment);
    return (
      existingAssigneeId === targetAssigneeId &&
      existingDoctorId === targetDoctorId &&
      existingType === assignmentType
    );
  });
}

export function buildLinkedAssignmentCandidates(directoryUsers, selectedDoctorId, seededCandidates = []) {
  const fromDirectory = directoryUsers
    .filter((user) => user.id !== selectedDoctorId)
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.type === 'primary' ? `Doctor (${user.specialty || 'General'})` : (user.role || 'Secondary'),
      email: user.email,
      type: user.type
    }));

  const dedupe = new Map();
  [...fromDirectory, ...seededCandidates].forEach((candidate) => {
    if (!dedupe.has(String(candidate.id))) dedupe.set(String(candidate.id), candidate);
  });

  return Array.from(dedupe.values());
}

export function createLinkedAssignmentRecord({
  assigneeUser,
  assignmentType,
  permissions,
  doctorId,
  doctorName,
}) {
  return {
    linkId: `link_${Date.now()}`,
    assigneeUserId: assigneeUser.id,
    assigneeType: assigneeUser.type || 'secondary',
    assignmentType,
    name: assigneeUser.name,
    role: assigneeUser.role,
    email: assigneeUser.email,
    permissions: { ...permissions },
    linkedToDoctorId: doctorId,
    linkedToDoctorName: doctorName,
  };
}
