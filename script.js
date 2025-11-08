const correctAnswers = ["lamp", "echo", "island", "yam", "leaf"];
const finalCode = "LEIYL";
let solvedCount = 0;
let riddleSolved = [false, false, false, false, false];

// Code guessing variables
let attemptsRemaining = 3;
const maxAttempts = 3;
const lockoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
let lockoutTimer = null;
let lockoutInterval = null;

// Check if user is currently locked out
function checkLockout() {
  const lockoutEnd = localStorage.getItem('lockoutEnd');
  if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
    activateLockout(parseInt(lockoutEnd) - Date.now());
    return true;
  }
  return false;
}

// Activate lockout mode
function activateLockout(remainingTime) {
  const overlay = document.getElementById('lockoutOverlay');
  overlay.classList.add('active');
  
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
  
  lockoutInterval = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearInterval(lockoutInterval);
      endLockout();
      return;
    }
    
    // Update timer display
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update progress bar
    const progress = (remaining / totalDuration) * 100;
    progressBar.style.width = progress + '%';
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
}

// Update attempts remaining display
function updateAttemptsDisplay() {
  document.getElementById('attemptsRemaining').textContent = attemptsRemaining;
}

// Handle code guess
function handleCodeGuess() {
  const guessInput = document.getElementById('codeGuessInput');
  const guess = guessInput.value.trim().toUpperCase();
  
  if (guess.length !== 5) {
    showFeedbackMessage('⚠️ Please enter a 5-letter code!', 'warning');
    guessInput.classList.add('error');
    setTimeout(() => guessInput.classList.remove('error'), 500);
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
    
    if (attemptsRemaining === 0) {
      // Lock out the user
      const lockoutEnd = Date.now() + lockoutDuration;
      localStorage.setItem('lockoutEnd', lockoutEnd.toString());
      showFeedbackMessage('🔒 Too many wrong attempts! Locked for 5 minutes.', 'error');
      setTimeout(() => activateLockout(lockoutDuration), 1500);
    } else {
      showFeedbackMessage(`❌ Wrong code! ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining.`, 'error');
    }
  }
}

// Show reward section
function showRewardSection() {
  const riddleSection = document.getElementById("riddleSection");
  const codeGuessSection = document.querySelector(".code-guess-section");
  const divider = document.querySelector(".divider");
  const progressContainer = document.querySelector(".progress-container");
  
  riddleSection.style.opacity = "0";
  codeGuessSection.style.opacity = "0";
  divider.style.opacity = "0";
  progressContainer.style.opacity = "0";
  riddleSection.style.transform = "scale(0.95)";
  riddleSection.style.transition = "all 0.5s ease-out";
  codeGuessSection.style.transition = "all 0.5s ease-out";
  divider.style.transition = "all 0.5s ease-out";
  progressContainer.style.transition = "all 0.5s ease-out";
  
  setTimeout(() => {
    riddleSection.style.display = "none";
    codeGuessSection.style.display = "none";
    divider.style.display = "none";
    progressContainer.style.display = "none";
    
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
    z-index: 1000;
    animation: slideDown 0.5s ease-out;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideUp 0.5s ease-out';
    setTimeout(() => messageDiv.remove(), 500);
  }, 2500);
}

function updateProgress() {
  const percentage = (solvedCount / 5) * 100;
  document.getElementById("progressBar").style.width = percentage + "%";
  document.getElementById("progressText").textContent = `${solvedCount}/5 Riddles Solved`;
  
  if (solvedCount === 5) {
    document.getElementById("progressText").textContent = "🎉 All Solved! 🎉";
  }
}

function setupRealTimeFeedback() {
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`r${i}`);
    input.addEventListener('input', () => {
      const riddleCard = input.closest('.riddle');
      riddleCard.classList.remove('correct', 'incorrect');
      document.getElementById(`status${i}`).textContent = '';
    });
  }
}

function playSound(frequency, duration) {
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

document.getElementById("submitRiddles").addEventListener("click", () => {
  let allCorrect = true;
  
  for (let i = 1; i <= 5; i++) {
    const userAnswer = document.getElementById(`r${i}`).value.trim().toLowerCase();
    const riddleCard = document.querySelector(`[data-riddle="${i}"]`);
    const statusElement = document.getElementById(`status${i}`);
    const isCorrect = userAnswer === correctAnswers[i - 1];
    
    riddleCard.classList.remove('correct', 'incorrect');
    
    if (isCorrect) {
      riddleCard.classList.add('correct');
      statusElement.textContent = '✅';
      
      if (!riddleSolved[i - 1]) {
        riddleSolved[i - 1] = true;
        playSound(800, 0.2);
      }
    } else {
      riddleCard.classList.add('incorrect');
      statusElement.textContent = '❌';
      allCorrect = false;
      riddleSolved[i - 1] = false;
    }
  }
  
  solvedCount = riddleSolved.filter(Boolean).length;
  updateProgress();
  
  if (allCorrect) {
    playSound(1000, 0.3);
    
    setTimeout(() => {
      showRewardSection();
    }, 600);
    
  } else {
    playSound(200, 0.3);
    
    const incorrectCount = 5 - solvedCount;
    let message = "";
    
    if (solvedCount === 0) {
      message = "Keep trying! You can do this! 💪";
    } else if (solvedCount < 3) {
      message = `Great start! ${incorrectCount} more to go! 🎯`;
    } else if (solvedCount < 5) {
      message = `So close! Only ${incorrectCount} left! 🔥`;
    }
    
    showFeedbackMessage(message, 'info');
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

// Initialize
checkLockout(); // Check if user is locked out on page load
setupRealTimeFeedback();
updateProgress();
updateAttemptsDisplay();

// Code guess button event listener
document.getElementById('guessCodeBtn').addEventListener('click', handleCodeGuess);

// Allow Enter key to submit code guess
document.getElementById('codeGuessInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleCodeGuess();
  }
});

// Auto-uppercase code input
document.getElementById('codeGuessInput').addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase();
});

document.querySelectorAll('.riddle-input').forEach((input, index) => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (index < 4) {
        document.getElementById(`r${index + 2}`).focus();
      } else {
        document.getElementById('submitRiddles').click();
      }
    }
  });
});