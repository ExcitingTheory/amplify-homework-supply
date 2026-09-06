import React from "react";
import { createRoot } from "react-dom/client";
import { addons, types } from "storybook/manager-api";
import { useTheme, ThemeProvider, ensure, themes } from "storybook/theming";
import OnboardingPanel from "../../components/OnboardingPanel";
import {
  getOnboardingEmitter,
  UserPersona,
  OnboardingMode,
} from "../onboarding-events";
import {
  ONBOARDING_TASKS,
  getTasksForPersona,
  OnboardingTaskWithCriteria,
} from "../onboarding-tasks";

const ADDON_ID = "storybook/addon-onboarding-custom";
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
`;

// Outer container - no animations, just positioning
const cardContainerStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: "4px",
  marginBottom: "8px",
  overflow: "hidden",
};

// Gradient background layer - always shows the animated gradient border
function getGradientLayerStyle(bg: string): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: "4px",
    border: "1px solid transparent",
    background: `
      linear-gradient(${bg}, ${bg}) padding-box,
      linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa) border-box
    `,
    backgroundSize: "auto, 200% 100%",
    animation: "onboarding-gradient-border 10s ease-in-out infinite",
    zIndex: 0,
    pointerEvents: "none",
  };
}

// Content wrapper - sits above gradient
const contentWrapperStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
};

// Enhanced sidebar widget without MUI dependencies
const SimpleSummaryWidget: React.FC<{ api: any }> = ({ api }) => {
  const emitter = getOnboardingEmitter();
  const theme = useTheme();
  // Resolve ensured theme properties (ensure() nests some flat props)
  const textColor = theme.color?.defaultText || theme.textMutedColor || "#333";
  const hoverBg = theme.background?.hoverable || "rgba(0,0,0,0.05)";
  const [persona, setPersona] = React.useState<UserPersona | null>(
    emitter.getPersona(),
  );
  const [percentage, setPercentage] = React.useState(() => {
    if (persona) {
      return emitter.getCompletionPercentage(persona, ONBOARDING_TASKS);
    }
    return 0;
  });
  // Compute these eagerly (not 0/0/[]) so a reload never flashes a false
  // "0/0 completed" or "All tasks completed!" empty-state before the
  // mount effect below corrects it a tick later.
  const [completedCount, setCompletedCount] = React.useState(() =>
    persona ? emitter.getCompletedTasks(persona, ONBOARDING_TASKS).length : 0,
  );
  const [totalCount, setTotalCount] = React.useState(() =>
    persona ? getTasksForPersona(persona).length : 0,
  );
  const [nextTasks, setNextTasks] = React.useState<
    OnboardingTaskWithCriteria[]
  >(() => {
    if (!persona) return [];
    const tasks = getTasksForPersona(persona);
    const completedIds = new Set(
      emitter.getCompletedTasks(persona, ONBOARDING_TASKS).map((c) => c.taskId),
    );
    return tasks.filter((t) => !completedIds.has(t.id)).slice(0, 3);
  });

  React.useEffect(() => {
    if (persona) {
      const tasks = getTasksForPersona(persona);
      const completed = emitter.getCompletedTasks(persona, ONBOARDING_TASKS);
      const completedIds = new Set(completed.map((c) => c.taskId));
      const incomplete = tasks.filter((t) => !completedIds.has(t.id));

      setTotalCount(tasks.length);
      setCompletedCount(completed.length);
      setNextTasks(incomplete.slice(0, 3)); // Show next 3 tasks
    }
  }, [persona]);

  React.useEffect(() => {
    const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    const unsubscribe = emitter.on((event) => {
      if (event.type === "persona-selected") {
        setPersona(event.persona);
        if (!event.persona) {
          // Reset was triggered - clear all state
          setPercentage(0);
          setTotalCount(0);
          setCompletedCount(0);
          setNextTasks([]);
          return;
        }
        const pct = emitter.getCompletionPercentage(
          event.persona,
          ONBOARDING_TASKS,
        );
        setPercentage(pct);
        const tasks = getTasksForPersona(event.persona);
        const completed = emitter.getCompletedTasks(
          event.persona,
          ONBOARDING_TASKS,
        );
        const completedIds = new Set(completed.map((c) => c.taskId));
        const incomplete = tasks.filter((t) => !completedIds.has(t.id));

        setTotalCount(tasks.length);
        setCompletedCount(completed.length);
        setNextTasks(incomplete.slice(0, 3));
      } else if (event.type === "task-completed" && persona === event.persona) {
        const pct = emitter.getCompletionPercentage(persona, ONBOARDING_TASKS);
        setPercentage(pct);
        const completed = emitter.getCompletedTasks(persona, ONBOARDING_TASKS);
        setCompletedCount(completed.length);

        // `nextTasks` only ever holds incomplete tasks, so a task that just
        // completed would otherwise vanish from the list before the
        // checkmark/strikethrough could ever be seen. Leave the list as-is
        // (the completed task renders its checkmark via isTaskCompleted
        // below) and swap in the real next-incomplete list after a beat.
        const timeoutId = setTimeout(() => {
          const tasks = getTasksForPersona(persona);
          const stillCompleted = emitter.getCompletedTasks(
            persona,
            ONBOARDING_TASKS,
          );
          const completedIds = new Set(stillCompleted.map((c) => c.taskId));
          const incomplete = tasks.filter((t) => !completedIds.has(t.id));
          setNextTasks(incomplete.slice(0, 3));
        }, 1200);
        pendingTimeouts.push(timeoutId);
      }
    });
    return () => {
      unsubscribe();
      pendingTimeouts.forEach(clearTimeout);
    };
  }, [persona]);

  const getPersonaConfig = (p: UserPersona) => {
    const configs = {
      instructor: { label: "Instructor", icon: "👨‍🏫", color: "#2196F3" },
      learner: { label: "Learner", icon: "🎓", color: "#4CAF50" },
      translator: { label: "Translator", icon: "🌐", color: "#FF9800" },
    };
    return configs[p];
  };

  const PersonaIcon: React.FC<{ type: UserPersona; color: string }> = ({
    type,
    color,
  }) => {
    if (type === "instructor") {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    }
    if (type === "learner") {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      );
    }
    if (type === "translator") {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
          <div style={getGradientLayerStyle(theme.barBg)} />
          <div style={contentWrapperStyle}>
            <div
              style={{
                padding: "10px",
                paddingBottom: "8px",
                borderBottom: `1px solid ${theme.appBorderColor}`,
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: textColor,
                  marginBottom: "2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Onboarding
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: theme.textMutedColor,
                  lineHeight: 1.2,
                }}
              >
                Select your role
              </div>
            </div>

            <div style={{ padding: "10px" }}>
              {[
                {
                  id: "instructor" as UserPersona,
                  label: "Instructor",
                  color: "#2196F3",
                },
                {
                  id: "learner" as UserPersona,
                  label: "Learner",
                  color: "#4CAF50",
                },
                {
                  id: "translator" as UserPersona,
                  label: "Translator",
                  color: "#FF9800",
                },
              ].map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px",
                    marginBottom: "4px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    border: `1px solid ${theme.appBorderColor}`,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => {
                    emitter.setPersona(p.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = p.color;
                    e.currentTarget.style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.appBorderColor;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "20px",
                      height: "20px",
                    }}
                  >
                    <PersonaIcon type={p.id} color={p.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
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
      <div style={getGradientLayerStyle(theme.barBg)} />
      <div style={contentWrapperStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px",
            paddingBottom: "8px",
            borderBottom: `1px solid ${theme.appBorderColor}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonaIcon type={persona} color={config.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: config.color,
                marginBottom: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {config.label}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: theme.textMutedColor,
                lineHeight: 1.2,
              }}
            >
              {completedCount}/{totalCount} completed · {Math.round(percentage)}
              %
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: "10px" }}>
          {/* Progress bar */}
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                height: "4px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.appBorderColor}`,
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  backgroundColor:
                    percentage === 100 ? "#10b981" : config.color,
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>

          {/* Next tasks to complete */}
          {nextTasks.length > 0 ? (
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: theme.textMutedColor,
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontWeight: 600,
                }}
              >
                Next Tasks
              </div>
              {nextTasks.map((task, index) => {
                const isCompleted = emitter.isTaskCompleted(task.id, persona);
                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginBottom: index < nextTasks.length - 1 ? "6px" : "0",
                      padding: "4px",
                      borderRadius: "3px",
                      opacity: isCompleted ? 0.5 : 1,
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={() => {
                      console.debug(
                        "[Onboarding] Task clicked in sidebar:",
                        task.id,
                      );

                      // Settings pages (e.g. /settings/guide) have no story loaded, so
                      // the addon panel doesn't render — navigate to the task's story
                      // first so the click is never a no-op there.
                      const mode = emitter.getMode();
                      const criteria = task.completionCriteria;
                      const storyId =
                        (mode === "quiz"
                          ? criteria?.quizStoryId
                          : criteria?.tutorialStoryId) ||
                        criteria?.tutorialStoryId ||
                        criteria?.quizStoryId ||
                        criteria?.storyId;

                      if (storyId) {
                        try {
                          api.selectStory(storyId);
                        } catch (err) {
                          console.warn(
                            "[Onboarding] selectStory failed, falling back to URL nav:",
                            err,
                          );
                          window.location.href = `/?path=/story/${encodeURIComponent(storyId)}`;
                        }
                      }

                      api.togglePanel(true);
                      api.setSelectedPanel(PANEL_ID);
                      window.dispatchEvent(
                        new CustomEvent("onboarding-scroll-to-task", {
                          detail: { taskId: task.id },
                        }),
                      );
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        flexShrink: 0,
                        marginTop: "-1px",
                        color: isCompleted ? "#10b981" : theme.textMutedColor,
                      }}
                    >
                      {isCompleted ? "✓" : "○"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: isCompleted ? theme.textMutedColor : textColor,
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: isCompleted ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: "8px",
                textAlign: "center",
                fontSize: "10px",
                color: "#10b981",
                fontWeight: 600,
              }}
            >
              🎉 All tasks completed!
            </div>
          )}

          {/* View details button */}
          <div
            style={{
              padding: "6px",
              backgroundColor: "transparent",
              borderRadius: "3px",
              fontSize: "11px",
              color: theme.barTextColor,
              textAlign: "center",
              cursor: "pointer",
              border: `1px solid ${theme.appBorderColor}`,
              transition: "all 0.2s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: 600,
            }}
            onClick={() => {
              console.debug("[Onboarding] View All Tasks clicked");

              // First open the panel (true = force open), then select our tab
              // This is the working pattern from OnboardingSummary.tsx
              api.togglePanel(true);
              api.setSelectedPanel(PANEL_ID);
              console.debug(
                "[Onboarding] Panel opened and tab selected:",
                PANEL_ID,
              );
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
              e.currentTarget.style.borderColor = theme.barSelectedColor;
              e.currentTarget.style.color = theme.barHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = theme.appBorderColor;
              e.currentTarget.style.color = theme.barTextColor;
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

function getPreferredScheme(): "dark" | "light" {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const injectIntoSidebar = (api: any) => {
  // Find the sidebar container - try multiple selectors
  const sidebar =
    document.querySelector('[data-side="left"]') ||
    document.querySelector(".sidebar-container") ||
    document.querySelector('[role="navigation"]') ||
    document.querySelector("#storybook-explorer-tree")?.parentElement;

  if (!sidebar) {
    console.warn("[Onboarding] Sidebar not found yet, will retry...");
    setTimeout(() => injectIntoSidebar(api), 500);
    return;
  }

  console.debug("[Onboarding] Found sidebar:", sidebar.className, sidebar.id);
  const children = Array.from(sidebar.children);
  console.debug("[Onboarding] Sidebar has", children.length, "children:");
  children.forEach((child, index) => {
    const elem = child as HTMLElement;
    console.debug(`  Child ${index}:`, {
      tag: elem.tagName,
      class: elem.className,
      id: elem.id,
      hasSearchInput: elem.querySelector('input[type="search"]') !== null,
      childCount: elem.children.length,
    });

    // Log children of each child (go one level deeper)
    if (elem.children.length > 0) {
      Array.from(elem.children).forEach((grandchild, gIndex) => {
        const gElem = grandchild as HTMLElement;
        console.debug(`    Grandchild ${index}-${gIndex}:`, {
          tag: gElem.tagName,
          class: gElem.className,
          id: gElem.id,
          hasSearchInput: gElem.querySelector('input[type="search"]') !== null,
        });
      });
    }
  });

  // Check if our container already exists
  let container = document.getElementById("storybook-addon-onboarding-custom");

  if (!container) {
    container = document.createElement("div");
    container.id = "storybook-addon-onboarding-custom";

    // Find the div that contains both search AND tree (child 2 based on logs)
    const mainContainer = children.find((child) => {
      return child.querySelector('input[type="search"]') !== null;
    }) as HTMLElement;

    if (mainContainer) {
      console.debug(
        "[Onboarding] Found main container with",
        mainContainer.children.length,
        "children",
      );

      // The tree is nested deeper - find its actual parent container
      const treeElement = mainContainer.querySelector(
        "#storybook-explorer-tree",
      );

      if (treeElement) {
        const treeParent = treeElement.parentElement;
        console.debug(
          "[Onboarding] Tree parent:",
          treeParent?.tagName,
          treeParent?.className,
        );

        if (treeParent) {
          // Insert before the tree inside its actual parent
          treeParent.insertBefore(container, treeElement);
          console.debug(
            "[Onboarding] Inserted before tree in its parent container",
          );
        } else {
          mainContainer.appendChild(container);
          console.debug(
            "[Onboarding] Appended to main container (no tree parent)",
          );
        }
      } else {
        console.debug(
          "[Onboarding] Tree not found, appending to main container",
        );
        mainContainer.appendChild(container);
      }
    } else {
      // Fallback: append to sidebar
      sidebar.appendChild(container);
      console.debug(
        "[Onboarding] Appended to sidebar (main container not found)",
      );
    }
  }

  if (!root) {
    root = createRoot(container);
  }

  // Render the compact summary widget wrapped in Storybook's ThemeProvider
  // so useTheme() works inside the createRoot tree
  const currentTheme =
    addons.getConfig()?.theme || themes[getPreferredScheme()];
  root.render(
    <ThemeProvider theme={ensure(currentTheme)}>
      <SimpleSummaryWidget api={api} />
    </ThemeProvider>,
  );
  console.debug("[Onboarding] Summary widget rendered");
};

// Register the onboarding addon
addons.register(ADDON_ID, (api) => {
  console.debug("[Storybook] Custom onboarding addon registered");

  // One-time completion detection for the standalone "getting-started-storybook-basics"
  // task: requires clicking both the sidebar tree and the toolbar. These live in the
  // manager frame, which task-completion.ts's preview-only DOM listener can't see.
  const STORYBOOK_BASICS_TASK_ID = "getting-started-storybook-basics";
  let sidebarClicked = false;
  let toolbarClicked = false;
  const checkStorybookBasicsComplete = () => {
    if (!sidebarClicked || !toolbarClicked) return;
    const emitter = getOnboardingEmitter();
    const persona = emitter.getPersona();
    if (!persona) return;
    if (emitter.isTaskCompleted(STORYBOOK_BASICS_TASK_ID, persona)) return;
    emitter.emit({
      type: "task-completed",
      taskId: STORYBOOK_BASICS_TASK_ID,
      persona,
      timestamp: Date.now(),
      metadata: { source: "manager-dom-listener" },
    });
  };
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!sidebarClicked && target.closest("#storybook-explorer-tree")) {
        sidebarClicked = true;
        checkStorybookBasicsComplete();
      }
      if (!toolbarClicked && target.closest('[role="toolbar"]')) {
        toolbarClicked = true;
        checkStorybookBasicsComplete();
      }
    },
    true,
  );

  // Add as a panel so it appears in the addon panel tabs
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "Onboarding",
    match: ({ viewMode }) => viewMode === "story",
    render: ({ active }) => (active ? <OnboardingPanel api={api} /> : null),
  });

  // Auto-open onboarding panel when Welcome story is displayed
  const WELCOME_STORY_ID = "getting-started-welcome--welcome";
  let panelOpenedForStory: string | null = null;

  // Helper to open the panel - uses same proven pattern as "View All Tasks" button
  const openOnboardingPanel = () => {
    console.debug("[Onboarding] Opening onboarding panel...");

    // Check current panel visibility state
    const isPanelOpen =
      api.getQueryParam("panel") !== null ||
      (api.getElements && api.getElements("panel"));

    // Always switch to the onboarding panel
    api.setSelectedPanel(PANEL_ID);

    // Only try to open the panel if we detect it's currently closed
    if (!isPanelOpen) {
      setTimeout(() => {
        const bottomPanel = document.querySelector('[data-side="bottom"]');

        if (bottomPanel) {
          const style = window.getComputedStyle(bottomPanel);
          const actuallyHidden =
            style.display === "none" ||
            style.visibility === "hidden" ||
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
      console.debug("[Onboarding] Welcome story detected, opening panel");
      panelOpenedForStory = storyId;
      openOnboardingPanel();
    }

    // Auto-emit task-started when navigating to a task's story
    const emitter = getOnboardingEmitter();
    const persona = emitter.getPersona();
    if (!persona) return;

    const mode = emitter.getMode();
    const tasks = getTasksForPersona(persona);

    for (const task of tasks) {
      if (!task.completionCriteria) continue;
      if (emitter.isTaskCompleted(task.id, persona)) continue;

      const expectedStoryId =
        mode === "tutorial"
          ? task.completionCriteria.tutorialStoryId
          : task.completionCriteria.quizStoryId;

      if (expectedStoryId && expectedStoryId === storyId) {
        console.debug(
          `[Onboarding] Story ${storyId} matches task ${task.id} (${mode} mode) — emitting task-started`,
        );
        emitter.emit({
          type: "task-started",
          taskId: task.id,
          persona,
          timestamp: Date.now(),
          metadata: { storyId, mode, autoDetected: true },
        });
      }
    }
  };

  // Listen for story changes
  api.on("storyChanged", handleStoryChange);

  // Inject compact summary into sidebar below the logo
  // Use longer delay and MutationObserver to ensure DOM is ready
  const tryInject = () => {
    const logo = document.querySelector(".sidebar-container svg");
    const search = document.querySelector("#storybook-explorer-searchfield");

    if (logo && search) {
      injectIntoSidebar(api);
    } else {
      console.debug("[Onboarding] Waiting for sidebar to be fully ready...");
      setTimeout(tryInject, 200);
    }
  };

  setTimeout(tryInject, 1000);
});
