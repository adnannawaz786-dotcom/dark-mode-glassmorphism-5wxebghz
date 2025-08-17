import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { savePlaybackState, getPlaybackState } from './storage.js';
import { AUDIO_SETTINGS } from '../lib/constants.js';

const AudioContext = createContext();

const initialState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: AUDIO_SETTINGS.DEFAULT_VOLUME,
  isMuted: false,
  playlist: [],
  currentIndex: -1,
  isLoading: false,
  error: null,
  analyzerData: new Uint8Array(256),
  isShuffled: false,
  repeatMode: 'none', // 'none', 'one', 'all'
};

const audioReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload.track,
        currentIndex: action.payload.index,
        isLoading: true,
        error: null,
      };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, isMuted: false };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_PLAYLIST':
      return { ...state, playlist: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ANALYZER_DATA':
      return { ...state, analyzerData: action.payload };
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled };
    case 'SET_REPEAT_MODE':
      const modes = ['none', 'one', 'all'];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...state, repeatMode: modes[nextIndex] };
    case 'NEXT_TRACK':
      const nextIdx = state.isShuffled 
        ? Math.floor(Math.random() * state.playlist.length)
        : (state.currentIndex + 1) % state.playlist.length;
      return {
        ...state,
        currentIndex: nextIdx,
        currentTrack: state.playlist[nextIdx] || null,
      };
    case 'PREVIOUS_TRACK':
      const prevIdx = state.currentIndex > 0 
        ? state.currentIndex - 1 
        : state.playlist.length - 1;
      return {
        ...state,
        currentIndex: prevIdx,
        currentTrack: state.playlist[prevIdx] || null,
      };
    default:
      return state;
  }
};

export const createAudioContext = () => {
  let audioContext = null;
  let analyser = null;
  let dataArray = null;

  const initializeContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    return { audioContext, analyser, dataArray };
  };

  const connectSource = (audioElement) => {
    if (audioContext && analyser && audioElement) {
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      return source;
    }
    return null;
  };

  const getAnalyzerData = () => {
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      return new Uint8Array(dataArray);
    }
    return new Uint8Array(256);
  };

  const resume = () => {
    if (audioContext && audioContext.state === 'suspended') {
      return audioContext.resume();
    }
    return Promise.resolve();
  };

  return {
    initializeContext,
    connectSource,
    getAnalyzerData,
    resume,
  };
};

export const AudioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const audioRef = useRef(null);
  const audioContextRef = useRef(createAudioContext());
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleLoadStart = () => dispatch({ type: 'SET_LOADING', payload: true });
    const handleCanPlay = () => dispatch({ type: 'SET_LOADING', payload: false });
    const handleLoadedMetadata = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration });
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    const handleTimeUpdate = () => dispatch({ type: 'SET_TIME', payload: audio.currentTime });
    const handleEnded = () => {
      dispatch({ type: 'SET_PLAYING', payload: false });
      handleTrackEnd();
    };
    const handleError = (e) => {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load audio file' });
      console.error('Audio error:', e);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Load saved state
  useEffect(() => {
    const savedState = getPlaybackState();
    if (savedState) {
      dispatch({ type: 'SET_VOLUME', payload: savedState.volume || AUDIO_SETTINGS.DEFAULT_VOLUME });
      if (savedState.playlist && savedState.playlist.length > 0) {
        dispatch({ type: 'SET_PLAYLIST', payload: savedState.playlist });
        if (savedState.currentIndex >= 0 && savedState.currentIndex < savedState.playlist.length) {
          dispatch({
            type: 'SET_TRACK',
            payload: {
              track: savedState.playlist[savedState.currentIndex],
              index: savedState.currentIndex,
            },
          });
        }
      }
    }
  }, []);

  // Save state changes
  useEffect(() => {
    const stateToSave = {
      volume: state.volume,
      playlist: state.playlist,
      currentIndex: state.currentIndex,
      currentTime: state.currentTime,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
    };
    savePlaybackState(stateToSave);
  }, [state.volume, state.playlist, state.currentIndex, state.currentTime, state.isShuffled, state.repeatMode]);

  // Audio context and analyzer setup
  useEffect(() => {
    if (audioRef.current && !sourceRef.current) {
      try {
        const { initializeContext, connectSource } = audioContextRef.current;
        initializeContext();
        sourceRef.current = connectSource(audioRef.current);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, [state.currentTrack]);

  // Analyzer animation loop
  useEffect(() => {
    if (state.isPlaying) {
      const updateAnalyzer = () => {
        const { getAnalyzerData } = audioContextRef.current;
        const analyzerData = getAnalyzerData();
        dispatch({ type: 'SET_ANALYZER_DATA', payload: analyzerData });
        animationFrameRef.current = requestAnimationFrame(updateAnalyzer);
      };
      updateAnalyzer();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying]);

  const handleTrackEnd = () => {
    if (state.repeatMode === 'one') {
      seekTo(0);
      play();
    } else if (state.repeatMode === 'all' || state.currentIndex < state.playlist.length - 1) {
      nextTrack();
    }
  };

  const loadTrack = (track, index) => {
    if (!track || !track.url) return;
    
    dispatch({ type: 'SET_TRACK', payload: { track, index } });
    
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
  };

  const play = async () => {
    if (!audioRef.current || !state.currentTrack) return;

    try {
      await audioContextRef.current.resume();
      await audioRef.current.play();
      dispatch({ type: 'SET_PLAYING', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio' });
      console.error('Play error:', error);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  };

  const togglePlayPause = () => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      dispatch({ type: 'SET_TIME', payload: time });
    }
  };

  const setVolume = (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    dispatch({ type: 'SET_VOLUME', payload: clampedVolume });
    
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : clampedVolume;
    }
  };

  const toggleMute = () => {
    dispatch({ type: 'TOGGLE_MUTE' });
    
    if (audioRef.current) {
      audioRef.current.volume = !state.isMuted ? 0 : state.volume;
    }
  };

  const nextTrack = () => {
    if (state.playlist.length === 0) return;
    
    dispatch({ type: 'NEXT_TRACK' });
    
    setTimeout(() => {
      const nextIndex = state.isShuffled 
        ? Math.floor(Math.random() * state.playlist.length)
        : (state.currentIndex + 1) % state.playlist.length;
      
      const nextTrack = state.playlist[nextIndex];
      if (nextTrack) {
        loadTrack(nextTrack, nextIndex);
      }
    }, 0);
  };

  const previousTrack = () => {
    if (state.playlist.length === 0) return;
    
    dispatch({ type: 'PREVIOUS_TRACK' });
    
    setTimeout(() => {
      const prevIndex = state.currentIndex > 0 
        ? state.currentIndex - 1 
        : state.playlist.length - 1;
      
      const prevTrack = state.playlist[prevIndex];
      if (prevTrack) {
        loadTrack(prevTrack, prevIndex);
      }
    }, 0);
  };

  const setPlaylist = (playlist) => {
    dispatch({ type: 'SET_PLAYLIST', payload: playlist });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const toggleRepeat = () => {
    dispatch({ type: 'SET_REPEAT_MODE' });
  };

  const value = {
    ...state,
    loadTrack,
    play,
    pause,
    togglePlayPause,
    seekTo,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    setPlaylist,
    toggleShuffle,
    toggleRepeat,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};