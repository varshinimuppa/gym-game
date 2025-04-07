// Leaderboard functionality for the game

// Function to fetch top scores from Supabase
async function fetchTopScores(limit = 10) {
  try {
    console.log('fetchTopScores called with limit:', limit);
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return [];
    }

    // Try the RPC function first
    console.log('Calling Supabase RPC function get_top_scores...');
    let { data, error } = await supabaseClient
      .rpc('get_top_scores', { limit_count: limit });

    // If RPC fails, fallback to direct query
    if (error) {
      console.warn('RPC get_top_scores failed, falling back to direct query:', error);
      
      // Fallback - direct query
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('leaderboard')
        .select('id, email, score, date, player_name')
        .order('score', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        console.error('Direct query also failed:', fallbackError);
        return [];
      }
      
      // Add rank to each record
      data = fallbackData.map((record, index) => ({
        ...record,
        rank: index + 1
      }));
      
      console.log('Fallback query successful:', data);
    } else {
      console.log('Top scores fetched successfully via RPC:', data);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchTopScores:', error);
    return [];
  }
}

// Function to fetch daily top scores from Supabase
async function fetchDailyTopScores(limit = 10) {
  try {
    console.log('fetchDailyTopScores called with limit:', limit);
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return [];
    }

    // Try the RPC function first
    console.log('Calling Supabase RPC function get_daily_top_scores...');
    let { data, error } = await supabaseClient
      .rpc('get_daily_top_scores', { limit_count: limit });

    // If RPC fails, fallback to direct query
    if (error) {
      console.warn('RPC get_daily_top_scores failed, falling back to direct query:', error);
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fallback - direct query
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('leaderboard')
        .select('id, email, score, date, player_name')
        .gte('date', today.toISOString())
        .order('score', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        console.error('Direct query also failed:', fallbackError);
        return [];
      }
      
      // Add rank to each record
      data = fallbackData.map((record, index) => ({
        ...record,
        rank: index + 1
      }));
      
      console.log('Fallback query successful:', data);
    } else {
      console.log('Daily top scores fetched successfully via RPC:', data);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDailyTopScores:', error);
    return [];
  }
}

// Function to display the leaderboard
function displayLeaderboard(scores, containerId = 'leaderboardContainer') {
  console.log('displayLeaderboard called with scores:', scores);
  console.log('Target container ID:', containerId);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID ${containerId} not found`);
    return;
  }

  // Clear previous content
  container.innerHTML = '';

  // Create table
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Rank</th>
      <th>Player</th>
      <th>Score</th>
      <th>Date</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  
  if (scores.length === 0) {
    console.log('No scores to display');
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4" class="empty-message">No scores yet. Be the first!</td>';
    tbody.appendChild(emptyRow);
  } else {
    console.log('Displaying', scores.length, 'scores in the leaderboard');
    scores.forEach(score => {
      const row = document.createElement('tr');
      
      // Format the date
      const date = new Date(score.date);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Use player_name if available, otherwise use email (with privacy protection)
      const displayName = score.player_name || maskEmail(score.email);
      
      row.innerHTML = `
        <td>${score.rank}</td>
        <td>${displayName}</td>
        <td>${score.score}</td>
        <td>${formattedDate}</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  table.appendChild(tbody);
  container.appendChild(table);
  console.log('Leaderboard table created and added to container');
}

// Helper function to mask email addresses for privacy
function maskEmail(email) {
  if (!email) return 'Anonymous';
  
  const parts = email.split('@');
  if (parts.length !== 2) return 'Anonymous';
  
  const username = parts[0];
  const domain = parts[1];
  
  // If username is short, just show first letter
  if (username.length <= 3) {
    return username.charAt(0) + '***@' + domain;
  }
  
  // Otherwise show first 3 characters and last character
  return username.substring(0, 3) + '***' + username.charAt(username.length - 1) + '@' + domain;
}

// Function to show the leaderboard UI
function showLeaderboardUI() {
  console.log('showLeaderboardUI called');
  
  // Create leaderboard container if it doesn't exist
  let container = document.getElementById('leaderboardContainer');
  if (!container) {
    console.log('Creating new leaderboard container');
    container = document.createElement('div');
    container.id = 'leaderboardContainer';
    container.className = 'leaderboard-container';
    document.body.appendChild(container);
  }
  
  // Show the container
  container.style.display = 'block';
  
  // Add tabs for different leaderboard views
  const tabsHtml = `
    <div class="leaderboard-tabs">
      <button id="allTimeTab" class="tab-button active">All Time</button>
      <button id="dailyTab" class="tab-button">Today</button>
      <button id="closeLeaderboard" class="close-button">×</button>
    </div>
  `;
  
  // Add the tabs to the container
  container.innerHTML = tabsHtml;
  console.log('Added tab buttons to container');
  
  // Create a table container
  const tableContainer = document.createElement('div');
  tableContainer.id = 'leaderboardTableContainer';
  container.appendChild(tableContainer);
  
  // Add event listeners
  document.getElementById('allTimeTab').addEventListener('click', async () => {
    console.log('All Time tab clicked');
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('allTimeTab').classList.add('active');
    
    // Fetch and display all-time scores
    const scores = await fetchTopScores();
    displayLeaderboard(scores, 'leaderboardTableContainer');
  });
  
  document.getElementById('dailyTab').addEventListener('click', async () => {
    console.log('Daily tab clicked');
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('dailyTab').classList.add('active');
    
    // Fetch and display daily scores
    const scores = await fetchDailyTopScores();
    displayLeaderboard(scores, 'leaderboardTableContainer');
  });
  
  document.getElementById('closeLeaderboard').addEventListener('click', () => {
    console.log('Close button clicked');
    container.style.display = 'none';
  });
  
  // Load all-time scores by default
  console.log('Loading initial all-time scores');
  fetchTopScores().then(scores => {
    displayLeaderboard(scores, 'leaderboardTableContainer');
  });
}

