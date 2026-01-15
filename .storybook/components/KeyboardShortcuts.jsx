import React from 'react';
import './KeyboardShortcuts.css';

const shortcuts = [
  { command: 'Go full screen', shortcut: '⌥ F' },
  { command: 'Toggle addons', shortcut: '⌥ A' },
  { command: 'Toggle addons orientation', shortcut: '⌥ D' },
  { command: 'Toggle sidebar', shortcut: '⌥ S' },
  { command: 'Toggle toolbar', shortcut: '⌥ T' },
  { command: 'Focus search', shortcut: '⌘ K' },
  { command: 'Focus sidebar', shortcut: '1' },
  { command: 'Focus canvas', shortcut: '2' },
  { command: 'Focus addons', shortcut: '3' },
  { command: 'Previous component', shortcut: '⌥ ↑' },
  { command: 'Next component', shortcut: '⌥ ↓' },
  { command: 'Previous story', shortcut: '⌥ ←' },
  { command: 'Next story', shortcut: '⌥ →' },
  { command: 'Go to shortcuts page', shortcut: '⌘ ⇧ ,' },
  { command: 'Go to about page', shortcut: '⌘ ,' },
  { command: 'Collapse all items on sidebar', shortcut: '⌘ ⇧ ↑' },
  { command: 'Expand all items on sidebar', shortcut: '⌘ ⇧ ↓' },
  { command: 'Reload story', shortcut: '⌥ R' },
  { command: 'Toggle Outline', shortcut: '⌥ O' },
];

export function KeyboardShortcuts() {
  return (
    <div className="keyboard-shortcuts">
      <h1>Keyboard shortcuts</h1>
      <p>Storybook has many keyboard shortcuts to help you work faster.</p>
      
      <div className="shortcuts-table">
        <div className="shortcuts-header">
          <div>Commands</div>
          <div>Shortcut</div>
        </div>
        {shortcuts.map((item, index) => (
          <div key={index} className="shortcut-row">
            <div className="command">{item.command}</div>
            <div className="shortcut">
              {item.shortcut.split(' ').map((key, i) => (
                <kbd key={i}>{key}</kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KeyboardShortcuts;
