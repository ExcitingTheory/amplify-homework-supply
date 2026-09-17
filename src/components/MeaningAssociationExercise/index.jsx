/**
 * @module MeaningAssociationExercise
 * @category Components
 * @description MeaningAssociationExercise component
 *
 * MeaningAssociationExercise component for the app.
 *
 * This component is a game where the user has to match the words with their
 * meanings. The user can listen to the words by clicking on the play button.
 *
 *
 */

import * as React from "react";
import { useDrop } from "react-dnd";
import { useTranslations } from "next-intl";
import { alpha } from "@mui/material/styles";

import {
  Box,
  Tabs,
  Tab,
  LinearProgress,
  Typography,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Easy } from "./Easy";
import { Hard } from "./Hard";
import { Learn } from "./Learn";
import { DndWrapper } from "./DndWrapper";
import UnitContext from "../../context/unitContext";
import getCachedUrl from "../../utils/getCachedUrl";
import { ExerciseBlockCard } from "../Editor3/components/ExerciseBlockCard";
import { ExerciseProgressMeters } from "../Editor3/components/ExerciseProgressMeters";
import { SEMANTIC_THEME } from "../../themes/semanticTheme";

function dropTargetSx(theme, { isActive, canDrop, isMatched = false }) {
  const primaryTint = alpha(
    theme.palette.primary.main,
    theme.palette.mode === "dark" ? 0.18 : 0.08,
  );

  return {
    boxSizing: "border-box",
    borderWidth: 2,
    borderStyle: isMatched ? "solid" : "dashed",
    borderColor: isMatched
      ? "success.main"
      : isActive
        ? "primary.main"
        : canDrop
          ? alpha(theme.palette.primary.main, 0.65)
          : alpha(theme.palette.text.primary, 0.28),
    bgcolor: isMatched
      ? alpha(theme.palette.success.main, 0.12)
      : isActive
        ? primaryTint
        : canDrop
          ? alpha(theme.palette.primary.main, 0.04)
          : "action.hover",
    borderRadius: `${SEMANTIC_THEME.radius.card}px`,
    boxShadow: isActive
      ? `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.22)}`
      : 0,
    transition: theme.transitions.create(
      ["border-color", "background-color", "box-shadow"],
      { duration: theme.transitions.duration.shorter },
    ),
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  };
}

export function LinearProgressWithLabel(props) {
  return (
    <Box display="flex" alignItems="center">
      <Box flex={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box width="fit-content" marginLeft={1}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

/** Lightweight play button that signs an S3 audio path and plays it */
export const PlayAudioButton = ({ audioPaths, size = "small" }) => {
  const t = useTranslations("common");
  const audioRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);

  const handlePlay = React.useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!audioPaths || audioPaths.length === 0) return;

      // Pick a random audio path from the array
      const path = audioPaths[Math.floor(Math.random() * audioPaths.length)];
      if (!path) return;

      try {
        const url = await getCachedUrl(path);
        if (!url) return;

        // Stop any existing playback
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        setPlaying(true);
        audio.addEventListener("ended", () => setPlaying(false));
        audio.addEventListener("error", () => setPlaying(false));
        await audio.play();
      } catch (err) {
        console.error("PlayAudioButton error:", err);
        setPlaying(false);
      }
    },
    [audioPaths],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!audioPaths || audioPaths.length === 0) return null;

  return (
    <IconButton
      size={size}
      onClick={handlePlay}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      aria-label={t("common.playAudio")}
      sx={{
        color: playing ? "primary.main" : "text.secondary",
        flexShrink: 0,
        p: 0.5,
      }}
    >
      <VolumeUpIcon fontSize={size} />
    </IconButton>
  );
};