// Add CSS for the leaderboard
function addLeaderboardStyles() {
  const styleId = 'leaderboard-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .leaderboard-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.9);
      border-radius: 10px;
      padding: 20px;
      color: white;
      max-width: 80%;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
      border: 2px solid #ff0000;
    }
    
    .leaderboard-tabs {
      display: flex;
      margin-bottom: 15px;
      border-bottom: 1px solid #ff0000;
      padding-bottom: 10px;
    }
    
    .tab-button {
      background-color: transparent;
      color: white;
      border: 1px solid #ff0000;
      padding: 8px 15px;
      margin-right: 10px;
      cursor: pointer;
      border-radius: 5px;
      transition: all 0.3s;
    }
    
    .tab-button:hover {
      background-color: rgba(255, 0, 0, 0.3);
    }
    
    .tab-button.active {
      background-color: #ff0000;
      color: white;
    }
    
    .close-button {
      margin-left: auto;
      background-color: transparent;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }
    
    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .leaderboard-table th,
    .leaderboard-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .leaderboard-table th {
      color: #ff0000;
      font-weight: bold;
    }
    
    .leaderboard-table tr:hover {
      background-color: rgba(255, 0, 0, 0.1);
    }
    
    .empty-message {
      text-align: center;
      color: #888;
      font-style: italic;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize leaderboard functionality
function initLeaderboard() {
  // Add styles
  addLeaderboardStyles();
  
  // Add a button to show the leaderboard
  const leaderboardButton = document.createElement('button');
  leaderboardButton.id = 'showLeaderboardButton';
  leaderboardButton.textContent = 'Leaderboard';
  leaderboardButton.className = 'leaderboard-button';
  leaderboardButton.addEventListener('click', showLeaderboardUI);
  
  // Add button styles
  const buttonStyle = document.createElement('style');
  buttonStyle.textContent = `
    .leaderboard-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ff0000;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      z-index: 100;
      box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
      transition: all 0.3s;
    }
    
    .leaderboard-button:hover {
      background-color: #cc0000;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(buttonStyle);
  
  // Add the button to the page
  document.body.appendChild(leaderboardButton);
}

// Export functions for use in other files
window.leaderboardFunctions = {
  fetchTopScores,
  fetchDailyTopScores,
  displayLeaderboard,
  showLeaderboardUI,
  initLeaderboard
};

// Make sure the functions are exposed globally
(function ensureFunctionsExposed() {
  console.log('Ensuring leaderboard functions are exposed globally');
  
  // Create global object if it doesn't exist
  if (typeof window.leaderboardFunctions === 'undefined') {
    console.log('Creating global leaderboardFunctions object');
    window.leaderboardFunctions = {
      fetchTopScores,
      fetchDailyTopScores,
      displayLeaderboard,
      showLeaderboardUI,
      initLeaderboard
    };
  }
  
  // Add a method to manually initialize (can be called from browser console for troubleshooting)
  window.initLeaderboardManually = function() {
    console.log('Manual leaderboard initialization requested');
    addLeaderboardStyles();
    
    // Check for Supabase client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      console.error('Cannot initialize leaderboard: Supabase client not available');
      alert('Leaderboard cannot be initialized - Supabase connection not available');
      return false;
    }
    
    // Add the button
    let leaderboardButton = document.getElementById('showLeaderboardButton');
    if (!leaderboardButton) {
      console.log('Creating leaderboard button');
      leaderboardButton = document.createElement('button');
      leaderboardButton.id = 'showLeaderboardButton';
      leaderboardButton.textContent = 'Leaderboard';
      leaderboardButton.className = 'leaderboard-button';
      leaderboardButton.addEventListener('click', showLeaderboardUI);
      document.body.appendChild(leaderboardButton);
    }
    
    // Show debug button
    const manualButton = document.getElementById('manualShowLeaderboard');
    if (manualButton) {
      manualButton.style.display = 'block';
    }
    
    console.log('Leaderboard initialized manually');
    return true;
  };
  
  // Auto-initialize on document ready if possible
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready, checking for Supabase');
    // Check if Supabase might be ready
    if (typeof supabase !== 'undefined') {
      console.log('Supabase library detected, attempting early initialization');
      setTimeout(function() {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
          console.log('Supabase client found, initializing leaderboard early');
          initLeaderboard();
        }
      }, 1000);
    }
  } else {
    console.log('Document not ready, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOMContentLoaded fired, checking for Supabase');
      if (typeof supabase !== 'undefined') {
        console.log('Supabase library detected on DOMContentLoaded');
        setTimeout(function() {
          if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            console.log('Supabase client found on DOMContentLoaded, initializing leaderboard');
            initLeaderboard();
          }
        }, 1000);
      }
    });
  }
})(); 