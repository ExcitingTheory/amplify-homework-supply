import React from 'react';
import './TutorialBanner.css';

function TutorialBanner() {
  return (
    <div className="tutorial-banner">
      <div className="banner-icon">📚</div>
      <div className="banner-content">
        <h3>Welcome to Homework Supply</h3>
        <p>
          This is a elearning platform. Use this Storybook to explore components, 
          learn the architecture, and test new features.
        </p>
      </div>
    </div>
  );
}

export default TutorialBanner;
