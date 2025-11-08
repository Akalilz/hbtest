const finalCode = "LEIYL";
let attemptsRemaining = 3;
const maxAttempts = 3;
const baseLockoutDuration = 5 * 60 * 1000; // Base 5 minutes in milliseconds
let lockoutInterval = null;

// Get lockout count from localStorage
function getLockoutCount() {
  return parseInt(localStorage.getItem('lockoutCount') || '0');
}

// Increment lockout count
function incrementLockoutCount() {
  const count = getLockoutCount() + 1;
  localStorage.setItem('lockoutCount', count.toString());
  return count;
}

// Get incremental lockout duration based on count
// 1st: 5 min, 2nd: 10 min, 3rd: 15 min, 4th: 20 min, etc.
function getLockoutDuration(count) {
  return baseLockoutDuration * count; // Each lockout adds 5 more minutes
}

// Check if user is currently locked out
function checkLockout() {
  const lockoutEnd = localStorage.getItem('lockoutEnd');
  if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
    activateLockout(parseInt(lockoutEnd) - Date.now());
    return true;
  } else {
    // Clear old lockout data
    localStorage.removeItem('lockoutEnd');
  }
  return false;
}

// Activate lockout mode
function activateLockout(remainingTime) {
  const overlay = document.getElementById('lockoutOverlay');
  overlay.classList.add('active');
  
  // Update lockout message based on count
  const lockoutCount = getLockoutCount();
  const lockoutContent = overlay.querySelector('.lockout-content');
  const heading = lockoutContent.querySelector('h2');
  const description = lockoutContent.querySelector('p:first-of-type');
  
  if (lockoutCount > 1) {
    heading.textContent = `Locked Out Again! (${lockoutCount}${getOrdinalSuffix(lockoutCount)} Time)`;
    description.textContent = 'Multiple failed attempts detected. Longer lockout applied.';
  } else {
    heading.textContent = 'Too Many Attempts!';
    description.textContent = "You've exceeded the maximum number of code guesses.";
  }
  
  // Disable all inputs and buttons
  document.querySelectorAll('input, button').forEach(el => {
    el.disabled = true;
  });
  
  startLockoutTimer(remainingTime);
}

// Start the lockout countdown timer
function startLockoutTimer(duration) {
  const timerElement = document.getElementById('lockoutTimer');
  const progressBar = document.getElementById('lockoutProgressBar');
  const totalDuration = duration;
  let remaining = duration;
  
  // Update immediately
  updateTimerDisplay();
  
  function updateTimerDisplay() {
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const progress = (remaining / totalDuration) * 100;
    progressBar.style.width = progress + '%';
  }
  
  lockoutInterval = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearInterval(lockoutInterval);
      endLockout();
      return;
    }
    
    updateTimerDisplay();
  }, 1000);
}

// End lockout and restore access
function endLockout() {
  localStorage.removeItem('lockoutEnd');
  const overlay = document.getElementById('lockoutOverlay');
  overlay.classList.remove('active');
  
  // Re-enable inputs and buttons
  document.querySelectorAll('input, button').forEach(el => {
    el.disabled = false;
  });
  
  // Reset attempts
  attemptsRemaining = maxAttempts;
  updateAttemptsDisplay();
  
  showFeedbackMessage('✅ Lockout ended! You have 3 new attempts.', 'success');
}

// Update attempts remaining display
function updateAttemptsDisplay() {
  const attemptsElement = document.getElementById('attemptsRemaining');
  attemptsElement.textContent = attemptsRemaining;
  
  // Change color based on remaining attempts
  if (attemptsRemaining === 1) {
    attemptsElement.style.color = '#e74c3c';
  } else if (attemptsRemaining === 2) {
    attemptsElement.style.color = '#e67e22';
  } else {
    attemptsElement.style.color = '#27ae60';
  }
}

// Play sound effect
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

// Trigger confetti burst
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

