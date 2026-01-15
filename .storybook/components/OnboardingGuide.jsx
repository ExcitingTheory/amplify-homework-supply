import React, { useState, useEffect } from 'react';
import './OnboardingGuide.css';

/**
 * Task tracking for custom onboarding
 * Stores progress in localStorage and displays achievements
 */

const STORAGE_KEY = 'homework-supply-onboarding';

const TASKS = {
  pages: {
    title: 'Understanding App Pages',
    items: [
      { id: 'index-page', label: 'Explore the Units index page', required: true },
      { id: 'unit-page', label: 'Understand Unit detail page layout', required: true },
      { id: 'workbook-page', label: 'Learn the Workbook (student view)', required: true },
      { id: 'sections-page', label: 'Understand Sections/Classes page', required: false },
      { id: 'navigation', label: 'Understand page navigation patterns', required: false },
    ]
  },
  creation: {
    title: 'Creating Content Manually',
    items: [
      { id: 'create-section', label: 'Create a Section (class) manually', required: true },
      { id: 'add-students', label: 'Add students to section with join code', required: true },
      { id: 'create-unit', label: 'Create a Unit manually', required: true },
      { id: 'publish-unit', label: 'Publish a unit for student access', required: false },
      { id: 'create-assignment', label: 'Create an Assignment for a section', required: true },
      { id: 'set-due-date', label: 'Set assignment due dates', required: false },
    ]
  },
  aiCreation: {
    title: 'Creating Content with AI',
    items: [
      { id: 'chat-create-section', label: 'Use chat to generate section structure', required: false },
      { id: 'chat-create-unit', label: 'Use chat to generate unit outline', required: true },
      { id: 'chat-build-content', label: 'Have AI build unit content step-by-step', required: true },
      { id: 'chat-create-assignment', label: 'Use chat to create and configure assignment', required: false },
      { id: 'iterate-content', label: 'Iterate on AI-generated content with feedback', required: false },
    ]
  },
  editor: {
    title: 'Using the Editor',
    items: [
      { id: 'editor-basics', label: 'Understand Lexical editor structure', required: true },
      { id: 'add-content', label: 'Add text and media blocks', required: true },
      { id: 'quiz-blocks', label: 'Create Quiz blocks (multiple choice)', required: true },
      { id: 'answer-blocks', label: 'Create Answer blocks (fill-in-blank)', required: true },
      { id: 'meaning-association', label: 'Use Meaning Association blocks', required: false },
      { id: 'custom-answer', label: 'Use Custom Answer blocks', required: false },
      { id: 'markdown-shortcuts', label: 'Use markdown shortcuts (##, -, *, etc.)', required: false },
    ]
  },
  workbook: {
    title: 'Student Workbook Flow',
    items: [
      { id: 'complete-assignment', label: 'Complete an assignment as student', required: true },
      { id: 'answer-questions', label: 'Answer graded questions', required: true },
      { id: 'submit-work', label: 'Submit completed work', required: true },
      { id: 'view-grade', label: 'View grade and accuracy', required: false },
      { id: 'workbook-navigation', label: 'Navigate workbook tabs', required: false },
    ]
  },
  ai: {
    title: 'AI Chat & Content Generation',
    items: [
      { id: 'open-chat', label: 'Open AI Chat sidebar', required: true },
      { id: 'search-content', label: 'Use search_content tool', required: true },
      { id: 'generate-suggestions', label: 'Generate content suggestions', required: true },
      { id: 'understand-forms', label: 'Understand suggested content forms', required: true },
      { id: 'insert-suggestions', label: 'Insert suggestions into editor', required: true },
      { id: 'chat-context', label: 'Understand chat context (unit, files, dictionary)', required: false },
      { id: 'streaming', label: 'Understand streaming responses', required: false },
    ]
  },
  files: {
    title: 'File Manager',
    items: [
      { id: 'upload-files', label: 'Upload audio/video/image files', required: true },
      { id: 'organize-files', label: 'Organize files with tags/categories', required: false },
      { id: 'file-protection', label: 'Understand file protection levels (public/protected)', required: false },
      { id: 'use-files', label: 'Reference files in editor content', required: true },
      { id: 'transcribe-audio', label: 'Transcribe audio with Whisper', required: false },
    ]
  },
  dictionary: {
    title: 'Dictionary & Questions',
    items: [
      { id: 'add-words', label: 'Add vocabulary words to dictionary', required: true },
      { id: 'word-audio', label: 'Add audio pronunciation to words', required: false },
      { id: 'create-questions', label: 'Create practice questions', required: true },
      { id: 'question-types', label: 'Understand question types (audio/drawing/text)', required: false },
      { id: 'link-to-unit', label: 'Link words/questions to units', required: true },
    ]
  },
  documents: {
    title: 'Document Parsing',
    items: [
      { id: 'upload-pdf', label: 'Upload a PDF document', required: true },
      { id: 'analyze-doc', label: 'Run document analysis', required: true },
      { id: 'extract-vocab', label: 'Review extracted vocabulary', required: true },
      { id: 'import-vocab', label: 'Import vocabulary to dictionary', required: true },
      { id: 'cancel-analysis', label: 'Know how to cancel long-running analysis', required: false },
    ]
  },
  search: {
    title: 'Search & Discovery',
    items: [
      { id: 'search-units', label: 'Search across units', required: true },
      { id: 'search-vocab', label: 'Search vocabulary', required: false },
      { id: 'semantic-search', label: 'Understand semantic search (embeddings)', required: false },
      { id: 'filter-results', label: 'Filter and sort search results', required: false },
    ]
  },
  advanced: {
    title: 'Advanced Workflows',
    items: [
      { id: 'bulk-import', label: 'Bulk import vocabulary from CSV', required: false },
      { id: 'grading-rubric', label: 'Understand auto-grading rubric', required: false },
      { id: 'unit-templates', label: 'Create reusable unit templates', required: false },
      { id: 'student-progress', label: 'Track student progress analytics', required: false },
    ]
  }
};

