import * as React from "react";
import { useEffect } from "react";
import DictionaryContext from "../../context/dictionaryContext";
import UnitContext from "../../context/unitContext";
import {
  Grid,
  List,
  ListItem,
  Box,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { AnswerDropLearn, ResultDropLearn } from ".";
import { DragBox } from "./DragBox";
import { shuffle, calcCardWidth } from "./utils";

export const Learn = ({
  tabIndex,
  setTabIndex,
  nodeKey,
  wordIDs,
  enabledModes = ["learn", "easy", "hard"],
  nextMode = "easy",
  nextModeLabel = "Easy",
  onProgressChange,
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
}) => {
  const [answers, setAnswers] = React.useState([]);
  const [length, setLength] = React.useState();
  const [vocabulary, setVocabulary] = React.useState([]);
  let [assignment, setAssignment] = React.useState([]);

  const [filterLearn, setFilterLearn] = React.useState([]);
  const [startPositionLearn, setStartPositionLearn] = React.useState(0);
  const [dropAnswerVisibility, setDropAnswerVisibility] = React.useState([]);
  const [droppedPairs, setDroppedPairs] = React.useState({}); // Track which answer was dropped on which target
  const [showCompletion, setShowCompletion] = React.useState(false);
  const hasAutoShownCompletion = React.useRef(false);

  // Seed combines nodeKey with a per-mount random value so order
  // differs each visit but stays stable within the session
  const mountSeed = React.useRef(Math.floor(Math.random() * 2147483647));
  const shuffleSeed = React.useMemo(() => {
    let hash = mountSeed.current;
    const str = String(nodeKey) + "-learn";
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [nodeKey]);

  const { wordMapId: dictionary } = React.useContext(DictionaryContext);

  useEffect(() => {
    // Use dictionary context instead of DataStore for Storybook compatibility
    const _vocabulary = wordIDs.map((id) => dictionary[id]).filter(Boolean);
    console.log("Learn._vocabulary", _vocabulary);
    setVocabulary(_vocabulary);
    setAssignment([..._vocabulary]);
    setAnswers([..._vocabulary]);
    setLength(_vocabulary.length);
  }, [wordIDs, dictionary]);

  const { grade, saveGrade } = React.useContext(UnitContext);
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === "string") {
      try {
        return JSON.parse(grade.data);
      } catch {
        return {};
      }
    }
    return grade.data;
  }, [grade?.data]);
  const inProgress = gradeData[nodeKey] || {};

  // Show completion screen once when exercise completes — don't re-show after dismiss
  React.useEffect(() => {
    const isComplete = inProgress?.learn?.complete;
    if (isComplete && !hasAutoShownCompletion.current) {
      hasAutoShownCompletion.current = true;
      setShowCompletion(true);
    }
  }, [inProgress?.learn?.complete]);

  // Update progress state when grade data changes
  useEffect(() => {
    if (inProgress && Object.keys(inProgress).length > 0) {
      const verified = inProgress?.learn?.verifiedAnswers || [];
      const pairs = inProgress?.learn?.droppedPairs || {};

      setFilterLearn(verified);
      setStartPositionLearn(verified.length);
      setDropAnswerVisibility(verified);
      setDroppedPairs(pairs);
    }
  }, [inProgress]);

  // Stable shuffled orders — computed once when answers load, never reshuffled mid-exercise
  const stableAssignment = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 2);
  }, [answers, shuffleSeed]);

  const shuffledDragOrder = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 1);
  }, [answers, shuffleSeed]);

  // Calculate drag card width based on longest unbroken word
  const cardWidth = React.useMemo(() => {
    const labels = answers
      .map((word) => (promptFor === "word" ? word?.definition : word?.phrase))
      .filter(Boolean);
    return calcCardWidth(labels);
  }, [answers, promptFor]);

  const cardPanelWidth = cardWidth + 16;

  // Filter out matched cards from stable drag order — no reshuffling
  const easyVocab = shuffledDragOrder
    .filter((word) => !filterLearn.includes(word?.id))
    .map((word) => (
      <DragBox
        answer={promptFor === "word" ? word.definition : word.phrase}
        wordID={word.id}
        key={word.id}
        cardWidth={cardWidth}
      />
    ));

  const easyAssignment = stableAssignment;
  const verifiedAnswers = filterLearn;

  const totalWords = stableAssignment.length;
  const currentQuestion = startPositionLearn;

  const attemptedAnswersRef = React.useRef({});

  React.useEffect(() => {
    attemptedAnswersRef.current = inProgress?.learn?.attemptedAnswers || {};
  }, [inProgress?.learn?.attemptedAnswers]);

  async function progressAssignment(draggedWordID, targetWordID) {
    // Verify the match is correct
    if (draggedWordID !== targetWordID) {
      console.error(
        "Mismatch in progressAssignment:",
        draggedWordID,
        targetWordID,
      );
      return;
    }

    const newIndex = verifiedAnswers.length + 1;
    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;

    // Use the current state values
    // Track which answer was dropped on which target
    let _droppedPairs = { ...droppedPairs };
    _droppedPairs[targetWordID] = draggedWordID; // Store the dropped wordID for this target

    // Add correctly matched wordID to verified list
    const _verified = [...new Set([...verifiedAnswers, targetWordID])];

    // Add to attempted answers
    let _attemptedAnswers = JSON.parse(
      JSON.stringify(attemptedAnswersRef.current),
    );

    if (typeof _attemptedAnswers[targetWordID] === "undefined") {
      _attemptedAnswers[targetWordID] = [];
    }

    _attemptedAnswers[targetWordID].push(draggedWordID);
    attemptedAnswersRef.current = _attemptedAnswers;
    const attempts = Object.values(_attemptedAnswers).reduce(
      (total, answers) => total + answers.length,
      0,
    );

    if (_verified.length === totalWords) {
      thisExerciseComplete = true;
      // check for top level complete, all assignments are completed
      allTabsComplete = enabledModes.every(
        (mode) => mode === "learn" || inProgress[mode]?.complete,
      );

      // Don't auto-advance, show completion screen instead
      // newTab++;
    }

    // Handle grade.data - it might be a string or object
    let gradeData = grade?.data || {};
    if (typeof gradeData === "string") {
      try {
        gradeData = JSON.parse(gradeData);
      } catch (e) {
        gradeData = {};
      }
    }
    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        learn: {},
      };
    }

    savedGradeCopy[nodeKey]["learn"] = {
      verifiedAnswers: _verified,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: _verified.length / attempts,
      percentComplete: newIndex / totalWords,
      complete: thisExerciseComplete,
      droppedPairs: _droppedPairs,
    };

    if (allTabsComplete) {
      savedGradeCopy[nodeKey].complete = true;
    }

    savedGradeCopy[nodeKey].tabIndex = newTab;

    // Update local state immediately before saving to prevent reset
    setFilterLearn(_verified);
    setStartPositionLearn(_verified.length);
    setDroppedPairs(_droppedPairs);
    onProgressChange?.("learn", savedGradeCopy[nodeKey]["learn"]);

    await saveGrade(savedGradeCopy);

    // Show completion screen if exercise is complete
    if (thisExerciseComplete) {
      setShowCompletion(true);
    }
  }

  async function sendFail(draggedWordID, targetWordID) {
    let _attemptedAnswers = JSON.parse(
      JSON.stringify(attemptedAnswersRef.current),
    );

    if (typeof _attemptedAnswers[targetWordID] === "undefined") {
      _attemptedAnswers[targetWordID] = [];
    }

    _attemptedAnswers[targetWordID].push(draggedWordID);
    attemptedAnswersRef.current = _attemptedAnswers;
    const attempts = Object.values(_attemptedAnswers).reduce(
      (total, answers) => total + answers.length,
      0,
    );

    // Handle grade.data - it might be a string or object
    let gradeData = grade?.data || {};
    if (typeof gradeData === "string") {
      try {
        gradeData = JSON.parse(gradeData);
      } catch (e) {
        gradeData = {};
      }
    }
    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        learn: {},
      };
    }

    savedGradeCopy[nodeKey]["learn"] = {
      ...savedGradeCopy[nodeKey]["learn"],
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / totalWords,
      complete: false,
      tabIndex,
    };

    savedGradeCopy[nodeKey].tabIndex = tabIndex;

    console.log("Learn savedGradeCopy", savedGradeCopy);
    onProgressChange?.("learn", savedGradeCopy[nodeKey]["learn"]);
    await saveGrade(savedGradeCopy);
  }

  function sendPass() {
    // // // console.log('sendPass')
  }
  const handleContinueFromCompletion = () => {
    setShowCompletion(false);
    if (nextMode) setTabIndex(nextMode);
  };

  const handleDismissCompletion = () => {
    setShowCompletion(false);
  };

  // Calculate min height based on card count: ~70px per drop target, minimum 300px
  const dropZoneMinHeight = Math.max(300, easyAssignment.length * 70);

  // Carousel scroll for small screens
  const carouselRef = React.useRef(null);
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 240;
      carouselRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const accuracyPercent = Math.round(
    (verifiedAnswers.length /
      (Object.values(attemptedAnswersRef.current).reduce(
        (total, answers) => total + answers.length,
        0,
      ) ||
        inProgress?.learn?.attemptsCount ||
        1)) *
      100,
  );

  return (
    <Box
      sx={{
        position: "relative",
        flex: "1 1 auto",
        minHeight: `${dropZoneMinHeight}px`,
        overflow: "auto",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      {showCompletion ? (
        /* Completed state: show all drop targets as a full list with pass/fail marks */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            maxWidth: "100%",
            gap: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Learn Mode Complete — {accuracyPercent}% accuracy
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDismissCompletion}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color={nextMode ? "primary" : "success"}
                size="small"
                onClick={handleContinueFromCompletion}
              >
                {nextMode
                  ? `Continue to ${nextModeLabel} Mode`
                  : "Finish Exercise"}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              width: "100%",
            }}
          >
            <List sx={{ padding: 0 }}>
              {easyAssignment.map((listItem) => {
                let _correctWord =
                  typeof listItem === "string"
                    ? dictionary[listItem]
                    : listItem;
                const matchedWordId = droppedPairs[_correctWord?.id];
                const matchedWord = matchedWordId
                  ? dictionary[matchedWordId]
                  : null;
                // Determine pass/fail: passed if matched on first attempt
                const attempts =
                  attemptedAnswersRef.current[_correctWord?.id] || [];
                const passed =
                  attempts.length > 0 && attempts[0] === _correctWord?.id;
                return (
                  <ResultDropLearn
                    key={_correctWord?.id}
                    pronunciation={_correctWord?.pronunciation}
                    definition={_correctWord?.definition}
                    matchedWord={matchedWord || _correctWord}
                    passed={passed}
                    audioPaths={_correctWord?.audio}
                    definitionAudioPaths={_correctWord?.definitionAudio}
                  />
                );
              })}
            </List>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            maxWidth: "100%",
            gap: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              flex: "1 1 auto",
              minHeight: 0,
              width: "100%",
              maxWidth: "100%",
              gap: 1,
              overflow: "hidden",
            }}
          >
            {/* Drop targets — carousel on mobile, scrollable list on desktop */}
            <Box
              sx={{
                minWidth: 0,
                flex: { xs: "0 0 auto", sm: "1 1 0" },
                minHeight: { xs: "auto" },
                maxWidth: "100%",
                order: { xs: 1, sm: 1 },
              }}
            >
              {/* Mobile carousel wrapper with arrows */}
              <Box
                sx={{
                  display: { xs: "flex", sm: "none" },
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => scrollCarousel(-1)}
                  sx={{ flexShrink: 0 }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Box
                  ref={carouselRef}
                  sx={{
                    flex: 1,
                    overflowX: "auto",
                    overflowY: "hidden",
                    display: "flex",
                    flexDirection: "row",
                    gap: 1,
                    scrollSnapType: "x mandatory",
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                    py: 0.5,
                  }}
                >
                  {easyAssignment.map((listItem) => {
                    let _correctWord =
                      typeof listItem === "string"
                        ? dictionary[listItem]
                        : listItem;
                    const matchedWordId = droppedPairs[_correctWord?.id];
                    const matchedWord = matchedWordId
                      ? dictionary[matchedWordId]
                      : null;
                    return (
                      <Box
                        key={_correctWord?.id}
                        sx={{ scrollSnapAlign: "start", flexShrink: 0 }}
                      >
                        <AnswerDropLearn
                          id={_correctWord?.id}
                          correctAnswer={{
                            ..._correctWord,
                            progressAssignment,
                            sendFail,
                            sendPass,
                          }}
                          pronunciation={_correctWord?.pronunciation}
                          definition={_correctWord?.definition}
                          phrase={_correctWord?.phrase}
                          matchedWord={matchedWord}
                          isMatched={!!matchedWordId}
                          audioPaths={_correctWord?.audio}
                          definitionAudioPaths={_correctWord?.definitionAudio}
                          promptFor={promptFor}
                          showAudio={showAudio}
                          showPronunciation={showPronunciation}
                        />
                      </Box>
                    );
                  })}
                </Box>
                <IconButton
                  size="small"
                  onClick={() => scrollCarousel(1)}
                  sx={{ flexShrink: 0 }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              {/* Desktop list */}
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  height: "100%",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                <List sx={{ padding: 0 }}>
                  {easyAssignment.map((listItem) => {
                    let _correctWord =
                      typeof listItem === "string"
                        ? dictionary[listItem]
                        : listItem;
                    const matchedWordId = droppedPairs[_correctWord?.id];
                    const matchedWord = matchedWordId
                      ? dictionary[matchedWordId]
                      : null;
                    return (
                      <AnswerDropLearn
                        key={_correctWord?.id}
                        id={_correctWord?.id}
                        correctAnswer={{
                          ..._correctWord,
                          progressAssignment,
                          sendFail,
                          sendPass,
                        }}
                        pronunciation={_correctWord?.pronunciation}
                        definition={_correctWord?.definition}
                        phrase={_correctWord?.phrase}
                        matchedWord={matchedWord}
                        isMatched={!!matchedWordId}
                        audioPaths={_correctWord?.audio}
                        definitionAudioPaths={_correctWord?.definitionAudio}
                        promptFor={promptFor}
                        showAudio={showAudio}
                        showPronunciation={showPronunciation}
                      />
                    );
                  })}
                </List>
              </Box>
            </Box>
            {/* Drag cards */}
            <Box
              sx={{
                minWidth: 0,
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
                width: { sm: `${cardPanelWidth}px` },
                maxWidth: { xs: "100%", sm: `${cardPanelWidth}px` },
                order: { xs: 2, sm: 2 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "nowrap",
                  flexDirection: "column",
                  gap: 0,
                  height: { xs: "auto", sm: "100%" },
                  maxHeight: { xs: "none", sm: "100%" },
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: 0.5,
                  width: "100%",
                  maxWidth: "100%",
                  alignContent: "flex-start",
                  justifyContent: { xs: "flex-start", sm: "flex-start" },
                  boxSizing: "border-box",
                }}
              >
                {easyVocab}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
