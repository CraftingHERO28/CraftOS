document.addEventListener('DOMContentLoaded', function() {
  var maximizeState = new WeakMap();
  var nextWindowZIndex = 101;
  var windows = document.querySelectorAll('.window');

  // lockscreen stuff
  var logoutBtn = document.getElementById('logout');
  var lockscreen = document.getElementById('lockscreen');
  var unlockBtn = document.getElementById('unlock-btn');

  if(logoutBtn && lockscreen) {
    logoutBtn.addEventListener('click', function() {
      lockscreen.style.display = 'flex';
    });
  }

  if(unlockBtn && lockscreen) {
    unlockBtn.addEventListener('click', function() {
      lockscreen.style.display = 'none';
    });
  }

  windows.forEach(function(win) {
    makeWindowDraggable(win);
    win.addEventListener('pointerdown', function() {
      win.style.zIndex = String(nextWindowZIndex++);
    });
  });

  var taskbarApps = document.querySelectorAll('.taskbar-app');
  taskbarApps.forEach(function(button) {
    button.addEventListener('click', function() {
      var appWindow = document.getElementById(this.dataset.windowid);
      if (!appWindow) return;

      appWindow.style.display = 'flex';
      appWindow.style.zIndex = String(nextWindowZIndex++);

      if (this.dataset.windowid === 'Paint') {
        resizePaintCanvas();
      }
    });
  });

  var closeButtons = document.querySelectorAll('.closebutton');
  closeButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var windowId = this.dataset.windowid;
      if (windowId) {
        var window = document.getElementById(windowId);
        if (window) {
          window.style.display = 'none';
        }
      }
    });
  });
  
  var maximizeButtons = document.querySelectorAll('.maximizebutton');
  maximizeButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var appWindow = document.getElementById(this.dataset.windowid);
      if (!appWindow) return;

      if (appWindow.classList.contains('maximized')) {
        appWindow.classList.remove('maximized');
        var previousStyle = maximizeState.get(appWindow);
        if (previousStyle) {
          appWindow.style.left = previousStyle.left;
          appWindow.style.top = previousStyle.top;
          appWindow.style.width = previousStyle.width;
          appWindow.style.height = previousStyle.height;
          maximizeState.delete(appWindow);
        }
        this.setAttribute('aria-label', 'Maximize ' + appWindow.id);
        this.title = 'Maximize';
      } else {
        maximizeState.set(appWindow, {
          left: appWindow.style.left,
          top: appWindow.style.top,
          width: appWindow.style.width,
          height: appWindow.style.height
        });
        appWindow.style.left = '';
        appWindow.style.top = '';
        appWindow.style.width = '';
        appWindow.style.height = '';
        appWindow.classList.add('maximized');
        this.setAttribute('aria-label', 'Restore ' + appWindow.id);
        this.title = 'Restore';
      }

      if (appWindow.id === 'Paint') {
        setTimeout(resizePaintCanvas, 50);
      }
    });
  });

  // Notes App
  var notesTextarea = document.getElementById('notes-textarea');
  var notesStatus = document.getElementById('notes-status');

  if (notesTextarea) {
    var savedNotes = localStorage.getItem('craftnotes_content');
    if (savedNotes !== null) {
      notesTextarea.value = savedNotes;
    }

    notesTextarea.addEventListener('input', function() {
      localStorage.setItem('craftnotes_content', notesTextarea.value);
      if (notesStatus) {
        notesStatus.textContent = 'Saving...';
        setTimeout(function() {
          notesStatus.textContent = 'Saved';
        }, 500);
      }
    });
  }

  // Clock App
  var clockDisplay = document.getElementById('clock-display');
  var timezoneSelect = document.getElementById('timezone-select');

  function updateClock() {
    if (!clockDisplay) return;
    var selectedZone = timezoneSelect ? timezoneSelect.value : 'Europe/Berlin';
    var now = new Date();
    try {
      var timeString = now.toLocaleTimeString('en-US', { timeZone: selectedZone });
      clockDisplay.textContent = timeString;
    } catch (e) {
      clockDisplay.textContent = now.toLocaleTimeString('en-US');
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  // Timer
  var timerInterval = null;
  var remainingSeconds = 60;
  var timerDisplay = document.getElementById('timer-display');
  var timerMinInput = document.getElementById('timer-input-min');
  var timerSecInput = document.getElementById('timer-input-sec');
  var startBtn = document.getElementById('timer-start-btn');
  var stopBtn = document.getElementById('timer-stop-btn');
  var resetBtn = document.getElementById('timer-reset-btn');

  function updateTimerDisplay() {
    var mins = Math.floor(remainingSeconds / 60);
    var secs = remainingSeconds % 60;
    if (timerDisplay) {
      timerDisplay.textContent = (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs);
    }
  }

  function getInputsInSeconds() {
    var mins = parseInt(timerMinInput ? timerMinInput.value : 0, 10) || 0;
    var secs = parseInt(timerSecInput ? timerSecInput.value : 0, 10) || 0;
    return (mins * 60) + secs;
  }

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      if (timerInterval) return;
      if (remainingSeconds <= 0) {
        remainingSeconds = getInputsInSeconds();
      }
      if (remainingSeconds <= 0) return;

      updateTimerDisplay();
      timerInterval = setInterval(function() {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          alert('Timer finished!');
        }
      }, 1000);
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', function() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      remainingSeconds = getInputsInSeconds();
      updateTimerDisplay();
    });
  }

  if (timerMinInput) timerMinInput.addEventListener('change', function() { if (!timerInterval) { remainingSeconds = getInputsInSeconds(); updateTimerDisplay(); } });
  if (timerSecInput) timerSecInput.addEventListener('change', function() { if (!timerInterval) { remainingSeconds = getInputsInSeconds(); updateTimerDisplay(); } });

  remainingSeconds = getInputsInSeconds();
  updateTimerDisplay();

  // Stopwatch
  var stopwatchInterval = null;
  var stopwatchTenths = 0;
  var stopwatchDisplay = document.getElementById('stopwatch-display');
  var swStartBtn = document.getElementById('stopwatch-start-btn');
  var swStopBtn = document.getElementById('stopwatch-stop-btn');
  var swResetBtn = document.getElementById('stopwatch-reset-btn');

  function updateStopwatchDisplay() {
    var mins = Math.floor(stopwatchTenths / 600);
    var secs = Math.floor((stopwatchTenths % 600) / 10);
    var tenths = stopwatchTenths % 10;
    if (stopwatchDisplay) {
      stopwatchDisplay.textContent = (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) + '.' + tenths;
    }
  }

  if (swStartBtn) {
    swStartBtn.addEventListener('click', function() {
      if (stopwatchInterval) return;
      stopwatchInterval = setInterval(function() {
        stopwatchTenths++;
        updateStopwatchDisplay();
      }, 100);
    });
  }

  if (swStopBtn) {
    swStopBtn.addEventListener('click', function() {
      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
      }
    });
  }

  if (swResetBtn) {
    swResetBtn.addEventListener('click', function() {
      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
      }
      stopwatchTenths = 0;
      updateStopwatchDisplay();
    });
  }

  // Paint App
  var paintCanvas = document.getElementById('paint-canvas');
  var paintColor = document.getElementById('paint-color');
  var paintSize = document.getElementById('paint-size');
  var paintClearBtn = document.getElementById('paint-clear-btn');
  var isPainting = false;
  var ctx = paintCanvas ? paintCanvas.getContext('2d') : null;

  function resizePaintCanvas() {
    if (!paintCanvas) return;
    var parent = paintCanvas.parentElement;
    if (parent) {
      var tempImg = ctx ? ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height) : null;
      paintCanvas.width = parent.clientWidth;
      paintCanvas.height = parent.clientHeight;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
        if (tempImg) ctx.putImageData(tempImg, 0, 0);
      }
    }
  }

  if (paintCanvas && ctx) {
    function startDrawing(e) {
      isPainting = true;
      draw(e);
    }

    function stopDrawing() {
      isPainting = false;
      ctx.beginPath();
    }

    function draw(e) {
      if (!isPainting) return;
      var rect = paintCanvas.getBoundingClientRect();
      var x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      var y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      ctx.lineWidth = paintSize.value;
      ctx.lineCap = 'round';
      ctx.strokeStyle = paintColor.value;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    paintCanvas.addEventListener('pointerdown', startDrawing);
    paintCanvas.addEventListener('pointermove', draw);
    window.addEventListener('pointerup', stopDrawing);

    if (paintClearBtn) {
      paintClearBtn.addEventListener('click', function() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
      });
    }
  }

  // Racer App
  var racerCanvas = document.getElementById('racer-canvas');
  var racerCtx = racerCanvas ? racerCanvas.getContext('2d') : null;
  var racerScoreEl = document.getElementById('racer-score');
  var racerOverlay = document.getElementById('racer-overlay');
  var racerStartBtn = document.getElementById('racer-start-btn');
  var racerCarColor = document.getElementById('racer-car-color');
  var racerDifficulty = document.getElementById('racer-difficulty');

  var racerRunning = false;
  var carX = 200;
  var roadOffset = 0;
  var score = 0;
  var obstacles = [];
  var keys = {};
  var gameInterval = null;

  window.addEventListener('keydown', function(e) {
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].indexOf(e.code) !== -1) {
      keys[e.code] = true;
    }
  });

  window.addEventListener('keyup', function(e) {
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].indexOf(e.code) !== -1) {
      keys[e.code] = false;
    }
  });

  if (racerStartBtn) {
    racerStartBtn.addEventListener('click', function() {
      startRacerGame();
    });
  }

  function startRacerGame() {
    racerRunning = true;
    carX = 200;
    roadOffset = 0;
    score = 0;
    obstacles = [];
    if (racerOverlay) racerOverlay.style.display = 'none';
    if (gameInterval) clearInterval(gameInterval);

    var diff = racerDifficulty ? racerDifficulty.value : 'medium';
    var spawnRate = 0.03;
    var obsSpeed = 6;

    if (diff === 'easy') {
      spawnRate = 0.015;
      obsSpeed = 4;
    } else if (diff === 'hard') {
      spawnRate = 0.06;
      obsSpeed = 8;
    }

    gameInterval = setInterval(function() {
      if (!racerRunning) return;

      if (keys['ArrowLeft'] || keys['KeyA']) carX -= 5;
      if (keys['ArrowRight'] || keys['KeyD']) carX += 5;

      carX = Math.max(100, Math.min(350, carX));
      roadOffset = (roadOffset + 8) % 40;
      score++;
      if (racerScoreEl) racerScoreEl.textContent = score;

      if (Math.random() < spawnRate) {
        var obsX = 100 + Math.random() * 250;
        obstacles.push({ x: obsX, y: -40, width: 40, height: 30 });
      }

      obstacles.forEach(function(obs) {
        obs.y += obsSpeed;
      });

      obstacles = obstacles.filter(function(obs) { return obs.y < 340; });

      obstacles.forEach(function(obs) {
        if (carX < obs.x + obs.width && carX + 30 > obs.x && 240 < obs.y + obs.height && 270 > obs.y) {
          racerRunning = false;
          if (racerOverlay) {
            racerOverlay.style.display = 'flex';
            racerOverlay.querySelector('h2').textContent = 'Game Over!';
            racerStartBtn.textContent = 'Play Again';
          }
          clearInterval(gameInterval);
        }
      });

      drawRacer();
    }, 1000 / 60);
  }

  function drawRacer() {
    if (!racerCtx) return;

    racerCtx.fillStyle = '#228B22';
    racerCtx.fillRect(0, 0, 450, 300);

    racerCtx.fillStyle = '#444';
    racerCtx.fillRect(80, 0, 290, 300);

    racerCtx.strokeStyle = '#fff';
    racerCtx.lineWidth = 4;
    racerCtx.beginPath();
    racerCtx.moveTo(80, 0);
    racerCtx.lineTo(80, 300);
    racerCtx.moveTo(370, 0);
    racerCtx.lineTo(370, 300);
    racerCtx.stroke();

    racerCtx.strokeStyle = '#ffcc00';
    racerCtx.lineWidth = 3;
    racerCtx.setLineDash([20, 20]);
    racerCtx.lineDashOffset = -roadOffset;
    racerCtx.beginPath();
    racerCtx.moveTo(225, 0);
    racerCtx.lineTo(225, 300);
    racerCtx.stroke();
    racerCtx.setLineDash([]);

    racerCtx.fillStyle = racerCarColor ? racerCarColor.value : '#ff3333';
    racerCtx.fillRect(carX, 240, 30, 50);
    racerCtx.fillStyle = '#fff';
    racerCtx.fillRect(carX + 5, 250, 20, 15);

    obstacles.forEach(function(obs) {
      racerCtx.fillStyle = '#3333ff';
      racerCtx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
  }
});