/** Static card shown in completed state for Easy/Hard — shows the word with a check or X */
export const ResultCard = ({
  phrase,
  passed,
  audioPaths,
  cardWidth = 140,
  showAudio = true,
}) => {
  return (
    <Box
      data-testid="result-card"
      data-passed={passed}
      sx={{
        fontSize: "1.2rem",
        margin: ".3rem",
        padding: ".8rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        borderRadius: "8px",
        border: passed
          ? "2px solid var(--mui-palette-success-main, #4caf50)"
          : "2px solid var(--mui-palette-error-main, #f44336)",
        backgroundColor: passed
          ? "var(--mui-palette-success-light, #e8f5e9)"
          : "var(--mui-palette-error-light, #ffebee)",
        color: passed
          ? "var(--mui-palette-success-dark, #2e7d32)"
          : "var(--mui-palette-error-dark, #c62828)",
        fontWeight: 500,
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        maxWidth: `${cardWidth}px`,
        boxSizing: "border-box",
        flexShrink: 0,
        justifyContent: "center",
        textAlign: "center",
        whiteSpace: "normal",
        wordBreak: "break-word",
      }}
    >
      {passed ? (
        <CheckCircleIcon sx={{ fontSize: "1rem", flexShrink: 0 }} />
      ) : (
        <CancelIcon sx={{ fontSize: "1rem", flexShrink: 0 }} />
      )}
      {phrase}
      {showAudio && <PlayAudioButton audioPaths={audioPaths} />}
    </Box>
  );
};

/** Static drop target shown in Learn completed state — shows matched word with pass/fail icon */
export const ResultDropLearn = ({
  pronunciation,
  definition,
  matchedWord,
  passed,
  audioPaths,
  definitionAudioPaths,
  showAudio = true,
  showPronunciation = true,
}) => {
  const borderColor = passed
    ? "var(--mui-palette-success-main, #4caf50)"
    : "var(--mui-palette-error-main, #f44336)";
  const backgroundColor = passed
    ? "var(--mui-palette-success-light, #e8f5e9)"
    : "var(--mui-palette-error-light, #ffebee)";

  return (
    <ListItem
      data-testid="result-drop-learn"
      data-passed={passed}
      sx={{
        margin: "0.25rem 0",
        padding: "0.75rem",
        border: `1px solid ${borderColor}`,
        backgroundColor: backgroundColor,
        borderRadius: "8px",
        boxSizing: "border-box",
        width: "100%",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          width: "100%",
        }}
      >
        {passed ? (
          <CheckCircleIcon
            sx={{
              fontSize: "1.2rem",
              color: "var(--mui-palette-success-main, #4caf50)",
              mt: "2px",
              flexShrink: 0,
            }}
          />
        ) : (
          <CancelIcon
            sx={{
              fontSize: "1.2rem",
              color: "var(--mui-palette-error-main, #f44336)",
              mt: "2px",
              flexShrink: 0,
            }}
          />
        )}
        <ListItemText
          primaryTypographyProps={{ component: "div" }}
          secondaryTypographyProps={{ component: "div" }}
          primary={
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  marginBottom: "0.25rem",
                }}
              >
                <Typography
                  component="span"
                  style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                >
                  {matchedWord?.phrase}
                </Typography>
                {showAudio && <PlayAudioButton audioPaths={audioPaths} />}
              </Box>
              <Typography
                component="span"
                style={{
                  display: "block",
                  fontStyle: "italic",
                  color: "var(--mui-palette-text-disabled)",
                  marginBottom: "0.25rem",
                }}
              >
                {showPronunciation && pronunciation}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {definition}
              </Typography>
              {showAudio && (
                <PlayAudioButton audioPaths={definitionAudioPaths} />
              )}
            </Box>
          }
        />
      </Box>
    </ListItem>
  );
};

