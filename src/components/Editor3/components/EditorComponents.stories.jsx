import React from 'react';
import { QuizComponent } from './QuizComponent';
import { AnswerComponent } from './AnswerComponent';
import { ImageComponent } from './ImageComponent';
import { MediaPlayerComponent } from './MediaPlayerComponent';

export default {
  title: 'Editor/Components',
  parameters: {
    layout: 'padded',
  },
};

// Quiz Component Stories
export const QuizDefault = {
  render: () => (
    <QuizComponent
      nodeKey="quiz-1"
      prompt="What is 2 + 2?"
      answer="4"
      hint="Think about basic addition"
      multipleChoice={false}
    />
  ),
};

export const QuizMultipleChoice = {
  render: () => (
    <QuizComponent
      nodeKey="quiz-2"
      prompt="Which planet is closest to the Sun?"
      answer="Mercury"
      hint="It's the smallest planet"
      multipleChoice={true}
      options={['Mercury', 'Venus', 'Earth', 'Mars']}
    />
  ),
};

// Answer Component Stories
export const AnswerInput = {
  render: () => (
    <AnswerComponent
      nodeKey="answer-1"
      prompt="Enter your response:"
      answer=""
      placeholder="Type your answer here..."
    />
  ),
};

export const AnswerWithValue = {
  render: () => (
    <AnswerComponent
      nodeKey="answer-2"
      prompt="What is the capital of Japan?"
      answer="Tokyo"
      placeholder="Type your answer here..."
    />
  ),
};

// Image Component Stories
export const ImageDefault = {
  render: () => (
    <ImageComponent
      src="https://via.placeholder.com/400x300"
      altText="Placeholder image"
      width={400}
      height={300}
    />
  ),
};

export const ImageWithCaption = {
  render: () => (
    <div>
      <ImageComponent
        src="https://via.placeholder.com/600x400"
        altText="Sample landscape"
        width={600}
        height={400}
      />
      <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#666' }}>
        A beautiful landscape
      </p>
    </div>
  ),
};

export const ImageSmall = {
  render: () => (
    <ImageComponent
      src="https://via.placeholder.com/200x200"
      altText="Small placeholder"
      width={200}
      height={200}
    />
  ),
};

// Media Player Component Stories
export const AudioPlayer = {
  render: () => (
    <MediaPlayerComponent
      src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      type="audio"
    />
  ),
};

export const VideoPlayerComponent = {
  render: () => (
    <MediaPlayerComponent
      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      type="video"
      width={640}
      height={360}
    />
  ),
};