function makeWindowDraggable(win) {
  var header = win.querySelector('.window-header');
  if (!header) return;

  header.addEventListener('pointerdown', function(event) {
    if (event.button !== 0 || event.target.closest('.window-controls')) return;

    event.preventDefault();
    header.setPointerCapture(event.pointerId);

    var startX = event.clientX;
    var startY = event.clientY;
    var startLeft = win.offsetLeft;
    var startTop = win.offsetTop;

    function moveWindow(moveEvent) {
      if (moveEvent.pointerId !== event.pointerId) return;

      var topbar = document.querySelector('.topbar');
      var minimumTop = topbar ? topbar.getBoundingClientRect().bottom + window.scrollY : 0;
      win.style.left = Math.max(0, startLeft + moveEvent.clientX - startX) + 'px';
      win.style.top = Math.max(minimumTop, startTop + moveEvent.clientY - startY) + 'px';
    }

    function stopDragging(stopEvent) {
      if (stopEvent.pointerId !== event.pointerId) return;
      header.removeEventListener('pointermove', moveWindow);
      header.removeEventListener('pointerup', stopDragging);
      header.removeEventListener('pointercancel', stopDragging);
    }

    header.addEventListener('pointermove', moveWindow);
    header.addEventListener('pointerup', stopDragging);
    header.addEventListener('pointercancel', stopDragging);
  });
}

