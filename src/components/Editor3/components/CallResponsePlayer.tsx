"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { uploadData } from "aws-amplify/storage";
import UnitContext from "../../../context/unitContext";
import { getAmplifyClient } from "../../../utils/amplifyClient";
import getCachedUrl from "../../../utils/getCachedUrl";
import {
  type CallResponseScript,
  type CallResponseResponseCue,
} from "../../../utils/callResponse/buildCallResponseScript";
import { scoreSpokenAnswer } from "../../../utils/callResponse/scoreSpokenAnswer";
import {
  isCueComplete,
  summarizeBlockGrade,
  type CueGrade,
  type SlideGrade,
} from "../../../utils/callResponse/gradeCues";
import {
  createResponseWindowState,
  evaluateResponseFrame,
  type ResponseWindowState,
} from "../../../utils/callResponse/responseWindow";
import { createRoomTone } from "../../../utils/callResponse/roomTone";
import {
  useCallResponseSession,
  useLiveMicStream,
  useVoiceActivity,
} from "../hooks/useCallResponseSession";
import FrequencyRingVisualizer from "./FrequencyRingVisualizer";
import CallResponseSlideView from "./CallResponseSlideView";

interface CallResponsePlayerProps {
  blockId: string;
  script: CallResponseScript;
  /** Runs the exercise without uploading audio or saving grades. */
  preview?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readGradeData(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) throw new Error("Grade data must be an object");
    return parsed;
  }
  if (value == null) return {};
  if (!isRecord(value)) throw new Error("Grade data must be an object");
  return value;
}

function parseVerifiedTranscript(value: string): string {
  const parsed: unknown = JSON.parse(value);
  if (
    !isRecord(parsed) ||
    typeof parsed.transcript !== "string" ||
    parsed.transcript.trim().length === 0
  ) {
    throw new Error("Audio verification returned no transcript");
  }
  return parsed.transcript;
}