export function OnboardingGuide() {
  const [progress, setProgress] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });
  
  const [activeSection, setActiveSection] = useState('pages');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggleTask = (taskId) => {
    setProgress(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all progress?')) {
      setProgress({});
    }
  };

  const calculateStats = () => {
    let total = 0;
    let completed = 0;
    let required = 0;
    let requiredCompleted = 0;

    Object.values(TASKS).forEach(section => {
      section.items.forEach(item => {
        total++;
        if (progress[item.id]) completed++;
        if (item.required) {
          required++;
          if (progress[item.id]) requiredCompleted++;
        }
      });
    });

    return { total, completed, required, requiredCompleted };
  };

  const stats = calculateStats();
  const overallProgress = (stats.completed / stats.total) * 100;
  const requiredProgress = stats.required > 0 ? (stats.requiredCompleted / stats.required) * 100 : 100;

  const getAchievements = () => {
    const achievements = [];
    
    if (stats.completed >= 1) achievements.push('🌱 First Steps');
    if (stats.completed >= 5) achievements.push('� Content Creator');
    if (stats.completed >= 10) achievements.push('🎓 Educator');
    if (stats.completed >= 15) achievements.push('⚡ Power User');
    if (stats.completed >= 20) achievements.push('🤖 AI Expert');
    if (stats.requiredCompleted === stats.required) achievements.push('✅ Core Complete');
    if (stats.completed === stats.total) achievements.push('🏆 Master Teacher');
    
    return achievements;
  };

  return (
    <div className="onboarding-guide">
      <div className="onboarding-header">
        <h2>Homework Supply Onboarding</h2>
        <p>Complete these tasks to get familiar with the codebase</p>
      </div>

      <div className="progress-overview">
        <div className="progress-bar-container">
          <div className="progress-label">
            Overall Progress: {stats.completed}/{stats.total}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {stats.required > 0 && (
          <div className="progress-bar-container">
            <div className="progress-label">
              Required Tasks: {stats.requiredCompleted}/{stats.required}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill required" 
                style={{ width: `${requiredProgress}%` }}
              />
            </div>
          </div>
        )}

        {getAchievements().length > 0 && (
          <div className="achievements">
            <strong>Achievements:</strong> {getAchievements().join(' ')}
          </div>
        )}
      </div>

      <div className="task-sections">
        {Object.entries(TASKS).map(([sectionId, section]) => {
          const sectionProgress = section.items.filter(item => progress[item.id]).length;
          const sectionTotal = section.items.length;
          const sectionPercent = (sectionProgress / sectionTotal) * 100;
          const isActive = activeSection === sectionId;

          return (
            <div key={sectionId} className={`task-section ${isActive ? 'active' : ''}`}>
              <div 
                className="section-header"
                onClick={() => setActiveSection(isActive ? null : sectionId)}
              >
                <h3>{section.title}</h3>
                <div className="section-progress">
                  <span>{sectionProgress}/{sectionTotal}</span>
                  <div className="mini-progress-bar">
                    <div 
                      className="mini-progress-fill"
                      style={{ width: `${sectionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="task-list">
                  {section.items.map(item => (
                    <div 
                      key={item.id}
                      className={`task-item ${progress[item.id] ? 'completed' : ''}`}
                      onClick={() => toggleTask(item.id)}
                    >
                      <div className="task-checkbox">
                        {progress[item.id] ? '✓' : ''}
                      </div>
                      <div className="task-label">
                        {item.label}
                        {item.required && <span className="required-badge">Required</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="onboarding-actions">
        <button onClick={resetProgress} className="reset-button">
          Reset Progress
        </button>
      </div>
    </div>
  );
}

export default OnboardingGuide;
