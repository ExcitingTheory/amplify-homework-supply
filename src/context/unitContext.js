import * as React from "react";
import { useState, useRef, createContext } from "react";
import { DataStore, SortDirection } from "aws-amplify/datastore";
import { fetchUserAttributes } from "aws-amplify/auth";
import { Unit, Grade } from "../models"
import { useRouter } from 'next/router';
import { Hub, Cache } from "aws-amplify/utils";

import getCachedUrl from '../utils/getCachedUrl'
// Provider and Consumer are connected through their "parent" context
const UnitContext = createContext();

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

  const name = unit?.name;
  const description = unit?.description;

  const router = useRouter();

  const [grade, setGrade] = React.useState({});
  const [recentGrades, setRecentGrades] = React.useState([]);
  const [session, setSession] = React.useState({
    error: undefined,
    username: undefined,
  });

  const isLoading = React.useRef(false)

  // const [featuredImageUrl, setFeaturedImageUrl] = React.useState(null);

  const rubricLength = rubric.length || 0
  const unitVersion = unit?._version || 0
  const unitOwner = unit?.owner || ''

  console.log('UnitProvider.rubricLength', rubricLength)
  console.log("Searching for in progress assignment for unitId:", id, "unitVersion", unitVersion)

  // 
  // cache username


  const fetchCurrentUsername = async () => {
      const { sub: username } = await fetchUserAttributes();
      isLoading.current = false
      setSession({username});
  }

  React.useEffect(() => {
    if (!isLoading.current) {
      isLoading.current = true
      fetchCurrentUsername()
    }
  }, [])

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
    console.log('useEffect.handleAuth', handleAuth)
    return unsubscribe;
  }, [handleAuth]);




  const verifyAccuracy = (data) => {
    let total = 0
    let accuracy = 0
    // let correct = 0
    if (data) {
      Object.entries(data).forEach(g => {
        console.log('verifyAccuracy.data', g)

        console.log('g[1]', g[1])
        console.log('g[1]?.complete', g[1]?.complete)

        if (g[1]?.complete === true && g[1]?.accuracy) {
          let _accuracy = parseInt(g[1]?.accuracy)
          if (_accuracy > 1) {
            _accuracy = _accuracy / 100
          }
          total++
          console.log('verifyAccuracy.complete', g)
          accuracy += _accuracy
          console.log('verifyAccuracy._accuracy', _accuracy)
        }
        if (g[1]?.learn?.accuracy) {
          total++
          console.log('verifyAccuracy.learn', g[1]?.learn?.accuracy)
          accuracy += parseInt(g[1]?.learn?.accuracy)
        }
        if (g[1]?.easy?.accuracy) {
          total++
          console.log('verifyAccuracy.easy', g[1]?.easy?.accuracy)
          accuracy += parseInt(g[1]?.easy?.accuracy)
        }
        if (g[1]?.hard?.accuracy) {
          total++
          console.log('verifyAccuracy.hard', g[1]?.hard?.accuracy)
          accuracy += parseInt(g[1]?.hard?.accuracy)
        }
      })
    }
    console.log('verifyAccuracy.total', total)
    console.log('verifyAccuracy.accuracy', accuracy)
    accuracy = accuracy / total
    console.log('verifyAccuracy.accuracyOfAssignment', accuracy)
    return accuracy * 100
  }


  const createGrade = async (unitAccuracy, unitIsComplete) => {
    const _grade = await DataStore.save(
      new Grade({
        unitID: id,
        // use the unit owner as the instructor
        instructor: unitOwner,
        // owner: username,
        unitVersion: unitVersion,
        complete: false,
        unitAccuracy,
        unitIsComplete
      })
    );

    setGrade(_grade)
    return _grade
  }

  const saveGrade = async (data) => {

    // let _grade = grade

    // Count the total number of expected questions to later compare to the number expected in the unit
    let _finishedQuestions = 0
    if (data) {
      Object.entries(data).forEach(g => {
        console.log('saveGrade.data', g)
        if (g[1]?.complete === true) {
          _finishedQuestions++
          // Count as a graded assignment
          console.log('saveGrade._finishedQuestions', _finishedQuestions)
        }
      })
    }
    console.log('saveGrade.rubric', rubricLength)
    let unitIsComplete = false
    let unitAccuracy = null
    if (_finishedQuestions === rubricLength) {
      unitIsComplete = true
      unitAccuracy = verifyAccuracy(data)
    }

    console.log("saveGrade.unitIsComplete", unitIsComplete)
    console.log("saveGrade.data", data)
    console.log("_finishedQuestions", _finishedQuestions)

    setFinishedQuestions(_finishedQuestions)

    try {
      if (!grade) {
        console.log("making new grade!!!")
        await createGrade(unitAccuracy, unitIsComplete)
      }
      console.log("saving!!!")
      await DataStore.save(
        Grade.copyOf(grade, updated => {
          updated.data = data
          updated.accuracy = unitAccuracy
          updated.complete = unitIsComplete // The entire assignment is completed
        })
      );
      console.log("Saved!!!") 
      if(unitIsComplete && !unit?.timeLimitSeconds) {
        setShowUnitComplete(true)
        setFinishedQuestions(0)
        console.log("unit?.timeLimitInSeconds", unit?.timeLimitInSeconds)
        console.log("createGrade(0, false)")
        await createGrade(0, false)
      }
    } catch (errors) {
      console.error(errors)
      // throw new Error(errors[0].message)
    }
  }

  React.useEffect(() => {
    if (!id || !unitVersion) {
      return
    }

    async function _getGrade() {

      let {
        username
      } = session

      const subscription = DataStore.observeQuery(
        Grade,
        g => g.and(g => [
          g.owner.eq(username),
          g.unitID.eq(id),
          g.unitVersion.eq(unitVersion),
          g.complete.eq(false)
        ]), {
        sort: g => g.createdAt(SortDirection.DESCENDING)
      }
      ).subscribe(snapshot => {
        const { items } = snapshot;
        // console.log('items', items)
        setGrade(items[0]);
        setUsername(username)
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    _getGrade()

  }, [id, unitVersion]);


  React.useEffect(() => {
    if (!id || !unitVersion) {
      return
    }

    async function _getGrades() {

      let {
        username
      } = session


      const subscription = DataStore.observeQuery(
        Grade,
        g => g.and(g => [
          g.owner.eq(username),
          g.unitID.eq(id),
          g.unitVersion.eq(unitVersion),
          g.complete.eq(true)
        ]), {
        sort: g => g.accuracy(SortDirection.DESCENDING).createdAt(SortDirection.DESCENDING),
      }
      ).subscribe(snapshot => {
        const { items } = snapshot;
        const _items = items.slice(0, 5)
        setRecentGrades(_items);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    _getGrades()

  }, [id, unitVersion]);

  React.useEffect(() => {

    if (!id) return

    async function fetchUnits() {

      const subscription = DataStore.observeQuery(Unit,
        s => s.id.eq(id)
      ).subscribe(async ({ items }) => {
        // Except for first render check if the version has changed before updating the editor
        const _newUnit = items[0]

        // if (versionRef.current >= _newUnit?._version) return // don't update the editor if the version is the same


        const _files = {}
        const _dictionary = {}
        const _questionBank = {}
        const _playlistUrls = {}
        const urlsWork = []
        const urlsIds = []

        setUnit(_newUnit);
        if(!_newUnit) return 

        const _unitWords = await _newUnit.words.toArray()
        const _unitFiles = await _newUnit.files.toArray()
        const _unitQuestions = await _newUnit.questions.toArray()

        console.log('_unitWords', _unitWords)
        console.log('_unitFiles', _unitFiles)

        const _unitWordsWork = _unitWords.map(async w => {
          // console.log('wordwordwordword', w)
          return await w.word 
        })

        const _unitFilesWork = _unitFiles.map(async f => {
          // console.log('wordwordwordword', f)
          return await f.file 
        })

        const _unitQuestionsWork = _unitQuestions.map(async q => {
          // console.log('wordwordwordword', f)
          return await q.question
        })

        const _words = await Promise.allSettled(_unitWordsWork)
        const _unitsFiles = await Promise.allSettled(_unitFilesWork)
        const _questions = await Promise.allSettled(_unitQuestionsWork)

        console.log('_unitsFiles', _unitsFiles)
        console.log('_words', _words)
        console.log('_questions', _questions)

        _words.forEach(w => {
          const _w = w.value
          _dictionary[_w.id] = _w
        })

        _unitsFiles.forEach(async f => {
          console.log(' _unitsFiles.forEach f', f)
          const _f = f.value
          _files[_f.id] = _f
        })

        _questions.forEach(q => {
          const _q = q.value
          _questionBank[_q.id] = _q
        })

        const _urlsOutput = await Promise.allSettled(urlsWork)

        _urlsOutput.forEach((item, key) => {
          console.log("unitContext.item::: ", item) 
          if (item.status === 'fulfilled') {
            const _url = item.value
            const urlsId = urlsIds[key]
            _playlistUrls[urlsId] = _url
          }
        })

        console.log('_dictionary', _dictionary)
        console.log('_files', _files)
        console.log('_questionBank', _questionBank)
        
        setDictionary(_dictionary);
        setFiles(_files);
        setPlaylistUrls(_playlistUrls);
        setQuestionBank(_questionBank);

        console.log("unit_playlistUrls::: ", _playlistUrls)


        editorStateRef.current = _newUnit?.data;
        versionRef.current = unit?._version

        const blocks = _newUnit?.data?.root?.children || []
        const _rubric = []

        if (blocks.length > 0) {
          blocks.forEach(block => {
            if (gradedBlockTypes.includes(block['type'])) {
              _rubric.push(block['key'])
            }
          })

          setRubric(_rubric)
        }

      });
      return () => {
        subscription.unsubscribe();
      };
    }

    fetchUnits()
  }, [id]);

  const saveEditorContent = async (editorContent) => {
    const {sub} = await fetchUserAttributes();

    if (!sub) return
    if (!unit?.id) return
    if (!id) return

    // For now prevent non owners from saving TODO: add a permission check
    if (unit?.owner !== sub) return false

    let _editorContent = editorContent? editorContent : editorStateRef.current

    const content = JSON.stringify(_editorContent)
    const unitData = JSON.stringify(unit?.data)
    // console.log('saveEditorContent', content)
    // if the content is the same as the content in the database, don't save
    if (content === unitData) return
    // if the version is behind the current version, don't save
    if (versionRef.current >= unit?._version) return

    try {
      await DataStore.save(
        Unit.copyOf(unit, updated => {
          updated.data = content;
        })
      );
      console.log('saved')
    } catch (errors) {
      console.error(errors)
    }
  }

  const handleDelete = async () => {
    /**
     * This deletes the unit from the database.
     * It is called from the Editor component.
     * It is passed to the Editor component through the unit context.
     */
    try {
      const deleted = await DataStore.delete(unit);
      // console.log('deleted', deleted)
      router.push(`/units`)
    } catch (errors) {
      console.error(errors)
    }
  }

  const saveDescription = async (description) => {
    try {
      await DataStore.save(
        Unit.copyOf(unit, updated => {
          updated.description = description;
        })
      );
    } catch (errors) {
      console.error(errors)
    }
  }

  const saveName = async (name) => {
    try {
      await DataStore.save(
        Unit.copyOf(unit, updated => {
          updated.name = name;
        })
      );
    } catch (errors) {
      console.error(errors)
    }
  }

  const handleBeforeUnload = async (event) => {
    // If content is different then save it
    // if(!unit?.data) return false;
    const content = JSON.stringify(editorStateRef.current)
    const unitData = JSON.stringify(unit?.data)

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
};

  const handleStatusChange = async (status) => {

    if (status === 'PUBLISHED') {
      // check if the unit has a name and description
      if (!name || !description) {
        alert('Please add a name and description to your unit before publishing.');
        return;
      }
    }

    try {
      await DataStore.save(
        Unit.copyOf(unit, updated => {
          updated.status = status;
        })
      );
    } catch (error) {
      console.log('error', error);
    }

  }

  return (
    <UnitContext.Provider
      value={{
        unit,
        name,
        rubric,
        grade,
        recentGrades,
        dictionary,
        files,
        questionBank,
        // featuredImageUrl,
        playlistUrls,
        description,
        editorStateRef,
        editorSelectionRef,
        versionRef,
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
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export { UnitProvider };

export default UnitContext;