<div style="text-align: center">
  <img alt="Playvia logo" height="70" src="./dist/assets/logo.svg" />
</div>
<br />
Playvia is a SmartTV application for Samsung TVs (2017 - 2024).<br />
It provides a clean and intuitive interface to browse and play video content stored on external hard drive disks.

<br />
<br />

> **NOTE**: The application can also run in a web browser with mocked data for development purposes.

## Table of content
 - [Main Features](#main-features)
 - [Screen captures](#screen-captures)
 - [How to run the application](#how-to-run-the-application)
   - [On Samsung TV](#on-samsung-tv)
   - [On your local machine](#on-your-local-machine)
 - [Environment Configuration](#environment-configuration)
 - [Project components](#project-components)
   - [AVPlayer](#avplayer)
   - [Card](#card)
   - [Cards](#cards)
   - [External Storage](#external-storage)
   - [Focus Manager](#focus-manager)
   - [Overlay](#overlay)
   - [VideoPlayer](#videoplayer)
 - [AI usage in this project](#ai-usage-in-this-project)
 - [Project origin](#project-origin)
   - [Why the name "Playvia"?](#why-the-name-playvia)
   - [Why Samsung 2017?](#why-samsung-2017)

## Main Features

- Browse video files from external USB storage with a visual card-based interface
- Play videos using multiple player engines (AVPlayer, HTML5 Video)
- 4K content support on compatible Samsung panels
- Progressive seek: the longer you hold the fast-forward/rewind button, the faster you skip
- Playback speed control (1x, 1.25x, 1.5x, 1.75x, 2x)
- Smooth navigation optimized for TV remote controls

## Screen captures

### List interface

<img alt="list interface" height="432" src="./dist/assets/docs/main-page.png" />

**With animation**

<img alt="list interface animation" height="432" src="./dist/assets/docs/main-page-animation.gif" />

### Player interface

<img alt="player interface - pause focused" height="432" src="./dist/assets/docs/player-overlay-1.png" />

<img alt="player interface - bar focused" height="432" src="./dist/assets/docs/player-overlay-2.png" />

## How to run the Application

### On Samsung TV

1. **Prerequisites**
   - Install [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) with the TV extensions
   - [Enable Developer Mode](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html) on your Samsung TV
   - Note your TV's IP address

2. **Build and Deploy**
   - Open the project in Tizen Studio
   - Connect to your TV using the Device Manager
   - Right-click on the project and select "Run As > Tizen Web Application"

3. **External Storage Setup**
   - Connect a USB drive to your Samsung TV
   - Create a folder named `Movies` at the root of the USB drive
   - Place your video files inside the `Movies` folder

### On your local machine

1. **Prerequisites**
   - A modern web browser (Chrome, Firefox, Edge, Safari)
   - [Node.js](https://nodejs.org/) installed on your machine

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```
   This will:
   - Copy mocked data to the `dist` folder
   - Build the TypeScript source code
   - Start a development server with hot-reload on http://localhost:8000
   - Automatically recompile when you make changes

4. **Build for Production**
   ```bash
   npm run build
   ```
   This creates an optimized, minified bundle in the `dist` folder.

5. **Development Notes**
   - When running locally, the app uses mocked movie data from `mocks/moviesList.ts`
   - The mocked images are located in `mocks/assetsMocked/`
   - Video playback uses the HTML5 Video Player instead of AVPlayer
   - All built files are output to the `dist` folder

## Environment Configuration

The project uses a `.env` file to manage configuration variables. A template file `.env.example` is provided in the repository.

### Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MOVIES_FOLDER` | `string` | - | Name of the folder containing movies on the external USB drive. The app will scan this folder for video files. This variable can be empty if you are running the project locally. |
| `PLAYER_NAME` | `'videoTag' \| 'avplayer'` | `videoTag` | Video player engine to use:<br/>• `videoTag`: HTML5 video player (for web browsers)<br/>• `avplayer`: Samsung Tizen AVPlayer (for TV) |
| `MOCKED_FALLBACK_VIDEO_URL` | `string` | - | URL of a fallback video used when running in development mode without external storage. Should be a publicly accessible video URL. Some urls can be found on the HTML source code of [WikiFlix](https://wikiflix.toolforge.org/#/entry/244971) (a royalty-free online movie platform) if you check the source of the video tag. |

### How it works

Environment variables are injected at build time into the JavaScript bundle using esbuild's `define` feature. This means:
- Variables are replaced with their actual values during compilation
- No runtime overhead or security concerns (values are baked into the code)
- You must rebuild (`npm run build`) after changing `.env` values

**Example:** If you set `PLAYER_NAME=avplayer` in `.env`, all instances of `process.env.PLAYER_NAME` in your TypeScript code will be replaced with `"avplayer"` in the compiled JavaScript.

## Project components

### AVPlayer

The `AVPlayer` component ([src/components/AVPlayer.js](src/components/AVPlayer.js)) is a wrapper around Samsung's native Tizen AVPlay API. It provides:

- Video playback control (play, pause, stop)
- Progressive seeking with acceleration (10s > 1min > 3min > 6min > 10min jumps based on hold duration)
- Playback speed control (without audio preservation)
- Stream completion and error handling
- Integration with the player overlay for time display and progress bar

This player is used when content is loaded from external USB storage on a real Samsung TV.

### Card

The `Card` component ([src/components/Card.js](src/components/Card.js)) creates individual movie cards for the browsing interface. Each card displays:

- A thumbnail image of the movie
- The movie title

Cards are designed to be fully navigable using directional buttons on a TV remote.

### Cards

The `Cards` component ([src/components/Cards.js](src/components/Cards.js)) is a container that manages the grid layout of movie cards. It:

- Receives a list of movies from external storage (or mock)
- Creates a `Card` component for each movie
- Arranges cards in a responsive flex grid (5 cards per row)
- Handles the insertion of cards into the DOM

### External Storage

The `externalStorage` module ([src/externalStorage.js](src/externalStorage.js)) handles file system access for external USB drives. It:

- Detects mounted external storage devices using Tizen's filesystem API
- Scans the `Movies` folder for video files (<= it will be updated)
- Filters and sorts files alphabetically
- Falls back to mocked data when running outside the Tizen environment
- Dispatches events when storage content is loaded

### Focus Manager

The `focusManager` module ([src/focusManager.js](src/focusManager.js)) handles all navigation logic for TV remote controls. It manages:

- Horizontal navigation between cards and overlay buttons
- Vertical navigation between card rows and between overlay bar/buttons
- Focus state persistence when switching between browse and player modes
- Smooth scrolling to keep focused elements visible
- Visual focus indicators on active elements

### Overlay

The `Overlay` component ([src/components/Overlay.js](src/components/Overlay.js)) provides the player control interface that appears during video playback. Features include:

- Play/Pause toggle button
- Previous/Next track buttons
- Playback speed control button
- Progress bar with current time and duration display
- Auto-hide after 5 seconds of inactivity
- SVG icons loaded dynamically for optimal performance and flexibility

### VideoPlayer

The `VideoPlayer` component ([src/components/VideoPlayer.js](src/components/VideoPlayer.js)) wraps the standard HTML5 `<video>` element. It provides:

- Video playback controls (play, pause, stop)
- Progressive seeking identical to [AVPlayer](#avplayer)
- Playback speed control (with audio preservation)
- Stream completion and error handling
- Integration with the player overlay for time display and progress bar

This player is used when running the application in a web browser or when playing non-file content.

## AI usage in this project

Artificial intelligence tools were used in the following ways during the development of Playvia:

- **Code Review**: Getting an external perspective on code quality and architecture decisions
- **Documentation**: Proofreading and improving this documentation
- **Logo Design**: Creating the Playvia logo
- **Bug Assistance**: Debugging assistance during development phases

## Project origin

The primary goal of Playvia is to provide a more intuitive user interface for Samsung SmartTV owners who want to watch content stored on external USB drives.

The native Samsung interface for browsing external storage has several limitations:
- It only displays a video thumbnail (a random single frame from the video), which is not informative enough to identify content
- It shows raw filenames without filtering out technical information like file extensions, codecs, or release tags
- The built-in player lacks advanced features and has a dated interface

Playvia addresses these issues by offering:
- A clean, card-based interface with proper movie artwork
- Intelligent title parsing to display clean, readable movie names
- An enhanced player with modern controls, speed adjustment, and progressive seeking
- A familiar streaming-service-like experience

### Why the name "Playvia"?

The name "Playvia" reflects one of the project's technical objectives: integrating multiple video players. This was done in order to gain more practical experience with the various playback technologies used in professional streaming applications.

The following players are integrated into Playvia:

- **HTML5 Video Player**: Using the native `<video>` tag for broad compatibility
- **AVPlayer (Tizen)**: Samsung's native player embedded in the Tizen OS, optimized for TV hardware

### Why Samsung 2017?

The project targets Samsung TVs from 2017 onwards because:
- It was my personal TV for years.
- I really needed a better multimedia browsing experience.
- I have the technical knowledge necessary to implement this solution.
- The Tizen platform (version 3.0+) provides sufficient APIs for this type of application.
