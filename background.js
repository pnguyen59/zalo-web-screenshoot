// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// To make sure we can uniquely identify each screenshot tab, add an id as a
// query param to the url that displays the screenshot.
// Note: It's OK that this is a global variable (and not in localStorage),
// because the event page will stay open as long as any screenshot tabs are
// open.
var id = 100;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting == "hello"){
      sendResponse({farewell: "goodbye"});
      chrome.desktopCapture.chooseDesktopMedia(["screen","window"], startStream);
    }
});

chrome.browserAction.onClicked.addListener(function() {
  //startStream();
  chrome.desktopCapture.chooseDesktopMedia(["screen","window"], startStream);
});

function startStream(id)
{
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var localMediaStream = null;
  var url;

  function snapshot() {
    if (localMediaStream) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      url = canvas.toDataURL('image/webp');
      localMediaStream.getTracks()[0].stop();
      showResult(url);
    }
  }
  navigator.webkitGetUserMedia({video: {
    mandatory:{
      chromeMediaSource: "desktop",
      chromeMediaSourceId: id,
      maxWidth: window.screen.width,
      maxHeight: window.screen.height
    }
  }}, function(stream) {
   // console.dir(stream);
    video.src = URL.createObjectURL(stream);
    localMediaStream = stream;
    video.onloadedmetadata = function () {
    // Delay capture.
    setTimeout(function() { snapshot(); }, 30);
    };
    video.play();
    console.log(chrome.windows.getAll(function(w){console.log(w);}));
  }, function(){
    console.log("dont care");
  });
}

function showResult(screenshotUrl){
    var viewTabUrl = chrome.extension.getURL('edit.html?id=' + id++)
    var targetId = null;

    chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
      // We are waiting for the tab we opened to finish loading.
      // Check that the tab's id matches the tab we opened,
      // and that the tab is done loading.
      if (tabId != targetId || changedProps.status != "complete")
        return;

      // Passing the above test means this is the event we were waiting for.
      // There is nothing we need to do for future onUpdated events, so we
      // use removeListner to stop getting called when onUpdated events fire.
      chrome.tabs.onUpdated.removeListener(listener);

      // Look through all views to find the window which will display
      // the screenshot.  The url of the tab which will display the
      // screenshot includes a query parameter with a unique id, which
      // ensures that exactly one view will have the matching URL.
      var views = chrome.extension.getViews();
      for (var i = 0; i < views.length; i++) {
        var view = views[i];
        if (view.location.href == viewTabUrl) {
          view.setScreenshotUrl(screenshotUrl);
          break;
        }
      }
    });

    chrome.tabs.create({url: viewTabUrl}, function(tab) {
      targetId = tab.id;
      chrome.windows.create({tabId: targetId,
        state: 'fullscreen'})
    });

    
}