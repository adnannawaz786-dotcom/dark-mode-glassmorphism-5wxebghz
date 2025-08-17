import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Plus, X, Upload, Music, Trash2, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { savePlaylist, getPlaylist } from '../utils/storage';
import { PLAYLIST_DEFAULTS } from '../lib/constants';

const PlaylistManager = ({ 
  currentTrack, 
  onTrackSelect, 
  isPlaying, 
  onPlayPause,
  onNext,
  onPrevious,
  volume,
  onVolumeChange 
}) => {
  const [playlist, setPlaylist] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');

  useEffect(() => {
    loadPlaylist();
  }, []);

  const loadPlaylist = () => {
    const savedPlaylist = getPlaylist();
    if (savedPlaylist && savedPlaylist.length > 0) {
      setPlaylist(savedPlaylist);
    } else {
      setPlaylist(PLAYLIST_DEFAULTS.tracks);
      savePlaylist(PLAYLIST_DEFAULTS.tracks);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    audioFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newTrack = {
          id: Date.now() + Math.random(),
          title: newTrackName || file.name.replace(/\.[^/.]+$/, ""),
          artist: 'Unknown Artist',
          duration: '0:00',
          url: e.target.result,
          file: file
        };
        
        const updatedPlaylist = [...playlist, newTrack];
        setPlaylist(updatedPlaylist);
        savePlaylist(updatedPlaylist);
        setNewTrackName('');
        setShowUpload(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeTrack = (trackId) => {
    const updatedPlaylist = playlist.filter(track => track.id !== trackId);
    setPlaylist(updatedPlaylist);
    savePlaylist(updatedPlaylist);
  };

  const editTrack = (track) => {
    setEditingTrack({ ...track });
    setIsEditing(true);
  };

  const saveTrackEdit = () => {
    const updatedPlaylist = playlist.map(track => 
      track.id === editingTrack.id ? editingTrack : track
    );
    setPlaylist(updatedPlaylist);
    savePlaylist(updatedPlaylist);
    setIsEditing(false);
    setEditingTrack(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Playlist</h2>
            <p className="text-sm text-white/60">{playlist.length} tracks</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowUpload(true)}
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 transition-all duration-200"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 bg-white/5 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevious}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <SkipBack className="w-4 h-4 text-white" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>
          
          <button
            onClick={onNext}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <SkipForward className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-white/60" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <AnimatePresence>
          {playlist.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                currentTrack?.id === track.id
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
              onClick={() => onTrackSelect(track)}
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                {currentTrack?.id === track.id && isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '12px', animationDelay: '0ms' }}></div>
                    <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '8px', animationDelay: '150ms' }}></div>
                    <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '16px', animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <Music className="w-5 h-5 text-white/60" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{track.title}</h3>
                <p className="text-white/60 text-sm truncate">{track.artist}</p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editTrack(track);
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrack(track.id);
                  }}
                  className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <span className="text-white/40 text-sm flex-shrink-0">
                {track.duration}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add Track</h3>
                <button
                  onClick={() => setShowUpload(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Track Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newTrackName}
                    onChange={(e) => setNewTrackName(e.target.value)}
                    placeholder="Enter track name..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Select Audio File
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-white/60" />
                      <p className="mb-2 text-sm text-white/60">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-white/40">MP3, WAV, OGG files</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && editingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Track</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingTrack.title}
                    onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={editingTrack.artist}
                    onChange={(e) => setEditingTrack({ ...editingTrack, artist: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveTrackEdit}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-white\/20::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default PlaylistManager;