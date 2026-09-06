import React from "react";
import Index from "../../app/[locale]/page.jsx";
import { FilesProvider } from "../../src/context/fileContext";
import { seedIndexPageData } from "../../.storybook/__mocks__/index-page-examples";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
import { expect } from "storybook/test";

// Wrapper component to bridge Storybook args to Next.js page props
// FilesProvider is added here for file context
function IndexPageWrapper(props) {
  console.log("[IndexPageWrapper] Received props:", props);
  return (
    <FilesProvider>
      <Index {...props} />
    </FilesProvider>
  );
}

export default {
  title: "📄 Pages/Index",
  component: IndexPageWrapper,
  parameters: {
    layout: "fullscreen",
    // Disable all extra context providers - index page queries DataStore directly
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    docs: {
      description: {
        component:
          "Student and instructor dashboard showing assignments, sections, and grade progress",
      },
    },
  },
};

/**
 * Student Dashboard - Active learner with assignments and progress
 *
 * Shows student enrolled in 2 sections with the following:
 *
 * **Assignments Section (needs grading):**
 * - Unit 2 (Numbers) - in progress (88%, 60% complete)
 * - Unit 3 (Daily Activities) - not started
 * - Unit 4 (Kanji Basics) - not started
 *
 * **Completed Assignments Section:**
 * - Unit 1 (Greetings) - 97% (highest), 95.5% (average), 2 attempts
 *
 * **Sections:**
 * - Japanese 101 - Spring 2024
 * - Japanese 102 - Advanced
 */
export const StudentDashboard = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
        },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      },
    },
  },
  decorators: [
    (Story, { args }) => {
      // Set mock auth user for any components that call getCurrentUser
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
        },
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      });
      // Seed data
      seedIndexPageData("student");

      // Return the story with props explicitly passed
      return <Story {...args} />;
    },
  ],
  args: {
    user: {
      username: "student-alice-sub",
      userId: "student-alice-sub",
      attributes: {
        sub: "student-alice-sub",
        email: "alice@example.com",
      },
      groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
    },
    signOut: () => console.log("Sign out clicked"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Instructor Dashboard - Teacher managing classes
 *
 * Shows:
 * - 1 section they teach
 * - 2 assignments they created
 * - Links to edit units
 */
export const InstructorDashboard = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: "teacher-1",
          email: "teacher@example.com",
        },
      },
      session: {
        username: "teacher-1",
        identityId: "identity-teacher-1",
        groups: ["Instructors"],
      },
    },
  },
  decorators: [
    (Story, { args }) => {
      setMockUser({
        username: "teacher-1",
        userId: "teacher-1",
        attributes: {
          sub: "teacher-1",
          email: "teacher@example.com",
        },
        groups: ["Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story {...args} />;
    },
  ],
  args: {
    user: {
      username: "teacher-1",
      userId: "teacher-1",
      attributes: {
        email: "teacher@example.com",
        sub: "teacher-1",
      },
      groups: ["Instructors"],
    },
    signOut: () => console.log("Sign out clicked"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Empty State - New user
 *
 * Shows:
 * - No sections
 * - No assignments
 */
export const EmptyState = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: "new-student",
          email: "new.student@example.com",
        },
      },
      session: {
        username: "new-student",
        identityId: "identity-new-student",
        groups: [],
      },
    },
  },
  decorators: [
    (Story, { args }) => {
      seedIndexPageData("empty");
      return <Story {...args} />;
    },
  ],
  args: {
    user: {
      username: "new-student",
      userId: "new-student",
      attributes: {
        email: "new.student@example.com",
        sub: "new-student",
      },
    },
    signOut: () => console.log("Sign out clicked"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Loading State - While data is fetching
 */
export const Loading = {
  args: {
    user: null,
    signOut: () => console.log("Sign out clicked"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
