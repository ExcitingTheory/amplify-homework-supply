interface GradeOwnerFields {
  id: string;
  owner?: string | null;
  unitID?: string | null;
  sectionID?: string | null;
  instructorGroup?: string | null;
}

export function gradeOwnerIdentifiers(
  userId: string,
  username: string | undefined,
  claims: Record<string, unknown>,
): string[] {
  const claimUsername =
    typeof claims["cognito:username"] === "string"
      ? claims["cognito:username"]
      : username;
  return [
    userId,
    claimUsername,
    claimUsername ? `${userId}::${claimUsername}` : undefined,
  ].filter((value): value is string => Boolean(value));
}

export function isGradeOwnedByCaller(
  grade: GradeOwnerFields,
  ownerIds: string[],
): boolean {
  return typeof grade.owner === "string" && ownerIds.includes(grade.owner);
}

export function gradeResponseAssociations(grade: GradeOwnerFields) {
  return {
    gradeID: grade.id,
    unitID: grade.unitID ?? null,
    sectionID: grade.sectionID ?? null,
    instructorGroup:
      grade.instructorGroup ??
      (grade.sectionID ? `section-${grade.sectionID}-instructors` : null),
    owner: grade.owner,
  };
}
