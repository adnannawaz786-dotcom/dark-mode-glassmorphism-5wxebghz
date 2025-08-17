// Audio settings and configuration constants
export const AUDIO_SETTINGS = {
  DEFAULT_VOLUME: 0.7,
  FADE_DURATION: 0.5,
  VISUALIZER_BARS: 64,
  VISUALIZER_SMOOTHING: 0.8,
  SAMPLE_RATE: 44100,
  FFT_SIZE: 2048,
  MIN_DECIBELS: -90,
  MAX_DECIBELS: -10,
  CROSSFADE_DURATION: 3000,
  SEEK_STEP: 10, // seconds
  VOLUME_STEP: 0.1
};

// Default playlist configuration
export const PLAYLIST_DEFAULTS = {
  NAME: 'My Playlist',
  SHUFFLE: false,
  REPEAT: 'none', // 'none', 'all', 'one'
  AUTOPLAY: true,
  CROSSFADE: false,
  GAPLESS: true,
  MAX_TRACKS: 1000,
  SUPPORTED_FORMATS: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  DEFAULT_ARTWORK: 'https://via.placeholder.com/300x300/1f2937/f3f4f6?text=♪',
  QUEUE_SIZE: 50
};

// LocalStorage keys for data persistence
export const STORAGE_KEYS = {
  PLAYBACK_STATE: 'mp3_player_playback_state',
  CURRENT_PLAYLIST: 'mp3_player_current_playlist',
  USER_PLAYLISTS: 'mp3_player_user_playlists',
  VOLUME: 'mp3_player_volume',
  SETTINGS: 'mp3_player_settings',
  QUEUE: 'mp3_player_queue',
  RECENTLY_PLAYED: 'mp3_player_recently_played',
  FAVORITES: 'mp3_player_favorites',
  EQUALIZER: 'mp3_player_equalizer',
  THEME_PREFERENCE: 'mp3_player_theme'
};

// Visualizer configuration
export const VISUALIZER_CONFIG = {
  TYPES: {
    BARS: 'bars',
    CIRCULAR: 'circular',
    WAVEFORM: 'waveform',
    SPECTRUM: 'spectrum'
  },
  COLORS: {
    PRIMARY: '#3b82f6',
    SECONDARY: '#8b5cf6',
    ACCENT: '#06d6a0',
    GRADIENT_START: '#667eea',
    GRADIENT_END: '#764ba2'
  },
  ANIMATION: {
    FRAME_RATE: 60,
    DECAY_RATE: 0.95,
    MIN_HEIGHT: 2,
    MAX_HEIGHT: 200,
    BAR_WIDTH: 4,
    BAR_GAP: 2
  }
};

// Player states and modes
export const PLAYER_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  ERROR: 'error',
  BUFFERING: 'buffering'
};

export const REPEAT_MODES = {
  NONE: 'none',
  ALL: 'all',
  ONE: 'one'
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_NOT_SUPPORTED: 'File format not supported',
  LOAD_ERROR: 'Failed to load audio file',
  PLAYBACK_ERROR: 'Playback error occurred',
  STORAGE_ERROR: 'Failed to save to storage',
  PERMISSION_ERROR: 'Permission denied',
  NETWORK_ERROR: 'Network error occurred'
};

// UI constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  PLAYER_HEIGHT: 80,
  TRANSITION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 3000,
  MODAL_BACKDROP_BLUR: 'blur(8px)',
  GLASSMORPHISM_OPACITY: 0.1
};