/**
 * OpenMinr Configuration
 * Centralizes all magic numbers and tunable parameters
 */

export const CONFIG = {
  // Ingestion settings
  INGESTION: {
    // Max incidents to process per batch (reduced for testing with single mission)
    MAX_GDACS_ITEMS: 3,
    MAX_GROK_RESULTS: 3,
    
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
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
    
    // Incident feed limits
    INITIAL_FEED_LIMIT: 50,
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
  
  // Priority levels (P1-P4 system)
  PRIORITY: {
    P1: { level: 1, label: 'P1', text: 'CRITICAL', color: '#ef4444', severity: 1 },
    P2: { level: 2, label: 'P2', text: 'HIGH', color: '#f97316', severity: 2 },
    P3: { level: 3, label: 'P3', text: 'MEDIUM', color: '#eab308', severity: 3 },
    P4: { level: 4, label: 'P4', text: 'LOW', color: '#3b82f6', severity: 4 }
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
