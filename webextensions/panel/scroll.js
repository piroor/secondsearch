/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

function scrollTo(aParams = {}) {
  log('scrollTo ', aParams);
  if (!aParams.justNow)
    return smoothScrollTo(aParams);

  if (aParams.engine)
    gActiveEngines.scrollTop += calculateScrollDeltaForItem(aParams.engine);
  else if (typeof aParams.position == 'number')
    gActiveEngines.scrollTop = aParams.position;
  else if (typeof aParams.delta == 'number')
    gActiveEngines.scrollTop += aParams.delta;
  else
    throw new Error('No parameter to indicate scroll position');
}

function cancelRunningScroll() {
  scrollToItem.stopped = true;
  stopSmoothScroll();
}

function calculateScrollDeltaForItem(aItem) {
  var itemRect      = aItem.getBoundingClientRect();
  var containerRect = gActiveEngines.getBoundingClientRect();
  var offset        = smoothScrollTo.currentOffset;
  var delta         = 0;
  if (containerRect.bottom < itemRect.bottom + offset) { // should scroll down
    delta = itemRect.bottom - containerRect.bottom + offset;
    delta += 10; // should show a half of next item
  }
  else if (containerRect.top > itemRect.top + offset) { // should scroll up
    delta = itemRect.top - containerRect.top + offset;
    delta -= 10; // should show a half of next item
  }
  return delta;
}

function isItemInViewport(aItem) {
  return calculateScrollDeltaForItem(aItem) == 0;
}

async function smoothScrollTo(aParams = {}) {
  log('smoothScrollTo ', aParams);

  smoothScrollTo.stopped = false;

  var startPosition = gActiveEngines.scrollTop;
  var delta, endPosition;
  if (aParams.tab) {
    delta       = calculateScrollDeltaForItem(aParams.tab);
    endPosition = startPosition + delta;
  }
  else if (typeof aParams.position == 'number') {
    endPosition = aParams.position;
    delta       = endPosition - startPosition;
  }
  else if (typeof aParams.delta == 'number') {
    endPosition = startPosition + aParams.delta;
    delta       = aParams.delta;
  }
  else {
    throw new Error('No parameter to indicate scroll position');
  }
  smoothScrollTo.currentOffset = delta;

  var duration  = aParams.duration || configs.smoothScrollDuration;
  var startTime = Date.now();

  return new Promise((aResolve, aReject) => {
    var radian = 90 * Math.PI / 180;
    var scrollStep = () => {
      if (smoothScrollTo.stopped) {
        smoothScrollTo.currentOffset = 0;
        aReject();
        return;
      }
      var nowTime = Date.now();
      var spentTime = nowTime - startTime;
      if (spentTime >= duration) {
        scrollTo({
          position: endPosition,
          justNow: true
        });
        smoothScrollTo.stopped       = true;
        smoothScrollTo.currentOffset = 0;
        aResolve();
        return;
      }
      var power        = Math.sin(spentTime / duration * radian);
      var currentDelta = parseInt(delta * power);
      var newPosition  = startPosition + currentDelta;
      scrollTo({
        position: newPosition,
        justNow:  true
      });
      smoothScrollTo.currentOffset = currentDelta;
      nextFrame().then(scrollStep);
    };
    nextFrame().then(scrollStep);
  });
}
smoothScrollTo.currentOffset= 0;

function stopSmoothScroll() {
  smoothScrollTo.stopped = true;
}

function isSmoothScrolling() {
  return !smoothScrollTo.stopped;
}

async function scrollToItem(aItem, aOptions = {}) {
  cancelRunningScroll();

  scrollToItem.stopped = false;
  await nextFrame();
  if (scrollToItem.stopped)
    return;

  if (isItemInViewport(aItem)) {
    log('=> already visible');
    return;
  }

  // wait for one more frame, to start collapse/expand animation
  await nextFrame();
  if (scrollToItem.stopped)
    return;

  scrollTo(Object.assign(aOptions, {
    position: gActiveEngines.scrollTop + calculateScrollDeltaForItem(aItem)
  }));
}

