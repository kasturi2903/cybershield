document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const textInput = document.getElementById('textInput');
  const checkButton = document.getElementById('checkButton');
  const resultDiv = document.getElementById('result');
  const autoCheckCheckbox = document.getElementById('enableAutoCheck');
  const notificationsCheckbox = document.getElementById('enableNotifications');
  
  // Load saved settings
  chrome.storage.sync.get(
    {
      enableAutoCheck: true,
      enableNotifications: true
    },
    function(items) {
      autoCheckCheckbox.checked = items.enableAutoCheck;
      notificationsCheckbox.checked = items.enableNotifications;
    }
  );
  
  // Save settings when changed
  autoCheckCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({ enableAutoCheck: this.checked });
  });
  
  notificationsCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({ enableNotifications: this.checked });
  });
  
  // Check button click handler
  checkButton.addEventListener('click', function() {
    const text = textInput.value.trim();
    if (!text) return;
    
    checkButton.disabled = true;
    checkButton.textContent = 'Analyzing...';
    
    // Send message to background script to analyze text
    chrome.runtime.sendMessage(
      { action: "analyzeText", text: text },
      function(response) {
        displayResult(response);
        checkButton.disabled = false;
        checkButton.textContent = 'Check Now';
      }
    );
  });
  
  // Function to display analysis result
  function displayResult(result) {
    resultDiv.style.display = 'block';
    
    if (result.error) {
      resultDiv.className = 'result';
      resultDiv.innerHTML = `<p>Error: ${result.error}</p>`;
      return;
    }
    
    if (result.prediction === "cyberbullying") {
      resultDiv.className = 'result bullying';
      
      let categories = '';
      for (const [category, score] of Object.entries(result.probabilities)) {
        const percentage = Math.round(score * 100);
        categories += `
          <div class="category">
            <strong>${formatCategory(category)}:</strong> ${percentage}%
            <div style="background:#f8bbd0;height:10px;width:${percentage}%;"></div>
          </div>
        `;
      }
      
      resultDiv.innerHTML = `
        <p><strong>🚨 Cyberbullying content detected</strong></p>
        <p>The text contains harmful content in these categories:</p>
        ${categories}
      `;
    } else {
      resultDiv.className = 'result safe';
      resultDiv.innerHTML = `
        <p><strong>✅ No cyberbullying detected</strong></p>
        <p>The text appears to be safe.</p>
      `;
    }
  }
  
  // Helper function to format category names
  function formatCategory(category) {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
});