# Design Document

## Overview

This design completes the PromptLoom MVP by implementing saved prompt management, UI polish, and deployment readiness. The solution builds upon the existing React + Zustand + Firebase architecture while adding new components and functionality for a complete user experience.

The design focuses on maintaining the current dopamine-rich, block-based interface while adding essential features like prompt library management, comprehensive empty states, and production-ready deployment configuration.

## Architecture

### Current Architecture (Maintained)
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion
- **State Management**: Zustand store with separate concerns (auth, blocks)
- **Backend**: Firebase Auth + Firestore
- **Deployment**: Vercel (to be configured)

### New Components Architecture
```
src/
├── components/
│   ├── SavedPrompts.jsx          # New: Saved prompts list
│   ├── EmptyState.jsx            # New: Reusable empty state component
│   ├── LoadingSpinner.jsx        # New: Loading indicator
│   └── ConfirmDialog.jsx         # New: Delete confirmation modal
├── lib/
│   ├── loadPrompts.js            # New: Load user's saved prompts
│   └── deletePrompt.js           # New: Delete saved prompt
└── hooks/
    └── useSavedPrompts.js        # New: Hook for managing saved prompts
```

## Components and Interfaces

### SavedPrompts Component
**Purpose**: Display and manage user's saved prompts
**Props**: None (uses Zustand store)
**State**: Loading state, error handling
**Features**:
- Grid layout of saved prompt cards
- Load prompt into builder
- Delete prompt with confirmation
- Empty state when no prompts exist

```jsx
// Interface
const SavedPrompts = () => {
  // Displays saved prompts in a responsive grid
  // Handles loading, error, and empty states
  // Provides actions: load, delete
}
```

### EmptyState Component
**Purpose**: Reusable component for empty states throughout the app
**Props**: 
- `title`: String - Main heading
- `description`: String - Explanatory text
- `actionText`: String - CTA button text (optional)
- `onAction`: Function - CTA handler (optional)
- `icon`: String - Emoji or icon (optional)

```jsx
// Interface
const EmptyState = ({ title, description, actionText, onAction, icon }) => {
  // Renders centered empty state with optional CTA
}
```

### ConfirmDialog Component
**Purpose**: Modal for confirming destructive actions
**Props**:
- `isOpen`: Boolean
- `title`: String
- `message`: String
- `onConfirm`: Function
- `onCancel`: Function

## Data Models

### Saved Prompt Structure (Firestore)
```javascript
// Collection: users/{userId}/prompts/{promptId}
{
  id: string,           // Document ID
  title: string,        // Auto-generated from first block or "Untitled Prompt"
  blocks: Array<{       // Same structure as current blocks
    id: string,
    type: string,
    content: string
  }>,
  createdAt: string,    // ISO timestamp
  updatedAt: string,    // ISO timestamp
  preview: string       // First 100 chars of combined prompt
}
```

### Enhanced Zustand Store
```javascript
// Add to existing promptStore.js
{
  // Existing state...
  savedPrompts: [],
  savedPromptsLoading: false,
  savedPromptsError: null,
  
  // New actions
  setSavedPrompts: (prompts) => void,
  setSavedPromptsLoading: (loading) => void,
  setSavedPromptsError: (error) => void,
  loadPromptIntoBuilder: (prompt) => void,
  clearBuilder: () => void
}
```

## Error Handling

### Network Errors
- **Firestore Connection**: Retry mechanism with exponential backoff
- **Auth Errors**: Clear error messages with retry options
- **Save/Load Failures**: Toast notifications with specific error details

### User Experience Errors
- **Empty Content**: Prevent saving prompts with no content
- **Duplicate Names**: Auto-increment titles for similar prompts
- **Concurrent Edits**: Last-write-wins with user notification

### Error UI Patterns
```jsx
// Error boundary for component-level errors
// Toast notifications for action feedback
// Inline error states for form validation
// Fallback UI for network failures
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- **Component Tests**: All new components with user interaction scenarios
- **Hook Tests**: useSavedPrompts hook with mocked Firebase
- **Utility Tests**: loadPrompts, deletePrompt, savePrompt functions
- **Store Tests**: Zustand actions and state updates

### Integration Tests
- **Auth Flow**: Login → Dashboard → Save/Load prompts
- **CRUD Operations**: Create, read, update, delete prompt workflows
- **Error Scenarios**: Network failures, auth errors, validation errors

### E2E Tests (Optional - Playwright)
- **Complete User Journey**: Login → Create prompt → Save → Load → Delete
- **Cross-browser Testing**: Chrome, Firefox, Safari compatibility
- **Mobile Responsiveness**: Touch interactions and layout

## UI/UX Design Specifications

### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: Logo + User Profile + Logout    │
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │ Saved       │ │ Prompt Builder      │ │
│ │ Prompts     │ │                     │ │
│ │ Sidebar     │ │ Block Controls      │ │
│ │             │ │ Drag & Drop Area    │ │
│ │             │ │ Preview Pane        │ │
│ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### Animation Specifications
- **Block Transitions**: 200ms ease-out for add/remove/reorder
- **Preview Updates**: 150ms fade transition when content changes
- **Saved Prompts**: 300ms slide-in when loading, stagger children by 50ms
- **Loading States**: Pulse animation for skeletons, spin for spinners
- **Hover Effects**: 100ms scale(1.02) for interactive elements

### Color Palette (Extending Current)
```css
/* Current gradient backgrounds maintained */
/* New additions: */
--success-green: #10b981
--error-red: #ef4444
--warning-yellow: #f59e0b
--info-blue: #3b82f6
--neutral-gray: #6b7280
```

### Typography Hierarchy
```css
/* Headings */
.heading-xl: text-2xl font-bold
.heading-lg: text-xl font-semibold
.heading-md: text-lg font-medium

/* Body */
.body-lg: text-base
.body-md: text-sm
.body-sm: text-xs

/* Interactive */
.button-text: text-sm font-medium
.link-text: text-sm underline
```

## Deployment Configuration

### Environment Variables
```bash
# Production .env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Vercel Configuration
```json
// vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase-api-key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@firebase-auth-domain",
    "VITE_FIREBASE_PROJECT_ID": "@firebase-project-id",
    "VITE_FIREBASE_STORAGE_BUCKET": "@firebase-storage-bucket",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "@firebase-messaging-sender-id",
    "VITE_FIREBASE_APP_ID": "@firebase-app-id"
  }
}
```

### Firebase Security Rules
```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/prompts/{promptId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Build Optimization
- **Code Splitting**: Lazy load SavedPrompts component
- **Bundle Analysis**: Webpack Bundle Analyzer for size optimization
- **Asset Optimization**: Image compression, font subsetting
- **Caching Strategy**: Service worker for offline functionality (future enhancement)

## Performance Considerations

### Firestore Optimization
- **Pagination**: Load saved prompts in batches of 20
- **Indexing**: Composite index on userId + createdAt for efficient queries
- **Caching**: Client-side caching of frequently accessed prompts
- **Real-time Updates**: Optional real-time listeners for collaborative features

### React Performance
- **Memoization**: React.memo for SavedPrompts cards
- **Virtual Scrolling**: For large prompt lists (future enhancement)
- **Debounced Search**: 300ms debounce for prompt filtering
- **Lazy Loading**: Code splitting for non-critical components

### Animation Performance
- **GPU Acceleration**: transform and opacity properties only
- **Reduced Motion**: Respect user's motion preferences
- **Frame Rate**: Target 60fps for all animations
- **Memory Management**: Cleanup animation listeners on unmount