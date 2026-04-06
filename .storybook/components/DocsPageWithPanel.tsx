/**
 * Custom Docs Page Template with Addon Panel-like Controls
 * 
 * This provides a docs page that includes controls similar to what you'd see
 * in the addon panel, embedded directly in the documentation.
 */
import React from 'react';
import {
  Title,
  Subtitle,
  Description,
  Primary,
  Controls,
  Stories,
  useOf,
} from '@storybook/addon-docs/blocks';

/**
 * Custom docs page template that mimics having an addon panel
 * by including Controls and other interactive elements prominently.
 */
export const DocsPageWithPanel: React.FC = () => {
  return (
    <div className="docs-page-with-panel">
      {/* Header Section */}
      <div className="docs-header">
        <Title />
        <Subtitle />
        <Description />
      </div>

      {/* Primary Story with prominent display */}
      <div className="docs-primary-section">
        <h2>Preview</h2>
        <Primary />
      </div>

      {/* Controls Panel - This replaces the addon panel functionality */}
      <div className="docs-controls-panel">
        <h2>Controls</h2>
        <p className="docs-panel-description">
          Adjust the props below to see how the component responds. 
          These controls work the same as the addon panel in canvas mode.
        </p>
        <Controls />
      </div>

      {/* All Stories Section */}
      <div className="docs-stories-section">
        <h2>All Stories</h2>
        <Stories includePrimary={false} />
      </div>

      {/* Styles for the custom layout */}
      <style>{`
        .docs-page-with-panel {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .docs-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--docs-border, #e6e6e6);
          padding-bottom: 1rem;
        }
        
        .docs-primary-section {
          margin-bottom: 2rem;
        }
        
        .docs-primary-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--docs-heading, #333);
        }
        
        .docs-controls-panel {
          background: var(--docs-panel-bg, #f8f9fa);
          border: 1px solid var(--docs-border, #e6e6e6);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .docs-controls-panel h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--docs-heading, #333);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .docs-controls-panel h2::before {
          content: '🎛️';
        }
        
        .docs-panel-description {
          font-size: 0.875rem;
          color: var(--docs-muted, #666);
          margin-bottom: 1rem;
        }
        
        .docs-stories-section {
          margin-top: 2rem;
        }
        
        .docs-stories-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--docs-heading, #333);
        }
        
        @media (prefers-color-scheme: dark) {
          :root {
            --docs-border: #444;
            --docs-heading: #e0e0e0;
            --docs-panel-bg: #1e1e1e;
            --docs-muted: #999;
          }
        }
      `}</style>
    </div>
  );
};

export default DocsPageWithPanel;
