# Lumii

Lumii is a modern, responsive streaming and gaming platform dashboard built using React 19, TypeScript, and Vite. It integrates media playback, movie/show information from TMDB, tiered membership plans, and a collection of interactive games.

## Features

### Content Discovery & Browsing
- **Dynamic Dashboards**: Explore trending, popular, and top-rated movies and TV shows.
- **Categorization & Filtering**: Browse by genres or media categories (Movies, TV Shows, Games).
- **Search System**: Find media dynamically with debounced searches querying the TMDB API.
- **Detailed Overview**: Detailed pages for individual movies and shows displaying ratings, genre tags, descriptions, director info, cast lists, and suggestions of similar items. For TV shows, it features an interactive season and episode selector.

### Media Player
- **HLS Integration**: A custom video player utilizing `hls.js` for adaptive bitrate streaming.
- **Advanced Controls**: Full-screen toggle, volume slider, interactive seeker, play/pause controls, quality level configuration (ABR/manual), and keyboard shortcuts.

### Subscription Packages
- **Membership Plans**: Tiered subscription page highlighting features, prices, and billing periods with a clean call-to-action layout.

### Mini-Games Hub
- **2048**: A grid-based puzzle game with animations.
- **Minesweeper**: A modern version of the classic puzzle with custom grids, bomb flags, and state management.
- **Sudoku**: Fully interactive board with number pad, input history, conflict highlighting, and sound effects.
- **Kelime Zinciri (Word Chain)**: A word connection game in Turkish featuring dictionary lookups, score tracking, and time limits.

## Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Sass / SCSS
- **Routing**: React Router DOM v7
- **APIs & Data**: Axios, TMDB (The Movie Database) API
- **Utilities & Icons**: Lucide React, RSuite, HLS.js, Anime.js

## Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env` file in the root directory and add your TMDB API key:
```env
VITE_TMDB_API_KEY=your_api_key_here
```

### Development
To start the Vite development server:
```bash
npm run dev
```

### Production Build
To build the application for production:
```bash
npm run build
```

To preview the built production site:
```bash
npm run preview
```

### Code Quality
To check for code linting errors:
```bash
npm run lint
```
