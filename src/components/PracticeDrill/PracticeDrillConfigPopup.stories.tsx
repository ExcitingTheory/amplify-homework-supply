/**
 * @fileoverview Stories for PracticeDrillConfigPopup — source selection
 * and configuration popup shown before starting a practice drill.
 */

import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import PracticeDrillConfigPopup from './PracticeDrillConfigPopup'
import type { PracticeDrillConfigPopupProps } from './PracticeDrillConfigPopup'

const meta: Meta<typeof PracticeDrillConfigPopup> = {
  title: '🎯 Practice Drills/Config Popup',
  component: PracticeDrillConfigPopup,
  parameters: {
    layout: 'centered',
  },
  args: {
    onStart: fn(),
    onClose: fn(),
  },
}

export default meta
type Story = StoryObj<typeof PracticeDrillConfigPopup>

export const Default: Story = {
  args: {
    open: true,
    unitName: 'Biology: Cell Structure',
    vocabularyCount: 30,
    questionCount: 12,
    textBlockCount: 5,
    documentCount: 3,
  },
  play: async ({ canvasElement, args }) => {
    // Dialog content may render in document.body portal
    const body = within(document.body)

    // Verify title renders (confirms dialog is in body)
    const titleEl = await body.findByText(/Biology: Cell Structure/)

    // Use raw DOM to find buttons (dialog role may differ between MUI versions)
    const doc = canvasElement.ownerDocument
    const btns = Array.from(doc.querySelectorAll('button'))
    expect(btns.length).toBeGreaterThan(0)
    const startBtn = btns[btns.length - 1] // last button is "Start Practice"
    await userEvent.click(startBtn)
    expect(args.onStart).toHaveBeenCalled()
  },
}

export const WithCoverage: Story = {
  args: {
    open: true,
    unitName: 'French Seasons & Weather',
    vocabularyCount: 25,
    questionCount: 8,
    textBlockCount: 4,
    documentCount: 2,
    coverageSnapshot: {
      vocabulary: { total: 25, covered: 18 },
      questions: { total: 8, covered: 5 },
      text: { total: 4, covered: 4 },
      documents: { total: 2, covered: 1 },
    },
  },
}

export const FullCoverage: Story = {
  args: {
    open: true,
    unitName: 'Spanish AR Verbs',
    vocabularyCount: 15,
    questionCount: 6,
    textBlockCount: 3,
    documentCount: 0,
    coverageSnapshot: {
      vocabulary: { total: 15, covered: 15 },
      questions: { total: 6, covered: 6 },
      text: { total: 3, covered: 3 },
      documents: { total: 0, covered: 0 },
    },
  },
}

export const VocabularyOnly: Story = {
  args: {
    open: true,
    unitName: 'Japanese Grammar Guide',
    vocabularyCount: 40,
    questionCount: 0,
    textBlockCount: 0,
    documentCount: 0,
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body)
    await body.findByText(/Japanese Grammar Guide/)

    // Vocabulary source row should be present
    await body.findByText(/Vocabulary/)

    // Use raw DOM to find buttons and click Start Practice (last button)
    const doc = canvasElement.ownerDocument
    const btns = Array.from(doc.querySelectorAll('button'))
    const startBtn = btns[btns.length - 1]
    expect(startBtn).not.toBeDisabled()
    await userEvent.click(startBtn)
    expect(args.onStart).toHaveBeenCalled()
  },
}

export const NoContent: Story = {
  args: {
    open: true,
    unitName: 'Empty Unit',
    vocabularyCount: 0,
    questionCount: 0,
    textBlockCount: 0,
    documentCount: 0,
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body)
    await body.findByText(/Empty Unit/)

    // Start button disabled with no content
    const doc = canvasElement.ownerDocument
    const btns = Array.from(doc.querySelectorAll('button'))
    const startBtn = btns[btns.length - 1]
    expect(startBtn).toBeDisabled()
  },
}

export const Loading: Story = {
  args: {
    open: true,
    unitName: 'Biology: Cell Structure',
    vocabularyCount: 30,
    questionCount: 12,
    textBlockCount: 5,
    documentCount: 3,
    loading: true,
  },
}

export const PreConfiguredFromChat: Story = {
  args: {
    open: true,
    unitName: 'Water Cycle',
    vocabularyCount: 20,
    questionCount: 10,
    textBlockCount: 6,
    documentCount: 2,
    initialSources: {
      vocabulary: true,
      questions: false,
      text: false,
      documents: false,
    },
    initialDrillType: 'vocabulary',
  },
}
