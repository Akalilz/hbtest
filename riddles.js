const riddles = [
  { question: "I shine bright in the dark and hang above your head at night.", answer: "lamp" },
  { question: "I speak without a mouth and hear without ears.", answer: "echo" },
  { question: "I float in the sky and bring shade on sunny days.", answer: "island" },
  { question: "I grow underground, am often orange, and can be eaten.", answer: "yam" },
  { question: "I am green or brown, sway in the wind, and am part of a forest.", answer: "leaf" }
];

const finalCode = "LEIYL";
let currentRiddleIndex = 0;
let scrambledLetters = [];
let riddlesSolved = [false, false, false, false, false];
let riddleQueue = [0, 1, 2, 3, 4]; // Tracks which riddles to show in order

// Save riddle state to localStorage
function saveRiddleState() {
  localStorage.setItem('riddlesSolved', JSON.stringify(riddlesSolved));
  localStorage.setItem('riddleQueue', JSON.stringify(riddleQueue));
  localStorage.setItem('scrambledLetters', JSON.stringify(scrambledLetters));
}

// Restore riddle state from localStorage
function restoreRiddleState() {
  const savedSolved = localStorage.getItem('riddlesSolved');
  const savedQueue = localStorage.getItem('riddleQueue');
  const savedScrambled = localStorage.getItem('scrambledLetters');
  
  if (savedSolved) {
    riddlesSolved = JSON.parse(savedSolved);
  }
  
  if (savedQueue) {
    riddleQueue = JSON.parse(savedQueue);
  }
  
  if (savedScrambled) {
    scrambledLetters = JSON.parse(savedScrambled);
  } else {
    scrambledLetters = scrambleLetters();
    localStorage.setItem('scrambledLetters', JSON.stringify(scrambledLetters));
  }
}

function scrambleLetters() {
  const letters = ['L', 'E', 'I', 'Y', 'L'];
  const correctOrder = 'LEIYL';
  let scrambled;
  
  do {
    scrambled = letters.slice();
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }
  } while (scrambled.join('') === correctOrder);
  
  return scrambled;
}

function updateProgress() {
  const solvedCount = riddlesSolved.filter(Boolean).length;
  // Progress tracking without display
}

function getNextRiddleIndex() {
  // Find the next unsolved riddle from the queue
  for (let i = 0; i < riddleQueue.length; i++) {
    const riddleIndex = riddleQueue[i];
    if (!riddlesSolved[riddleIndex]) {
      return i; // Return position in queue
    }
  }
  return -1; // All solved
}

function displayCurrentRiddle() {
  const queuePosition = getNextRiddleIndex();
  
  // Check if all riddles are solved
  if (queuePosition === -1) {
    showRewardSection();
    return;
  }
  
  currentRiddleIndex = riddleQueue[queuePosition];
  
  const riddleTextEl = document.getElementById("riddleText");
  const riddleInput = document.getElementById("riddleInput");
  const riddleStatus = document.getElementById("riddleStatus");
  
  riddleTextEl.textContent = riddles[currentRiddleIndex].question;
  riddleInput.value = "";
  riddleStatus.textContent = "";
  
  const riddleCard = document.getElementById("currentRiddle");
  riddleCard.classList.remove('correct', 'incorrect');
  riddleInput.focus();
}

function revealLetter(index) {
  const collectedLetters = document.getElementById('collectedLetters');
  
  if (scrambledLetters[index]) {
    // Create a new letter card
    const letterCard = document.createElement('div');
    letterCard.className = 'letter-slot revealed';
    letterCard.textContent = scrambledLetters[index];
    letterCard.id = `slot${index + 1}`;
    
    // Add to the container
    collectedLetters.appendChild(letterCard);
    
    // Trigger animation
    setTimeout(() => {
      letterCard.style.animation = 'popIn 0.6s ease-out';
    }, 10);
    
    // Save collected letters to localStorage immediately
    const currentLetters = Array.from(collectedLetters.children).map(el => el.textContent).join('');
    localStorage.setItem('collectedLetters', currentLetters);
    localStorage.setItem('riddlesCompleted', riddlesSolved.filter(Boolean).length === 5 ? 'true' : 'partial');
  }
}

function playSound(frequency, duration) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Audio not supported, silently fail
  }
}

function celebrateConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#667eea', '#764ba2', '#f093fb', '#FFD700', '#FF69B4']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#667eea', '#764ba2', '#f093fb', '#FFD700', '#FF69B4']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

function showRewardSection() {
  const riddleSection = document.getElementById("riddleSection");
  const collectedLetters = document.querySelector(".collected-letters-container");
  
  // Save collected letters to localStorage (mark as fully completed)
  const lettersArray = scrambledLetters.join('');
  localStorage.setItem('collectedLetters', lettersArray);
  localStorage.setItem('riddlesCompleted', 'true');
  
  riddleSection.style.opacity = "0";
  collectedLetters.style.opacity = "0";
  riddleSection.style.transform = "scale(0.95)";
  riddleSection.style.transition = "all 0.5s ease-out";
  collectedLetters.style.transition = "all 0.5s ease-out";
  
  setTimeout(() => {
    riddleSection.style.display = "none";
    collectedLetters.style.display = "none";
    
    const completionMessage = document.getElementById("completionMessage");
    completionMessage.classList.add("show");
    
    celebrateConfetti();
  }, 500);
}

