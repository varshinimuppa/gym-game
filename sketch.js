// Debug message to verify script loading
console.log('Script loaded and executing');

// Game variables
let player;
let dumbbells = [];
let score = 0;
let gameOver = false;
let spawnInterval = 90; // frames between dumbbells
let frameCounter = 0;
let backgroundGradient;

// ===== Supabase Integration =====
const SUPABASE_URL = 'https://rehokkvfwlfholsnxcus.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaG9ra3Zmd2xmaG9sc254Y3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTU2NTcsImV4cCI6MjA1ODY5MTY1N30.V_V7jThZYXRFIfXWwVNMkuATvBkstUCSOD-wpR7Csd0'

// Initialize Supabase client
let supabaseClient;

// Debug function to check Supabase availability
function checkSupabase() {
  console.log('Checking Supabase...');
  console.log('supabase object exists:', typeof supabase !== 'undefined');
  if (typeof supabase !== 'undefined') {
    console.log('supabase version:', supabase.version);
  }
}

function initSupabase() {
  try {
    console.log('Checking if Supabase is available...');
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded. Make sure the script is included in your HTML file.');
      return false;
    }
    console.log('Supabase library found, creating client...');
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return false;
  }
}

// Test Supabase connection and table access
async function testSupabaseConnection() {
  if (!supabaseClient) {
    console.error('Supabase client not initialized. Call initSupabase() first.');
    return false;
  }

  try {
    console.log('Starting Supabase connection test...');
    
    // Test 1: Check if we can query the table
    console.log('Testing table query...');
    const { data: testData, error: queryError } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.error('Error querying table:', queryError);
      return false;
    }
    
    console.log('Table query successful:', testData);
    
    // Test 2: Try to insert a test record
    console.log('Testing record insertion...');
    const testRecord = {
      email: 'test@example.com',
      score: 0,
      date: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabaseClient
      .from('leaderboard')
      .insert([testRecord]);
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
      return false;
    }
    
    console.log('Record insertion successful:', insertData);
    
    // Test 3: Try to delete the test record
    console.log('Testing record deletion...');
    const { error: deleteError } = await supabaseClient
      .from('leaderboard')
      .delete()
      .eq('email', 'test@example.com');
    
    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
      return false;
    }
    
    console.log('Record deletion successful');
    return true;
    
  } catch (error) {
    console.error('Error in test function:', error);
    return false;
  }
}

function setup() {
  try {
    console.log('Setup function started');
    createCanvas(windowWidth, windowHeight);
    player = new Player();
    
    // Create gradient background
    backgroundGradient = drawingContext.createLinearGradient(0, 0, 0, height);
    backgroundGradient.addColorStop(0, '#1a1a1a');
    backgroundGradient.addColorStop(1, '#2a2a2a');
    
    // Check Supabase availability
    checkSupabase();
    
    // Check if leaderboard functions are available
    console.log('Checking leaderboard functions availability:');
    console.log('window.leaderboardFunctions exists:', typeof window.leaderboardFunctions !== 'undefined');
    if (typeof window.leaderboardFunctions !== 'undefined') {
      console.log('Available leaderboard functions:', Object.keys(window.leaderboardFunctions));
    }
    
    // Initialize Supabase and run tests
    console.log('Starting Supabase initialization...');
    if (initSupabase()) {
      console.log('Supabase initialized, starting connection test...');
      testSupabaseConnection().then(success => {
        if (success) {
          console.log('All Supabase tests passed successfully!');
          // Initialize leaderboard after Supabase is ready
          if (window.leaderboardFunctions && typeof window.leaderboardFunctions.initLeaderboard === 'function') {
            console.log('Initializing leaderboard...');
            window.leaderboardFunctions.initLeaderboard();
          } else {
            console.error('Leaderboard functions not available at setup time');
          }
        } else {
          console.error('Some Supabase tests failed. Check console for details.');
        }
      });
    } else {
      console.error('Failed to initialize Supabase client');
    }
    
  } catch (error) {
    console.error('Error in setup:', error);
    alert('There was an error initializing the game. Please refresh the page.');
  }
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  player = new Player();
}