// Calculator Logic
var calculatorDisplay = '0';

function updateCalculatorDisplay() {
  var display = document.getElementById('calculator-display');
  if (display) {
    display.textContent = calculatorDisplay || '0';
  }
}

function calculatorAppend(value) {
  if (calculatorDisplay === '0' && value !== '.') {
    calculatorDisplay = value;
  } else if (value === '.' && calculatorDisplay.indexOf('.') !== -1) {
    return;
  } else {
    calculatorDisplay += value;
  }
  updateCalculatorDisplay();
}

function calculatorClear() {
  calculatorDisplay = '0';
  updateCalculatorDisplay();
}

function calculatorBackspace() {
  if (calculatorDisplay.length > 1) {
    calculatorDisplay = calculatorDisplay.slice(0, -1);
  } else {
    calculatorDisplay = '0';
  }
  updateCalculatorDisplay();
}

function calculatorEquals() {
  try {
    var result = eval(calculatorDisplay.replace('÷', '/').replace('*', '*').replace('−', '-'));
    calculatorDisplay = String(result);
    updateCalculatorDisplay();
  } catch (error) {
    calculatorDisplay = 'error';
    updateCalculatorDisplay();
    setTimeout(function() {
      calculatorDisplay = '0';
      updateCalculatorDisplay();
    }, 1500);
  }
}