function checkAnswer() {
  const userAnswer = document.getElementById("riddleInput").value.trim().toLowerCase();
  const correctAnswer = riddles[currentRiddleIndex].answer;
  const riddleCard = document.getElementById("currentRiddle");
  const riddleStatus = document.getElementById("riddleStatus");
  const submitButton = document.getElementById("submitAnswer");
  const riddleInput = document.getElementById("riddleInput");
  
  // Disable input and button to prevent multiple submissions
  submitButton.disabled = true;
  riddleInput.disabled = true;
  
  riddleCard.classList.remove('correct', 'incorrect');
  
  if (userAnswer === correctAnswer) {
    riddleCard.classList.add('correct');
    riddleStatus.textContent = '✅';
    playSound(800, 0.2);
    
    // Mark this riddle as solved
    riddlesSolved[currentRiddleIndex] = true;
    
    // Reveal the corresponding letter
    revealLetter(currentRiddleIndex);
    
    // Save state
    saveRiddleState();
    
    // Move to next riddle after a short delay
    setTimeout(() => {
      updateProgress();
      displayCurrentRiddle();
      // Re-enable input and button for next riddle
      submitButton.disabled = false;
      riddleInput.disabled = false;
    }, 1000);
    
  } else {
    riddleCard.classList.add('incorrect');
    riddleStatus.textContent = '❌';
    playSound(200, 0.3);
    
    const solvedCount = riddlesSolved.filter(Boolean).length;
    
    // Move this riddle to the end of the queue
    const queuePosition = riddleQueue.indexOf(currentRiddleIndex);
    if (queuePosition !== -1) {
      riddleQueue.splice(queuePosition, 1);
      riddleQueue.push(currentRiddleIndex);
    }
    
    // Save state
    saveRiddleState();
    
    // Show appropriate feedback
    if (solvedCount === 0) {
      showFeedbackMessage("Not quite! Moving to the next riddle... 🔄", 'warning');
    } else {
      showFeedbackMessage("We'll come back to this one! Next riddle... �", 'warning');
    }
    
    // Move to next riddle after a short delay
    setTimeout(() => {
      displayCurrentRiddle();
      // Re-enable input and button for next riddle
      submitButton.disabled = false;
      riddleInput.disabled = false;
    }, 1500);
  }
}

function showFeedbackMessage(message, type = 'info') {
  const existingMsg = document.getElementById('feedback-message');
  if (existingMsg) existingMsg.remove();
  
  const colors = {
    info: 'linear-gradient(135deg, #667eea, #764ba2)',
    warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
    error: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
    success: 'linear-gradient(135deg, #4caf50, #45a049)'
  };
  
  const messageDiv = document.createElement('div');
  messageDiv.id = 'feedback-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type]};
    color: white;
    padding: 15px 30px;
    border-radius: 10px;
    font-weight: bold;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideDown 0.5s ease-out;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideUp 0.5s ease-out';
    setTimeout(() => messageDiv.remove(), 500);
  }, 2500);
}

// Initialize scrambled letters on page load
restoreRiddleState();

// Detect page refresh and warn user about losing progress
// Track if user is navigating via a button/link
let isNavigating = false;

// Add click listeners to all navigation links
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('a[href]');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      isNavigating = true;
    });
  });
});

window.addEventListener('beforeunload', (event) => {
  // Only show warning if NOT navigating via button and has progress
  if (!isNavigating) {
    const hasProgress = riddlesSolved.some(solved => solved === true);
    
    if (hasProgress) {
      // Trigger browser's default warning dialog
      // Note: Modern browsers don't show custom messages for security reasons
      event.preventDefault();
      event.returnValue = ''; // Required for the dialog to show
    }
  }
});

// Check if page was reloaded and redirect to index
const navigationEntries = performance.getEntriesByType('navigation');
if (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') {
  // Clear all progress
  localStorage.removeItem('riddlesSolved');
  localStorage.removeItem('riddleQueue');
  localStorage.removeItem('scrambledLetters');
  localStorage.removeItem('collectedLetters');
  localStorage.removeItem('riddlesCompleted');
  // Redirect to main page
  window.location.href = 'index.html';
}

// Restore previously collected letters
const collectedLettersContainer = document.getElementById('collectedLetters');
if (collectedLettersContainer) {
  collectedLettersContainer.innerHTML = '';
  
  // Re-display collected letters for solved riddles
  riddlesSolved.forEach((solved, index) => {
    if (solved && scrambledLetters[index]) {
      const letterCard = document.createElement('div');
      letterCard.className = 'letter-slot revealed';
      letterCard.textContent = scrambledLetters[index];
      letterCard.id = `slot${index + 1}`;
      collectedLettersContainer.appendChild(letterCard);
    }
  });
}

// Event listener for submit button
document.getElementById("submitAnswer").addEventListener("click", checkAnswer);

// Event listener for Enter key
document.getElementById("riddleInput").addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    checkAnswer();
  }
});

const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }
`;
document.head.appendChild(style);

// Initialize the first riddle
updateProgress();
displayCurrentRiddle();
