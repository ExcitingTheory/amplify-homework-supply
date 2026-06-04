import * as React from "react";
import { useState, useRef, useReducer, createContext } from "react";
import { useRouter } from "next/navigation";
import yaml from "js-yaml";
import { moderateContent } from "../utils/moderateContent";
import { getAmplifyClient } from "../utils/amplifyClient";
import { saveDraftContent, loadContent } from "../utils/unitContentStorage";
import {
  awardXP,
  recordGradeCompletion,
  updateLearningMemory,
} from "../../app/actions/gamification";
import { summarizeFeedback as summarizeFeedbackAction } from "../../app/actions/feedback";
import AuthContext from "../context/authContext";
import { useWorkbookCollaboration } from "../yjs/workbookHooks";
import {
  unitReducer,
  initialState as unitInitialState,
  actionTypes,
} from "./reducers/unitReducer";
// Provider and Consumer are connected through their "parent" context
/** @type {import('react').Context<Record<string, any>>} */
const UnitContext = createContext({});

export const gradedBlockTypes = [
  "quiz",
  "meaning-association",
  "answer",
  "custom-answer",
  "custom-ai",
];
const UnitProvider = ({ children, id }) => {
  // Get auth state from centralized context
  const {
    user,
    session: authSession,
    isLoading: authLoading,
  } = React.useContext(AuthContext);

  const [state, dispatch] = useReducer(unitReducer, unitInitialState);
  const [sectionId, setSectionId] = React.useState(undefined);
  const savingCountRef = useRef(0);

  const versionRef = useRef(0); // Store _version to detect changes and prevent rerenders
  const practiceSessionVersionMapRef = useRef({});
  const gradeVersionMapRef = useRef({});
  const editorStateRef = useRef();
  const editorSelectionRef = useRef();
  const editorRef = useRef(null);
  const unitRef = useRef({});
  const usernameRef = useRef(null);
  const workbookCollaborationRef = useRef(null); // Ref to access workbook collaboration from saveGrade

  // Memoize derived values to prevent recalculation on every render
  const name = React.useMemo(() => state.unit?.name, [state.unit?.name]);
  const description = React.useMemo(
    () => state.unit?.description,
    [state.unit?.description],
  );
  const timeLimitSeconds = React.useMemo(
    () => state.unit?.timeLimitSeconds,
    [state.unit?.timeLimitSeconds],
  );

  const router = useRouter();

  // const [featuredImageUrl, setFeaturedImageUrl] = React.useState(null);

  // Memoize derived values to prevent recalculation on every render
  const rubricLength = React.useMemo(
    () => state.rubric.length || 0,
    [state.rubric.length],
  );
  const unitVersion = React.useMemo(
    () => state.unit?._version || 0,
    [state.unit?._version],
  );
  const unitOwner = React.useMemo(
    () => state.unit?.owner || "",
    [state.unit?.owner],
  );

  /**
   * Check if the current user has permission to EDIT the unit (strict check)
   * Returns true if:
   * - User is the owner of the unit
   * - User is in Instructors, Moderators, or Admins group
   * - Unit status is PUBLISHED (public access for viewing)
   */
  const checkUnitEditPermission = React.useCallback(
    (unit, currentUser, userGroups) => {
      if (!unit || !unit.id) {
        return { hasAccess: false, reason: null }; // Unit not loaded yet
      }

      // If unit is published, anyone can view it (learners can read published units)
      if (unit.status === "PUBLISHED") {
        return { hasAccess: true, reason: null };
      }

      // Check if user is authenticated
      if (!currentUser) {
        return {
          hasAccess: false,
          reason: "You must be signed in to access this content.",
        };
      }

      const userId = currentUser?.attributes?.sub;
      const groups = userGroups || [];

      // Check if user is owner
      if (unit.owner === userId) {
        return { hasAccess: true, reason: null };
      }

      // Check if user is in privileged groups
      const hasInstructorAccess = groups.some((group) =>
        ["Instructors", "Moderators", "Admins"].includes(group),
      );

      if (hasInstructorAccess) {
        return { hasAccess: true, reason: null };
      }

      // No access to edit
      return {
        hasAccess: false,
        reason:
          "You do not have permission to edit this unit. Only the owner or instructors can edit unpublished units.",
      };
    },
    [],
  );

  /**
   * Check if the current user has permission to VIEW the unit in workbook (permissive check)
   * Workbook is for completing assignments, so it's more accessible than the editor.
   * Returns true if:
   * - User is authenticated (learners can work on any published or assigned units)
   * - Unit is published (anyone can access)
   * - User is owner or instructor (can access any unit)
   */
  const checkUnitViewPermission = React.useCallback(
    (unit, currentUser, userGroups) => {
      if (!unit || !unit.id) {
        return { hasAccess: false, reason: null }; // Unit not loaded yet
      }

      // If unit is published, anyone can view it
      if (unit.status === "PUBLISHED") {
        return { hasAccess: true, reason: null };
      }

      // Check if user is authenticated
      if (!currentUser) {
        return {
          hasAccess: false,
          reason: "You must be signed in to access this content.",
        };
      }

      const userId = currentUser?.attributes?.sub;
      const groups = userGroups || [];

      // Check if user is owner
      if (unit.owner === userId) {
        return { hasAccess: true, reason: null };
      }

      // Check if user is in privileged groups (instructors can view all units)
      const hasInstructorAccess = groups.some((group) =>
        ["Instructors", "Moderators", "Admins"].includes(group),
      );

      if (hasInstructorAccess) {
        return { hasAccess: true, reason: null };
      }

      // For workbook/viewing: Allow authenticated learners to access
      // The backend (Grade creation, Assignment checks) will enforce actual access control
      // This allows students to view units they have assignments for
      return { hasAccess: true, reason: null };
    },
    [],
  );

  // NOTE: Authentication is now handled by centralized AuthContext
  // Update usernameRef when user changes
  React.useEffect(() => {
    if (user?.attributes?.sub) {
      usernameRef.current = user.attributes.sub;
    } else {
      usernameRef.current = null;
    }
  }, [user]);

  // Derive sectionId from Assignment record (server-authoritative, not URL)
  React.useEffect(() => {
    if (!id || authLoading || !user) return;

    let cancelled = false;
    const client = getAmplifyClient();

    async function lookupAssignment() {
      try {
        const { data: assignments } = await client.models.Assignment.list({
          filter: { unitID: { eq: id } },
        });
        if (cancelled) return;
        // Use the first assignment that matches this unit for the current user
        const assignment = (assignments || []).find(
          (a) => a != null && a.sectionID,
        );
        if (assignment?.sectionID) {
          setSectionId(assignment.sectionID);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn(
            "[UnitContext] Failed to look up Assignment for sectionId:",
            err,
          );
        }
      }
    }

    lookupAssignment();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  const verifyAccuracy = React.useCallback((data) => {
    let total = 0;
    let accuracy = 0;
    if (data) {
      Object.entries(data).forEach((g) => {
        if (g[1]?.complete === true && g[1]?.accuracy) {
          let _accuracy = parseInt(g[1]?.accuracy);
          if (_accuracy > 1) {
            _accuracy = _accuracy / 100;
          }
          total++;
          accuracy += _accuracy;
        }
        if (g[1]?.learn?.accuracy) {
          total++;
          accuracy += parseInt(g[1]?.learn?.accuracy);
        }
        if (g[1]?.easy?.accuracy) {
          total++;
          accuracy += parseInt(g[1]?.easy?.accuracy);
        }
        if (g[1]?.hard?.accuracy) {
          total++;
          accuracy += parseInt(g[1]?.hard?.accuracy);
        }
      });
    }
    accuracy = accuracy / total;
    return accuracy * 100;
  }, []);

  const createGrade = React.useCallback(
    async (unitAccuracy, unitIsComplete) => {
      // Ensure we have authentication before creating grade
      // Check both the ref (for production) and direct user (for tests where useEffect may not have run)
      const currentUsername = usernameRef.current || user?.attributes?.sub;
      if (!currentUsername) {
        throw new Error("User not authenticated - cannot create grade");
      }

      const client = getAmplifyClient();
      const currentUnit = unitRef.current;

      const { data: _grade, errors } = await client.models.Grade.create({
        unitID: id,
        sectionID: sectionId || undefined,
        // use the unit owner as the instructor
        instructor: currentUnit?.owner || "",
        // Owner will be auto-populated by Amplify based on auth
        unitVersion: currentUnit?._version || 1,
        complete: unitIsComplete,
        accuracy: unitAccuracy,
        timerStarted: currentUnit?.timeLimitSeconds > 0 ? true : null,
      });

      if (errors) {
        console.error("[createGrade] Error creating grade:", errors);
        throw new Error("Failed to create grade");
      }

      dispatch({ type: actionTypes.SET_GRADE, payload: _grade });

      // Award XP for submitting homework (first time only — dedup by gradeId)
      awardXP(
        currentUsername,
        "HOMEWORK_SUBMITTED",
        _grade.id,
        sectionId || undefined,
        id,
      );

      return _grade;
    },
    [id, sectionId, user],
  );

  /**
   * Calls GPT-4o-mini to produce an overall feedback summary for the completed grade.
   * Sends assignment (unit name, description, rubric) and grade data as YAML.
   * Stores result in Grade.feedback.
   */
  const summarizeGradeFeedback = React.useCallback(
    async (gradeData, gradeId) => {
      const client = getAmplifyClient();

      // Build assignment context as YAML
      const assignmentYaml = yaml.dump({
        name: name || "",
        description: description || "",
        rubric_blocks: state.rubric,
      });

      // Build grade data as YAML (per-block results)
      const blocks = {};
      if (gradeData) {
        Object.entries(gradeData).forEach(([blockId, block]) => {
          blocks[blockId] = {
            complete: !!block?.complete,
            accuracy: block?.accuracy ?? null,
            ...(block?.userAnswer && {
              userAnswer: String(block.userAnswer).slice(0, 200),
            }),
            ...(block?.feedback && {
              aiFeedback: String(block.feedback).slice(0, 200),
            }),
          };
        });
      }
      const gradeYaml = yaml.dump({ blocks });

      let feedbackJson;
      try {
        feedbackJson = await summarizeFeedbackAction({
          assignmentData: assignmentYaml,
          gradeData: gradeYaml,
        });
      } catch (err) {
        console.error("[unitContext] summarizeFeedback failed:", err?.message);
        return;
      }

      if (!feedbackJson) {
        console.error("[unitContext] summarizeFeedback returned empty");
        return;
      }

      // Parse and store in Grade.feedback
      try {
        const feedback = JSON.parse(feedbackJson);
        await client.models.Grade.update({
          id: gradeId,
          feedback: JSON.stringify(feedback),
        });
      } catch (parseErr) {
        // If the model didn't return valid JSON, store as plain overall text
        await client.models.Grade.update({
          id: gradeId,
          feedback: JSON.stringify({ overall: feedbackJson }),
        });
      }
    },
    [name, description, state.rubric],
  );

  const saveGrade = React.useCallback(
    async (data) => {
      // let _grade = grade

      // Count the total number of expected questions to later compare to the number expected in the unit
      let _finishedQuestions = 0;
      if (data) {
        Object.entries(data).forEach((g) => {
          if (g[1]?.complete === true) {
            _finishedQuestions++;
          }
        });
      }
      let unitIsComplete = false;
      let unitAccuracy = null;
      if (_finishedQuestions === rubricLength) {
        unitIsComplete = true;
        unitAccuracy = verifyAccuracy(data);
      }

      dispatch({
        type: actionTypes.SET_FINISHED_QUESTIONS,
        payload: _finishedQuestions,
      });

      // Sync block-level updates to Yjs for real-time collaboration with tutors
      if (data && workbookCollaborationRef.current?.provider) {
        Object.entries(data).forEach(([blockId, blockData]) => {
          workbookCollaborationRef.current.updateBlock(blockId, blockData);
        });
      }

      try {
        // Save grade first, then kick off moderation (backend persists to record)
        let gradeId = state.grade?.id;

        if (!state.grade) {
          const newGrade = await createGrade(unitAccuracy, unitIsComplete);
          if (newGrade && newGrade.id) {
            gradeId = newGrade.id;
            const client = getAmplifyClient();
            await client.models.Grade.update({
              id: newGrade.id,
              data: JSON.stringify(data),
              accuracy: unitAccuracy,
              complete: unitIsComplete,
            });
          }
        } else if (state.grade && state.grade.id) {
          const client = getAmplifyClient();
          await client.models.Grade.update({
            id: state.grade.id,
            data: JSON.stringify(data),
            accuracy: unitAccuracy,
            complete: unitIsComplete,
          });
        } else {
          console.error("Invalid grade object:", state.grade);
          const newGrade = await createGrade(unitAccuracy, unitIsComplete);
          if (newGrade && newGrade.id) {
            gradeId = newGrade.id;
            const client = getAmplifyClient();
            await client.models.Grade.update({
              id: newGrade.id,
              data: JSON.stringify(data),
              accuracy: unitAccuracy,
              complete: unitIsComplete,
            });
          }
        }

        // Moderate async — backend fetches _version and writes to Grade.moderation
        if (gradeId) {
          moderateContent(data, { modelName: "Grade", recordId: gradeId }).then(
            (result) => {
              if (result.flagged) {
                console.warn(
                  "[UnitContext] Student submission flagged by moderation, saving for instructor review",
                  {
                    categories: result.categories,
                    username: user?.attributes?.sub,
                  },
                );
              }
            },
          );
        }
        if (unitIsComplete && !timeLimitSeconds) {
          dispatch({ type: actionTypes.SET_SHOW_UNIT_COMPLETE, payload: true });
          // Award XP + badges + streak + personal best via batched Server Action
          const currentUsername = usernameRef.current || user?.attributes?.sub;
          if (currentUsername && state.grade?.id) {
            // Primary: Server Action batches XP, badges, streak, personal best, easter eggs
            (async () => {
              try {
                const result = await recordGradeCompletion(
                  currentUsername,
                  id,
                  unitAccuracy,
                  state.grade.id,
                  undefined,
                  sectionId || undefined,
                );
                // Show personal best banner if applicable
                if (result?.personalBest?.isNewBest) {
                  dispatch({
                    type: actionTypes.SET_PERSONAL_BEST_RESULT,
                    payload: result.personalBest,
                  });
                }
              } catch (err) {
                console.error(
                  "[unitContext] recordGradeCompletion failed:",
                  err?.message,
                );
              }
            })();

            // Summarize feedback via GPT-4o-mini (fire-and-forget)
            summarizeGradeFeedback(data, state.grade.id).catch((err) =>
              console.error("[unitContext] summarizeGradeFeedback error:", err),
            );

            // Evaluate skills linked to this unit (fire-and-forget)
            client.mutations
              .evaluateSkillsForUnit({
                studentId: currentUsername,
                unitId: id,
                cohortId: sectionId || undefined,
              })
              .catch((err) =>
                console.warn("[unitContext] Skill evaluation:", err),
              );

            // Update per-unit learning memory with block-level accuracy data
            const weakAreas = [];
            const strongAreas = [];
            if (data) {
              Object.entries(data).forEach(([blockKey, blockData]) => {
                if (blockData?.complete && blockData?.accuracy != null) {
                  const acc = parseInt(blockData.accuracy);
                  const label = blockKey.slice(0, 60);
                  if (acc < 70) weakAreas.push(label);
                  else if (acc >= 90) strongAreas.push(label);
                }
              });
            }
            updateLearningMemory(
              currentUsername,
              id,
              unitAccuracy,
              weakAreas,
              strongAreas,
              { sourceType: "workbook" },
            ).catch((err) =>
              console.error("[unitContext] updateLearningMemory error:", err),
            );
          }
        }
      } catch (error) {
        console.error("Error saving grade:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
        });

        // If it's an authentication error, try to refresh auth
        if (
          error.message?.includes("auth") ||
          error.message?.includes("Auth")
        ) {
          console.log(
            "Authentication error detected, attempting to fetch user...",
          );
          try {
            await fetchCurrentUsername();
          } catch (authError) {
            console.error("Failed to refresh authentication:", authError);
          }
        }

        // Re-throw to let calling code handle it
        throw error;
      }
    },
    [rubricLength, state.grade, createGrade, timeLimitSeconds],
  );

  React.useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user) {
      return;
    }

    // Validate required fields before subscribing
    if (!id) {
      return;
    }

    const username = user.attributes.sub;

    // Validate username
    if (!username) {
      console.warn(
        "[UnitContext] No username available, skipping Grade subscription",
      );
      return;
    }

    const client = getAmplifyClient();
    let cancelled = false;

    function processGrades(validItems) {
      // Filter client-side
      const incompleteGrades = validItems.filter((grade) => !grade.complete);
      const completedGrades = validItems.filter((grade) => grade.complete);

      // Handle current grade (most recent incomplete)
      const currentGrade = incompleteGrades[0];

      // Parse grade.data from JSON string to object so all consumers get an object
      if (currentGrade?.data && typeof currentGrade.data === "string") {
        try {
          currentGrade.data = JSON.parse(currentGrade.data);
        } catch (e) {
          console.error("[UnitContext] Failed to parse grade.data:", e);
          currentGrade.data = {};
        }
      }

      // If there are completed grades but no current incomplete grade,
      // show the completion screen (persists across navigation)
      const showComplete = !currentGrade && completedGrades.length > 0;

      // Calculate finished questions from the current grade data
      let _finishedQuestions = 0;
      if (currentGrade?.data) {
        const gradeData = currentGrade.data;
        Object.entries(gradeData).forEach(([key, value]) => {
          if (value?.complete === true) {
            _finishedQuestions++;
          }
        });
      }

      // Handle recent grades (top 5 completed, sorted by accuracy then date)
      const sortedCompletedGrades = completedGrades
        .sort((a, b) => {
          if (b.accuracy !== a.accuracy) {
            return (b.accuracy || 0) - (a.accuracy || 0);
          }
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })
        .slice(0, 5);

      dispatch({
        type: actionTypes.GRADE_SUBSCRIPTION_UPDATE,
        payload: {
          grade: currentGrade,
          username,
          showUnitComplete: showComplete,
          finishedQuestions: _finishedQuestions,
          recentGrades: sortedCompletedGrades,
        },
      });
    }

    function handleGradeError(label, error) {
      const errorMessage =
        error?.error?.errors?.[0]?.message || error?.message || "";
      if (errorMessage.includes("DuplicatedOperationError")) {
        console.warn(
          `[UnitContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      if (
        errorMessage.includes("exceeds maximum value limit") ||
        errorMessage.includes("operator `in`")
      ) {
        console.warn(
          "[UnitContext] Subscription filter limit exceeded, using client-side filtering only",
        );
        return;
      }
      console.error(`[UnitContext] ${label} error:`, error);
    }

    // Single observeQuery replaces list() + 3 manual subscriptions
    // observeQuery handles create/update/delete internally with built-in dedup
    const subscription = client.models.Grade.observeQuery({
      filter: { unitID: { eq: id } },
    }).subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );

        // Version map guard: skip dispatch if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = gradeVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (!hasChanges && Object.keys(gradeVersionMapRef.current).length > 0) {
          return;
        }

        // Update version map
        gradeVersionMapRef.current = {};
        validItems.forEach((item) => {
          gradeVersionMapRef.current[item.id] = item._version;
        });

        processGrades(validItems);
      },
      error: (error) => handleGradeError("Grade observeQuery", error),
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [id, user, authLoading]);

  // ============================================================================
  // Practice Sessions subscription + CRUD
  // ============================================================================

  React.useEffect(() => {
    if (authLoading || !user || !id) return;

    const client = getAmplifyClient();
    let cancelled = false;

    function handleError(label, error) {
      const msg =
        error?.message || error?.error?.errors?.[0]?.message || String(error);
      if (msg.includes("DuplicatedOperationError")) {
        console.warn(
          `[UnitContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      if (msg.includes("exceeds maximum value limit")) {
        console.warn(
          "[UnitContext] PracticeSession subscription filter limit — using client filtering",
        );
        return;
      }
      console.error(`[UnitContext] ${label} error:`, msg);
    }

    // Single observeQuery replaces list() + 3 manual subscriptions
    // Exclude heavy fields: generatedContent, data (loaded on-demand)
    const subscription = client.models.PracticeSession.observeQuery({
      filter: { unitID: { eq: id } },
      selectionSet: [
        "id",
        "unitID",
        "drillType",
        "accuracy",
        "blockCount",
        "blocksCompleted",
        "complete",
        "xpAwarded",
        "sourcesEnabled.*",
        "coverageSnapshot.*",
        "collaborative",
        "roomCode",
        "maxParticipants",
        "insightStudentId",
        "weakAreas.*",
        "strongAreas.*",
        "sourcesUsedList.*",
        "blockBreakdown.*",
        "insightTimestamp",
        "_version",
        "_lastChangedAt",
        "_deleted",
        "createdAt",
        "updatedAt",
      ],
    }).subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (s) => s != null && s.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = practiceSessionVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (
          !hasChanges &&
          Object.keys(practiceSessionVersionMapRef.current).length > 0
        ) {
          return;
        }

        // Update version map
        practiceSessionVersionMapRef.current = {};
        validItems.forEach((item) => {
          practiceSessionVersionMapRef.current[item.id] = item._version;
        });

        dispatch({
          type: actionTypes.SET_PRACTICE_SESSIONS,
          payload: validItems,
        });
      },
      error: (error) => handleError("PracticeSession observeQuery", error),
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [id, user, authLoading]);

  const createPracticeSession = React.useCallback(
    async (data) => {
      const client = getAmplifyClient();
      const { data: record, errors } =
        await client.models.PracticeSession.create({
          unitID: id,
          ...data,
        });
      if (errors?.length)
        console.error("[UnitContext] createPracticeSession errors:", errors);
      return record;
    },
    [id],
  );

  const updatePracticeSession = React.useCallback(
    async (sessionId, updates) => {
      const client = getAmplifyClient();
      const { data: record, errors } =
        await client.models.PracticeSession.update({
          id: sessionId,
          ...updates,
        });
      if (errors?.length)
        console.error("[UnitContext] updatePracticeSession errors:", errors);
      return record;
    },
    [],
  );

  React.useEffect(() => {
    console.log("[UnitContext] useEffect triggered", {
      id,
      authLoading,
      hasUser: !!user,
      userSub: user?.attributes?.sub,
    });
    // Wait for auth to be ready before fetching unit data
    if (authLoading || !user) {
      console.log("[UnitContext] Waiting for auth...", {
        authLoading,
        hasUser: !!user,
      });
      return;
    }

    if (!id) {
      console.log("[UnitContext] No unit id provided");
      return;
    }

    // ── Offline fallback: load from IndexedDB if offline ──────────────
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("[UnitContext] Offline — loading unit from IndexedDB cache");
      (async () => {
        try {
          const {
            getCachedUnit,
            getCachedWordsForUnit,
            getCachedQuestionsForUnit,
            getCachedFilesForUnit,
            getCachedGrade,
          } = await import("../offline/OfflineDataStore");
          const cachedUnit = await getCachedUnit(id);
          if (cachedUnit) {
            const unitData =
              typeof cachedUnit.data === "string"
                ? JSON.parse(cachedUnit.data)
                : cachedUnit.data;
            const blocks = unitData?.root?.children || [];
            const _rubric = blocks
              .filter((b) => gradedBlockTypes.includes(b.type))
              .map((b) => b.key);
            const cachedWords = await getCachedWordsForUnit(id);
            const cachedQuestions = await getCachedQuestionsForUnit(id);
            const cachedFiles = await getCachedFilesForUnit(id);
            const _dictionary = {};
            cachedWords.forEach((w) => {
              _dictionary[w.id] = w;
            });
            const _questionBank = {};
            cachedQuestions.forEach((q) => {
              _questionBank[q.id] = q;
            });
            const _files = {};
            cachedFiles.forEach((f) => {
              _files[f.id] = f;
            });
            unitRef.current = {
              ...cachedUnit,
              data: unitData,
              _version: cachedUnit.version,
            };
            dispatch({
              type: actionTypes.UNIT_LOADED,
              payload: {
                unit: unitRef.current,
                dictionary: _dictionary,
                questionBank: _questionBank,
                files: _files,
                rubric: _rubric,
              },
            });
            editorStateRef.current = unitData;
            versionRef.current = cachedUnit.version;
            console.log("[UnitContext] Loaded unit from offline cache");
          }
        } catch (err) {
          console.warn("[UnitContext] Offline cache load failed:", err);
        }
      })();
      // When we come back online, re-subscribe
      const handleOnline = () => {
        console.log(
          "[UnitContext] Back online — will re-run subscription effect",
        );
      };
      window.addEventListener("online", handleOnline, { once: true });
      return () => window.removeEventListener("online", handleOnline);
    }
    // ── End offline fallback ──────────────────────────────────────────

    console.log("[UnitContext] Fetching unit data for id:", id);
    const client = getAmplifyClient();
    const subscriptions = [];
    let cancelled = false;

    // Helper to load a unit record and all its relations
    async function loadUnit(unitRecord) {
      if (!unitRecord) {
        dispatch({ type: actionTypes.SET_UNIT, payload: {} });
        dispatch({ type: actionTypes.SET_PERMISSION_ERROR, payload: null });
        return;
      }

      // Permission checking is handled by individual pages (editor vs workbook)
      dispatch({ type: actionTypes.SET_PERMISSION_ERROR, payload: null });

      // Only process if incoming version is greater than what we're tracking
      if (
        unitRecord?._version != null &&
        !(unitRecord._version > versionRef.current)
      ) {
        return;
      }

      // Detect contentVersion change — fetch content from S3
      const prevContentVersion = unitRef.current?.contentVersion || 0;
      if (
        unitRecord.identityId &&
        (unitRecord.contentVersion || 0) > prevContentVersion
      ) {
        const isInstructor =
          authSession?.groups?.includes("Instructors") ||
          authSession?.groups?.includes("Admins");
        const variant = isInstructor ? "draft" : "published";
        const s3Content = await loadContent(
          unitRecord.identityId,
          unitRecord.id,
          variant,
        );
        if (s3Content) {
          unitRecord = { ...unitRecord, data: s3Content };
        }
      }

      const _files = {};
      const _dictionary = {};
      const _questionBank = {};
      const _playlistUrls = {};

      // Load related words via join table
      const { data: _unitWords } = await client.models.UnitWord.list({
        filter: { unitID: { eq: id } },
      });

      // Load related files via join table
      const { data: _unitFiles } = await client.models.UnitFile.list({
        filter: { unitID: { eq: id } },
      });

      // Load related questions via join table
      const { data: _unitQuestions } = await client.models.QuestionUnit.list({
        filter: { unitID: { eq: id } },
      });

      // Fetch full Word objects
      const _unitWordsWork = (_unitWords || [])
        .filter((uw) => uw != null)
        .map(async (uw) => {
          if (uw.wordID) {
            const { data } = await client.models.Word.get({ id: uw.wordID });
            return data;
          }
          return null;
        });

      // Fetch full File objects
      const _unitFilesWork = (_unitFiles || [])
        .filter((uf) => uf != null)
        .map(async (uf) => {
          if (uf.fileID) {
            const { data } = await client.models.File.get({ id: uf.fileID });
            return data;
          }
          return null;
        });

      // Fetch full Question objects
      const _unitQuestionsWork = (_unitQuestions || [])
        .filter((uq) => uq != null)
        .map(async (uq) => {
          if (uq.questionID) {
            const { data } = await client.models.Question.get({
              id: uq.questionID,
            });
            return data;
          }
          return null;
        });

      const _words = await Promise.allSettled(_unitWordsWork);
      const _unitsFiles = await Promise.allSettled(_unitFilesWork);
      const _questions = await Promise.allSettled(_unitQuestionsWork);

      _words.forEach((w) => {
        if (w.status === "fulfilled" && w.value) {
          const _w = w.value;
          _dictionary[_w.id] = _w;
        }
      });

      _unitsFiles.forEach((f) => {
        if (f.status === "fulfilled" && f.value) {
          const _f = f.value;
          _files[_f.id] = _f;
        }
      });

      _questions.forEach((q) => {
        if (q.status === "fulfilled" && q.value) {
          const _q = q.value;
          _questionBank[_q.id] = _q;
        }
      });

      // Parse unit data (Gen2 stores JSON as string)
      const unitData =
        typeof unitRecord?.data === "string"
          ? JSON.parse(unitRecord.data)
          : unitRecord?.data;

      const blocks = unitData?.root?.children || [];
      const _rubric = [];

      if (blocks.length > 0) {
        blocks.forEach((block) => {
          if (gradedBlockTypes.includes(block["type"])) {
            _rubric.push(block["key"]);
          }
        });
      }

      if (cancelled) return;

      // Update all state - _version check ensures data has changed
      unitRef.current = unitRecord;
      dispatch({
        type: actionTypes.UNIT_LOADED,
        payload: {
          unit: unitRecord,
          dictionary: _dictionary,
          files: _files,
          playlistUrls: _playlistUrls,
          questionBank: _questionBank,
          rubric: _rubric,
        },
      });

      editorStateRef.current = unitData;
      versionRef.current = unitRecord?._version;
    }

    function handleSubscriptionError(label, error) {
      const msg =
        error?.message ||
        error?.error?.errors?.[0]?.message ||
        JSON.stringify(error);
      if (msg.includes("DuplicatedOperationError")) {
        console.warn(
          `[UnitContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      console.error(`[UnitContext] ${label} error:`, error);
    }

    // Initial fetch: single get() instead of observeQuery() table scan
    async function fetchUnit() {
      try {
        const { data: unitRecord, errors } = await client.models.Unit.get({
          id,
        });
        if (cancelled) return;
        if (errors?.length) {
          console.error("[UnitContext] Unit.get errors:", errors);
        }
        await loadUnit(unitRecord);
      } catch (error) {
        console.error("[UnitContext] Unit.get error:", error);
      }

      if (cancelled) return;

      // Subscribe to updates for this specific unit
      const updateSub = client.models.Unit.onUpdate({
        filter: { id: { eq: id } },
      }).subscribe({
        next: async (response) => {
          const updatedUnit = response;
          if (!updatedUnit || !updatedUnit.id) return;
          console.log(
            "[UnitContext] Unit updated via subscription, _version:",
            updatedUnit._version,
          );
          await loadUnit(updatedUnit);
        },
        error: (error) => handleSubscriptionError("Unit onUpdate", error),
      });
      subscriptions.push(updateSub);
    }

    fetchUnit();

    return () => {
      cancelled = true;
      subscriptions.forEach((sub) => sub?.unsubscribe());
    };
  }, [id, user, authLoading]);

  // Helpers to track concurrent saves and show spinner only while at least one is in-flight
  const beginSaving = React.useCallback(() => {
    savingCountRef.current += 1;
    dispatch({ type: actionTypes.SET_IS_SAVING, payload: true });
  }, []);
  const endSaving = React.useCallback(() => {
    savingCountRef.current = Math.max(0, savingCountRef.current - 1);
    if (savingCountRef.current === 0)
      dispatch({ type: actionTypes.SET_IS_SAVING, payload: false });
  }, []);

  const saveEditorContent = React.useCallback(
    async (editorContent) => {
      const currentUnit = unitRef.current;

      // Guard: Don't save if unit is not loaded or is invalid
      if (!currentUnit || !currentUnit.id) {
        console.warn("[saveEditorContent] Cannot save - unit not loaded yet");
        return;
      }

      let _editorContent = editorContent
        ? editorContent
        : editorStateRef.current;

      // Guard: Don't save null/undefined content — prevents storing "null" string in DB
      if (_editorContent == null) {
        console.warn(
          "[saveEditorContent] Cannot save - no editor content available",
        );
        return;
      }

      const newContent =
        typeof _editorContent === "string"
          ? _editorContent
          : JSON.stringify(_editorContent);

      beginSaving();
      // Optimistic version bump — blocks subscription echo from re-rendering
      const predictedNextVersion = currentUnit._version + 1;
      versionRef.current = predictedNextVersion;

      try {
        // 1. Upload content to S3 (private — owner only)
        await saveDraftContent(
          currentUnit.identityId,
          currentUnit.id,
          newContent,
        );

        // 2. Bump contentVersion in DynamoDB (no content payload)
        const nextContentVersion = (currentUnit.contentVersion || 0) + 1;
        const client = getAmplifyClient();
        const { data: savedUnit, errors } = await client.models.Unit.update({
          id: currentUnit.id,
          contentVersion: nextContentVersion,
          _version: currentUnit._version,
        });
        if (errors?.length) {
          console.error("[saveEditorContent] Save returned errors:", errors);
          // Rollback optimistic version on error
          versionRef.current = currentUnit._version;
        } else if (savedUnit) {
          // Confirm with actual version from server
          unitRef.current = {
            ...unitRef.current,
            _version: savedUnit._version,
            contentVersion: nextContentVersion,
          };
          versionRef.current = savedUnit._version;
        }

        // Moderate async — backend fetches _version and writes to Unit.moderation
        moderateContent(newContent, {
          modelName: "Unit",
          recordId: currentUnit.id,
        }).then((result) => {
          if (result.flagged) {
            console.warn(
              "[UnitContext] Content flagged by moderation, saved for instructor review",
              {
                categories: result.categories,
              },
            );
          }
        });
      } catch (errors) {
        console.error("[saveEditorContent] Save failed:", errors);
        // Rollback optimistic version on exception
        versionRef.current = currentUnit._version;
      } finally {
        endSaving();
      }
    },
    [id, beginSaving, endSaving],
  );

  const handleDelete = React.useCallback(async () => {
    /**
     * This deletes the unit from the database.
     * It is called from the Editor component.
     * It is passed to the Editor component through the unit context.
     */
    const currentUnit = unitRef.current;
    try {
      const client = getAmplifyClient();
      await client.models.Unit.delete({ id: currentUnit.id });
      router.push(`/units`);
    } catch (errors) {
      console.error(errors);
    }
  }, [router]);

  const saveDescription = React.useCallback(
    async (description) => {
      const currentUnit = unitRef.current;
      beginSaving();
      // Optimistic version bump
      const predictedNextVersion = currentUnit._version + 1;
      versionRef.current = predictedNextVersion;

      try {
        const client = getAmplifyClient();
        const { data: savedUnit, errors } = await client.models.Unit.update({
          id: currentUnit.id,
          description: description,
          _version: currentUnit._version,
        });
        if (errors?.length) {
          console.error("[saveDescription] Update returned errors:", errors);
          versionRef.current = currentUnit._version;
        } else if (savedUnit) {
          unitRef.current = {
            ...unitRef.current,
            _version: savedUnit._version,
          };
          versionRef.current = savedUnit._version;
        }
      } catch (errors) {
        console.error(errors);
        versionRef.current = currentUnit._version;
      } finally {
        endSaving();
      }
    },
    [beginSaving, endSaving],
  );

  const saveName = React.useCallback(
    async (name) => {
      const currentUnit = unitRef.current;
      beginSaving();
      // Optimistic version bump
      const predictedNextVersion = currentUnit._version + 1;
      versionRef.current = predictedNextVersion;

      try {
        const client = getAmplifyClient();
        const { data: savedUnit, errors } = await client.models.Unit.update({
          id: currentUnit.id,
          name: name,
          _version: currentUnit._version,
        });
        if (errors?.length) {
          console.error("[saveName] Update returned errors:", errors);
          versionRef.current = currentUnit._version;
        } else if (savedUnit) {
          unitRef.current = {
            ...unitRef.current,
            _version: savedUnit._version,
          };
          versionRef.current = savedUnit._version;
        }
      } catch (errors) {
        console.error(errors);
        versionRef.current = currentUnit._version;
      } finally {
        endSaving();
      }
    },
    [beginSaving, endSaving],
  );

  const handleBeforeUnload = React.useCallback(
    async (event) => {
      // If content is different then save it
      const currentUnit = unitRef.current;
      const content = JSON.stringify(editorStateRef.current);
      const unitData = JSON.stringify(currentUnit?.data);

      console.log("unitData", unitData);
      if (content === unitData) {
        event.returnValue = null;
        console.log("content === unitData", content);
        console.log("!!!+=======", unitData);
      } else {
        console.log("content !== unitContent", content);
        console.log("!!!+=======", unitData);
        event.preventDefault();
        await saveEditorContent();
      }
    },
    [saveEditorContent],
  );

  const handleStatusChange = React.useCallback(async (status) => {
    const currentUnit = unitRef.current;
    const currentName = currentUnit?.name;
    const currentDescription = currentUnit?.description;

    if (status === "PUBLISHED") {
      // check if the unit has a name and description
      if (!currentName || !currentDescription) {
        alert(
          "Please add a name and description to your unit before publishing.",
        );
        return;
      }
    }

    beginSaving();
    // Optimistic version bump
    const predictedNextVersion = currentUnit._version + 1;
    versionRef.current = predictedNextVersion;

    try {
      const client = getAmplifyClient();
      const { data: savedUnit, errors } = await client.models.Unit.update({
        id: currentUnit.id,
        status: status,
        _version: currentUnit._version,
      });
      if (errors?.length) {
        console.error("[handleStatusChange] Update returned errors:", errors);
        versionRef.current = currentUnit._version;
      } else if (savedUnit) {
        unitRef.current = { ...unitRef.current, _version: savedUnit._version };
        versionRef.current = savedUnit._version;

        // On publish: delegate to publishUnit Lambda which handles
        // media path rewriting, S3 writes, and DynamoDB update atomically.
        if (status === "PUBLISHED") {
          await client.mutations.publishUnit({ unitId: currentUnit.id });
        }
      }
    } catch (error) {
      console.log("error", error);
      versionRef.current = currentUnit._version;
    } finally {
      endSaving();
    }
  }, []);

  // Create session object for backward compatibility with components expecting session.username
  const session = React.useMemo(
    () => ({
      username: user?.attributes?.sub,
      error: authSession?.error,
    }),
    [user?.attributes?.sub, authSession?.error],
  );

  // Initialize collaborative workbook when feature is enabled and grade exists
  const workbookEnabled = true; // Always enabled - uses mocks in Storybook

  const workbookCollaborationConfig = React.useMemo(() => {
    if (!workbookEnabled || !state.grade?.id) return null;

    return {
      gradeId: state.grade.id,
      user: {
        username: user?.attributes?.sub || "",
        role:
          authSession?.groups?.includes("Instructors") ||
          authSession?.groups?.includes("Moderators") ||
          authSession?.groups?.includes("Admins")
            ? "instructor"
            : "student",
        displayName:
          user?.attributes?.name ||
          user?.attributes?.email?.split("@")[0] ||
          user?.attributes?.sub ||
          "Anonymous",
        color:
          authSession?.groups?.includes("Instructors") ||
          authSession?.groups?.includes("Moderators") ||
          authSession?.groups?.includes("Admins")
            ? "#f59e0b"
            : "#3b82f6",
      },
      initialData: state.grade.data,
      wsUrl: process.env.NEXT_PUBLIC_YJS_WS_URL || "ws://localhost:3001",
      onTutorJoin: (tutor) => {
        console.log(`[UnitContext] Tutor ${tutor.displayName} joined to help!`);
      },
      onSyncToGrade: async (data, feedback) => {
        if (!state.grade) return;

        try {
          const parsed = typeof data === "string" ? JSON.parse(data) : data;
          const blocks = Object.values(parsed);

          // Calculate metrics from workbook data
          const completeBlocks = blocks.filter((b) => b.complete);
          const complete = blocks.length > 0 && blocks.every((b) => b.complete);
          const percentComplete =
            blocks.length > 0
              ? Math.round((completeBlocks.length / blocks.length) * 100)
              : 0;
          const accuracy =
            blocks.length > 0
              ? Math.round(
                  blocks.reduce((sum, b) => sum + (b.accuracy || 0), 0) /
                    blocks.length,
                )
              : 0;

          // Save to DataStore
          const client = getAmplifyClient();
          await client.models.Grade.update({
            id: state.grade.id,
            data: typeof data === "string" ? data : JSON.stringify(data),
            feedback: feedback
              ? JSON.stringify(feedback)
              : state.grade.feedback,
            complete,
            percentComplete,
            accuracy,
          });

          // Moderate async — backend persists to Grade.moderation
          moderateContent(data, {
            modelName: "Grade",
            recordId: state.grade.id,
          }).then((result) => {
            if (result.flagged) {
              console.warn(
                "[UnitContext] Workbook data flagged by moderation, saving for instructor review",
                {
                  categories: result.categories,
                  username: user?.attributes?.sub,
                },
              );
            }
          });

          console.log("[UnitContext] Synced workbook to Grade.data", {
            complete,
            percentComplete,
            accuracy,
          });
        } catch (error) {
          console.error("[UnitContext] Error syncing workbook:", error);
        }
      },
    };
  }, [
    workbookEnabled,
    state.grade?.id,
    state.grade?.data,
    user?.attributes,
    authSession?.groups,
  ]);

  // Use the workbook collaboration hook
  const workbookCollaboration = useWorkbookCollaboration(
    workbookCollaborationConfig,
  );

  // Keep ref in sync so saveGrade can access the provider without being in its dependency array
  React.useEffect(() => {
    workbookCollaborationRef.current = workbookCollaboration;
  }, [workbookCollaboration]);

  // Calculate workbook stats from live Yjs workbook data
  const workbookStats = React.useMemo(() => {
    if (!workbookCollaboration?.provider) {
      return { completion: 0, accuracy: 0, totalBlocks: 0, completeBlocks: 0 };
    }
    const completion = workbookCollaboration.getCompletionPercentage?.() || 0;
    const accuracy = workbookCollaboration.getOverallAccuracy?.() || 0;
    const data = workbookCollaboration.getWorkbookData?.() || {};
    const blocks = Object.values(data);
    return {
      completion,
      accuracy,
      totalBlocks: blocks.length,
      completeBlocks: blocks.filter((b) => b.complete).length,
    };
  }, [workbookCollaboration]);

  // Stable dispatch-based setters for consumers
  const setShowUnitComplete = React.useCallback(
    (val) =>
      dispatch({ type: actionTypes.SET_SHOW_UNIT_COMPLETE, payload: val }),
    [],
  );
  const setFinishedQuestions = React.useCallback(
    (val) =>
      dispatch({ type: actionTypes.SET_FINISHED_QUESTIONS, payload: val }),
    [],
  );
  const setPersonalBestResult = React.useCallback(
    (val) =>
      dispatch({ type: actionTypes.SET_PERSONAL_BEST_RESULT, payload: val }),
    [],
  );

  const contextValue = React.useMemo(
    () => ({
      unit: state.unit,
      name,
      rubric: state.rubric,
      grade: state.grade,
      recentGrades: state.recentGrades,
      dictionary: state.dictionary,
      files: state.files,
      questionBank: state.questionBank,
      playlistUrls: state.playlistUrls,
      description,
      editorStateRef,
      editorSelectionRef,
      editorRef,
      versionRef,
      unitRef,
      unitVersion,
      finishedQuestions: state.finishedQuestions,
      showUnitComplete: state.showUnitComplete,
      personalBestResult: state.personalBestResult,
      setPersonalBestResult,
      permissionError: state.permissionError,
      handleBeforeUnload,
      setShowUnitComplete,
      setFinishedQuestions,
      saveName,
      saveDescription,
      handleDelete,
      handleStatusChange,
      saveEditorContent,
      saveGrade,
      checkUnitEditPermission,
      checkUnitViewPermission,
      createGrade,
      session,
      // Workbook collaboration features
      workbook: workbookCollaboration,
      workbookStats,
      workbookEnabled,
      // Practice drill features
      practiceSessions: state.practiceSessions,
      createPracticeSession,
      updatePracticeSession,
      // Save state
      isSaving: state.isSaving,
      beginSaving,
      endSaving,
      // Section context for chat
      sectionId,
    }),
    [
      state.unit,
      name,
      state.rubric,
      state.grade,
      state.recentGrades,
      state.dictionary,
      state.files,
      state.questionBank,
      state.playlistUrls,
      description,
      state.finishedQuestions,
      checkUnitEditPermission,
      checkUnitViewPermission,
      state.showUnitComplete,
      state.personalBestResult,
      setPersonalBestResult,
      state.permissionError,
      session,
      handleBeforeUnload,
      saveName,
      saveDescription,
      handleDelete,
      handleStatusChange,
      saveEditorContent,
      saveGrade,
      createGrade,
      workbookCollaboration,
      workbookStats,
      workbookEnabled,
      state.practiceSessions,
      createPracticeSession,
      updatePracticeSession,
      state.isSaving,
      beginSaving,
      endSaving,
      sectionId,
    ],
  );

  return (
    <UnitContext.Provider value={contextValue}>{children}</UnitContext.Provider>
  );
};

export { UnitProvider };

export default UnitContext;