export const AnswerDropLearn = ({
  correctAnswer,
  pronunciation,
  definition,
  id,
  phrase,
  matchedWord,
  isMatched,
  audioPaths,
  definitionAudioPaths,
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
}) => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: "box",
    drop: () => ({ correctAnswer: correctAnswer, targetWordID: id }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;

  return (
    <ListItem
      ref={drop}
      key={id}
      data-testid="drop-target-learn"
      data-word-id={id}
      data-is-matched={isMatched}
      sx={(theme) => ({
        margin: "0.25rem 0",
        padding: "0.75rem",
        ...dropTargetSx(theme, { isActive, canDrop, isMatched }),
        boxSizing: "border-box",
        width: { xs: "220px", sm: "100%" },
        minWidth: { xs: "220px", sm: "auto" },
        maxWidth: { xs: "220px", sm: "100%" },
        flexShrink: 0,
      })}
    >
      {isMatched && matchedWord ? (
        // Show complete information when matched
        <ListItemText
          primaryTypographyProps={{ component: "div" }}
          secondaryTypographyProps={{ component: "div" }}
          primary={
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  marginBottom: "0.25rem",
                }}
              >
                <Typography
                  component="span"
                  style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                >
                  {matchedWord.phrase}
                </Typography>
                {showAudio && <PlayAudioButton audioPaths={audioPaths} />}
              </Box>
              <Typography
                component="span"
                style={{
                  display: "block",
                  fontStyle: "italic",
                  color: "var(--mui-palette-text-disabled)",
                  marginBottom: "0.25rem",
                }}
              >
                {showPronunciation && pronunciation}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {definition}
              </Typography>
              {showAudio && (
                <PlayAudioButton audioPaths={definitionAudioPaths} />
              )}
            </Box>
          }
        />
      ) : (
        // Show only pronunciation/definition when not matched
        <ListItemText
          secondaryTypographyProps={{ component: "div" }}
          primary={
            promptFor === "word"
              ? phrase
              : showPronunciation
                ? pronunciation
                : null
          }
          secondary={
            promptFor === "word" ? (
              showPronunciation ? (
                pronunciation
              ) : null
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="textSecondary"
                >
                  {definition}
                </Typography>
                {showAudio && (
                  <PlayAudioButton audioPaths={definitionAudioPaths} />
                )}
              </Box>
            )
          }
        />
      )}
    </ListItem>
  );
};

