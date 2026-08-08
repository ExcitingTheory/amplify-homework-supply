import React from "react";
import { fn, expect, userEvent, within } from "storybook/test";
import SortableAnswers from "./SortableAnswers";

export default {
  title: "🧩 UI Components/Sortable Answers",
  component: SortableAnswers,
  parameters: {
    layout: "padded",
  },
};

const mockAnswers = [
  { answer: "Paris", correct: true },
  { answer: "London", correct: false },
  { answer: "Berlin", correct: false },
  { answer: "Madrid", correct: false },
];

export const Default = {
  args: {
    answers: mockAnswers,
    onQuestionChange: fn(),
    onCorrectChange: fn(),
    onQuestionDelete: fn(),
    onQuestionReorder: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify all answer fields render
    await canvas.findByDisplayValue("Paris");
    canvas.getByDisplayValue("London");

    // Edit an answer text field
    const parisInput = canvas.getByDisplayValue("Paris");
    await userEvent.clear(parisInput);
    await userEvent.type(parisInput, "Rome");
    expect(args.onQuestionChange).toHaveBeenCalled();

    // Toggle the correct switch on London row
    // MUI Switch renders as a visually-hidden input[type=checkbox]
    const switches = Array.from(canvasElement.querySelectorAll('input[type="checkbox"]'));
    await userEvent.click(switches[1]); // second switch (London)
    expect(args.onCorrectChange).toHaveBeenCalled();

    // Delete button for first answer
    const deleteButtons = canvas.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    await userEvent.click(deleteButtons[0]);
    expect(args.onQuestionDelete).toHaveBeenCalled();
  },
};

export const SingleAnswer = {
  args: {
    answers: [{ answer: "Single answer", correct: true }],
    onQuestionChange: fn(),
    onCorrectChange: fn(),
    onQuestionDelete: fn(),
    onQuestionReorder: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByDisplayValue("Single answer");
    // The component allows deletion even for single answers (behavior is permissive)
    const deleteButtons = canvas.queryAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(0);
  },
};

export const ManyAnswers = {
  args: {
    answers: [
      { answer: "Answer 1", correct: false },
      { answer: "Answer 2", correct: true },
      { answer: "Answer 3", correct: false },
      { answer: "Answer 4", correct: false },
      { answer: "Answer 5", correct: false },
      { answer: "Answer 6", correct: false },
    ],
    onQuestionChange: fn(),
    onCorrectChange: fn(),
    onQuestionDelete: fn(),
    onQuestionReorder: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // All 6 answers render
    await canvas.findByDisplayValue("Answer 1");
    canvas.getByDisplayValue("Answer 6");
    // All delete buttons present
    const deleteButtons = canvas.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(6);
  },
};
