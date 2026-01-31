# How Data Ingestion Works (Simple Guide)

1.  **The Toggle (System Status)**
    *   Think of the "SYSTEM ONLINE" button as the **Master Power Switch**.
    *   **OFF**: The system sleeps. No new data is fetched automatically.
    *   **ON**: The system wakes up. Every **90 seconds**, it runs a "Sync Cycle".

2.  **The Sync Cycle (What happens every 90s)**
    *   **Step 1**: The system asks **Grok (AI)**: "Check X.com for breaking events related to our watchlist (Civil Unrest, Cyber, etc.)."
    *   **Step 2**: It simultaneously asks **GDACS**: "Any new major earthquakes or floods?"
    *   **Step 3**: Any *new* events found are saved to the database.

3.  **Real-time Updates**
    *   Your Dashboard and Map are "listening" to the database.
    *   The moment a new event is saved in Step 3, it **instantly pops up** on your screen (and the map).
    *   You don't need to refresh the page.

**Manual Override:**
*   The "SYNC NOW" button forces a Sync Cycle *immediately*, even if the system is paused. Use this if you can't wait 90 seconds.
