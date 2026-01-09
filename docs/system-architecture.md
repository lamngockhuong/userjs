# System Architecture: UserJS Vue Userscript Manager

## Architecture Overview
- Single-page application (SPA) built with Vue 3 Composition API
- Vite as build tool and development server
- Tailwind CSS for styling
- Modular component and composable architecture

## Component Architecture

### Composables
- `useScripts`:
  - Manages script data retrieval
  - Handles error states
  - Provides reactive script list

- `useBookmarks`:
  - Manages bookmark data
  - Provides CRUD operations
  - Handles bookmark state management

- `useSearch`:
  - Implements Fuse.js fuzzy search
  - Supports searching across scripts and bookmarks
  - 300ms debounce for search input
  - Provides category filtering
  - Implements error boundaries for search operations

- `useDarkMode`: 
  - Manages dark mode toggle
  - Persists mode in localStorage
  - Provides reactive dark mode state

- `useUserscriptManager`:
  - Detects userscript manager
  - Provides install detection logic
  - Manages userscript-related operations

### UI Components
- `ScriptCard`: Renders individual script details
- `BookmarkCard`: Displays bookmark information
- `Header`: Application navigation
- `SearchBar`:
  - Enables script/bookmark searching
  - Includes clear button
  - Supports category filtering
- `Footer`: Application footer
- `InstallBanner`: Userscript manager installation prompt
- `ErrorBoundary`: Handles search operation errors

### Pages
- `Home`: Script listing page
  - Displays paginated script list
  - Provides search and filtering capabilities

- `ScriptDetail`: Individual script preview page
  - Shows full script code
  - Enables syntax highlighting
  - Provides script metadata

- `Bookmarks`: User's bookmarked scripts page
  - Manages saved/bookmarked scripts
  - Supports searching and filtering bookmarks

- `NotFound`: 404 error page
  - Handles undefined routes
  - Provides navigation back to home

## Routing
- Vue Router for client-side navigation
- Keyboard shortcuts:
  - `/`: Trigger search
  - `Shift+G`: Navigate to Home
  - `Shift+B`: Open Bookmarks
  - `Shift+D`: Toggle Dark Mode

## State Management
- Composition API reactive state
- localStorage for persistent settings
- Minimal global state, component-level reactivity

## Browser Interaction
- SSR-safe browser API usage
- Graceful fallback for unsupported browsers
- Minimal DOM manipulation

## Performance Considerations
- Code-splitting via Vite
- Lazy loading of components
- Efficient reactivity with Vue 3
