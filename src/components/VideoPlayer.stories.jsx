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
    src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    width: 640,
    height: 360,
  },
};

export const CustomDimensions = {
  args: {
    src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    width: 800,
    height: 450,
  },
};

export const SmallPlayer = {
  args: {
    src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    width: 320,
    height: 180,
  },
};
