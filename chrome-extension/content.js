chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showResult") {
    showResultOverlay(message.text, message.result);
  }
});

// Function to monitor text fields on social media sites
function monitorTextFields() {
  // Find comment/post input fields based on common selectors
  const inputSelectors = [
    'textarea', 
    '[contenteditable="true"]',
    '[role="textbox"]',
    // Add selectors for specific social media platforms
    '.public-DraftEditor-content',  // Facebook
    '[data-testid="tweetTextarea_0"]'  // Twitter
  ];
  
  const inputs = document.querySelectorAll(inputSelectors.join(','));
  
  inputs.forEach(input => {
    // Check if already processed to avoid duplicate listeners
    if (input.dataset.bullyingCheckerAttached) return;
    input.dataset.bullyingCheckerAttached = "true";
    
    // Remove button creation code and replace with automatic checking
    let lastCheckedText = '';
    
    // Function to check text every 5 seconds
    function checkForBullying() {
      const text = input.value || input.textContent || '';
      
      // Only send for analysis if text has changed since last check and isn't empty
      if (text.trim() && text !== lastCheckedText) {
        lastCheckedText = text;
        
        chrome.runtime.sendMessage(
          { action: "analyzeText", text: text },
          (response) => {
            // Only show popup if cyberbullying is detected
            if (response && response.prediction === "cyberbullying") {
              showWarning(input, response);
            } else {
              // Remove any existing warnings if content is now safe
              const existingWarning = input.parentNode.querySelector('.bullying-warning');
              if (existingWarning) {
                existingWarning.remove();
              }
            }
          }
        );
      }
    }
    
    // Start periodic checking for this input field
    const intervalId = setInterval(checkForBullying, 5000);
    
    // Store the interval ID to clean up if needed
    input.dataset.checkIntervalId = intervalId;
  });
}

// Check page periodically for new text fields (for dynamically loaded content)
setInterval(monitorTextFields, 2000);

// Initial check when page loads
window.addEventListener('load', monitorTextFields);

// Function to show result overlay
function showResultOverlay(text, result) {
  // Only show overlay for cyberbullying content
  if (result.prediction !== "cyberbullying") return;
  
  // Remove existing overlay if present
  const existingOverlay = document.getElementById('bullying-result-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'bullying-result-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    padding: 15px;
    font-family: Arial, sans-serif;
  `;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => overlay.remove();
  
  // Create content
  const title = document.createElement('h3');
  title.textContent = '🚨 Cyberbullying Detected';
  title.style.cssText = 'margin: 0 0 10px 0; color: #d32f2f;';
  
  const content = document.createElement('div');
  content.innerHTML = `
    <p>The text appears to contain harmful content.</p>
    <div style="margin-top: 10px;">
      <strong>Categories detected:</strong>
      <ul style="margin-top: 5px;">
        ${Object.entries(result.probabilities)
          .map(([category, score]) => 
            `<li>${category}: ${Math.round(score * 100)}%</li>`
          ).join('')}
      </ul>
    </div>
  `;
  
  // Assemble and append overlay
  overlay.appendChild(closeBtn);
  overlay.appendChild(title);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 10000);
}

// Function to show warning on text input
function showWarning(inputElement, result) {
  // Don't create a new warning if one already exists
  const existingWarning = inputElement.parentNode.querySelector('.bullying-warning');
  if (existingWarning) return;
  
  // Create warning element
  const warning = document.createElement('div');
  warning.className = 'bullying-warning';
  warning.style.cssText = `
    color: #d32f2f;
    background: #ffebee;
    border: 1px solid #ffcdd2;
    padding: 10px;
    margin-top: 5px;
    border-radius: 4px;
  `;
  
  warning.innerHTML = `
    <p><strong>⚠️ Warning:</strong> Your text may contain cyberbullying content.</p>
    <p>Please consider rephrasing before posting.</p>
  `;
  
  // Add warning after input
  inputElement.parentNode.insertBefore(warning, inputElement.nextSibling);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (warning.parentNode) {
      warning.remove();
    }
  }, 10000);
}

// The showSafe function is no longer needed as we only show warnings