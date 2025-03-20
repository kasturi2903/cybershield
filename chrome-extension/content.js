chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showResult") {
    showResultOverlay(message.text, message.result);
  }
});

// Function to monitor text input fields on social media sites
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
    
    // Add button next to input field
    const button = document.createElement('button');
    button.textContent = 'Check for bullying';
    button.className = 'bullying-check-btn';
    button.style.cssText = `
      background: #0078d7;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      margin: 5px;
    `;
    
    // Insert button after input field
    input.parentNode.insertBefore(button, input.nextSibling);
    
    // Check button click
    button.addEventListener('click', () => {
      const text = input.value || input.textContent;
      if (text.trim()) {
        chrome.runtime.sendMessage(
          { action: "analyzeText", text: text },
          (response) => {
            if (response.prediction === "cyberbullying") {
              showWarning(input, response);
            } else {
              showSafe(input);
            }
          }
        );
      }
    });
  });
}

// Check page periodically for new text fields (for dynamically loaded content)
setInterval(monitorTextFields, 2000);

// Initial check when page loads
window.addEventListener('load', monitorTextFields);

// Function to show result overlay
function showResultOverlay(text, result) {
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
  title.style.margin = '0 0 10px 0';
  
  const content = document.createElement('div');
  
  if (result.prediction === "cyberbullying") {
    title.textContent = '🚨 Cyberbullying Detected';
    title.style.color = '#d32f2f';
    
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
  } else {
    title.textContent = '✅ Safe Content';
    title.style.color = '#388e3c';
    content.innerHTML = '<p>No cyberbullying content detected.</p>';
  }
  
  // Assemble and append overlay
  overlay.appendChild(closeBtn);
  overlay.appendChild(title);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

// Function to show warning on text input
function showWarning(inputElement, result) {
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
  
  // Remove existing warning if present
  const existingWarning = inputElement.parentNode.querySelector('.bullying-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // Add warning after input
  inputElement.parentNode.insertBefore(warning, inputElement.nextSibling);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (warning.parentNode) {
      warning.remove();
    }
  }, 10000);
}

// Function to show "safe" indicator
function showSafe(inputElement) {
  // Remove existing warnings
  const existingWarning = inputElement.parentNode.querySelector('.bullying-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // Create safe element
  const safe = document.createElement('div');
  safe.className = 'bullying-safe';
  safe.style.cssText = `
    color: #388e3c;
    background: #e8f5e9;
    border: 1px solid #c8e6c9;
    padding: 10px;
    margin-top: 5px;
    border-radius: 4px;
  `;
  
  safe.innerHTML = `<p><strong>✅ Safe:</strong> No cyberbullying content detected.</p>`;
  
  // Add safe indicator after input
  inputElement.parentNode.insertBefore(safe, inputElement.nextSibling);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (safe.parentNode) {
      safe.remove();
    }
  }, 3000);
}
