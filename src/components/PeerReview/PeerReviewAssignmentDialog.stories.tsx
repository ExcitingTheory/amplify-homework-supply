import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { PeerReviewAssignmentDialog } from './PeerReviewAssignmentDialog';

const meta: Meta<typeof PeerReviewAssignmentDialog> = {
  title: '🤝 Peer Review/Assignment Dialog',
  component: PeerReviewAssignmentDialog,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof PeerReviewAssignmentDialog>;

const mockGrades = [
  { id: 'grade-1', owner: 'student-alice', unitID: 'unit-vocab' },
  { id: 'grade-2', owner: 'student-bob', unitID: 'unit-vocab' },
  { id: 'grade-3', owner: 'student-charlie', unitID: 'unit-grammar' },
  { id: 'grade-4', owner: 'student-diana', unitID: 'unit-vocab' },
];

const mockStudents = {
  'student-alice': { id: 'student-alice', userId: 'student-alice', preferredName: 'Alice', name: 'Alice Johnson' },
  'student-bob': { id: 'student-bob', userId: 'student-bob', preferredName: 'Bob', name: 'Bob Smith' },
  'student-charlie': { id: 'student-charlie', userId: 'student-charlie', preferredName: 'Charlie', name: 'Charlie Brown' },
  'student-diana': { id: 'student-diana', userId: 'student-diana', preferredName: 'Diana', name: 'Diana Prince' },
};

const mockUnits = {
  'unit-vocab': { id: 'unit-vocab', name: 'Vocabulary Unit 1' },
  'unit-grammar': { id: 'unit-grammar', name: 'Grammar Basics' },
};

export const Default: Story = {
  args: {
    open: true,
    onClose: fn(),
    grades: mockGrades,
    sectionStudents: mockStudents,
    units: mockUnits,
    onAssign: fn(),
  },
};

export const SingleGrade: Story = {
  args: {
    ...Default.args,
    grades: [mockGrades[0]],
  },
};

export const ManyStudents: Story = {
  args: {
    ...Default.args,
    grades: Array.from({ length: 20 }, (_, i) => ({
      id: `grade-${i}`,
      owner: `student-${i}`,
      unitID: i % 2 === 0 ? 'unit-vocab' : 'unit-grammar',
    })),
    sectionStudents: Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [
        `student-${i}`,
        { id: `student-${i}`, userId: `student-${i}`, preferredName: `Student ${i + 1}`, name: `Student ${i + 1}` },
      ]),
    ),
  },
};

export const Closed: Story = {
  args: {
    ...Default.args,
    open: false,
  },
};