export const AnswerDrop = ({
  correctAnswer,
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
}) => {
  // console.log('AnswerDrop correctAnswer', correctAnswer)

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: "box",
    drop: () => ({
      correctAnswer: correctAnswer,
      targetWordID: correctAnswer.id,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;
  return (
    <>
      <Box
        ref={drop}
        data-testid="drop-target"
        data-word-id={correctAnswer?.id}
        sx={(theme) => ({
          ...dropTargetSx(theme, { isActive, canDrop }),
          width: "100%",
          maxWidth: "100%",
          minWidth: "0",
          height: "100%",
          maxHeight: "100%",
          overflow: "hidden",
          alignContent: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
        })}
      >
        <div
          style={{
            width: "100%",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            gap: "0.5rem",
          }}
        >
          {promptFor === "word"
            ? correctAnswer?.phrase
            : correctAnswer?.definition}
          {showPronunciation &&
            promptFor !== "word" &&
            correctAnswer?.pronunciation}
          {showAudio && (
            <PlayAudioButton
              audioPaths={
                promptFor === "word"
                  ? correctAnswer?.audio
                  : correctAnswer?.definitionAudio || correctAnswer?.audio
              }
            />
          )}
        </div>
      </Box>
      {/* <Paper
        style={{
          margin: '1rem',
          padding: '1rem'
        }}>
        {correctAnswer?.definition}
      </Paper> */}
    </>
  );
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      style={{
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
        boxSizing: "border-box",
        flex: value === index ? "1 1 auto" : undefined,
        minHeight: 0,
        display: value === index ? "flex" : "none",
        flexDirection: "column",
      }}
      {...other}
    >
      {children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `scrollable-auto-tab-${index}`,
    "aria-controls": `scrollable-auto-tabpanel-${index}`,
  };
}

export const MEANING_MODE_ORDER = ["learn", "easy", "hard"];

export function getAvailableMeaningModes(enabledModes) {
  const modes = MEANING_MODE_ORDER.filter((mode) =>
    enabledModes.includes(mode),
  );
  return modes.length > 0 ? modes : ["learn"];
}

export function resolveMeaningMode(savedValue, availableModes) {
  const legacyMode =
    typeof savedValue === "number"
      ? MEANING_MODE_ORDER[savedValue]
      : savedValue;
  return availableModes.includes(legacyMode) ? legacyMode : availableModes[0];
}

export function getNextMeaningMode(mode, availableModes) {
  const nextIndex = availableModes.indexOf(mode) + 1;
  return nextIndex > 0 && nextIndex < availableModes.length
    ? availableModes[nextIndex]
    : null;
}

function modeLabel(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

const MeaningAssociationTabs = ({
  nodeKey,
  wordIDs,
  enabledModes = ["learn", "easy", "hard"],
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
}) => {
  const t = useTranslations("common");
  const { grade } = React.useContext(UnitContext);
  const [liveModeProgress, setLiveModeProgress] = React.useState({});
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

  React.useEffect(() => {
    setLiveModeProgress({});
  }, [grade?.id, nodeKey]);

  const handleModeProgressChange = React.useCallback((mode, progress) => {
    setLiveModeProgress((current) => ({
      ...current,
      [mode]: progress,
    }));
  }, []);

  const availableModes = React.useMemo(() => {
    return getAvailableMeaningModes(enabledModes);
  }, [enabledModes]);

  const resolveSavedMode = React.useCallback(
    (savedValue) => {
      return resolveMeaningMode(savedValue, availableModes);
    },
    [availableModes],
  );

  const [activeMode, setActiveMode] = React.useState(() =>
    resolveSavedMode(inProgress?.tabIndex),
  );

  // Update tab index when grade data changes (e.g., from another component)
  React.useEffect(() => {
    if (inProgress?.tabIndex !== undefined) {
      setActiveMode(resolveSavedMode(inProgress.tabIndex));
    }
  }, [inProgress?.tabIndex, resolveSavedMode]);

  React.useEffect(() => {
    setActiveMode((currentMode) =>
      availableModes.includes(currentMode) ? currentMode : availableModes[0],
    );
  }, [availableModes]);

  const handleTabChange = (event, newValue) => {
    if (availableModes.includes(newValue)) {
      setActiveMode(newValue);
    }
  };

  const nextModeAfter = (mode) => {
    return getNextMeaningMode(mode, availableModes);
  };

  // Check completion status for each mode
  const learnComplete = inProgress?.learn?.complete || false;
  const easyComplete = inProgress?.easy?.complete || false;
  const hardComplete = inProgress?.hard?.complete || false;
  const modeProgress = availableModes.map(
    (mode) => liveModeProgress[mode] || inProgress?.[mode] || {},
  );
  const overallProgress =
    (modeProgress.reduce(
      (total, mode) => total + (Number(mode.percentComplete) || 0),
      0,
    ) /
      availableModes.length) *
    100;
  const totalAttempts = modeProgress.reduce(
    (total, mode) => total + (Number(mode.attemptsCount) || 0),
    0,
  );
  const overallAccuracy =
    totalAttempts > 0
      ? (modeProgress.reduce(
          (total, mode) =>
            total +
            (Number(mode.accuracy) || 0) * (Number(mode.attemptsCount) || 0),
          0,
        ) /
          totalAttempts) *
        100
      : 0;
  const allEnabledModesComplete = availableModes.every(
    (mode) => inProgress?.[mode]?.complete,
  );

  return (
    <ExerciseBlockCard
      blockType="meaning-association"
      accuracy={overallAccuracy}
      graded={allEnabledModesComplete}
      sx={{
        width: "100%",
        maxWidth: "100vw",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <ExerciseProgressMeters
        percentComplete={overallProgress}
        accuracy={overallAccuracy}
        hasAttempts={totalAttempts > 0}
        progressDescription="Average completion across enabled practice modes."
        accuracyDescription="Accuracy across attempts in enabled practice modes."
      />
      <Box
        sx={{
          mb: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${SEMANTIC_THEME.radius.control}px`,
          overflow: "hidden",
          bgcolor: "action.hover",
        }}
      >
        <Tabs
          value={activeMode}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label={t("common.filter")}
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              py: 0.75,
            },
          }}
        >
          {availableModes.includes("learn") && (
            <Tab
              value="learn"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Learn
                  {learnComplete && (
                    <CheckCircleIcon
                      style={{
                        fontSize: "1rem",
                        color: "var(--mui-palette-success-main, #4caf50)",
                      }}
                    />
                  )}
                </Box>
              }
              {...a11yProps("learn")}
            />
          )}
          {availableModes.includes("easy") && (
            <Tab
              value="easy"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Easy
                  {easyComplete && (
                    <CheckCircleIcon
                      style={{
                        fontSize: "1rem",
                        color: "var(--mui-palette-success-main, #4caf50)",
                      }}
                    />
                  )}
                </Box>
              }
              {...a11yProps("easy")}
            />
          )}
          {availableModes.includes("hard") && (
            <Tab
              value="hard"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Hard
                  {hardComplete && (
                    <CheckCircleIcon
                      style={{
                        fontSize: "1rem",
                        color: "var(--mui-palette-success-main, #4caf50)",
                      }}
                    />
                  )}
                </Box>
              }
              {...a11yProps("hard")}
            />
          )}
        </Tabs>
      </Box>
      <DndWrapper>
        {availableModes.includes("learn") && (
          <TabPanel value={activeMode} index="learn">
            <Learn
              nodeKey={nodeKey}
              setTabIndex={setActiveMode}
              tabIndex={activeMode}
              wordIDs={wordIDs}
              enabledModes={availableModes}
              nextMode={nextModeAfter("learn")}
              nextModeLabel={modeLabel(nextModeAfter("learn") || "learn")}
              onProgressChange={handleModeProgressChange}
              promptFor={promptFor}
              showAudio={showAudio}
              showPronunciation={showPronunciation}
            />
          </TabPanel>
        )}
        {availableModes.includes("easy") && (
          <TabPanel value={activeMode} index="easy">
            <Easy
              nodeKey={nodeKey}
              setTabIndex={setActiveMode}
              tabIndex={activeMode}
              wordIDs={wordIDs}
              enabledModes={availableModes}
              nextMode={nextModeAfter("easy")}
              nextModeLabel={modeLabel(nextModeAfter("easy") || "easy")}
              onProgressChange={handleModeProgressChange}
              promptFor={promptFor}
              showAudio={showAudio}
              showPronunciation={showPronunciation}
            />
          </TabPanel>
        )}
        {availableModes.includes("hard") && (
          <TabPanel value={activeMode} index="hard">
            <Hard
              nodeKey={nodeKey}
              setTabIndex={setActiveMode}
              tabIndex={activeMode}
              wordIDs={wordIDs}
              enabledModes={availableModes}
              nextMode={nextModeAfter("hard")}
              nextModeLabel={modeLabel(nextModeAfter("hard") || "hard")}
              onProgressChange={handleModeProgressChange}
              promptFor={promptFor}
              showAudio={showAudio}
              showPronunciation={showPronunciation}
            />
          </TabPanel>
        )}
      </DndWrapper>
    </ExerciseBlockCard>
  );
};

const MeaningAssociationExercise = ({
  nodeKey,
  wordIDs,
  enabledModes = ["learn", "easy", "hard"],
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
}) => {
  return (
    <div
      style={{
        flexGrow: 1,
        width: "100%",
        maxWidth: "100vw",
        minHeight: "400px",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MeaningAssociationTabs
        nodeKey={nodeKey}
        wordIDs={wordIDs}
        enabledModes={enabledModes}
        promptFor={promptFor}
        showAudio={showAudio}
        showPronunciation={showPronunciation}
      />
    </div>
  );
};

export default MeaningAssociationExercise;
