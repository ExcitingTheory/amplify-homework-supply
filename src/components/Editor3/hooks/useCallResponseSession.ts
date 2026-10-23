import * as React from "react";
import type { CallResponseScript } from "../../../utils/callResponse/buildCallResponseScript";

export type CallResponseSessionState =
  | "Idle"
  | "Arming"
  | "Prompt"
  | "Response"
  | "Answer"
  | "Done"
  | "PermissionDenied"
  | "Paused";

export interface CallResponseSession {
  state: CallResponseSessionState;
  cueIndex: number;
  previousState: Exclude<
    CallResponseSessionState,
    "Idle" | "Arming" | "Done" | "PermissionDenied" | "Paused"
  > | null;
}

export type CallResponseSessionAction =
  | { type: "START" }
  | { type: "ARMED"; firstCueState: CallResponseSessionState }
  | { type: "ADVANCE"; nextCueState: CallResponseSessionState | null }
  | { type: "DENIED" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" };

export const initialCallResponseSession: CallResponseSession = {
  state: "Idle",
  cueIndex: 0,
  previousState: null,
};

export function callResponseSessionReducer(
  session: CallResponseSession,
  action: CallResponseSessionAction,
): CallResponseSession {
  switch (action.type) {
    case "START":
      return { state: "Arming", cueIndex: 0, previousState: null };
    case "ARMED":
      return {
        state: action.firstCueState,
        cueIndex: 0,
        previousState: null,
      };
    case "ADVANCE":
      return action.nextCueState === null
        ? { state: "Done", cueIndex: session.cueIndex + 1, previousState: null }
        : {
            state: action.nextCueState,
            cueIndex: session.cueIndex + 1,
            previousState: null,
          };
    case "DENIED":
      return { ...session, state: "PermissionDenied", previousState: null };
    case "PAUSE":
      if (
        session.state !== "Prompt" &&
        session.state !== "Response" &&
        session.state !== "Answer"
      ) {
        return session;
      }
      return { ...session, state: "Paused", previousState: session.state };
    case "RESUME":
      return session.state === "Paused" && session.previousState
        ? { ...session, state: session.previousState, previousState: null }
        : session;
    case "RESET":
      return initialCallResponseSession;
  }
}

export function getCallResponseCueState(
  cue: CallResponseScript["cues"][number] | undefined,
): CallResponseSessionState | null {
  if (!cue) return null;
  if (cue.kind === "prompt") return "Prompt";
  if (cue.kind === "response") return "Response";
  return "Answer";
}

export function useCallResponseSession(script: CallResponseScript) {
  const [session, dispatch] = React.useReducer(
    callResponseSessionReducer,
    initialCallResponseSession,
  );
  const start = React.useCallback(
    () => dispatch({ type: "START" }),
    [],
  );
  const armed = React.useCallback(() => {
    dispatch({
      type: "ARMED",
      firstCueState: getCallResponseCueState(script.cues[0]) ?? "Done",
    });
  }, [script.cues]);
  const advance = React.useCallback(() => {
    const nextCue = script.cues[session.cueIndex + 1];
    dispatch({
      type: "ADVANCE",
      nextCueState: getCallResponseCueState(nextCue),
    });
  }, [script.cues, session.cueIndex]);
  const deny = React.useCallback(() => dispatch({ type: "DENIED" }), []);
  const pause = React.useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = React.useCallback(() => dispatch({ type: "RESUME" }), []);
  const reset = React.useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...session, start, armed, advance, deny, pause, resume, reset };
}

export function useLiveMicStream() {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [analyser, setAnalyser] = React.useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = React.useState<AudioContext | null>(
    null,
  );
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);

  const arm = React.useCallback(async () => {
    const audioContext = new AudioContext();
    try {
      await audioContext.resume();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const source = audioContext.createMediaStreamSource(mediaStream);
      const nextAnalyser = audioContext.createAnalyser();
      nextAnalyser.fftSize = 2048;
      nextAnalyser.smoothingTimeConstant = 0.8;
      source.connect(nextAnalyser);
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setAnalyser(nextAnalyser);
      setAudioContext(audioContext);
    } catch (error) {
      await audioContext.close();
      throw error;
    }
  }, []);

  const release = React.useCallback(() => {
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setAnalyser(null);
    setAudioContext(null);
    sourceRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  React.useEffect(() => release, [release]);

  return { stream, analyser, audioContext, arm, release };
}

export function useVoiceActivity(
  analyser: AnalyserNode | null,
  active: boolean,
  onFrame: (rms: number, timestamp: number) => void,
): number {
  const [level, setLevel] = React.useState(0);
  const onFrameRef = React.useRef(onFrame);
  React.useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  React.useEffect(() => {
    if (!active || !analyser) {
      setLevel(0);
      return;
    }
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let lastUpdate = 0;
    const readLevel = (timestamp: number) => {
      analyser.getByteTimeDomainData(samples);
      const rms = Math.sqrt(
        samples.reduce((sum, sample) => {
          const normalized = (sample - 128) / 128;
          return sum + normalized * normalized;
        }, 0) / samples.length,
      );
      onFrameRef.current(rms, timestamp);
      if (timestamp - lastUpdate >= 80) {
        setLevel(Math.max(0, Math.min(1, rms * 8)));
        lastUpdate = timestamp;
      }
      frame = requestAnimationFrame(readLevel);
    };
    frame = requestAnimationFrame(readLevel);
    return () => cancelAnimationFrame(frame);
  }, [active, analyser]);

  return level;
}
