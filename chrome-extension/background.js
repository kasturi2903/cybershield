// chrome.runtime.onInstalled.addListener(() => {
//     // Create context menu item
//     chrome.contextMenus.create({
//       id: "checkBullying",
//       title: "Check for cyberbullying",
//       contexts: ["selection"]
//     });
//   });
  
//   // Handle context menu clicks
//   chrome.contextMenus.onClicked.addListener((info, tab) => {
//     if (info.menuItemId === "checkBullying" && info.selectionText) {
//       // Send text to API
//       checkText(info.selectionText, (result) => {
//         // Send result to content script to display
//         chrome.tabs.sendMessage(tab.id, {
//           action: "showResult",
//           result: result,
//           text: info.selectionText
//         });
//       });
//     }
//   });
  
//   // Function to check text with API
//   function checkText(text, callback) {
//     fetch("http://127.0.0.1:5000/predict", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ text: text })
//     })
//     .then(response => response.json())
//     .then(data => callback(data))
//     .catch(error => {
//       console.error("Error:", error);
//       callback({ error: "Failed to analyze text" });
//     });
//   }
  
//   // Listen for messages from content scripts or popup
//   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "analyzeText") {
//       checkText(request.text, sendResponse);
//       return true; // Required for async sendResponse
//     }
//   });
// Keep the service worker alive for Manifest V3
// Keep the service worker alive for Manifest V3
const keepAlive = () => setInterval(() => {
    console.log("Keeping service worker alive");
  }, 20000);
  
  keepAlive();
  
  // Track which tabs have content scripts ready
  const readyTabs = new Set();
  
  // When extension is installed or updated
  chrome.runtime.onInstalled.addListener(() => {
    // Create context menu item
    chrome.contextMenus.create({
      id: "checkBullying",
      title: "Check for cyberbullying",
      contexts: ["selection"]
    });
    
    console.log("Cyberbullying Shield extension installed");
  });
  
  // Listen for content script ready messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "contentScriptReady" && sender.tab) {
      readyTabs.add(sender.tab.id);
      console.log("Content script ready in tab", sender.tab.id);
      sendResponse({ status: "acknowledged" });
    }
    
    if (message.action === "analyzeText") {
      checkText(message.text, sendResponse);
      return true; // Keep the message channel open for async response
    }
  });
  
  // Remove tab from ready list when closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    readyTabs.delete(tabId);
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkBullying" && info.selectionText) {
      // Check if we can inject content script
      chrome.tabs.get(tab.id, (tabInfo) => {
        if (chrome.runtime.lastError) {
          console.error("Tab not found:", chrome.runtime.lastError.message);
          return;
        }
  
        // Check if URL is restricted
        if (isRestrictedUrl(tabInfo.url)) {
          // Show a notification instead since we can't inject scripts
          showSystemNotification("Cannot analyze text on this page", 
            "Chrome doesn't allow extensions to run on internal pages. Try copying the text and analyzing it through the extension popup.");
          
          // Alternatively, open the popup with the text pre-filled
          openPopupWithText(info.selectionText);
        } else {
          // Normal flow for allowed pages
          ensureContentScriptLoaded(tab.id, () => {
            checkText(info.selectionText, (result) => {
              safelySendMessage(tab.id, {
                action: "showResult",
                result: result,
                text: info.selectionText
              });
            });
          });
        }
      });
    }
  });
  
  // Function to check if URL is restricted
  function isRestrictedUrl(url) {
    return url.startsWith('chrome://') || 
           url.startsWith('chrome-extension://') || 
           url.startsWith('devtools://') ||
           url.startsWith('chrome-search://') ||
           url.startsWith('about:') ||
           url.startsWith('edge://') ||    // For Edge browser
           url.startsWith('brave://') ||   // For Brave browser
           url.startsWith('opera://') ||   // For Opera browser
           url.startsWith('vivaldi://') || // For Vivaldi browser
           url.startsWith('file://');      // Local file access is also restricted
  }
  
  // Function to show a system notification
  function showSystemNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon48.png',
      title: title,
      message: message
    });
  }
  
  // Function to open popup with text pre-filled
  function openPopupWithText(text) {
    // Store the text temporarily in storage
    chrome.storage.local.set({ 'tempAnalysisText': text }, function() {
      // Chrome doesn't provide a direct way to open popup with parameters
      // You can either use chrome.action.openPopup() (limited support)
      // or create a dedicated popup window
      chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 400,
        height: 500
      });
    });
  }
  
  // Function to ensure content script is loaded before sending messages
  function ensureContentScriptLoaded(tabId, callback) {
    // If we already know the tab has the content script ready
    if (readyTabs.has(tabId)) {
      console.log("Content script already ready in tab", tabId);
      callback();
      return;
    }
    
    // Check if we can inject scripts in this tab
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("Tab not found:", chrome.runtime.lastError.message);
        return;
      }
      
      if (isRestrictedUrl(tab.url)) {
        console.log("Cannot inject content script in restricted URL:", tab.url);
        return;
      }
      
      // Otherwise, inject the content script
      console.log("Injecting content script into tab", tabId);
      
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        // Give the content script a moment to initialize
        setTimeout(() => {
          readyTabs.add(tabId);
          callback();
        }, 200);
      }).catch((error) => {
        console.error("Error injecting content script:", error.message);
      });
    });
  }
  
  // Function to safely send a message to a tab
  function safelySendMessage(tabId, message) {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("Tab not found:", chrome.runtime.lastError.message);
        return;
      }
      
      // Check if we can inject scripts in this tab
      if (isRestrictedUrl(tab.url)) {
        console.log("Cannot send message to restricted URL:", tab.url);
        return;
      }
      
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError.message);
          
          // If the content script isn't ready, try injecting it again
          if (chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
            readyTabs.delete(tabId); // Remove from ready list
            ensureContentScriptLoaded(tabId, () => {
              // Try again after ensuring content script is loaded
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, message);
              }, 200);
            });
          }
        } else {
          console.log("Message sent successfully to tab", tabId);
        }
      });
    });
  }
  
  // Function to check text with API
  function checkText(text, callback) {
    // Get API URL from storage or use default
    chrome.storage.sync.get({ apiUrl: "http://127.0.0.1:5000/predict" }, (data) => {
      fetch(data.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: text })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => callback(data))
      .catch(error => {
        console.error("API Error:", error);
        callback({ 
          error: "Failed to analyze text", 
          details: error.message,
          prediction: "error" 
        });
      });
    });
  }
  
  // Listen for install/update events to handle migrations
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // Set default settings for new installations
      chrome.storage.sync.set({
        enableAutoCheck: true,
        enableNotifications: true,
        apiUrl: "http://127.0.0.1:5000/predict"
      });
    }
  });
  
  // Update content script if navigation happens within same tab
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      // Tab has completed loading, content script needs to be reinjected
      readyTabs.delete(tabId);
    }
  });
  
  // Handle extension icon clicks
  chrome.action.onClicked.addListener((tab) => {
    // Open the popup
    chrome.action.openPopup();
  });