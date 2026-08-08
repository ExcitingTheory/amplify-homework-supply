import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import JoinPracticeDialog from './JoinPracticeDialog';

const meta: Meta<typeof JoinPracticeDialog> = {
  title: '🎯 Practice Drills/Components/Join Practice Dialog',
  component: JoinPracticeDialog,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof JoinPracticeDialog>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    onJoin: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const doc = canvasElement.ownerDocument
    const body = within(doc.body)

    // Dialog renders
    await body.findByText('Join Study Session')
    await body.findByText('Enter Code')

    // Type a room code
    const codeInput = doc.querySelector('input[type="text"], input:not([type])') as HTMLInputElement
    if (codeInput) {
      await userEvent.click(codeInput)
      await userEvent.type(codeInput, 'ROOM-1234')
    }

    // Join button present and clickable
    const btns = Array.from(doc.querySelectorAll('button'))
    const joinBtn = btns.find(b => b.textContent?.includes('Join'))
    expect(joinBtn).toBeTruthy()
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
    onJoin: fn(),
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    // Dialog not visible
    expect(body.queryByText('Join Study Session')).toBeNull()
  },
};
