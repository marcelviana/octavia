# Octavia

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/marcelvianas-projects/v0-music-sheet-pro)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/T2dv1h11MUJ)
[![codecov](https://codecov.io/gh/marcelvianas-projects/octavia/branch/main/graph/badge.svg)](https://codecov.io/gh/marcelvianas-projects/octavia)

## 🎵 Overview

Octavia is a comprehensive digital music management application designed for musicians who want to replace physical folders of sheet music, tablatures, and lyrics. The app facilitates organization, visualization, and sharing of musical content during rehearsals and performances.

**Live Demo:** [https://vercel.com/marcelvianas-projects/v0-music-sheet-pro](https://vercel.com/marcelvianas-projects/v0-music-sheet-pro)

## ✨ Key Features

### 📚 **Music Library Management**
- **Multi-format Support**: Import and organize sheet music (PDF, PNG, JPG), guitar tabs (GP5, GPX), chord charts, lyrics, and more
- **Smart Organization**: Categorize content by type, genre, difficulty, key, and custom tags
- **Advanced Search**: Find songs by title, artist, tags, or musical properties
- **Favorites System**: Mark frequently used songs for quick access
- **Grid & List Views**: Switch between visual layouts for optimal browsing

### 🎭 **Performance Mode**
- **Distraction-Free Interface**: Full-screen mode optimized for live performances
- **Auto-Hide Controls**: UI elements fade away during performance for minimal distraction
- **Keyboard Navigation**: Navigate songs with arrow keys, space bar, and escape
- **Zoom Controls**: Adjust content size for optimal visibility on stage
- **Timer Integration**: Track performance time with built-in elapsed timer
- **Quick Song Switching**: Seamless transitions between songs in setlists

### 📝 **Setlist Management**
- **Create & Organize**: Build custom setlists for different venues and occasions
- **Drag & Drop Ordering**: Easily reorder songs within setlists
- **Performance Analytics**: Track total duration and song count
- **Quick Actions**: Duplicate, share, and manage setlists efficiently
- **Song Addition**: Add songs from your library to existing setlists
- **Performance Integration**: Launch directly into performance mode from setlists

### 🎨 **Content Creation & Editing**
- **Built-in Editors**: Create lyrics sheets, chord charts, and guitar tablatures from scratch
- **Annotation Tools**: Add notes, highlights, and markings to existing sheet music
- **Multiple Content Types**:
  - Lyrics-only sheets with formatting options
  - Chord charts with progression mapping
  - Guitar tablatures with standard notation
  - Piano scores and arrangements
  - Drum notation and patterns
- **Real-time Preview**: See changes as you edit
- **Version Control**: Undo/redo functionality for safe editing

### 📱 **Content Import Options**
- **File Upload**: Drag-and-drop or browse for local files
- **URL Import**: Import from online music libraries (IMSLP, MuseScore, Ultimate Guitar)
- **Batch Processing**: Upload multiple files simultaneously
- **Auto-Detection**: Automatically categorize content by file type

### 🎯 **Smart Dashboard**
- **Recent Activity**: Quick access to recently opened content
- **Performance Overview**: Upcoming gigs and setlist management
- **Library Statistics**: Track your collection growth and practice time
- **Quick Actions**: Fast access to common tasks and content creation
- **Practice Insights**: Monitor your musical progress and habits

### ⚙️ **Comprehensive Settings**
- **Display Customization**: Adjust zoom levels, fonts, and layout preferences
- **Performance Optimization**: Configure auto-scroll, metronome, and keyboard shortcuts
- **Sync & Backup**: Cloud synchronization and local backup options
- **Data Management**: Import/export capabilities and storage analytics
- **User Preferences**: Personalize the app to match your workflow

### 🎼 **Advanced Music Features**
- **Key & BPM Tracking**: Store and display musical properties
- **Difficulty Ratings**: Organize content by skill level
- **Capo & Tuning Support**: Guitar-specific notation and settings
- **Time Signature Support**: Handle various musical time signatures
- **Genre Classification**: Organize by musical styles and categories

## 🎨 Design & User Experience

### **Warm Color Palette**
- **Primary Background**: Warm cream (`#fff9f0`) for reduced eye strain
- **Accent Colors**: Professional blue (`#2E7CE4`) for interactive elements
- **Text Hierarchy**: High contrast grays for optimal readability
- **Status Indicators**: Color-coded difficulty levels and content types

### **Responsive Design**
- **Mobile Optimized**: Touch-friendly interface for tablets and phones
- **Desktop Enhanced**: Full keyboard support and multi-panel layouts
- **Performance Mode**: Optimized for stage lighting conditions
- **Accessibility**: Screen reader support and keyboard navigation

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS with custom color palette
- **Icons**: Lucide React icon set
- **State Management**: React hooks and context
- **File Handling**: Multi-format support with drag-and-drop
- **Testing**: Vitest with React Testing Library + Playwright for E2E testing
- **Coverage**: Codecov integration for test coverage tracking
- **Deployment**: Vercel with automatic deployments

## 🚀 Getting Started

### Installation Options

#### Use the Built-in Installation (Recommended)
1. Visit the [live demo](https://vercel.com/marcelvianas-projects/v0-music-sheet-pro)
2. Click "Download Code" in the top right corner
3. Follow the shadcn CLI setup instructions

The `ALLOWED_PROXY_HOSTS` variable controls which domains the
offline cache proxy will fetch from. Add any additional hosts
you need for external imports (comma‑separated).

Authentication tokens are now verified directly using the Firebase Admin SDK in
middleware. No additional URLs are required, and results are cached to allow
offline access.

### First Steps
1. **Import Content**: Start by uploading your existing sheet music and tabs
2. **Create Setlists**: Organize songs for your upcoming performances
3. **Customize Settings**: Adjust display preferences and keyboard shortcuts
4. **Try Performance Mode**: Test the full-screen performance interface

## 📖 Usage Guide

### **Managing Your Library**
1. Navigate to the Library section
2. Use "Import Content" to add new files
3. Edit metadata for better organization
4. Use search and filters to find specific content

### **Creating Setlists**
1. Go to Setlist Manager
2. Click "Create Setlist" and add details
3. Add songs from your library
4. Reorder songs by dragging and dropping
5. Use "Start Performance" for live shows

### **Performance Mode**
1. Select a setlist or individual song
2. Click "Performance Mode" or press the play button
3. Use arrow keys to navigate between songs
4. Press Escape to exit performance mode

### **Content Creation**
1. Click "Add Content" from the sidebar
2. Choose "Create New" tab
3. Select content type (lyrics, chords, tabs)
4. Use the built-in editor to create your content
5. Save and add to your library

## 🎯 Use Cases

### **Solo Musicians**
- Organize personal repertoire
- Create practice setlists
- Track learning progress
- Perform without physical sheets

### **Bands & Ensembles**
- Share setlists with band members
- Coordinate song arrangements
- Manage multiple venue setlists
- Collaborative content creation

### **Music Teachers**
- Organize lesson materials
- Create student-specific content
- Track difficulty progression
- Digital lesson delivery

### **Live Performers**
- Stage-optimized performance mode
- Quick song transitions
- Backup-free performances
- Professional presentation

## 🔮 Roadmap

### **Planned Features**
- [ ] **Batch Import**: Process multiple files simultaneously
- [ ] **Audio Integration**: Sync backing tracks with sheet music
- [ ] **Template System**: Pre-built templates for common song structures
- [ ] **Collaboration Tools**: Real-time sharing and editing with band members
- [ ] **Cloud Sync**: Cross-device synchronization
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **MIDI Support**: Import and export MIDI files
- [ ] **Transposition Tools**: Automatic key changes
- [ ] **Practice Mode**: Metronome and tempo adjustment features

## 🧪 Testing

Octavia uses a comprehensive testing strategy with Vitest and React Testing Library:

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI mode
pnpm test:e2e:ui

# Run tests in watch mode
pnpm test:watch

# Open test UI
pnpm test:ui
```

### Coverage

- **Current Coverage**: 34.84% overall
- **Coverage Reports**: Available locally and on [Codecov](https://codecov.io/gh/marcelvianas-projects/octavia)
- **Coverage Scripts**: Use `./scripts/coverage.sh` for local coverage management

### Test Types

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: End-to-end component interaction testing
- **API Tests**: Backend route and service testing
- **Behavioral Tests**: User interaction and workflow testing
- **E2E Tests**: Full browser testing with Playwright

For detailed testing information, see [TESTING_STRATEGY.md](./TESTING_STRATEGY.md), [CODECOV_INTEGRATION.md](./CODECOV_INTEGRATION.md), and [PLAYWRIGHT_SETUP.md](./PLAYWRIGHT_SETUP.md).

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Found a bug? Open an issue with details
2. **Feature Requests**: Suggest new features or improvements
3. **Code Contributions**: Fork the repo and submit pull requests
4. **Documentation**: Help improve guides and documentation
5. **Testing**: Test new features and provide feedback

## 🧪 Tests

Automated unit tests live in `lib/__tests__` and are executed with [Vitest](https://vitest.dev). Run `npm test` to execute them.

### Offline Support

The application includes an offline mode backed by IndexedDB. A health check endpoint (`/api/health`) lets the client detect when connectivity returns. Library data and setlists viewed while online are cached locally so they can be accessed from the dedicated offline page when the network is unavailable. Cached files are stored as binary Blobs and an LRU policy keeps the total size under 50 MB to avoid quota errors. In addition to IndexedDB, a custom service worker caches key pages and static assets so previously visited screens load even without a network connection.

### Service Worker Updates

The service worker code lives in `worker/index.js`. A small build script copies this file to `public/sw.js` during `pnpm build`, ensuring the deployed worker always matches the source. When a new worker version is available, the app displays an update toast; clicking **Reload** activates the fresh worker immediately.

## 🔧 Configuration

Create a `.env` file in the project root with the variables listed in `.env.example`. These include Firebase credentials and the Supabase service role key required for server-side database access.
If you plan to enforce row level security, run the SQL in `supabase/rls-policies.sql` on your database.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [v0.dev](https://v0.dev) - AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
- Deployed on [Vercel](https://vercel.com)

## 📞 Support

- **Documentation**: Continue building on [v0.dev](https://v0.dev/chat/projects/T2dv1h11MUJ)
- **Issues**: Report bugs and request features via GitHub issues
- **Community**: Join discussions and share feedback

---

**Made with ❤️ for musicians, by musicians**

*Transform your musical workflow with Octavia - where digital meets performance.*