export default function CallResponsePlayer({
  blockId,
  script,
  preview = false,
}: CallResponsePlayerProps) {
  const { unit, grade, saveGrade, session } = React.useContext(UnitContext);
  const t = useTranslations("common");
  const sessionController = useCallResponseSession(script);
  const advanceCue = sessionController.advance;
  const startSession = sessionController.start;
  const markArmed = sessionController.armed;
  const markDenied = sessionController.deny;
  const { stream, analyser, audioContext, arm, release } = useLiveMicStream();
  const [error, setError] = React.useState<string | null>(null);
  // Grades are tracked in a ref so async saves never read stale data; this
  // counter re-renders the progress summary once a save completes.
  const [, setSavedGradeCount] = React.useState(0);
  const [micRecorderAvailable, setMicRecorderAvailable] = React.useState(true);
  const [albumTrackUrl, setAlbumTrackUrl] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const responseWindowRef = React.useRef<ResponseWindowState | null>(null);
  const responseActive = React.useRef(false);
  const finishResponseRef = React.useRef<() => void>(() => undefined);
  const attemptsRef = React.useRef<Record<string, number>>({});
  const gradeDataRef = React.useRef<Record<string, unknown>>({});
  const gradingQueueRef = React.useRef<Promise<void>>(Promise.resolve());

  const cue = script.cues[sessionController.cueIndex];
  const responseCue = cue?.kind === "response" ? cue : null;
  const responses = React.useMemo(
    () =>
      script.cues.filter(
        (candidate): candidate is CallResponseResponseCue =>
          candidate.kind === "response",
      ),
    [script.cues],
  );
  const gradableResponses = React.useMemo(
    () =>
      responses.map((response) => ({
        id: response.id,
        gradedSlide:
          response.slide?.type === "lexical" && response.slide.graded === true,
      })),
    [responses],
  );
  const savedBlock = gradeDataRef.current[blockId];
  const savedCues: Record<string, CueGrade> =
    isRecord(savedBlock) && isRecord(savedBlock.cues)
      ? (savedBlock.cues as Record<string, CueGrade>)
      : {};
  const completedResponses = gradableResponses.filter((response) =>
    isCueComplete(savedCues[response.id], response.gradedSlide),
  ).length;

  React.useEffect(() => {
    try {
      gradeDataRef.current = readGradeData(grade?.data);
    } catch (gradeError) {
      console.error("[CallResponsePlayer] Invalid saved grade data:", gradeError);
      setError(
        gradeError instanceof Error
          ? gradeError.message
          : "Unable to read the saved grade",
      );
    }
  }, [grade?.data]);

  React.useEffect(() => {
    if (!script.albumTrackFileID) {
      setAlbumTrackUrl(null);
      return;
    }
    let active = true;
    void getAmplifyClient()
      .models.File.get({ id: script.albumTrackFileID })
      .then(async ({ data, errors }) => {
        if (errors?.length || !data?.path) {
          throw new Error("Unable to load the album track");
        }
        const url = await getCachedUrl(data.path);
        if (!url) throw new Error("Unable to resolve the album track");
        if (active) setAlbumTrackUrl(url);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("[CallResponsePlayer] Album track loading failed:", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the album track",
        );
      });
    return () => {
      active = false;
    };
  }, [script.albumTrackFileID]);

  const saveResponseGrade = React.useCallback(
    async (
      response: CallResponseResponseCue,
      transcript: string,
      audioPath: string,
      attempts: number,
    ) => {
      const score = scoreSpokenAnswer(
        transcript,
        response.expected,
        response.accept,
      );
      const currentData = gradeDataRef.current;
      const savedBlock = currentData[blockId];
      const savedCues =
        isRecord(savedBlock) && isRecord(savedBlock.cues)
          ? (savedBlock.cues as Record<string, CueGrade>)
          : {};
      const nextCues = {
        ...savedCues,
        [response.id]: {
          ...savedCues[response.id],
          transcript,
          score: score.score,
          audioPath,
          attempts,
        },
      };
      const gradedBlock = summarizeBlockGrade(gradableResponses, nextCues);
      const updatedGrade = { ...currentData, [blockId]: gradedBlock };
      gradeDataRef.current = updatedGrade;
      await saveGrade(updatedGrade);
      setSavedGradeCount((count) => count + 1);
    },
    [blockId, gradableResponses, saveGrade],
  );

  const saveSlideGrade = React.useCallback(
    (cueId: string, slideGrade: SlideGrade) => {
      if (preview) return;
      gradingQueueRef.current = gradingQueueRef.current
        .then(async () => {
          const currentData = gradeDataRef.current;
          const savedBlock = currentData[blockId];
          const savedCues =
            isRecord(savedBlock) && isRecord(savedBlock.cues)
              ? (savedBlock.cues as Record<string, CueGrade>)
              : {};
          const nextCues = {
            ...savedCues,
            [cueId]: { ...savedCues[cueId], slide: slideGrade },
          };
          const updatedGrade = {
            ...currentData,
            [blockId]: summarizeBlockGrade(gradableResponses, nextCues),
          };
          gradeDataRef.current = updatedGrade;
          await saveGrade(updatedGrade);
          setSavedGradeCount((count) => count + 1);
        })
        .catch((gradingError: unknown) => {
          console.error("[CallResponsePlayer] Slide grading failed:", gradingError);
          setError(
            gradingError instanceof Error
              ? gradingError.message
              : "Unable to save the slide grade",
          );
        });
    },
    [blockId, gradableResponses, preview, saveGrade],
  );

  const queueGrading = React.useCallback(
    (response: CallResponseResponseCue, blob: Blob) => {
      gradingQueueRef.current = gradingQueueRef.current
        .then(async () => {
          const identityId = session?.identityId;
          const unitId = unit?.id;
          if (!identityId || !unitId) {
            throw new Error("A signed-in learner and unit are required to save audio");
          }
          const mimeType = blob.type || "audio/webm";
          const extension = mimeType.includes("mp4") ? "mp4" : "webm";
          const attempt =
            (attemptsRef.current[response.id] ?? 0) + 1;
          attemptsRef.current[response.id] = attempt;
          const audioPath = `protected/${identityId}/call-response/${unitId}/${blockId}/${response.id}-${attempt}.${extension}`;
          await uploadData({
            path: audioPath,
            data: blob,
            options: { contentType: mimeType },
          }).result;

          const audioUrl = await getCachedUrl(audioPath);
          if (!audioUrl) throw new Error("Unable to create an audio URL");
          const expectedTerms = [response.expected, ...response.accept]
            .filter((term) => term.trim().length >= 3)
            .join(", ");
          const client = getAmplifyClient();
          const verification = await client.queries.verifyAudioUrl({
            expected: response.expected,
            audioUrl,
            model: "whisper-1",
            chatModel: "gpt-4o-mini",
            ...(expectedTerms ? { prompt: expectedTerms } : {}),
          });
          if (verification.errors?.length) {
            throw new Error(
              `Audio transcription failed: ${JSON.stringify(verification.errors)}`,
            );
          }
          if (typeof verification.data !== "string") {
            throw new Error("Audio verification returned no result");
          }
          const transcript = parseVerifiedTranscript(verification.data);
          await saveResponseGrade(response, transcript, audioPath, attempt);
        })
        .catch((gradingError: unknown) => {
          console.error("[CallResponsePlayer] Response grading failed:", gradingError);
          setError(
            gradingError instanceof Error
              ? gradingError.message
              : "Unable to grade the spoken response",
          );
        });
    },
    [blockId, saveResponseGrade, session?.identityId, unit?.id],
  );

  const finishResponse = React.useCallback(() => {
    if (!responseActive.current) return;
    responseActive.current = false;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    if (!recorder && responseCue) {
      setMicRecorderAvailable(false);
      setError("Audio recording is not supported in this browser");
    }
    advanceCue();
  }, [advanceCue, responseCue]);
  finishResponseRef.current = finishResponse;

  const onVoiceFrame = React.useCallback(
    (rms: number, timestamp: number) => {
      const windowState = responseWindowRef.current;
      if (!responseCue || !responseActive.current || !windowState) return;
      const frame = evaluateResponseFrame(
        windowState,
        responseCue,
        rms,
        timestamp,
      );
      responseWindowRef.current = frame.state;
      if (frame.decision === "finish") finishResponseRef.current();
    },
    [responseCue],
  );
  const micLevel = useVoiceActivity(
    analyser,
    sessionController.state === "Response",
    onVoiceFrame,
  );

  const armSession = React.useCallback(async () => {
    setError(null);
    startSession();
    try {
      if (script.cues.length === 0) {
        markArmed();
        return;
      }
      await arm();
      markArmed();
    } catch (armError) {
      markDenied();
      setError(
        armError instanceof Error
          ? armError.message
          : "Microphone permission was denied",
      );
    }
  }, [arm, markArmed, markDenied, script.cues.length, startSession]);

  React.useEffect(() => {
    if (sessionController.state === "Done") release();
  }, [release, sessionController.state]);

  React.useEffect(() => {
    if (
      (sessionController.state !== "Prompt" &&
        sessionController.state !== "Answer") ||
      !cue
    ) {
      return;
    }
    let active = true;
    const text = cue.kind === "response" ? "" : cue.text;
    const playCue = async () => {
      if (cue.kind !== "response" && cue.audioFileID) {
        const client = getAmplifyClient();
        const fileResponse = await client.models.File.get({
          id: cue.audioFileID,
        });
        if (fileResponse.errors?.length || !fileResponse.data?.path) {
          throw new Error("Unable to load the call-response audio file");
        }
        const url = await getCachedUrl(fileResponse.data.path);
        if (!url) throw new Error("Unable to resolve the call-response audio");
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Call-response audio playback failed"));
          void audio.play().catch(reject);
        });
        return;
      }
      if (text && "speechSynthesis" in window) {
        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => resolve();
          utterance.onerror = () =>
            reject(new Error("Speech playback was interrupted"));
          window.speechSynthesis.speak(utterance);
        });
      }
    };

    void playCue()
      .then(() => {
        if (active) advanceCue();
      })
      .catch((playError: unknown) => {
        if (!active) return;
        console.error("[CallResponsePlayer] Prompt playback failed:", playError);
        setError(
          playError instanceof Error
            ? playError.message
            : "Unable to play this cue",
        );
      });
    return () => {
      active = false;
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, [advanceCue, cue, sessionController.state]);

  React.useEffect(() => {
    if (sessionController.state !== "Response" || !responseCue || !stream) {
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setMicRecorderAvailable(false);
      setError("Audio recording is not supported in this browser");
      return;
    }
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/mp4",
    ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (recordError) {
      setError(
        recordError instanceof Error
          ? recordError.message
          : "Unable to start audio recording",
      );
      finishResponseRef.current();
      return;
    }

    const chunks: Blob[] = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });
      if (blob.size > 0 && !preview) queueGrading(responseCue, blob);
    });
    recorderRef.current = recorder;
    responseActive.current = true;
    responseWindowRef.current = createResponseWindowState(performance.now());
    recorder.start();

    return () => {
      responseActive.current = false;
      if (recorder.state === "recording") recorder.stop();
      if (recorderRef.current === recorder) recorderRef.current = null;
    };
  }, [preview, queueGrading, responseCue, sessionController.state, stream]);

  React.useEffect(() => {
    if (sessionController.state !== "Response" || !audioContext) return;
    const roomTone = createRoomTone(audioContext);
    roomTone.start();
    return () => roomTone.stop();
  }, [audioContext, sessionController.state]);

  const continueWithoutAudio = React.useCallback(() => {
    setError(null);
    advanceCue();
  }, [advanceCue]);

  const pauseOrResume = () => {
    if (sessionController.state === "Paused") sessionController.resume();
    else sessionController.pause();
  };

  return (
    <Box
      role="group"
      aria-label={t("callResponse.groupLabel", { title: script.title })}
      sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}
    >
      <Stack spacing={1.5}>
        <Typography variant="h5">{script.title}</Typography>
        {albumTrackUrl && (
          <audio
            controls
            preload="none"
            src={albumTrackUrl}
            aria-label={t("callResponse.albumTrack", { title: script.title })}
          />
        )}
        {cue?.slide &&
          (sessionController.state === "Prompt" ||
            sessionController.state === "Response" ||
            sessionController.state === "Answer" ||
            sessionController.state === "Paused") && (
            <CallResponseSlideView
              key={cue.id}
              cueId={cue.id}
              slide={
                cue.slide.type === "lexical" && cue.kind !== "response"
                  ? { ...cue.slide, graded: false }
                  : cue.slide
              }
              slideGrade={savedCues[cue.id]?.slide}
              onSlideGrade={saveSlideGrade}
              ariaLabel={t("callResponse.slideLabel", { title: script.title })}
            />
          )}
        {sessionController.state === "Idle" && (
          <Button variant="contained" onClick={() => void armSession()}>
            {t("callResponse.start")}
          </Button>
        )}
        {sessionController.state === "Arming" && (
          <Typography role="status">{t("callResponse.preparingMic")}</Typography>
        )}
        {(sessionController.state === "Prompt" ||
          sessionController.state === "Answer") &&
          cue?.kind !== "response" && (
            <>
              <Typography variant="h6">{cue?.text}</Typography>
              <Button onClick={continueWithoutAudio}>
                {t("actions.continue")}
              </Button>
            </>
          )}
        {sessionController.state === "Response" && responseCue && (
          <>
            <Typography variant="h6">
              {t("callResponse.yourResponse", { field: responseCue.field })}
            </Typography>
            {micRecorderAvailable && (
              <FrequencyRingVisualizer
                analyser={analyser}
                visible={true}
                onLevelChange={() => undefined}
              />
            )}
            <LinearProgress
              aria-label={t("callResponse.microphoneActivity")}
              variant="determinate"
              value={micLevel * 100}
            />
            <Button onClick={finishResponse}>
              {t("callResponse.finishResponse")}
            </Button>
          </>
        )}
        {sessionController.state === "PermissionDenied" && (
          <>
            <Typography role="alert">
              {t("callResponse.microphoneRequired")}
            </Typography>
            <Button onClick={() => sessionController.reset()}>
              {t("actions.retry")}
            </Button>
          </>
        )}
        {sessionController.state === "Done" && (
          <Typography role="status">
            {t("callResponse.completed", {
              graded: completedResponses,
              total: responses.length,
            })}
          </Typography>
        )}
        {error && <Typography color="error">{error}</Typography>}
        {sessionController.state !== "Idle" &&
          sessionController.state !== "Done" &&
          sessionController.state !== "PermissionDenied" && (
            <Button onClick={pauseOrResume}>
              {sessionController.state === "Paused"
                ? t("callResponse.resume")
                : t("callResponse.pause")}
            </Button>
          )}
      </Stack>
    </Box>
  );
}
