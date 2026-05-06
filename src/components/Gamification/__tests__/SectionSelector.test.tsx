import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SectionSelector, SectionOption } from '../SectionSelector'

const mockSections: SectionOption[] = [
  { id: 'sec-1', name: 'Period 1 - Biology', description: 'Morning class', studentCount: 25 },
  { id: 'sec-2', name: 'Period 3 - Chemistry', description: 'After lunch', studentCount: 30 },
  { id: 'sec-3', name: 'Period 5 - Physics', studentCount: 18 },
]

describe('SectionSelector', () => {
  it('renders without crashing', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        onSectionChange={onSectionChange}
      />
    )
    expect(screen.getByLabelText(/Section/i)).toBeInTheDocument()
  })

  it('shows placeholder when no section selected', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId={null}
        onSectionChange={onSectionChange}
      />
    )
    expect(screen.getByPlaceholderText(/Select a section/i)).toBeInTheDocument()
  })

  it('shows hint text when no section selected and sections available', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId={null}
        onSectionChange={onSectionChange}
      />
    )
    expect(screen.getByText(/Select a section to scope/i)).toBeInTheDocument()
  })

  it('does not show hint when a section is selected', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId="sec-1"
        onSectionChange={onSectionChange}
      />
    )
    expect(screen.queryByText(/Select a section to scope/i)).not.toBeInTheDocument()
  })

  it('displays selected section name in the input', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId="sec-1"
        onSectionChange={onSectionChange}
      />
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('Period 1 - Biology')
  })

  it('calls onSectionChange with section ID when selecting', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId={null}
        onSectionChange={onSectionChange}
      />
    )

    const input = screen.getByRole('combobox')
    await user.click(input)
    
    // Type to filter
    await user.type(input, 'Chemistry')
    
    // Click the option
    const option = await screen.findByText('Period 3 - Chemistry')
    await user.click(option)

    expect(onSectionChange).toHaveBeenCalledWith('sec-2')
  })

  it('calls onSectionChange with null when clearing', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId="sec-1"
        onSectionChange={onSectionChange}
      />
    )

    // MUI Autocomplete clear button
    const clearButton = screen.getByTitle('Clear')
    await user.click(clearButton)

    expect(onSectionChange).toHaveBeenCalledWith(null)
  })

  it('shows "No sections available" when sections array is empty', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={[]}
        onSectionChange={onSectionChange}
      />
    )

    const input = screen.getByRole('combobox')
    await user.click(input)

    expect(await screen.findByText('No sections available')).toBeInTheDocument()
  })

  it('does not show hint text when sections is empty', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={[]}
        selectedSectionId={null}
        onSectionChange={onSectionChange}
      />
    )
    expect(screen.queryByText(/Select a section to scope/i)).not.toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId={null}
        onSectionChange={onSectionChange}
        disabled
      />
    )
    const input = screen.getByRole('combobox')
    expect(input).toBeDisabled()
  })

  it('shows student count chips in options', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        onSectionChange={onSectionChange}
      />
    )

    const input = screen.getByRole('combobox')
    await user.click(input)

    expect(await screen.findByText('25 students')).toBeInTheDocument()
    expect(await screen.findByText('30 students')).toBeInTheDocument()
  })

  it('shows description in options when provided', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    render(
      <SectionSelector
        sections={mockSections}
        onSectionChange={onSectionChange}
      />
    )

    const input = screen.getByRole('combobox')
    await user.click(input)

    expect(await screen.findByText('Morning class')).toBeInTheDocument()
    expect(await screen.findByText('After lunch')).toBeInTheDocument()
  })
})
