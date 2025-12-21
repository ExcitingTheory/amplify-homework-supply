import React from 'react';
import { VideoPlayer } from './VideoPlayer';

export default {
  title: 'Components/VideoPlayer',
  component: VideoPlayer,
  parameters: {
    layout: 'centered',
  },
};

export const DefaultVideoPlayer = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    width: 640,
    height: 360,
  },
};

export const CustomDimensions = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    width: 800,
    height: 450,
  },
};

export const SmallPlayer = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    width: 320,
    height: 180,
  },
};
