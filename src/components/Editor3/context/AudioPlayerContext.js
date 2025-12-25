import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

/**
 * Shared audio player context
 * Provides a single audio element that all AudioWaveformPlayers can use
 * Only one audio can play at a time
 */

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
    const audioRef = useRef(null);
    const [currentSource, setCurrentSource] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const listenersRef = useRef(new Set());

    // Initialize audio element if it doesn't exist
    if (!audioRef.current && typeof window !== 'undefined') {
        audioRef.current = new Audio();
        audioRef.current.preload = 'metadata';

        // Set up event listeners
        audioRef.current.addEventListener('timeupdate', () => {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);
            // Notify all listeners
            listenersRef.current.forEach(listener => {
                if (listener.onTimeUpdate) {
                    listener.onTimeUpdate(time);
                }
            });
        });

        audioRef.current.addEventListener('loadedmetadata', () => {
            const dur = audioRef.current.duration;
            const validDuration = isNaN(dur) || !isFinite(dur) ? 0 : dur;
            setDuration(validDuration);
            listenersRef.current.forEach(listener => {
                if (listener.onDurationChange) {
                    listener.onDurationChange(validDuration);
                }
            });
        });

        audioRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
            listenersRef.current.forEach(listener => {
                if (listener.onEnded) {
                    listener.onEnded();
                }
            });
        });

        audioRef.current.addEventListener('canplay', () => {
            listenersRef.current.forEach(listener => {
                if (listener.onCanPlay) {
                    listener.onCanPlay();
                }
            });
        });

        audioRef.current.addEventListener('error', (e) => {
            console.error('Shared audio error:', e, audioRef.current.error);
            setIsPlaying(false);
            listenersRef.current.forEach(listener => {
                if (listener.onError) {
                    listener.onError(e);
                }
            });
        });

        audioRef.current.addEventListener('play', () => {
            setIsPlaying(true);
        });

        audioRef.current.addEventListener('pause', () => {
            setIsPlaying(false);
        });
    }

    const loadSource = useCallback((sourceUrl) => {
        if (!audioRef.current || !sourceUrl) {
            console.warn('[AudioPlayerContext] Cannot load source - missing audio element or source URL');
            return false;
        }
        
        // If already loaded with same source, just notify it's ready
        if (currentSource === sourceUrl && audioRef.current.src === sourceUrl) {
            console.log('[AudioPlayerContext] Source already loaded:', sourceUrl.substring(0, 50) + '...');
            // Trigger canplay event for already-loaded source
            listenersRef.current.forEach(listener => {
                if (listener.onCanPlay) {
                    listener.onCanPlay();
                }
            });
            return true;
        }

        try {
            console.log('[AudioPlayerContext] Loading new source:', sourceUrl.substring(0, 50) + '...');
            audioRef.current.src = sourceUrl;
            audioRef.current.load();
            setCurrentSource(sourceUrl);
            setCurrentTime(0);
            return true;
        } catch (error) {
            console.error('[AudioPlayerContext] Error loading audio source:', error);
            return false;
        }
    }, [currentSource]);

    const play = useCallback(async (sourceUrl) => {
        if (!audioRef.current) return false;

        // Load source if different
        if (sourceUrl && sourceUrl !== currentSource) {
            const loaded = loadSource(sourceUrl);
            if (!loaded) return false;
        }

        try {
            await audioRef.current.play();
            return true;
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
            return false;
        }
    }, [currentSource, loadSource]);

    const pause = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
    }, []);

    const seek = useCallback((time) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
    }, []);

    const subscribe = useCallback((listener) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    const value = {
        audioElement: audioRef.current,
        currentSource,
        isPlaying,
        currentTime,
        duration,
        loadSource,
        play,
        pause,
        seek,
        subscribe
    };

    return (
        <AudioPlayerContext.Provider value={value}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
    }
    return context;
}
