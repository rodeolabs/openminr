/**
 * OpenMinr Configuration
 * Centralizes all magic numbers and tunable parameters
 */

export const CONFIG = {
  // Ingestion settings
  INGESTION: {
    // Max incidents to process per batch
    MAX_GDACS_ITEMS: 5,
    MAX_GROK_RESULTS: 5,
    
    // Cooldown between API calls (ms)
    GROK_CALL_DELAY: 1000,
    
    // Polling intervals
    AUTO_SYNC_INTERVAL: 90000, // 90 seconds
    
    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 30,
    MAX_AI_CALLS_PER_HOUR: 100
  },
  
  // Database settings
  DATABASE: {
    // Pagination limits
    DEFAULT_PAGE_SIZE: 100,
    MAX_PAGE_SIZE: 500,
    
    // Incident feed limits
    INITIAL_FEED_LIMIT: 100,
    SEARCH_RESULTS_LIMIT: 20,
    
    // Text field limits
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 5000
  },
  
  // Deduplication
  DEDUPLICATION: {
    // Hash precision for location
    LOCATION_PRECISION: 2, // decimal places
    
    // Time window for considering incidents as potential duplicates (hours)
    TIME_WINDOW_HOURS: 24
  },
  
  // Severity levels
  SEVERITY: {
    CRITICAL: { min: 1, max: 2, label: 'Critical', color: '#ef4444' },
    HIGH: { min: 3, max: 3, label: 'High', color: '#f59e0b' },
    MEDIUM: { min: 4, max: 4, label: 'Medium', color: '#eab308' },
    LOW: { min: 5, max: 5, label: 'Low', color: '#6b7280' }
  },
  
  // Map settings
  MAP: {
    DEFAULT_CENTER: [10, 30] as [number, number],
    DEFAULT_ZOOM: 2.2,
    FLY_SPEED: 1.2,
    FLY_ZOOM: 7
  },
  
  // Notifications
  NOTIFICATIONS: {
    DISPLAY_DURATION: 5000, // ms
    MAX_CONCURRENT: 5
  },
  
  // UI settings
  UI: {
    // Animation durations
    ANIMATION_DURATION: 300,
    SCANLINE_SPEED: 8, // seconds per cycle
    
    // Mobile breakpoints
    MOBILE_BREAKPOINT: 1024
  }
} as const;

// Type-safe access to config values
export type Config = typeof CONFIG;
