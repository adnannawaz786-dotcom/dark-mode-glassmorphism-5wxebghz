import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, RotateCcw } from 'lucide-react';
import Visualizer from './Visualizer';
import { useAudioContext } from '../utils/audioContext';
import { savePlaybackState, getPlaybackState } from '../utils/storage';
import { AUDIO_SETTINGS } from '../lib/constants';

const AudioPlayer = () => {
  const { audioContext, analyserNode } = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const progressRef = useRef(null);

  // Load saved state on component mount
  useEffect(() => {
    const savedState = getPlaybackState();
    if (savedState) {
      setVolume(savedState.volume || 0.8);
      setCurrentTrackIndex(savedState.currentTrackIndex || 0);
      if (savedState.playlist && savedState.playlist.length > 0) {
        setPlaylist(savedState.playlist);
        setCurrentTrack(savedState.playlist[savedState.currentTrackIndex || 0]);
      }
    }
  }, []);

  // Save state whenever important values change
  useEffect(() => {
    if (playlist.length > 0) {
      savePlaybackState({
        volume,
        currentTrackIndex,
        playlist,
        currentTime,
        isPlaying: false // Don't auto-play on reload
      });
    }
  }, [volume, currentTrackIndex, playlist, currentTime]);

  // Setup audio nodes when audio context is available
  useEffect(() => {
    if (audioContext && audioRef.current && !sourceNodeRef.current) {
      setupAudioNodes();
    }
  }, [audioContext, currentTrack]);

  const setupAudioNodes = () => {
    if (!audioContext || !audioRef.current) return;

    try {
      // Clean up existing nodes
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }

      // Create new nodes
      const source = audioContext.createMediaElementSource(audioRef.current);
      const gainNode = audioContext.createGain();

      // Connect nodes: source -> gain -> analyser -> destination
      source.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      gainNode.gain.value = isMuted ? 0 : volume;

      sourceNodeRef.current = source;
      gainNodeRef.current = gainNode;
    } catch (error) {
      console.error('Error setting up audio nodes:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      alert('Please select valid audio files');
      return;
    }

    const newTracks = audioFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name.replace(/\.[^/.]+$/, ''),
      url: URL.createObjectURL(file),
      file: file,
      duration: 0
    }));

    setPlaylist(prev => [...prev, ...newTracks]);
    
    if (!currentTrack) {
      setCurrentTrack(newTracks[0]);
      setCurrentTrackIndex(playlist.length);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const skipTrack = (direction) => {
    if (playlist.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentTrackIndex + 1) % playlist.length;
    } else {
      newIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    }

    setCurrentTrackIndex(newIndex);
    setCurrentTrack(playlist[newIndex]);
    setIsPlaying(false);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.value = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = !isMuted ? 0 : volume;
    }
  };

  const handleProgressClick = (event) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentTrack(null);
    setPlaylist([]);
    setCurrentTrackIndex(0);
    localStorage.removeItem('audioPlayerState');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* Main Player Container */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
        {/* Visualizer */}
        <div className="mb-8 h-32 rounded-2xl overflow-hidden bg-black/20 border border-white/10">
          <Visualizer isPlaying={isPlaying} />
        </div>

        {/* Track Info */}
        <AnimatePresence mode="wait">
          {currentTrack ? (
            <motion.div
              key={currentTrack.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-bold text-white mb-2 truncate">
                {currentTrack.name}
              </h2>
              <p className="text-white/60">
                Track {currentTrackIndex + 1} of {playlist.length}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-bold text-white/60 mb-2">
                No Track Selected
              </h2>
              <p className="text-white/40">Upload audio files to get started</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mb-6">
          <div
            ref={progressRef}
            className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-200 group-hover:shadow-lg group-hover:shadow-purple-500/25"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => skipTrack('prev')}
            disabled={playlist.length === 0}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            disabled={!currentTrack}
            className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => skipTrack('next')}
            disabled={playlist.length === 0}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward size={20} />
          </motion.button>
        </div>

        {/* Volume and Additional Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </motion.button>
            <div className="w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetPlayer}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Reset Player"
            >
              <RotateCcw size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Upload size={18} />
            </motion.button>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack?.url}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              setupAudioNodes();
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current && !isDragging) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            if (playlist.length > 1) {
              skipTrack('next');
            } else {
              setIsPlaying(false);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Playlist */}
      {playlist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Playlist</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {playlist.map((track, index) => (
              <motion.div
                key={track.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setCurrentTrack(track);
                  setCurrentTrackIndex(index);
                  setIsPlaying(false);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  index === currentTrackIndex
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white truncate flex-1">{track.name}</span>
                  <span className="text-white/60 text-sm ml-2">{index + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #a855f7, #ec4899);
          border-radius: 3px;
        }
      `}</style>
    </motion.div>
  );
};

export default AudioPlayer;