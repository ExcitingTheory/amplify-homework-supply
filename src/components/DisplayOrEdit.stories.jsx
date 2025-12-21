import React from 'react';
import { DisplayOrEditAnswer } from './DisplayOrEditAnswer';
import { DisplayOrEditPrompt } from './DisplayOrEditPrompt';
import { DisplayOrEditHint } from './DisplayOrEditHint';
import { DisplayOrEditDefinition } from './DisplayOrEditDefinition';
import { DisplayOrEditPhraseAndPronunciation } from './DisplayOrEditPhraseAndPronunciation';

export default {
  title: 'Components/DisplayOrEdit',
  parameters: {
    layout: 'padded',
  },
};

// DisplayOrEditAnswer Stories
export const AnswerDisplay = {
  render: () => (
    <DisplayOrEditAnswer
      answer="This is a sample answer to display"
      isEditing={false}
      onChange={() => {}}
    />
  ),
};

export const AnswerEdit = {
  render: () => {
    const [answer, setAnswer] = React.useState("Edit this answer");
    return (
      <DisplayOrEditAnswer
        answer={answer}
        isEditing={true}
        onChange={(e) => setAnswer(e.target.value)}
      />
    );
  },
};

// DisplayOrEditPrompt Stories
export const PromptDisplay = {
  render: () => (
    <DisplayOrEditPrompt
      prompt="What is the capital of France?"
      isEditing={false}
      onChange={() => {}}
    />
  ),
};

export const PromptEdit = {
  render: () => {
    const [prompt, setPrompt] = React.useState("Edit this prompt");
    return (
      <DisplayOrEditPrompt
        prompt={prompt}
        isEditing={true}
        onChange={(e) => setPrompt(e.target.value)}
      />
    );
  },
};

// DisplayOrEditHint Stories
export const HintDisplay = {
  render: () => (
    <DisplayOrEditHint
      hint="Think about European capitals"
      isEditing={false}
      onChange={() => {}}
    />
  ),
};

export const HintEdit = {
  render: () => {
    const [hint, setHint] = React.useState("Edit this hint");
    return (
      <DisplayOrEditHint
        hint={hint}
        isEditing={true}
        onChange={(e) => setHint(e.target.value)}
      />
    );
  },
};

// DisplayOrEditDefinition Stories
export const DefinitionDisplay = {
  render: () => (
    <DisplayOrEditDefinition
      definition="A large city that serves as the seat of government"
      isEditing={false}
      onChange={() => {}}
    />
  ),
};

export const DefinitionEdit = {
  render: () => {
    const [definition, setDefinition] = React.useState("Edit this definition");
    return (
      <DisplayOrEditDefinition
        definition={definition}
        isEditing={true}
        onChange={(e) => setDefinition(e.target.value)}
      />
    );
  },
};

// DisplayOrEditPhraseAndPronunciation Stories
export const PhraseDisplay = {
  render: () => (
    <DisplayOrEditPhraseAndPronunciation
      phrase="Bonjour"
      pronunciation="bon-ZHOOR"
      isEditing={false}
      onPhraseChange={() => {}}
      onPronunciationChange={() => {}}
    />
  ),
};

export const PhraseEdit = {
  render: () => {
    const [phrase, setPhrase] = React.useState("Bonjour");
    const [pronunciation, setPronunciation] = React.useState("bon-ZHOOR");
    return (
      <DisplayOrEditPhraseAndPronunciation
        phrase={phrase}
        pronunciation={pronunciation}
        isEditing={true}
        onPhraseChange={(e) => setPhrase(e.target.value)}
        onPronunciationChange={(e) => setPronunciation(e.target.value)}
      />
    );
  },
};
