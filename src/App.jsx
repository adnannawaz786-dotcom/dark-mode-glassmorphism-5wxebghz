import { AudioProvider } from './utils/audioContext'
import AudioPlayer from './components/AudioPlayer'
import PlaylistManager from './components/PlaylistManager'
import { useState } from 'react'
import { motion } from 'framer-motion'

function App() {
  const [showPlaylist, setShowPlaylist] = useState(false)

  return (
    <AudioProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
        </div>

        {/* Glassmorphism container */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"
              >
                Glassmorphic Player
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 text-lg"
              >
                Experience music with stunning visualizations
              </motion.p>
            </div>

            {/* Main player container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Audio Player - takes up 2 columns on large screens */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <AudioPlayer />
              </motion.div>

              {/* Playlist Manager - 1 column */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-1"
              >
                <PlaylistManager />
              </motion.div>
            </div>

            {/* Mobile playlist toggle */}
            <div className="lg:hidden mt-6 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-300"
              >
                {showPlaylist ? 'Hide Playlist' : 'Show Playlist'}
              </motion.button>
            </div>

            {/* Mobile playlist overlay */}
            {showPlaylist && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowPlaylist(false)}
              >
                <div
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PlaylistManager />
                  <button
                    onClick={() => setShowPlaylist(false)}
                    className="mt-4 w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-12 text-gray-400"
            >
              <p className="text-sm">
                Built with React, Vite & Tailwind CSS • Powered by Web Audio API
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AudioProvider>
  )
}

export default App