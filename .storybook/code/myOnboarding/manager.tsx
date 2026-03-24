import React from 'react';
import { createRoot } from 'react-dom/client';
import { addons, types } from 'storybook/manager-api';
import OnboardingPanel from '../../components/OnboardingPanel';
import { getOnboardingEmitter, UserPersona } from '../onboarding-events';
import { ONBOARDING_TASKS, getTasksForPersona } from '../onboarding-tasks';

const ADDON_ID = 'storybook/addon-onboarding-custom';
const PANEL_ID = `${ADDON_ID}/panel`;

// Keyframe animations for gradient border effect
const keyframesStyle = `
  @keyframes onboarding-gradient-border {
    0%, 100% { 
      background-position: 0% 50%;
    }
    50% { 
      background-position: 100% 50%;
    }
  }
  @keyframes onboarding-fade {
    0%, 100% { 
      opacity: 1;
    }
    50% { 
      opacity: 0;
    }
  }
`;

// Outer container - no animations, just positioning
const cardContainerStyle: React.CSSProperties = {
  position: 'relative',
  borderRadius: '4px',
  marginBottom: '8px',
  overflow: 'hidden',
};

// Gradient background layer - simulates :before pseudo-element
const gradientLayerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  borderRadius: '4px',
  border: '1px solid transparent',
  background: `
    linear-gradient(#1a1a1a, #1a1a1a) padding-box,
    linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa) border-box
  `,
  backgroundSize: 'auto, 200% 100%',
  animation: 'onboarding-gradient-border 10s ease-in-out infinite, onboarding-fade 60s ease-in-out infinite',
  zIndex: 0,
  pointerEvents: 'none',
};

// Content wrapper - sits above gradient
const contentWrapperStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
};