function draw() {
  // Draw gradient background
  drawingContext.fillStyle = backgroundGradient;
  rect(0, 0, width, height);

  if (!gameOver) {
    frameCounter++;
    // Spawn a new dumbbell at regular intervals
    if (frameCounter % spawnInterval === 0) {
      dumbbells.push(new Dumbbell());
    }

    // Update and display the player
    player.update();
    player.display();

    // Update and display each dumbbell
    for (let i = dumbbells.length - 1; i >= 0; i--) {
      dumbbells[i].update();
      dumbbells[i].display();

      // Check for collision with the player
      if (dumbbells[i].hits(player)) {
        gameOver = true;
      }

      // Remove dumbbells that have fallen off-screen and increase score
      if (dumbbells[i].offScreen()) {
        dumbbells.splice(i, 1);
        score++;
      }
    }

    // Display current score with better styling
    fill(255);
    textSize(32);
    textAlign(LEFT, TOP);
    text("Score: " + score, 20, 20);
    
    // Add a subtle glow effect to the score
    drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';
    drawingContext.shadowBlur = 10;
    text("Score: " + score, 20, 20);
    drawingContext.shadowBlur = 0;
  } else {
    // Game over screen with enhanced styling
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("Game Over!", width / 2, height / 2 - 50);
    
    textSize(32);
    text("Score: " + score, width / 2, height / 2 + 10);
    
    textSize(24);
    text("Press Enter to Restart", width / 2, height / 2 + 60);
    
    // Show email form after a short delay
    setTimeout(showEmailForm, 1000);
  }
}

// Use keyPressed and keyReleased to move the player
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    player.move(-1);
  } else if (keyCode === RIGHT_ARROW) {
    player.move(1);
  }
  // Restart game when Enter is pressed instead of 'R'
  if (gameOver && keyCode === ENTER) {
    resetGame();
  }
}

function keyReleased() {
  // Stop moving when arrow keys are released
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    player.move(0);
  }
}

function resetGame() {
  gameOver = false;
  score = 0;
  dumbbells = [];
  player = new Player();
  frameCounter = 0;
  document.getElementById('emailForm').style.display = 'none';
}

// ===== Player (Gym Bro) Class =====
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 100;
    this.speed = 8;
    this.xdir = 0;
    this.size = min(width, height) * 0.1; // Scale player size based on screen size
  }

  update() {
    this.x += this.xdir * this.speed;
    // Constrain the player within the canvas
    this.x = constrain(this.x, this.size, width - this.size);
  }

  move(dir) {
    this.xdir = dir;
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // Add glow effect
    drawingContext.shadowColor = 'rgba(255, 0, 0, 0.5)';
    drawingContext.shadowBlur = 15;
   
    // Draw legs with gradient
    let legGradient = drawingContext.createLinearGradient(-10, 0, 5, 30);
    legGradient.addColorStop(0, '#000');
    legGradient.addColorStop(1, '#333');
    drawingContext.fillStyle = legGradient;
    
    rect(-10, 0, 5, 30); // left leg
    rect(5, 0, 5, 30);   // right leg
   
    // Draw torso with gradient
    let torsoGradient = drawingContext.createLinearGradient(-15, -50, 15, 0);
    torsoGradient.addColorStop(0, '#ff0000');
    torsoGradient.addColorStop(1, '#cc0000');
    drawingContext.fillStyle = torsoGradient;
    rect(-15, -50, 30, 50, 10);
   
    // Draw arms with gradient
    let armGradient = drawingContext.createLinearGradient(-25, -45, 15, -15);
    armGradient.addColorStop(0, '#cc0000');
    armGradient.addColorStop(1, '#990000');
    drawingContext.fillStyle = armGradient;
    
    rect(-25, -45, 10, 30, 5);
    rect(15, -45, 10, 30, 5);
   
    // Draw head with gradient
    let headGradient = drawingContext.createRadialGradient(0, -70, 0, 0, -70, 12.5);
    headGradient.addColorStop(0, '#ffd4b3');
    headGradient.addColorStop(1, '#ffb366');
    drawingContext.fillStyle = headGradient;
    ellipse(0, -70, 25, 25);
   
    // Add muscle detail with gradient
    let muscleGradient = drawingContext.createRadialGradient(-20, -35, 0, -20, -35, 8);
    muscleGradient.addColorStop(0, '#ff0000');
    muscleGradient.addColorStop(1, '#cc0000');
    drawingContext.fillStyle = muscleGradient;
    ellipse(-20, -35, 8, 15);
    ellipse(20, -35, 8, 15);
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
    pop();
  }
}

