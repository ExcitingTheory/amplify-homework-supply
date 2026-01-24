import * as React from "react";
import { useState, useRef, createContext } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from 'next/router';
import { Hub, Cache } from "aws-amplify/utils";
import { moderateContent, buildModerationFields } from '../utils/moderateContent';
import { getAmplifyClient } from '../utils/amplifyClient';

import getCachedUrl from '../utils/getCachedUrl'
// Provider and Consumer are connected through their "parent" context
const UnitContext = createContext({});

export const gradedBlockTypes = [
  'quiz',
  'meaning-association',
  'answer',
  'custom-answer',
]
const UnitProvider = ({ children, id }) => {

  const [unit, setUnit] = useState({});
  const [dictionary, setDictionary] = useState({});
  const [questionBank, setQuestionBank] = useState({});
  const [files, setFiles] = useState({});
  const [rubric, setRubric] = useState([])
  const [finishedQuestions, setFinishedQuestions] = useState(0)
  const [showUnitComplete, setShowUnitComplete] = useState(false)
  const [playlistUrls, setPlaylistUrls] = React.useState({})
  const [username, setUsername] = React.useState(null);

  const versionRef = useRef(0);
  const editorStateRef = useRef();
  const editorSelectionRef = useRef();
  const editorRef = useRef(null);
  const unitRef = useRef({});
  const usernameRef = useRef(null);

  // Memoize derived values to prevent recalculation on every render
  const name = React.useMemo(() => unit?.name, [unit?.name]);
  const description = React.useMemo(() => unit?.description, [unit?.description]);
  const timeLimitSeconds = React.useMemo(() => unit?.timeLimitSeconds, [unit?.timeLimitSeconds]);

  const router = useRouter();

  const [grade, setGrade] = React.useState({});
  const [recentGrades, setRecentGrades] = React.useState([]);
  const [session, setSession] = React.useState({
    error: undefined,
    username: undefined,
  });

  const isLoading = React.useRef(false)

  // const [featuredImageUrl, setFeaturedImageUrl] = React.useState(null);

  // Memoize derived values to prevent recalculation on every render
  const rubricLength = React.useMemo(() => rubric.length || 0, [rubric.length]);
  const unitVersion = React.useMemo(() => unit?._version || 0, [unit?._version]);
  const unitOwner = React.useMemo(() => unit?.owner || '', [unit?.owner]);

  // 
  // cache username


  const fetchCurrentUsername = React.useCallback(async () => {
      try {
        const { sub: username } = await fetchUserAttributes();
        isLoading.current = false
        usernameRef.current = username;
        setSession({username});
      } catch (error) {
        // Suppress benign Cognito 400 errors in development
        if (error?.name !== 'NotAuthorizedException' && error?.statusCode !== 400) {
          console.error('[UnitContext] Error fetching user attributes:', error);
        }
        isLoading.current = false;
      }
  }, [])

  React.useEffect(() => {
    if (!isLoading.current) {
      isLoading.current = true
      fetchCurrentUsername()
    }
  }, [fetchCurrentUsername])

  const handleAuth = React.useCallback(
    ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
        case "signUp":
        case "tokenRefresh":
        case "autoSignIn": {
        if (!isLoading.current) {
          isLoading.current = true
          fetchCurrentUsername({force: true});
          }
          break;
          
        }
        case "signedOut": {
          isLoading.current = false
          usernameRef.current = null;
          setSession({ username: undefined, error: undefined });
          break;
        }
        case "tokenRefresh_failure":
        case "signIn_failure": {
          isLoading.current = false
          setSession({ error: payload.data });
          break;
        }
        case "autoSignIn_failure": {
          isLoading.current = false
          setSession({ error: new Error(payload.message) });
          break;
        }
        default: {
          break;
        }
      }
    },
    [fetchCurrentUsername]
  );

  React.useEffect(() => {
    const unsubscribe = Hub.listen("auth", handleAuth, "useAuth");
    return unsubscribe;
  }, [handleAuth]);




  const verifyAccuracy = React.useCallback((data) => {
    let total = 0
    let accuracy = 0
    if (data) {
      Object.entries(data).forEach(g => {
        if (g[1]?.complete === true && g[1]?.accuracy) {
          let _accuracy = parseInt(g[1]?.accuracy)
          if (_accuracy > 1) {
            _accuracy = _accuracy / 100
          }
          total++
          accuracy += _accuracy
        }
        if (g[1]?.learn?.accuracy) {
          total++
          accuracy += parseInt(g[1]?.learn?.accuracy)
        }
        if (g[1]?.easy?.accuracy) {
          total++
          accuracy += parseInt(g[1]?.easy?.accuracy)
        }
        if (g[1]?.hard?.accuracy) {
          total++
          accuracy += parseInt(g[1]?.hard?.accuracy)
        }
      })
    }
    accuracy = accuracy / total
    return accuracy * 100
  }, []);


  const createGrade = React.useCallback(async (unitAccuracy, unitIsComplete) => {
    // Ensure we have authentication before creating grade
    const currentUsername = usernameRef.current;
    if (!currentUsername) {
      throw new Error("User not authenticated - cannot create grade");
    }

    const client = getAmplifyClient();
    const currentUnit = unitRef.current;
    
    const { data: _grade, errors } = await client.models.Grade.create({
      unitID: id,
      // use the unit owner as the instructor
      instructor: currentUnit?.owner || '',
      // Owner will be auto-populated by Amplify based on auth
      unitVersion: currentUnit?._version || 0,
      complete: unitIsComplete,
      accuracy: unitAccuracy
    });

    if (errors) {
      console.error('[createGrade] Error creating grade:', errors);
      throw new Error('Failed to create grade');
    }

    setGrade(_grade);
    return _grade;
  }, [id]);

  const saveGrade = React.useCallback(async (data) => {

    // let _grade = grade

    // Count the total number of expected questions to later compare to the number expected in the unit
    let _finishedQuestions = 0
    if (data) {
      Object.entries(data).forEach(g => {
        if (g[1]?.complete === true) {
          _finishedQuestions++
        }
      })
    }
    let unitIsComplete = false
    let unitAccuracy = null
    if (_finishedQuestions === rubricLength) {
      unitIsComplete = true
      unitAccuracy = verifyAccuracy(data)
    }

    setFinishedQuestions(_finishedQuestions)

    try {
      // Moderate student submission data
      const moderationResult = await moderateContent(data);
      const moderationFields = buildModerationFields(moderationResult);
      
      if (moderationResult.flagged) {
        console.warn('[UnitContext] Student submission flagged by moderation, saving for instructor review', {
          categories: moderationResult.categories,
          username: session.username
        });
      }

      if (!grade) {
        const newGrade = await createGrade(unitAccuracy, unitIsComplete)
        // Use the newly created grade for the update operation
        if (newGrade && newGrade.id) {
          const client = getAmplifyClient();
          await client.models.Grade.update({
            id: newGrade.id,
            data: JSON.stringify(data),
            accuracy: unitAccuracy,
            complete: unitIsComplete,
            moderationStatus: moderationFields.moderationStatus,
            moderationFlags: moderationFields.moderationFlags ? JSON.stringify(moderationFields.moderationFlags) : null,
            moderationCheckedAt: moderationFields.moderationCheckedAt,
          });
        }
      } else if (grade && grade.id) {
        // Only proceed if grade is a valid model instance
        const client = getAmplifyClient();
        await client.models.Grade.update({
          id: grade.id,
          data: JSON.stringify(data),
          accuracy: unitAccuracy,
          complete: unitIsComplete,
          moderationStatus: moderationFields.moderationStatus,
          moderationFlags: moderationFields.moderationFlags ? JSON.stringify(moderationFields.moderationFlags) : null,
          moderationCheckedAt: moderationFields.moderationCheckedAt,
        });
      } else {
        console.error("Invalid grade object:", grade)
        // Create a new grade if the existing one is invalid
        const newGrade = await createGrade(unitAccuracy, unitIsComplete)
        if (newGrade && newGrade.id) {
          const client = getAmplifyClient();
          await client.models.Grade.update({
            id: newGrade.id,
            data: JSON.stringify(data),
            accuracy: unitAccuracy,
            complete: unitIsComplete,
            moderationStatus: moderationFields.moderationStatus,
            moderationFlags: moderationFields.moderationFlags ? JSON.stringify(moderationFields.moderationFlags) : null,
            moderationCheckedAt: moderationFields.moderationCheckedAt,
          });
        }
      }
      if(unitIsComplete && !timeLimitSeconds) {
        setShowUnitComplete(true)
        setFinishedQuestions(0)
        await createGrade(0, false)
      }
    } catch (error) {
      console.error("Error saving grade:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
      
      // If it's an authentication error, try to refresh auth
      if (error.message?.includes("auth") || error.message?.includes("Auth")) {
        console.log("Authentication error detected, attempting to fetch user...")
        try {
          await fetchCurrentUsername()
        } catch (authError) {
          console.error("Failed to refresh authentication:", authError)
        }
      }
      
      // Re-throw to let calling code handle it
      throw error
    }
  }, [rubricLength, grade, createGrade, timeLimitSeconds, fetchCurrentUsername]);

  React.useEffect(() => {
    if (!id || !unitVersion || !session.username) {
      return
    }

    const username = session.username;
    const client = getAmplifyClient();

    // Subscribe to grades for this unit and user
    const subscription = client.models.Grade.observeQuery({
      filter: {
        owner: { eq: username },
        unitID: { eq: id },
        unitVersion: { eq: unitVersion }
      },
      sortDirection: 'DESC',
      sortField: 'createdAt'
    }).subscribe({
      next: ({ items }) => {
        // Filter client-side
        const incompleteGrades = items.filter(grade => !grade.complete);
        const completedGrades = items.filter(grade => grade.complete);
        
        // Handle current grade (most recent incomplete)
        const currentGrade = incompleteGrades[0];
        
        setGrade(currentGrade);
        setUsername(username);
        
        // Calculate finished questions from the current grade data
        if (currentGrade?.data) {
          let _finishedQuestions = 0;
          const gradeData = typeof currentGrade.data === 'string' 
            ? JSON.parse(currentGrade.data) 
            : currentGrade.data;
          Object.entries(gradeData).forEach(([key, value]) => {
            if (value?.complete === true) {
              _finishedQuestions++;
            }
          });
          setFinishedQuestions(_finishedQuestions);
        } else {
          setFinishedQuestions(0);
        }
        
        // Handle recent grades (top 5 completed, sorted by accuracy then date)
        const sortedCompletedGrades = completedGrades
          .sort((a, b) => {
            if (b.accuracy !== a.accuracy) {
              return (b.accuracy || 0) - (a.accuracy || 0);
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, 5);
        
        setRecentGrades(sortedCompletedGrades);
      },
      error: (error) => {
        console.error('[UnitContext] Grade subscription error:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };

  }, [id, unitVersion, session.username]);

  React.useEffect(() => {
    if (!id) return

    const client = getAmplifyClient();

    const subscription = client.models.Unit.observeQuery({
      filter: {
        id: { eq: id }
      }
    }).subscribe({
      next: async ({ items }) => {
        const _newUnit = items[0]
        
        if (!_newUnit) {
          setUnit({});
          return;
        }

        // Only update if version has actually changed
        if (versionRef.current === _newUnit?._version) {
          return;
        }

        const _files = {}
        const _dictionary = {}
        const _questionBank = {}
        const _playlistUrls = {}

        // Load related words via join table
        const { data: _unitWords } = await client.models.UnitWord.list({
          filter: { unitID: { eq: id } }
        });

        // Load related files via join table
        const { data: _unitFiles } = await client.models.UnitFile.list({
          filter: { unitID: { eq: id } }
        });

        // Load related questions via join table
        const { data: _unitQuestions } = await client.models.QuestionUnit.list({
          filter: { unitID: { eq: id } }
        });

        // Fetch full Word objects
        const _unitWordsWork = (_unitWords || []).map(async uw => {
          if (uw.wordID) {
            const { data } = await client.models.Word.get({ id: uw.wordID });
            return data;
          }
          return null;
        });

        // Fetch full File objects
        const _unitFilesWork = (_unitFiles || []).map(async uf => {
          if (uf.fileID) {
            const { data } = await client.models.File.get({ id: uf.fileID });
            return data;
          }
          return null;
        });

        // Fetch full Question objects
        const _unitQuestionsWork = (_unitQuestions || []).map(async uq => {
          if (uq.questionID) {
            const { data } = await client.models.Question.get({ id: uq.questionID });
            return data;
          }
          return null;
        });

        const _words = await Promise.allSettled(_unitWordsWork)
        const _unitsFiles = await Promise.allSettled(_unitFilesWork)
        const _questions = await Promise.allSettled(_unitQuestionsWork)

        _words.forEach(w => {
          if (w.status === 'fulfilled' && w.value) {
            const _w = w.value
            _dictionary[_w.id] = _w
          }
        })

        _unitsFiles.forEach(f => {
          if (f.status === 'fulfilled' && f.value) {
            const _f = f.value
            _files[_f.id] = _f
          }
        })

        _questions.forEach(q => {
          if (q.status === 'fulfilled' && q.value) {
            const _q = q.value
            _questionBank[_q.id] = _q
          }
        })

        // Parse unit data (Gen2 stores JSON as string)
        const unitData = typeof _newUnit?.data === 'string' 
          ? JSON.parse(_newUnit.data) 
          : _newUnit?.data;

        const blocks = unitData?.root?.children || []
        const _rubric = []

        if (blocks.length > 0) {
          blocks.forEach(block => {
            if (gradedBlockTypes.includes(block['type'])) {
              _rubric.push(block['key'])
            }
          })
        }

        // Update all state - version check ensures data has changed
        unitRef.current = _newUnit;
        setUnit(_newUnit);
        setDictionary(_dictionary);
        setFiles(_files);
        setPlaylistUrls(_playlistUrls);
        setQuestionBank(_questionBank);
        setRubric(_rubric);

        editorStateRef.current = unitData;
        versionRef.current = _newUnit?._version
      },
      error: (error) => {
        console.error('[UnitContext] Unit subscription error:', error);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const saveEditorContent = React.useCallback(async (editorContent) => {
    const currentUnit = unitRef.current;

    // Guard: Don't save if unit is not loaded or is invalid
    if (!currentUnit || !currentUnit.id) {
      console.warn('[saveEditorContent] Cannot save - unit not loaded yet');
      return;
    }

    let _editorContent = editorContent ? editorContent : editorStateRef.current;

    const newContent = typeof _editorContent === 'string' 
      ? _editorContent 
      : JSON.stringify(_editorContent);

    try {
      // Moderate content before saving (runs async, doesn't block)
      const moderationResult = await moderateContent(newContent);
      const moderationFields = buildModerationFields(moderationResult);
      
      if (moderationResult.flagged) {
        console.warn('[UnitContext] Content flagged by moderation, saving anyway for instructor review', {
          categories: moderationResult.categories
        });
      }

      // Save with Gen2 client
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: currentUnit.id,
        data: newContent,
        moderationStatus: moderationFields.moderationStatus,
        moderationFlags: moderationFields.moderationFlags ? JSON.stringify(moderationFields.moderationFlags) : null,
        moderationCheckedAt: moderationFields.moderationCheckedAt,
      });
    } catch (errors) {
      console.error('[saveEditorContent] Save failed:', errors);
    }
  }, [id]);

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
      router.push(`/units`)
    } catch (errors) {
      console.error(errors)
    }
  }, [router]);

  const saveDescription = React.useCallback(async (description) => {
    const currentUnit = unitRef.current;
    try {
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: currentUnit.id,
        description: description,
      });
    } catch (errors) {
      console.error(errors)
    }
  }, []);

  const saveName = React.useCallback(async (name) => {
    const currentUnit = unitRef.current;
    try {
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: currentUnit.id,
        name: name,
      });
    } catch (errors) {
      console.error(errors)
    }
  }, []);

  const handleBeforeUnload = React.useCallback(async (event) => {
    // If content is different then save it
    const currentUnit = unitRef.current;
    const content = JSON.stringify(editorStateRef.current)
    const unitData = JSON.stringify(currentUnit?.data)

    console.log('unitData', unitData)
    if (content === unitData) {
        event.returnValue = null;
        console.log('content === unitData', content)
        console.log('!!!+=======', unitData)
    } else {
        console.log('content !== unitContent', content)
        console.log('!!!+=======', unitData)
        event.preventDefault();
        await saveEditorContent()
    }
}, [saveEditorContent]);

  const handleStatusChange = React.useCallback(async (status) => {
    const currentUnit = unitRef.current;
    const currentName = currentUnit?.name;
    const currentDescription = currentUnit?.description;

    if (status === 'PUBLISHED') {
      // check if the unit has a name and description
      if (!currentName || !currentDescription) {
        alert('Please add a name and description to your unit before publishing.');
        return;
      }
    }

    try {
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: currentUnit.id,
        status: status,
      });
    } catch (error) {
      console.log('error', error);
    }

  }, []);

  const contextValue = React.useMemo(() => ({
    unit,
    name,
    rubric,
    grade,
    recentGrades,
    dictionary,
    files,
    questionBank,
    playlistUrls,
    description,
    editorStateRef,
    editorSelectionRef,
    editorRef,
    versionRef,
    unitRef,
    finishedQuestions,
    showUnitComplete,
    handleBeforeUnload,
    setShowUnitComplete,
    setFinishedQuestions,
    saveName,
    saveDescription,
    handleDelete,
    handleStatusChange,
    saveEditorContent,
    saveGrade,
    createGrade,
    session,
  }), [
    unit,
    name,
    rubric,
    grade,
    recentGrades,
    dictionary,
    files,
    questionBank,
    playlistUrls,
    description,
    finishedQuestions,
    showUnitComplete,
    session,
    handleBeforeUnload,
    saveName,
    saveDescription,
    handleDelete,
    handleStatusChange,
    saveEditorContent,
    saveGrade,
    createGrade,
  ]);

  return (
    <UnitContext.Provider value={contextValue}>
      {children}
    </UnitContext.Provider>
  );
}

export { UnitProvider };

export default UnitContext;