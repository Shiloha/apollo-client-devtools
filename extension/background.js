let connections = {};
let apolloConnected = false;
let backgroundPageConnection = undefined;
let requestLog = {};

chrome.runtime.onConnect.addListener((port) => {
  tabId = port.name
  connections[tabId] = [port, {}];

  port.onDisconnect.addListener(port => {

    const tabs = Object.keys(connections);
    for (let i = 0; i < tabs.length; i++) {
      if (connections[tabs[i]] == port) {
        delete connections[tabs[i]];
        break;
      }
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.tabId || request.panelTab) {
    const panelTab = Object.values(request)[1];
    console.log(panelTab);
    port = connections[request.tabId];
    port[1][panelTab] = true; // don't think I need this
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(request.tabId, {action: panelTab});
    });
    console.log('sent onMount message to hook???');
  }

  if (!apolloConnected && request.APOLLO_CONNECTED) {
    chrome.pageAction.show(sender.tab.id);
    apolloConnected = true;
  }

  if (request.queriesDidMount) {
    console.log(request);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage({action: "queriesData"}, function() {
        console.log('send queries mount to hook');
      });
    });
  }

  if (request.trimmedObj) {
    if (connections[sender.tab.id]) {
      connections[sender.tab.id][0].postMessage(request.trimmedObj);
    }
    else {
      let connectionsPoll = setInterval(function() {
        if (connections[sender.tab.id]) {
          connections[sender.tab.id][0].postMessage(request.trimmedObj);
          clearInterval(connectionsPoll);
        }
      }, 500);
    }
  }
});