// Handle code guess
function handleCodeGuess() {
  const guessInput = document.getElementById('codeGuessInput');
  const guess = guessInput.value.trim().toUpperCase();
  
  // Skip validation, just process the guess
  if (guess.length === 0) {
    guessInput.classList.add('error');
    setTimeout(() => guessInput.classList.remove('error'), 500);
    playSound(300, 0.2);
    return;
  }
  
  if (guess === finalCode) {
    // Correct guess!
    playSound(1000, 0.3);
    showRewardSection();
  } else {
    // Wrong guess
    attemptsRemaining--;
    updateAttemptsDisplay();
    playSound(200, 0.3);
    
    guessInput.classList.add('error');
    setTimeout(() => guessInput.classList.remove('error'), 500);
    guessInput.value = '';
    guessInput.focus();
    
    if (attemptsRemaining === 0) {
      // Lock out the user with progressive duration
      const lockoutCount = incrementLockoutCount();
      const duration = getLockoutDuration(lockoutCount);
      const lockoutEnd = Date.now() + duration;
      
      localStorage.setItem('lockoutEnd', lockoutEnd.toString());
      
      const minutes = Math.floor(duration / 60000);
      const lockoutMessage = lockoutCount === 1 
        ? `🔒 Too many wrong attempts! Locked for ${minutes} minutes.`
        : `🔒 Too many wrong attempts! Locked for ${minutes} minutes (${lockoutCount}${getOrdinalSuffix(lockoutCount)} lockout).`;
      
      showFeedbackMessage(lockoutMessage, 'error');
      setTimeout(() => activateLockout(duration), 1500);
    } else {
      showFeedbackMessage(`❌ Wrong code! ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining.`, 'error');
    }
  }
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Show reward section
function showRewardSection() {
  const codeGuessSection = document.querySelector(".code-guess-section-large");
  const navigation = document.querySelector(".page-navigation");
  
  codeGuessSection.style.opacity = "0";
  navigation.style.opacity = "0";
  codeGuessSection.style.transform = "scale(0.95)";
  codeGuessSection.style.transition = "all 0.5s ease-out";
  navigation.style.transition = "all 0.5s ease-out";
  
  setTimeout(() => {
    codeGuessSection.style.display = "none";
    navigation.style.display = "none";
    
    const rewardForm = document.getElementById("rewardForm");
    rewardForm.classList.add("show");
    
    celebrateConfetti();
    
    document.getElementById("finalCode").textContent = finalCode;
  }, 500);
}

// Show feedback message
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

// Add CSS animations
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

// Display collected letters if riddles were completed
function displayCollectedLetters() {
  const riddlesCompleted = localStorage.getItem('riddlesCompleted');
  const collectedLetters = localStorage.getItem('collectedLetters');
  
  if (collectedLetters && (riddlesCompleted === 'true' || riddlesCompleted === 'partial')) {
    const container = document.getElementById('collectedLettersHint');
    const lettersDisplay = document.getElementById('displayCollectedLetters');
    
    // Clear any existing letters
    lettersDisplay.innerHTML = '';
    
    // Create letter cards
    for (let i = 0; i < collectedLetters.length; i++) {
      const letterCard = document.createElement('div');
      letterCard.className = 'letter-slot revealed';
      letterCard.textContent = collectedLetters[i];
      letterCard.style.animationDelay = `${i * 0.1}s`;
      lettersDisplay.appendChild(letterCard);
    }
    
    // Show the container
    container.style.display = 'block';
  }
}

// Initialize
checkLockout();
updateAttemptsDisplay();
displayCollectedLetters();

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
  // Only show warning if NOT navigating via button and has collected letters
  if (!isNavigating) {
    const collectedLetters = localStorage.getItem('collectedLetters');
    
    if (collectedLetters && collectedLetters.length > 0) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
});

// Detect page refresh (F5 or Ctrl+R) and reset progress
const navigationEntries = performance.getEntriesByType('navigation');
if (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') {
  // Clear all riddle progress (keep lockout data)
  localStorage.removeItem('riddlesSolved');
  localStorage.removeItem('riddleQueue');
  localStorage.removeItem('scrambledLetters');
  localStorage.removeItem('collectedLetters');
  localStorage.removeItem('riddlesCompleted');
  // Redirect to main page
  window.location.href = 'index.html';
}

// Event listeners
document.getElementById('guessCodeBtn').addEventListener('click', handleCodeGuess);

document.getElementById('codeGuessInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleCodeGuess();
  }
});

document.getElementById('codeGuessInput').addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase();
});
