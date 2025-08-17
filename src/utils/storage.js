import { STORAGE_KEYS } from '../lib/constants';

// Save playback state to localStorage
export const savePlaybackState = (state) => {
  try {
    const playbackData = {
      currentTrack: state.currentTrack || null,
      currentTime: state.currentTime || 0,
      isPlaying: state.isPlaying || false,
      volume: state.volume || 1,
      isMuted: state.isMuted || false,
      playbackRate: state.playbackRate || 1,
      repeat: state.repeat || 'none', // 'none', 'track', 'playlist'
      shuffle: state.shuffle || false,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify(playbackData));
  } catch (error) {
    console.error('Failed to save playback state:', error);
  }
};

// Get playback state from localStorage
export const getPlaybackState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYBACK_STATE);
    if (!stored) {
      return {
        currentTrack: null,
        currentTime: 0,
        isPlaying: false,
        volume: 1,
        isMuted: false,
        playbackRate: 1,
        repeat: 'none',
        shuffle: false,
        lastUpdated: null
      };
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate the data structure
    return {
      currentTrack: parsed.currentTrack || null,
      currentTime: typeof parsed.currentTime === 'number' ? parsed.currentTime : 0,
      isPlaying: Boolean(parsed.isPlaying),
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 1,
      isMuted: Boolean(parsed.isMuted),
      playbackRate: typeof parsed.playbackRate === 'number' ? Math.max(0.25, Math.min(2, parsed.playbackRate)) : 1,
      repeat: ['none', 'track', 'playlist'].includes(parsed.repeat) ? parsed.repeat : 'none',
      shuffle: Boolean(parsed.shuffle),
      lastUpdated: parsed.lastUpdated || null
    };
  } catch (error) {
    console.error('Failed to get playback state:', error);
    return {
      currentTrack: null,
      currentTime: 0,
      isPlaying: false,
      volume: 1,
      isMuted: false,
      playbackRate: 1,
      repeat: 'none',
      shuffle: false,
      lastUpdated: null
    };
  }
};

// Save playlist to localStorage
export const savePlaylist = (playlist) => {
  try {
    const playlistData = {
      tracks: Array.isArray(playlist.tracks) ? playlist.tracks : [],
      name: playlist.name || 'My Playlist',
      id: playlist.id || Date.now().toString(),
      createdAt: playlist.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalDuration: playlist.totalDuration || 0,
      trackCount: Array.isArray(playlist.tracks) ? playlist.tracks.length : 0
    };
    
    // Validate track structure
    playlistData.tracks = playlistData.tracks.map((track, index) => ({
      id: track.id || `track-${index}`,
      name: track.name || `Track ${index + 1}`,
      artist: track.artist || 'Unknown Artist',
      album: track.album || 'Unknown Album',
      duration: typeof track.duration === 'number' ? track.duration : 0,
      file: track.file || null,
      url: track.url || null,
      artwork: track.artwork || null,
      genre: track.genre || 'Unknown',
      year: track.year || null,
      trackNumber: track.trackNumber || index + 1,
      addedAt: track.addedAt || new Date().toISOString()
    }));
    
    localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlistData));
    
    // Also save to playlist history
    const history = getPlaylistHistory();
    const updatedHistory = [playlistData, ...history.filter(p => p.id !== playlistData.id)].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.PLAYLIST_HISTORY, JSON.stringify(updatedHistory));
    
  } catch (error) {
    console.error('Failed to save playlist:', error);
  }
};

// Get playlist from localStorage
export const getPlaylist = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYLIST);
    if (!stored) {
      return {
        tracks: [],
        name: 'My Playlist',
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalDuration: 0,
        trackCount: 0
      };
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate and clean the data
    const playlist = {
      tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
      name: parsed.name || 'My Playlist',
      id: parsed.id || Date.now().toString(),
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      totalDuration: typeof parsed.totalDuration === 'number' ? parsed.totalDuration : 0,
      trackCount: typeof parsed.trackCount === 'number' ? parsed.trackCount : 0
    };
    
    // Recalculate totals if they don't match
    if (playlist.trackCount !== playlist.tracks.length) {
      playlist.trackCount = playlist.tracks.length;
      playlist.totalDuration = playlist.tracks.reduce((total, track) => total + (track.duration || 0), 0);
    }
    
    return playlist;
  } catch (error) {
    console.error('Failed to get playlist:', error);
    return {
      tracks: [],
      name: 'My Playlist',
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalDuration: 0,
      trackCount: 0
    };
  }
};

// Helper function to get playlist history
const getPlaylistHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYLIST_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get playlist history:', error);
    return [];
  }
};

// Clear all stored data
export const clearStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};

// Get storage usage info
export const getStorageInfo = () => {
  try {
    let totalSize = 0;
    const items = {};
    
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key);
      const size = item ? new Blob([item]).size : 0;
      items[name] = {
        key,
        size,
        exists: Boolean(item)
      };
      totalSize += size;
    });
    
    return {
      totalSize,
      items,
      available: navigator.storage && navigator.storage.estimate ? 
        navigator.storage.estimate() : Promise.resolve({ usage: 0, quota: 0 })
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      totalSize: 0,
      items: {},
      available: Promise.resolve({ usage: 0, quota: 0 })
    };
  }
};