// Enhanced sidebar widget without MUI dependencies
const SimpleSummaryWidget: React.FC<{ api: any }> = ({ api }) => {
  const emitter = getOnboardingEmitter();
  const [persona, setPersona] = React.useState<UserPersona | null>(emitter.getPersona());
  const [percentage, setPercentage] = React.useState(() => {
    if (persona) {
      return emitter.getCompletionPercentage(persona, ONBOARDING_TASKS);
    }
    return 0;
  });
  const [completedCount, setCompletedCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [nextTasks, setNextTasks] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (persona) {
      const tasks = getTasksForPersona(persona);
      const completed = emitter.getCompletedTasks(persona);
      const completedIds = new Set(completed.map(c => c.taskId));
      const incomplete = tasks.filter(t => !completedIds.has(t.id));
      
      setTotalCount(tasks.length);
      setCompletedCount(completed.length);
      setNextTasks(incomplete.slice(0, 3)); // Show next 3 tasks
    }
  }, [persona]);

  React.useEffect(() => {
    const unsubscribe = emitter.on((event) => {
      if (event.type === 'persona-selected') {
        setPersona(event.persona);
        const pct = emitter.getCompletionPercentage(event.persona, ONBOARDING_TASKS);
        setPercentage(pct);
        const tasks = getTasksForPersona(event.persona);
        const completed = emitter.getCompletedTasks(event.persona);
        const completedIds = new Set(completed.map(c => c.taskId));
        const incomplete = tasks.filter(t => !completedIds.has(t.id));
        
        setTotalCount(tasks.length);
        setCompletedCount(completed.length);
        setNextTasks(incomplete.slice(0, 3));
      } else if (event.type === 'task-completed' && persona === event.persona) {
        const pct = emitter.getCompletionPercentage(persona, ONBOARDING_TASKS);
        setPercentage(pct);
        const completed = emitter.getCompletedTasks(persona);
        setCompletedCount(completed.length);
        
        const tasks = getTasksForPersona(persona);
        const completedIds = new Set(completed.map(c => c.taskId));
        const incomplete = tasks.filter(t => !completedIds.has(t.id));
        setNextTasks(incomplete.slice(0, 3));
      }
    });
    return unsubscribe;
  }, [persona]);

  const getPersonaConfig = (p: UserPersona) => {
    const configs = {
      instructor: { label: 'Instructor', icon: '👨‍🏫', color: '#2196F3' },
      learner: { label: 'Learner', icon: '🎓', color: '#4CAF50' },
      developer: { label: 'Developer', icon: '💻', color: '#9C27B0' },
      translator: { label: 'Translator', icon: '🌐', color: '#FF9800' },
    };
    return configs[p];
  };

  const PersonaIcon: React.FC<{ type: UserPersona; color: string }> = ({ type, color }) => {
    if (type === 'instructor') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    }
    if (type === 'learner') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      );
    }
    if (type === 'developer') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      );
    }
    if (type === 'translator') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      );
    }
    return null;
  };

  if (!persona) {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div style={cardContainerStyle}>
          <div style={gradientLayerStyle} />
          <div style={contentWrapperStyle}>
            <div style={{
            padding: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid #3d3d3d'
          }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#ccc',
                marginBottom: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Onboarding
              </div>
              <div style={{ fontSize: '9px', color: '#73828c', lineHeight: 1.2 }}>
                Select your role
              </div>
            </div>
            
            <div style={{ padding: '10px' }}>
              {[
                { id: 'instructor' as UserPersona, label: 'Instructor', color: '#2196F3' },
                { id: 'learner' as UserPersona, label: 'Learner', color: '#4CAF50' },
                { id: 'developer' as UserPersona, label: 'Developer', color: '#9C27B0' },
                { id: 'translator' as UserPersona, label: 'Translator', color: '#FF9800' },
              ].map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px',
                    marginBottom: '4px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    border: '1px solid #444',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    emitter.setPersona(p.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = p.color;
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}>
                    <PersonaIcon type={p.id} color={p.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#ccc'
                    }}>
                      {p.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  const config = getPersonaConfig(persona);

  return (
    <div style={cardContainerStyle}>
      <style>{keyframesStyle}</style>
      <div style={gradientLayerStyle} />
      <div style={contentWrapperStyle}>
        <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid #3d3d3d'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <PersonaIcon type={persona} color={config.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: config.color,
            marginBottom: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {config.label}
          </div>
          <div style={{ fontSize: '9px', color: '#73828c', lineHeight: 1.2 }}>
            {completedCount}/{totalCount} completed · {Math.round(percentage)}%
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: '10px' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            height: '4px',
            backgroundColor: 'transparent',
            border: '1px solid #3d3d3d',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: percentage === 100 ? '#10b981' : config.color,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>

        {/* Next tasks to complete */}
        {nextTasks.length > 0 ? (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              fontSize: '9px', 
              color: '#73828c', 
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600
            }}>
              Next Tasks
            </div>
            {nextTasks.map((task, index) => {
              const isCompleted = emitter.isTaskCompleted(task.id, persona);
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: index < nextTasks.length - 1 ? '6px' : '0',
                    padding: '4px',
                    borderRadius: '3px',
                    opacity: isCompleted ? 0.5 : 1
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    flexShrink: 0,
                    marginTop: '-1px',
                    color: isCompleted ? '#10b981' : '#555'
                  }}>
                    {isCompleted ? '✓' : '○'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '10px',
                      color: isCompleted ? '#999' : '#ccc',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '8px',
            textAlign: 'center',
            fontSize: '10px',
            color: '#10b981',
            fontWeight: 600
          }}>
            🎉 All tasks completed!
          </div>
        )}

        {/* View details button */}
        <div 
          style={{
            padding: '6px',
            backgroundColor: 'transparent',
            borderRadius: '3px',
            fontSize: '9px',
            color: '#73828c',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid #444',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600
          }}
          onClick={() => {
            console.log('[Onboarding] View All Tasks clicked');
            
            // First open the panel (true = force open), then select our tab
            // This is the working pattern from OnboardingSummary.tsx
            api.togglePanel(true);
            api.setSelectedPanel(PANEL_ID);
            console.log('[Onboarding] Panel opened and tab selected:', PANEL_ID);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3d3d3d';
            e.currentTarget.style.borderColor = '#555';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#444';
            e.currentTarget.style.color = '#73828c';
          }}
        >
          View All Tasks →
        </div>
      </div>
      </div>
    </div>
  );
};

let root: ReturnType<typeof createRoot> | null = null;

