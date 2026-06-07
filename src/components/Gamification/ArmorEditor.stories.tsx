import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ArmorEditor } from './ArmorEditor'

const meta: Meta<typeof ArmorEditor> = {
  title: '🏆 Gamification/Avatars & Cosmetics/Armor Editor',
  component: ArmorEditor,
}

export default meta
type Story = StoryObj<typeof ArmorEditor>

export const Default: Story = {
  args: {
    open: true,
    squadName: 'Phoenix Squad',
    squadDescription: 'Rising from the ashes',
    onSave: (config, svg, name, description) => {
      console.log('Saved config:', config)
      console.log('SVG:', svg)
      console.log('Name:', name, 'Description:', description)
    },
    onClose: () => console.log('Closed'),
  },
}

export const WithInitialConfig: Story = {
  args: {
    open: true,
    squadName: 'Dragon Knights',
    squadDescription: 'Fire and honor',
    initialConfig: {
      shape: 'pointed',
      fieldColor: '#c62828',
      fieldColor2: '#f9a825',
      division: 'halved',
      chargeId: 'mullet',
      chargeColor: '#f9a825',
      chargePosition: 'center',
    },
    onSave: (config, svg, name, description) => console.log('Saved:', config, name, description),
    onClose: () => console.log('Closed'),
  },
}

export const QuarteredShield: Story = {
  args: {
    open: true,
    squadName: 'The Scholars',
    initialConfig: {
      shape: 'classic',
      fieldColor: '#1565c0',
      fieldColor2: '#bdbdbd',
      division: 'quartered',
      chargeId: 'fleurDeLis',
      chargeColor: '#f9a825',
      chargePosition: 'center',
      chargeScale: 1.5,
    },
    onSave: (config, svg, name, description) => console.log('Saved:', config, name, description),
    onClose: () => console.log('Closed'),
  },
}

export const ChevronBand: Story = {
  args: {
    open: true,
    squadName: 'Mountain Guard',
    squadDescription: 'Guardians of the summit',
    initialConfig: {
      shape: 'classic',
      fieldColor: '#2e7d32',
      fieldColor2: '#f9a825',
      division: 'chevron',
      chargeId: 'sun',
      chargeColor: '#f9a825',
      chargePosition: 'top',
      chargeScale: 0.75,
    },
    onSave: (config, svg, name, description) => console.log('Saved:', config, name, description),
    onClose: () => console.log('Closed'),
  },
}

export const SaltireCross: Story = {
  args: {
    open: true,
    squadName: 'Star Raiders',
    initialConfig: {
      shape: 'rounded',
      fieldColor: '#1565c0',
      fieldColor2: '#f5f5f5',
      division: 'saltire',
      chargeId: 'crossMaltese',
      chargeColor: '#f9a825',
      chargePosition: 'center',
    },
    onSave: (config, svg) => console.log('Saved:', config),
    onClose: () => console.log('Closed'),
  },
}

export const BendWithBorder: Story = {
  args: {
    open: true,
    squadName: 'Night Watch',
    initialConfig: {
      shape: 'diamond',
      fieldColor: '#212121',
      fieldColor2: '#c62828',
      division: 'bend',
      chargeId: 'crossLatin',
      chargeColor: '#bdbdbd',
      chargePosition: 'center',
    },
    onSave: (config, svg) => console.log('Saved:', config),
    onClose: () => console.log('Closed'),
  },
}

export const ChiefBand: Story = {
  args: {
    open: true,
    squadName: 'Royal Lions',
    initialConfig: {
      shape: 'classic',
      fieldColor: '#c62828',
      fieldColor2: '#f9a825',
      division: 'chief',
      chargeId: 'heart',
      chargeColor: '#1565c0',
      chargePosition: 'bottom',
    },
    onSave: (config, svg) => console.log('Saved:', config),
    onClose: () => console.log('Closed'),
  },
}

export const LargeCharge: Story = {
  args: {
    open: true,
    squadName: 'Iron Wreath',
    initialConfig: {
      shape: 'classic',
      fieldColor: '#212121',
      fieldColor2: '#f9a825',
      division: 'none',
      chargeId: 'laurelWreath',
      chargeColor: '#f9a825',
      chargePosition: 'center',
      chargeScale: 2,
    },
    onSave: (config, svg) => console.log('Saved:', config),
    onClose: () => console.log('Closed'),
  },
}

export const MultipleCharges: Story = {
  args: {
    open: true,
    squadName: 'Triple Crown',
    initialConfig: {
      shape: 'classic',
      fieldColor: '#1565c0',
      fieldColor2: '#f9a825',
      division: 'quartered',
      chargeId: 'fleurDeLis',
      chargeColor: '#f9a825',
      chargePosition: 'top',
      charges: [
        { chargeId: 'fleurDeLis', chargeColor: '#f9a825', chargePosition: 'top', chargeScale: 0.75, offsetX: 0, offsetY: 0, rotation: 0 },
        { chargeId: 'mullet', chargeColor: '#f5f5f5', chargePosition: 'left', chargeScale: 1, offsetX: -3, offsetY: 5, rotation: 45 },
        { chargeId: 'mullet', chargeColor: '#f5f5f5', chargePosition: 'right', chargeScale: 1, offsetX: 3, offsetY: 5, rotation: 315 },
        { chargeId: 'heart', chargeColor: '#c62828', chargePosition: 'bottom', chargeScale: 0.75, offsetX: 0, offsetY: 0, rotation: 180 },
      ],
    },
    onSave: (config, svg) => console.log('Saved:', config),
    onClose: () => console.log('Closed'),
  },
}
