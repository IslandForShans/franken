const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Scheduled function to clean up old lobbies
 * Runs every day at 3 AM Pacific Time
 * Removes lobbies older than 24 hours
 */
exports.cleanupOldLobbies = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (_context) => {
    try {
      const db = admin.database();
      const lobbiesRef = db.ref('lobbies');
      const snapshot = await lobbiesRef.once('value');
      
      if (!snapshot.exists()) {
        console.log('No lobbies to clean up');
        return null;
      }
      
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      const promises = [];
      let count = 0;
      
      snapshot.forEach((child) => {
        const lobby = child.val();
        
        // Check if lobby has created timestamp and is older than maxAge
        if (lobby && lobby.created && (now - lobby.created > maxAge)) {
          promises.push(child.ref.remove());
          count++;
        }
      });
      
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`Successfully cleaned up ${count} old lobbies`);
      } else {
        console.log('No old lobbies found to clean up');
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning up lobbies:', error);
      return null;
    }
  });

/**
 * Scheduled function to clean up old completed drafts
 * Runs every Sunday at 4 AM Pacific Time
 * Removes completed drafts older than 90 days
 */
exports.cleanupOldDrafts = functions.pubsub
  .schedule('0 4 * * 0')
  .timeZone('America/Los_Angeles')
  .onRun(async (_context) => {
    try {
      const db = admin.database();
      const draftsRef = db.ref('completedDrafts');
      const snapshot = await draftsRef.once('value');
      
      if (!snapshot.exists()) {
        console.log('No completed drafts to clean up');
        return null;
      }
      
      const now = Date.now();
      const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
      
      const promises = [];
      let count = 0;
      
      snapshot.forEach((child) => {
        const draft = child.val();
        
        // Check if draft has completedAt timestamp and is older than maxAge
        if (draft && draft.completedAt && (now - draft.completedAt > maxAge)) {
          promises.push(child.ref.remove());
          count++;
        }
      });
      
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`Successfully cleaned up ${count} old completed drafts`);
      } else {
        console.log('No old completed drafts found to clean up');
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning up completed drafts:', error);
      return null;
    }
  });

/**
 * Optional: HTTP function to manually trigger cleanup
 * Can be called via HTTP request for testing or manual cleanup
 * 
 * Usage: 
 * curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/manualCleanup
 */
exports.manualCleanup = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.database();
    
    // Clean up lobbies
    const lobbiesRef = db.ref('lobbies');
    const lobbiesSnapshot = await lobbiesRef.once('value');
    
    const now = Date.now();
    const lobbyMaxAge = 24 * 60 * 60 * 1000;
    const draftMaxAge = 90 * 24 * 60 * 60 * 1000;
    
    let lobbiesCount = 0;
    const lobbyPromises = [];
    
    if (lobbiesSnapshot.exists()) {
      lobbiesSnapshot.forEach((child) => {
        const lobby = child.val();
        if (lobby && lobby.created && (now - lobby.created > lobbyMaxAge)) {
          lobbyPromises.push(child.ref.remove());
          lobbiesCount++;
        }
      });
    }
    
    // Clean up drafts
    const draftsRef = db.ref('completedDrafts');
    const draftsSnapshot = await draftsRef.once('value');
    
    let draftsCount = 0;
    const draftPromises = [];
    
    if (draftsSnapshot.exists()) {
      draftsSnapshot.forEach((child) => {
        const draft = child.val();
        if (draft && draft.completedAt && (now - draft.completedAt > draftMaxAge)) {
          draftPromises.push(child.ref.remove());
          draftsCount++;
        }
      });
    }
    
    // Execute all deletions
    await Promise.all([...lobbyPromises, ...draftPromises]);
    
    const result = {
      success: true,
      lobbiesDeleted: lobbiesCount,
      draftsDeleted: draftsCount,
      timestamp: new Date().toISOString()
    };
    
    console.log('Manual cleanup completed:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});