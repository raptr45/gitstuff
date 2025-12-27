# Design Document: GitHub Follower Tracker

## Overview

The GitHub Follower Tracker is a Next.js application that fetches and displays GitHub user follower counts with intelligent caching to minimize API calls. The application uses Next.js 14+ with the App Router, React Server Components where appropriate, and client components for interactive elements. The UI is built with shadcn/ui components and styled with Tailwind CSS.

The system architecture separates concerns into three main layers:
1. **API Layer**: Handles GitHub API communication and rate limiting
2. **Cache Layer**: Manages data persistence and expiration logic
3. **UI Layer**: Renders the interface and handles user interactions

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer (Client)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Input Form   │  │ Loading UI   │  │ Display Card │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   API Route Handler                      │
│              /api/followers/[username]                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  GitHub API Client   │  │   Cache Manager      │    │
│  └──────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Caching**: In-memory cache with timestamp-based expiration
- **API**: GitHub REST API v3

## Components and Interfaces

### 1. GitHub API Client

**Purpose**: Encapsulates all GitHub API communication logic.

**Interface**:
```typescript
interface GitHubUser {
  login: string;
  followers: number;
  avatar_url: string;
  name: string | null;
}

interface GitHubAPIClient {
  fetchUserFollowers(username: string): Promise<GitHubUser>;
}
```

**Implementation Details**:
- Uses native `fetch` API
- Endpoint: `https://api.github.com/users/{username}`
- Handles HTTP errors (404, 403 rate limit, 500 server errors)
- Includes User-Agent header as required by GitHub API
- Returns structured error messages for different failure scenarios

### 2. Cache Manager

**Purpose**: Manages in-memory caching with expiration logic.

**Interface**:
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttlMs: number): void;
  has(key: string): boolean;
  isExpired(key: string): boolean;
  clear(key: string): void;
}
```

**Implementation Details**:
- Uses JavaScript `Map` for in-memory storage
- Default TTL: 5 minutes (300,000 ms)
- Configurable TTL per cache entry
- Automatic expiration checking on retrieval
- Cache keys format: `github:followers:{username}`

### 3. Follower Service

**Purpose**: Orchestrates fetching and caching logic.

**Interface**:
```typescript
interface FollowerData {
  username: string;
  followers: number;
  avatarUrl: string;
  name: string | null;
  cached: boolean;
  fetchedAt: number;
}

interface FollowerService {
  getFollowerCount(username: string): Promise<FollowerData>;
}
```

**Implementation Details**:
- Checks cache before making API calls
- Returns cached data if valid
- Fetches from GitHub API if cache miss or expired
- Updates cache after successful fetch
- Includes metadata about cache status

### 4. API Route Handler

**Purpose**: Next.js API route that serves follower data to the frontend.

**Route**: `/api/followers/[username]`

**Response Format**:
```typescript
// Success Response
{
  success: true;
  data: {
    username: string;
    followers: number;
    avatarUrl: string;
    name: string | null;
    cached: boolean;
    fetchedAt: number;
  }
}

// Error Response
{
  success: false;
  error: string;
  code: "NOT_FOUND" | "RATE_LIMIT" | "NETWORK_ERROR" | "INVALID_INPUT";
}
```

### 5. UI Components

#### FollowerTrackerForm (Client Component)

**Purpose**: Input form for GitHub username entry.

**Props**:
```typescript
interface FollowerTrackerFormProps {
  onSubmit: (username: string) => void;
  isLoading: boolean;
}
```

**Features**:
- shadcn/ui Input component
- shadcn/ui Button component
- Form validation (non-empty username)
- Loading state management
- Keyboard support (Enter to submit)

#### FollowerDisplay (Client Component)

**Purpose**: Displays follower count and user information.

**Props**:
```typescript
interface FollowerDisplayProps {
  data: FollowerData | null;
  error: string | null;
  isLoading: boolean;
}
```

**Features**:
- shadcn/ui Card component for layout
- Avatar display
- Follower count with formatting
- Cache status indicator
- Error message display
- Loading skeleton

#### Main Page Component

**Purpose**: Orchestrates the application flow.

**Features**:
- Client component with state management
- Handles API calls to `/api/followers/[username]`
- Manages loading, error, and success states
- Responsive layout with Tailwind CSS

## Data Models

### GitHubUser
```typescript
interface GitHubUser {
  login: string;          // GitHub username
  followers: number;      // Follower count
  avatar_url: string;     // Profile picture URL
  name: string | null;    // Display name (may be null)
}
```

### CacheEntry
```typescript
interface CacheEntry<T> {
  data: T;               // Cached data
  timestamp: number;     // Unix timestamp when cached
  expiresAt: number;     // Unix timestamp when expires
}
```

### FollowerData
```typescript
interface FollowerData {
  username: string;      // GitHub username
  followers: number;     // Current follower count
  avatarUrl: string;     // Profile picture URL
  name: string | null;   // Display name
  cached: boolean;       // Whether data came from cache
  fetchedAt: number;     // Unix timestamp of fetch/cache
}
```

### APIResponse
```typescript
type APIResponse = 
  | { success: true; data: FollowerData }
  | { success: false; error: string; code: ErrorCode };

type ErrorCode = "NOT_FOUND" | "RATE_LIMIT" | "NETWORK_ERROR" | "INVALID_INPUT";
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Successful API fetch returns follower data