// ===== Dumbbell Class =====
class Dumbbell {
  constructor() {
    this.x = random(40, width - 40);
    this.y = -20;
    this.size = random(20, 30);
    this.speed = random(3, 7);
  }

  update() {
    this.y += this.speed;
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // Add glow effect
    drawingContext.shadowColor = 'rgba(100, 100, 100, 0.5)';
    drawingContext.shadowBlur = 10;
   
    // Draw the handle with gradient
    let handleGradient = drawingContext.createLinearGradient(-this.size/2, -5, this.size/2, 5);
    handleGradient.addColorStop(0, '#888');
    handleGradient.addColorStop(1, '#666');
    drawingContext.fillStyle = handleGradient;
    rect(-this.size / 2, -5, this.size, 10, 5);
   
    // Draw the weights with gradient
    let weightGradient = drawingContext.createRadialGradient(-this.size/2, 0, 0, -this.size/2, 0, 5);
    weightGradient.addColorStop(0, '#999');
    weightGradient.addColorStop(1, '#777');
    drawingContext.fillStyle = weightGradient;
    
    ellipse(-this.size / 2, 0, 10, 10);
    ellipse(this.size / 2, 0, 10, 10);
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
    pop();
  }

  offScreen() {
    return this.y > height + this.size;
  }

  hits(player) {
    let playerLeft = player.x - 15;
    let playerRight = player.x + 15;
    let playerTop = player.y - 70;
    let playerBottom = player.y + 30;
   
    let dLeft = this.x - this.size / 2 - 10;
    let dRight = this.x + this.size / 2 + 10;
    let dTop = this.y - 10;
    let dBottom = this.y + 10;
   
    return !(dRight < playerLeft || dLeft > playerRight || dBottom < playerTop || dTop > playerBottom);
  }
}

// Show email form when game ends
function showEmailForm() {
  document.getElementById('emailForm').style.display = 'block';
}

// Submit email to Supabase
async function submitEmail() {
  const emailInput = document.getElementById('emailInput');
  const playerNameInput = document.getElementById('playerNameInput');
  const listservConsent = document.getElementById('listservConsent');
  const email = emailInput.value;
  const playerName = playerNameInput.value.trim();
  
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  if (!listservConsent.checked) {
    alert('Please agree to join the listServ to submit your score');
    return;
  }

  console.log('Attempting to submit score:', { email, playerName, score, listservConsent: true });

  try {
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert([
        { 
          email: email,
          player_name: playerName || null,
          score: score,
          date: new Date().toISOString(),
          listserv_consent: true
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Score submitted successfully:', data);
    alert('Thanks for joining! Your score has been recorded and you\'ve been added to our listServ.');
    document.getElementById('emailForm').style.display = 'none';
    emailInput.value = '';
    playerNameInput.value = '';
    listservConsent.checked = false;
    
    // Wait a short time to ensure the alert has been dismissed
    setTimeout(() => {
      // Show the leaderboard after submitting score
      if (window.leaderboardFunctions && typeof window.leaderboardFunctions.showLeaderboardUI === 'function') {
        console.log('Showing leaderboard after score submission');
        window.leaderboardFunctions.showLeaderboardUI();
      } else {
        console.error('Leaderboard functions not available');
      }
    }, 500);
  } catch (error) {
    console.error('Error submitting score:', error);
    alert('There was an error submitting your score. Please try again.');
  }
}