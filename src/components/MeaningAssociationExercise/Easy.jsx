import * as React from "react";
import { useState, useEffect } from "react";
import UnitContext from "../../context/unitContext";
import { Grid, Box, IconButton, Button, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LinearProgressWithLabel, AnswerDrop, ResultCard } from ".";

import DictionaryContext from "../../context/dictionaryContext";
import { shuffle, calcCardWidth } from "./utils";
import { DragBox } from "./DragBox";

export const Easy = ({ tabIndex, setTabIndex, nodeKey, wordIDs }) => {
  let [assignment, setAssignment] = React.useState([]);
  const [answers, setAnswers] = React.useState([]);

  const [filterEasy, setFilterEasy] = React.useState([]);
  const [verifiedAnswers, setVerifiedAnswers] = React.useState([]);
  const [completedEasy, setCompletedEasy] = React.useState(0);
  const [startPositionEasy, setStartPositionEasy] = React.useState(0);
  const [showCompletion, setShowCompletion] = React.useState(false);
  const hasAutoShownCompletion = React.useRef(false);

  // Seed combines nodeKey with a per-mount random value so order
  // differs each visit but stays stable within the session
  const mountSeed = React.useRef(Math.floor(Math.random() * 2147483647));
  const shuffleSeed = React.useMemo(() => {
    let hash = mountSeed.current;
    const str = String(nodeKey) + "-easy";
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
    console.log("MeaningAssociationExercise._vocabulary", _vocabulary);
    setAssignment([..._vocabulary]);
    setAnswers([..._vocabulary]);
  }, [wordIDs, dictionary]);

  const { grade, saveGrade } = React.useContext(UnitContext);

  // Parse grade.data if it's a string
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === "string") {
      try {
        return JSON.parse(grade.data);
      } catch (e) {
        console.error("Failed to parse grade.data:", e);
        return {};
      }
    }
    return grade.data;
  }, [grade?.data]);

  const inProgress = gradeData[nodeKey] || {};

  // Show completion screen once when exercise completes — don't re-show after dismiss
  React.useEffect(() => {
    const isComplete = inProgress?.easy?.complete;
    if (isComplete && !hasAutoShownCompletion.current) {
      hasAutoShownCompletion.current = true;
      setShowCompletion(true);
    }
  }, [inProgress?.easy?.complete]);

  console.log("Easy.nodeKey", nodeKey, "type:", typeof nodeKey);
  console.log("Easy.grade:", grade);
  console.log("Easy.grade.data:", grade?.data);
  console.log("Easy.grade.data === grade?", grade?.data === grade);
  console.log(
    "Easy.grade.data keys:",
    grade?.data ? Object.keys(grade.data) : "no data",
  );
  console.log("Easy.grade.data[nodeKey]:", grade?.data?.[nodeKey]);
  console.log("Easy.inProgress", inProgress);

  // Update progress state when grade data changes
  useEffect(() => {
    if (inProgress && Object.keys(inProgress).length > 0) {
      const verified = inProgress?.easy?.verifiedAnswers || [];
      const percentComplete = (inProgress?.easy?.percentComplete || 0) * 100;

      setFilterEasy(verified);
      setVerifiedAnswers(verified);
      setCompletedEasy(percentComplete);
      setStartPositionEasy(verified.length);
    }
  }, [inProgress]);

  // Stable shuffled orders — computed once when answers load, never reshuffled mid-exercise
  const shuffledWords = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed);
  }, [answers, shuffleSeed]);

  const shuffledDragOrder = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 1);
  }, [answers, shuffleSeed]);

  const shuffledDropOrder = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 2);
  }, [answers, shuffleSeed]);

  // Calculate drag card width based on longest unbroken word
  const cardWidth = React.useMemo(() => {
    const phrases = answers.map((w) => w?.phrase).filter(Boolean);
    return calcCardWidth(phrases);
  }, [answers]);

  const cardPanelWidth = cardWidth + 16;

  // Filter out matched cards from stable order — no reshuffling
  const easyVocab = shuffledDragOrder
    .filter((word) => !filterEasy.includes(word?.id))
    .map((word) => (
      <DragBox
        answer={word.phrase}
        wordID={word.id}
        key={word.id}
        cardWidth={cardWidth}
      />
    ));

  // Find the first unmatched word in the stable shuffled order
  const correctAnswer = shuffledWords.find(
    (word) => !filterEasy.includes(word?.id),
  );
  const currentQuestion = startPositionEasy;
  const percentComplete = completedEasy;
  const loadAttemptedAnswers = inProgress?.easy?.attemptedAnswers || {};

  let _correctAnswer = "";

  // console.log('Easy.correctAnswer', correctAnswer)
  if (typeof correctAnswer === "string") {
    _correctAnswer = dictionary[correctAnswer];
  } else {
    _correctAnswer = correctAnswer;
  }

  // console.log('Easy._correctAnswer', _correctAnswer)
  const correctId = _correctAnswer?.id;
  const correctWord = _correctAnswer;
  // const attemptsCount = inProgress?.easy?.attemptsCount || 0;

  // const [attemptedAnswers, setAttemptedAnswers] = useState(loadAttemptedAnswers);

  const totalWords = shuffledWords.length;

  async function progressAssignment(draggedWordID, targetWordID) {
    // Verify the match is correct
    if (draggedWordID !== targetWordID) {
      console.error(
        "Mismatch in Easy progressAssignment:",
        draggedWordID,
        targetWordID,
      );
      return;
    }

    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    let _verified = [...new Set([...verifiedAnswers, targetWordID])];

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[targetWordID] === "undefined") {
      _attemptedAnswers[targetWordID] = [];
    }

    _attemptedAnswers[targetWordID].push(draggedWordID);

    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });

    const attempts = attemptedAnswersLength;

    // setAttemptedAnswers(_attemptedAnswers);
    // setAttemptsCount(attempts);

    // Check completion against the full word count, not filtered length
    if (_verified.length === totalWords) {
      // // console.log('newIndex === length')
      thisExerciseComplete = true;

      const completedHard = inProgress.hard?.complete;
      const completedLearn = inProgress.learn?.complete;
      if (completedHard && completedLearn) {
        allTabsComplete = true;
      }

      // Don't auto-advance, show completion screen instead
      // newTab++;
    }

    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        easy: {},
      };
    }

    // console.log('easy _verified.length / length,', _verified.length, totalWords)
    savedGradeCopy[nodeKey]["easy"] = {
      verifiedAnswers: _verified,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: _verified.length / attempts,
      percentComplete: _verified.length / totalWords,
      complete: thisExerciseComplete,
    };

    if (allTabsComplete) {
      savedGradeCopy[nodeKey].complete = true;
    }

    savedGradeCopy[nodeKey].tabIndex = newTab;

    // Update local state immediately before saving to prevent reset
    setFilterEasy(_verified);
    setVerifiedAnswers(_verified);
    setStartPositionEasy(_verified.length);
    setCompletedEasy((_verified.length / totalWords) * 100);

    await saveGrade(savedGradeCopy);

    // Show completion screen if exercise is complete
    if (thisExerciseComplete) {
      setShowCompletion(true);
    }
  }

  async function sendFail(draggedWordID, targetWordID) {
    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[targetWordID] === "undefined") {
      _attemptedAnswers[targetWordID] = [];
    }

    _attemptedAnswers[targetWordID].push(draggedWordID);

    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });

    const attempts = attemptedAnswersLength;

    // setAttemptsCount(attempts);

    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        easy: {},
      };
    }

    // console.log('easy verifiedAnswers.length / length,', verifiedAnswers.length, totalWords)
    // console.log('easy currentQuestion+1 / length', currentQuestion + 1, totalWords)
    savedGradeCopy[nodeKey]["easy"] = {
      ...savedGradeCopy[nodeKey]["easy"],
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / totalWords,
      complete: false,
    };

    savedGradeCopy[nodeKey].tabIndex = 1;

    await saveGrade(savedGradeCopy);
  }

  function sendPass() {
    console.log("sendPass");
  }

  const handleContinueFromCompletion = () => {
    setShowCompletion(false);
    setTabIndex(2); // Move to Hard mode
  };

  const handleDismissCompletion = () => {
    setShowCompletion(false);
  };

  // Calculate min height for mobile based on drag card count
  const allCardRows = Math.ceil(shuffledDragOrder.length / 2);
  const dropZoneMinHeight = Math.max(300, allCardRows * 56);

  // Build result cards for completed state — check if word was matched on first try
  const resultCards = shuffledDragOrder.map((word) => {
    const attempts = loadAttemptedAnswers[word?.id] || [];
    // Passed if the first attempt was correct (word matched itself)
    const passed = attempts.length > 0 && attempts[0] === word?.id;
    return (
      <ResultCard
        key={word?.id}
        phrase={word?.phrase}
        passed={passed}
        audioPaths={word?.audio}
        cardWidth={cardWidth}
      />
    );
  });

  const accuracyPercent = Math.round(
    (verifiedAnswers.length / (inProgress?.easy?.attemptsCount || 1)) * 100,
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
          <Box sx={{ flexShrink: 0, width: "100%" }}>
            <LinearProgressWithLabel value={100} />
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Easy Mode Complete — {accuracyPercent}% accuracy
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
                size="small"
                onClick={handleContinueFromCompletion}
              >
                Continue to Hard Mode
              </Button>
            </Box>
          </Box>
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
            {/* Blank drop zone */}
            <Box
              sx={{
                minWidth: 0,
                flex: { xs: "0 0 auto", sm: "1 1 0" },
                minHeight: {
                  xs: `${dropZoneMinHeight}px`,
                },
                aspectRatio: { sm: "1" },
                alignSelf: { sm: "flex-start" },
                maxWidth: "100%",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  minHeight: { xs: `${dropZoneMinHeight}px`, sm: "unset" },
                  display: "flex",
                  borderRadius: "8px",
                  border: "1px dashed var(--mui-palette-divider)",
                  backgroundColor:
                    "var(--mui-palette-action-disabledBackground)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Complete
                </Typography>
              </Box>
            </Box>
            {/* Result cards with check/X */}
            <Box
              sx={{
                minWidth: 0,
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
                width: { sm: `${cardPanelWidth}px` },
                maxWidth: { xs: "100%", sm: `${cardPanelWidth}px` },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "nowrap",
                  flexDirection: "column",
                  gap: 0,
                  height: { xs: "auto", sm: "100%" },
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: 0.5,
                  alignContent: "flex-start",
                  justifyContent: "flex-start",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              >
                {resultCards}
              </Box>
            </Box>
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
          <Box sx={{ flexShrink: 0, width: "100%" }}>
            <LinearProgressWithLabel value={percentComplete} />
          </Box>
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
            {/* Drop target */}
            <Box
              sx={{
                minWidth: 0,
                flex: { xs: "0 0 auto", sm: "1 1 0" },
                minHeight: {
                  xs: `${dropZoneMinHeight}px`,
                },
                aspectRatio: { sm: "1" },
                alignSelf: { sm: "flex-start" },
                maxWidth: "100%",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  minHeight: { xs: `${dropZoneMinHeight}px`, sm: "unset" },
                  display: "flex",
                }}
              >
                <AnswerDrop
                  correctAnswer={{
                    ...correctWord,
                    progressAssignment,
                    sendFail,
                    sendPass,
                  }}
                />
              </Box>
            </Box>
            {/* Drag cards */}
            <Box
              sx={{
                minWidth: 0,
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
                width: { sm: `${cardPanelWidth}px` },
                maxWidth: { xs: "100%", sm: `${cardPanelWidth}px` },
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
                  alignContent: "flex-start",
                  justifyContent: { xs: "flex-start", sm: "flex-start" },
                  width: "100%",
                  maxWidth: "100%",
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
