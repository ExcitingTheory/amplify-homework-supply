import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import { fn } from 'storybook/test'
import { SectionSelector } from './SectionSelector'

const mockSections = [
  { id: 'sec-1', name: 'Period 1 - Biology', description: 'MWF 8:00am', studentCount: 25 },
  { id: 'sec-2', name: 'Period 3 - Chemistry', description: 'TTh 10:30am', studentCount: 30 },
  { id: 'sec-3', name: 'Period 5 - Physics', description: 'MWF 1:00pm', studentCount: 18 },
  { id: 'sec-4', name: 'AP Computer Science', studentCount: 12 },
]

const meta: Meta<typeof SectionSelector> = {
  title: '🏆 Gamification/Instructor/Section Selector',
  component: SectionSelector,
  args: {
    onSectionChange: fn(),
  },
}
export default meta

type Story = StoryObj<typeof SectionSelector>

/** Default state — no section selected */
export const Default: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: null,
  },
}

/** A section is pre-selected */
export const WithSelection: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: 'sec-2',
  },
}

/** No sections available (new instructor) */
export const Empty: Story = {
  args: {
    sections: [],
    selectedSectionId: null,
  },
}

/** Single section available */
export const SingleSection: Story = {
  args: {
    sections: [mockSections[0]],
    selectedSectionId: null,
  },
}

/** Many sections (scrollable dropdown) */
export const ManySections: Story = {
  args: {
    sections: Array.from({ length: 15 }, (_, i) => ({
      id: `sec-${i + 1}`,
      name: `Section ${i + 1} - ${['Biology', 'Chemistry', 'Physics', 'Math', 'English'][i % 5]}`,
      description: `Period ${i + 1}`,
      studentCount: 15 + Math.floor(Math.random() * 20),
    })),
    selectedSectionId: null,
  },
}

/** Loading state */
export const Loading: Story = {
  args: {
    sections: [],
    selectedSectionId: null,
    loading: true,
  },
}

/** Disabled state */
export const Disabled: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: 'sec-1',
    disabled: true,
  },
}

/** Interaction: select a section from the dropdown */
export const SelectSection: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    // Verify hint text is shown
    await expect(canvas.getByText(/Select a section to scope/i)).toBeInTheDocument()

    // Open the dropdown
    const input = canvas.getByRole('combobox')
    await userEvent.click(input)

    // Type to filter
    await userEvent.type(input, 'Chemistry')

    // Select the option (portaled to document body by MUI Autocomplete)
    const option = await body.findByText('Period 3 - Chemistry')
    await userEvent.click(option)

    // Verify callback was called
    await expect(args.onSectionChange).toHaveBeenCalledWith('sec-2')
  },
}

/** Interaction: clear the selection */
export const ClearSelection: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: 'sec-1',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify the selected value
    const input = canvas.getByRole('combobox')
    await expect(input).toHaveValue('Period 1 - Biology')

    // Clear the selection
    const clearButton = canvas.getByTitle('Clear')
    await userEvent.click(clearButton)

    // Verify callback was called with null
    await expect(args.onSectionChange).toHaveBeenCalledWith(null)
  },
}