*For any* valid GitHub username, when the GitHub API client fetches user data, it should return a GitHubUser object containing the username and a non-negative follower count.

**Validates: Requirements 1.1, 1.2**

### Property 2: Error responses produce appropriate error codes

*For any* error scenario (404 not found, 403 rate limit, network error), when the GitHub API client encounters the error, it should return an error with the appropriate error code matching the failure type.

**Validates: Requirements 1.3**

### Property 3: Cache stores data with timestamp

*For any* follower data, when it is stored in the cache, retrieving it should return the same data along with a timestamp indicating when it was cached.

**Validates: Requirements 2.1**

### Property 4: Cache hit prevents API calls

*For any* username with valid cached data, when requesting follower data, the cache should be checked first and return the cached data without making an API call.

**Validates: Requirements 2.2, 2.3**

### Property 5: Expired cache triggers fresh fetch

*For any* username with expired cached data, when requesting follower data, the system should fetch fresh data from the API and update the cache with the new data.

**Validates: Requirements 2.4**

### Property 6: Configurable TTL is respected

*For any* TTL value provided to the cache manager, when data is cached with that TTL, the data should expire after exactly that duration.

**Validates: Requirements 2.5**

### Property 7: Display renders complete follower information

*For any* follower data object, when rendered by the display component, the output should contain both the username and the follower count.

**Validates: Requirements 3.1, 3.2**

### Property 8: Error states display appropriate messages

*For any* error code (NOT_FOUND, RATE_LIMIT, NETWORK_ERROR, INVALID_INPUT), when displayed by the UI, the error message should be user-friendly and match the error type.

**Validates: Requirements 3.4**

### Property 9: Empty input validation

*For any* string composed entirely of whitespace or empty string, when submitted as a username, the validation should reject it and prevent the fetch process.

**Validates: Requirements 4.2**

### Property 10: Valid username triggers fetch

*For any* non-empty, valid username string, when submitted through the form, the system should initiate the follower data fetch process.

**Validates: Requirements 4.3**

## Error Handling

### Error Categories

1. **User Not Found (404)**
   - Error code: `NOT_FOUND`
   - Message: "GitHub user '{username}' not found"
   - Action: Display error to user, do not cache

2. **Rate Limit Exceeded (403)**
   - Error code: `RATE_LIMIT`
   - Message: "GitHub API rate limit exceeded. Please try again later."
   - Action: Display error to user, suggest waiting

3. **Network Errors**
   - Error code: `NETWORK_ERROR`
   - Message: "Failed to connect to GitHub. Please check your connection."
   - Action: Display error to user, allow retry

4. **Invalid Input**
   - Error code: `INVALID_INPUT`
   - Message: "Please enter a valid GitHub username"
   - Action: Display error to user, focus input field

5. **Server Errors (500+)**
   - Error code: `NETWORK_ERROR`
   - Message: "GitHub is experiencing issues. Please try again later."
   - Action: Display error to user, allow retry

### Error Handling Strategy

- All errors are caught and converted to structured error responses
- No raw error objects are exposed to the UI
- Each error type has a specific user-friendly message
- Failed requests are not cached
- Network timeouts are set to 10 seconds
- Retry logic is left to user interaction (manual retry)

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify that general correctness properties hold across a wide range of inputs.

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library. Each property test will:

- Run a minimum of 100 iterations to ensure thorough coverage
- Generate random valid inputs (usernames, follower counts, timestamps, TTL values)
- Verify that the correctness properties hold for all generated inputs
- Be tagged with a comment referencing the design document property

**Tag format**: `// Feature: github-follower-tracker, Property {number}: {property_text}`

### Unit Testing

Unit tests will focus on:

- Specific examples that demonstrate correct behavior (e.g., fetching a known user)
- Edge cases (empty cache, expired cache, malformed API responses)
- Error conditions (404, 403, network failures)
- Integration between components (API client + cache manager)
- UI component rendering with specific props

### Test Organization

```
__tests__/
├── unit/
│   ├── github-api-client.test.ts
│   ├── cache-manager.test.ts
│   ├── follower-service.test.ts
│   └── components/
│       ├── follower-tracker-form.test.tsx
│       └── follower-display.test.tsx
└── properties/
    ├── api-properties.test.ts
    ├── cache-properties.test.ts
    ├── service-properties.test.ts
    └── validation-properties.test.ts
```

### Testing Tools

- **Test Runner**: Vitest (fast, modern, TypeScript-first)
- **Property Testing**: fast-check
- **React Testing**: @testing-library/react
- **Mocking**: Vitest's built-in mocking capabilities

### Key Testing Scenarios

1. **API Client Tests**
   - Successful fetch with valid username
   - 404 error handling
   - Rate limit error handling
   - Network timeout handling
   - Malformed response handling

2. **Cache Manager Tests**
   - Store and retrieve data
   - Expiration logic
   - Cache hit/miss scenarios
   - TTL configuration

3. **Follower Service Tests**
   - Cache-first behavior
   - API fallback on cache miss
   - Cache update after fetch
   - Error propagation

4. **UI Component Tests**
   - Form submission with valid input
   - Form validation with empty input
   - Loading state display
   - Success state display
   - Error state display
   - Accessibility attributes

5. **Property Tests**
   - All properties listed in Correctness Properties section
   - Each property implemented as a separate test
   - Minimum 100 iterations per property test
