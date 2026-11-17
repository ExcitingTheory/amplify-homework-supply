import { describe, expect, it } from "vitest";
import {
  gradeOwnerIdentifiers,
  gradeResponseAssociations,
  isGradeOwnedByCaller,
} from "./gradeResponseOwnership";

describe("grade response ownership", () => {
  it("accepts only owner identifiers from the authenticated identity", () => {
    const ownerIds = gradeOwnerIdentifiers(
      "student-sub",
      "student-name",
      { "cognito:username": "student-name" },
    );

    expect(
      isGradeOwnedByCaller(
        { id: "grade-1", owner: "student-sub::student-name" },
        ownerIds,
      ),
    ).toBe(true);
    expect(
      isGradeOwnedByCaller(
        { id: "grade-2", owner: "other-student::other-name" },
        ownerIds,
      ),
    ).toBe(false);
  });

  it("derives response associations only from the verified grade", () => {
    expect(
      gradeResponseAssociations({
        id: "grade-1",
        owner: "student-sub::student-name",
        unitID: "unit-1",
        sectionID: "section-1",
      }),
    ).toEqual({
      gradeID: "grade-1",
      owner: "student-sub::student-name",
      unitID: "unit-1",
      sectionID: "section-1",
      instructorGroup: "section-section-1-instructors",
    });
  });
});
