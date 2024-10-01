/**
 * Copyright (c) Facebook, Inc. and its affiliates. All rights reserved.
 *
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {convertFromRaw} from 'draft-js';

var rawContent = {
  blocks: [
    {
      text: 'This is a Draft-based editor that supports TeX rendering.',
      type: 'unstyled',
    },
    {
      text: '',
      type: 'unstyled',
    },
    {
      text: (
        'Each TeX block below is represented as a DraftEntity object and ' +
        'rendered using Khan Academy\'s KaTeX library.'
      ),
      type: 'unstyled',
    },
    {
      text: '',
      type: 'unstyled',
    },
    {
      text: 'Click any TeX block to edit.',
      type: 'unstyled',
    },
    {
      text: ' ',
      type: 'atomic',
      entityRanges: [{offset: 0, length: 1, key: 'first'}],
    },
    {
      text: 'You can also insert a new TeX block at the cursor location.',
      type: 'unstyled',
    },
  ],

  entityMap: {
    first: {
      type: 'TOKEN',
      mutability: 'IMMUTABLE',
      data: {
        content: [
          {id: "id-1", answer: "This is the text", correct: true},
          {id: "id-2", answer: "Some text"},
          {id: "id-3", answer: "Some text"}
        ],
      },
    },
  },
};

export var content = convertFromRaw(rawContent);