const injectIntoSidebar = (api: any) => {
  // Find the sidebar container - try multiple selectors
  const sidebar = document.querySelector('[data-side="left"]') ||
                  document.querySelector('.sidebar-container') ||
                  document.querySelector('[role="navigation"]') || 
                  document.querySelector('#storybook-explorer-tree')?.parentElement;
  
  if (!sidebar) {
    console.warn('[Onboarding] Sidebar not found yet, will retry...');
    setTimeout(() => injectIntoSidebar(api), 500);
    return;
  }
  
  console.log('[Onboarding] Found sidebar:', sidebar.className, sidebar.id);
  const children = Array.from(sidebar.children);
  console.log('[Onboarding] Sidebar has', children.length, 'children:');
  children.forEach((child, index) => {
    const elem = child as HTMLElement;
    console.log(`  Child ${index}:`, {
      tag: elem.tagName,
      class: elem.className,
      id: elem.id,
      hasSearchInput: elem.querySelector('input[type="search"]') !== null,
      childCount: elem.children.length
    });
    
    // Log children of each child (go one level deeper)
    if (elem.children.length > 0) {
      Array.from(elem.children).forEach((grandchild, gIndex) => {
        const gElem = grandchild as HTMLElement;
        console.log(`    Grandchild ${index}-${gIndex}:`, {
          tag: gElem.tagName,
          class: gElem.className,
          id: gElem.id,
          hasSearchInput: gElem.querySelector('input[type="search"]') !== null,
        });
      });
    }
  });
  
  // Check if our container already exists
  let container = document.getElementById('storybook-addon-onboarding-custom');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'storybook-addon-onboarding-custom';
    
    // Find the div that contains both search AND tree (child 2 based on logs)
    const mainContainer = children.find(child => {
      return child.querySelector('input[type="search"]') !== null;
    }) as HTMLElement;
    
    if (mainContainer) {
      console.log('[Onboarding] Found main container with', mainContainer.children.length, 'children');
      
      // The tree is nested deeper - find its actual parent container
      const treeElement = mainContainer.querySelector('#storybook-explorer-tree');
      
      if (treeElement) {
        const treeParent = treeElement.parentElement;
        console.log('[Onboarding] Tree parent:', treeParent?.tagName, treeParent?.className);
        
        if (treeParent) {
          // Insert before the tree inside its actual parent
          treeParent.insertBefore(container, treeElement);
          console.log('[Onboarding] Inserted before tree in its parent container');
        } else {
          mainContainer.appendChild(container);
          console.log('[Onboarding] Appended to main container (no tree parent)');
        }
      } else {
        console.log('[Onboarding] Tree not found, appending to main container');
        mainContainer.appendChild(container);
      }
    } else {
      // Fallback: append to sidebar
      sidebar.appendChild(container);
      console.log('[Onboarding] Appended to sidebar (main container not found)');
    }
  }
  
  if (!root) {
    root = createRoot(container);
  }
  
  // Render the compact summary widget
  root.render(<SimpleSummaryWidget api={api} />);
  console.log('[Onboarding] Summary widget rendered');
};

// Register the onboarding addon
addons.register(ADDON_ID, (api) => {
  console.log('[Storybook] Custom onboarding addon registered');
  
  // Add as a panel so it appears in the addon panel tabs
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Onboarding',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => (
      active ? <OnboardingPanel api={api} /> : null
    ),
  });
  
  // Auto-open onboarding panel when Welcome story is displayed
  const WELCOME_STORY_ID = 'getting-started-welcome--welcome';
  let panelOpenedForStory: string | null = null;
  
  // Helper to open the panel - uses same proven pattern as "View All Tasks" button
  const openOnboardingPanel = () => {
    console.log('[Onboarding] Opening onboarding panel...');
    
    // Check current panel visibility state
    const isPanelOpen = api.getQueryParam('panel') !== null || 
                       (api.getElements && api.getElements('panel'));
    
    // Always switch to the onboarding panel
    api.setSelectedPanel(PANEL_ID);
    
    // Only try to open the panel if we detect it's currently closed
    if (!isPanelOpen) {
      setTimeout(() => {
        const bottomPanel = document.querySelector('[data-side="bottom"]');
        
        if (bottomPanel) {
          const style = window.getComputedStyle(bottomPanel);
          const actuallyHidden = style.display === 'none' || 
                               style.visibility === 'hidden' ||
                               parseInt(style.height) < 50;
          
          if (actuallyHidden && api.togglePanel) {
            api.togglePanel();
          }
        }
      }, 50);
    }
  };
  
  // Handle story changes
  const handleStoryChange = (storyId: string) => {
    if (storyId === WELCOME_STORY_ID && panelOpenedForStory !== storyId) {
      console.log('[Onboarding] Welcome story detected, opening panel');
      panelOpenedForStory = storyId;
      openOnboardingPanel();
    }
  };
  
  // Listen for story changes
  api.on('storyChanged', handleStoryChange);
  
  // Inject compact summary into sidebar below the logo
  // Use longer delay and MutationObserver to ensure DOM is ready
  const tryInject = () => {
    const logo = document.querySelector('.sidebar-container svg');
    const search = document.querySelector('#storybook-explorer-searchfield');
    
    if (logo && search) {
      injectIntoSidebar(api);
    } else {
      console.log('[Onboarding] Waiting for sidebar to be fully ready...');
      setTimeout(tryInject, 200);
    }
  };
  
  setTimeout(tryInject, 1000);
});
