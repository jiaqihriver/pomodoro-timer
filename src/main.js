const { invoke } = window.__TAURI__;

let timer = null;
let timeLeft = 25 * 60; // 25 分钟，以秒为单位
let totalTime = 25 * 60;
let isRunning = false;
let currentMode = 'work';
let currentSession = 0;

let settings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationEnabled: true
};

const modeDurations = {
  work: 25,
  shortBreak: 5,
  longBreak: 15
};

async function init() {
  await loadSettings();
  updateTimerDisplay();
  updateProgressRing();
  updateStats();
  setupEventListeners();
  setupSettingsPanel();
}

async function loadSettings() {
  try {
    const data = await invoke('load_data');
    if (data && data.settings) {
      settings = {
        workDuration: data.settings.work_duration,
        shortBreak: data.settings.short_break,
        longBreak: data.settings.long_break,
        sessionsBeforeLongBreak: data.settings.sessions_before_long_break,
        autoStartBreaks: data.settings.auto_start_breaks,
        autoStartWork: data.settings.auto_start_work,
        soundEnabled: data.settings.sound_enabled,
        notificationEnabled: data.settings.notification_enabled
      };

      modeDurations.work = settings.workDuration;
      modeDurations.shortBreak = settings.shortBreak;
      modeDurations.longBreak = settings.longBreak;

      timeLeft = modeDurations[currentMode] * 60;
      totalTime = timeLeft;

      document.getElementById('workDuration').value = settings.workDuration;
      document.getElementById('shortBreak').value = settings.shortBreak;
      document.getElementById('longBreak').value = settings.longBreak;
      document.getElementById('sessionsBeforeLongBreak').value = settings.sessionsBeforeLongBreak;
      document.getElementById('autoStartBreaks').checked = settings.autoStartBreaks;
      document.getElementById('autoStartWork').checked = settings.autoStartWork;
      document.getElementById('soundEnabled').checked = settings.soundEnabled;
      document.getElementById('notificationEnabled').checked = settings.notificationEnabled;
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('timerDisplay').textContent = display;
  
  const modeLabels = {
    work: '🍅 专注工作',
    shortBreak: '☕ 短休息',
    longBreak: '🌴 长休息'
  };
  document.title = `${display} - ${modeLabels[currentMode]} - 番茄钟`;
}

function updateProgressRing() {
  const ring = document.getElementById('progressRing');
  const circumference = 2 * Math.PI * 90;
  const progress = (totalTime - timeLeft) / totalTime;
  const offset = circumference * (1 - progress);
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${offset}`;
}

function updateSessionIndicator() {
  const indicator = document.getElementById('sessionIndicator');
  indicator.innerHTML = '';
  
  for (let i = 0; i < settings.sessionsBeforeLongBreak; i++) {
    const dot = document.createElement('span');
    dot.className = `session-dot ${i < currentSession ? 'filled' : ''}`;
    indicator.appendChild(dot);
  }
}

async function startTimer() {
  if (isRunning) {
    pauseTimer();
    return;
  }

  isRunning = true;
  const startBtn = document.getElementById('startBtn');
  startBtn.innerHTML = '<span class="btn-icon">⏸</span>暂停';
  
  timer = setInterval(async () => {
    timeLeft--;
    updateTimerDisplay();
    updateProgressRing();
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      await completeSession();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timer);
  const startBtn = document.getElementById('startBtn');
  startBtn.innerHTML = '<span class="btn-icon">▶</span>继续';
}

async function resetTimer() {
  isRunning = false;
  clearInterval(timer);
  
  if (currentMode === 'work') {
    timeLeft = settings.workDuration * 60;
  } else if (currentMode === 'shortBreak') {
    timeLeft = settings.shortBreak * 60;
  } else {
    timeLeft = settings.longBreak * 60;
  }
  
  totalTime = timeLeft;
  
  const startBtn = document.getElementById('startBtn');
  startBtn.innerHTML = '<span class="btn-icon">▶</span>开始';
  
  updateTimerDisplay();
  updateProgressRing();
}

async function skipSession() {
  isRunning = false;
  clearInterval(timer);
  await completeSession();
}

async function completeSession() {
  const duration = totalTime / 60;
  
  if (currentMode === 'work') {
    currentSession++;
    await invoke('record_session', { sessionType: 'work', duration: duration });
    
    if (settings.notificationEnabled) {
      showNotification('🎉 专注完成', '干得漂亮！休息一下吧~');
    }
    
    if (settings.soundEnabled) {
      playSound();
    }
    
    if (currentSession >= settings.sessionsBeforeLongBreak) {
      switchMode('longBreak');
      currentSession = 0;
    } else {
      switchMode('shortBreak');
    }
    
    if (settings.autoStartBreaks) {
      setTimeout(() => startTimer(), 1000);
    }
  } else {
    await invoke('record_session', { sessionType: currentMode, duration: duration });
    
    if (settings.notificationEnabled) {
      showNotification('💪 休息结束', '开始新的专注吧！');
    }
    
    if (settings.soundEnabled) {
      playSound();
    }
    
    switchMode('work');
    
    if (settings.autoStartWork && currentMode === 'work') {
      setTimeout(() => startTimer(), 1000);
    }
  }
  
  updateStats();
  updateSessionIndicator();
}

function switchMode(mode) {
  currentMode = mode;
  
  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach(tab => {
    if (tab.dataset.mode === mode) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  resetTimer();
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: body, icon: '/assets/icon.png' });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body: body, icon: '/assets/icon.png' });
      }
    });
  }
}

function playSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 1);
}

async function updateStats() {
  try {
    const data = await invoke('get_statistics');
    document.getElementById('todaySessions').textContent = data.sessions_today;
    document.getElementById('totalSessions').textContent = data.total_sessions;
    
    const totalHours = Math.floor(data.total_work_time / 60);
    document.getElementById('totalTime').textContent = `${totalHours}h`;
  } catch (error) {
    console.error('更新统计失败:', error);
  }
}

function setupEventListeners() {
  document.getElementById('startBtn').addEventListener('click', () => startTimer());
  document.getElementById('resetBtn').addEventListener('click', () => resetTimer());
  document.getElementById('skipBtn').addEventListener('click', () => skipSession());
  
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (!isRunning) {
        switchMode(tab.dataset.mode);
      }
    });
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsOverlay').classList.add('active');
  });
  
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsOverlay').classList.remove('active');
  });
  
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettingsToDefault);
  
  document.getElementById('settingsOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settingsOverlay')) {
      document.getElementById('settingsOverlay').classList.remove('active');
    }
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.body.setAttribute('data-theme', btn.dataset.theme);
    });
  });
}

function setupSettingsPanel() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    if (btn.classList.contains('active')) {
      document.body.setAttribute('data-theme', btn.dataset.theme);
    }
  });
}

async function saveSettings() {
  settings.workDuration = parseInt(document.getElementById('workDuration').value);
  settings.shortBreak = parseInt(document.getElementById('shortBreak').value);
  settings.longBreak = parseInt(document.getElementById('longBreak').value);
  settings.sessionsBeforeLongBreak = parseInt(document.getElementById('sessionsBeforeLongBreak').value);
  settings.autoStartBreaks = document.getElementById('autoStartBreaks').checked;
  settings.autoStartWork = document.getElementById('autoStartWork').checked;
  settings.soundEnabled = document.getElementById('soundEnabled').checked;
  settings.notificationEnabled = document.getElementById('notificationEnabled').checked;

  modeDurations.work = settings.workDuration;
  modeDurations.shortBreak = settings.shortBreak;
  modeDurations.longBreak = settings.longBreak;

  const tauriSettings = {
    work_duration: settings.workDuration,
    short_break: settings.shortBreak,
    long_break: settings.longBreak,
    sessions_before_long_break: settings.sessionsBeforeLongBreak,
    auto_start_breaks: settings.autoStartBreaks,
    auto_start_work: settings.autoStartWork,
    sound_enabled: settings.soundEnabled,
    notification_enabled: settings.notificationEnabled
  };

  try {
    await invoke('save_settings', { settings: tauriSettings });
    alert('设置已保存！');
    document.getElementById('settingsOverlay').classList.remove('active');
    resetTimer();
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存设置失败，请重试。');
  }
}

async function resetSettingsToDefault() {
  if (confirm('确定要恢复默认设置吗？')) {
    document.getElementById('workDuration').value = 25;
    document.getElementById('shortBreak').value = 5;
    document.getElementById('longBreak').value = 15;
    document.getElementById('sessionsBeforeLongBreak').value = 4;
    document.getElementById('autoStartBreaks').checked = false;
    document.getElementById('autoStartWork').checked = false;
    document.getElementById('soundEnabled').checked = true;
    document.getElementById('notificationEnabled').checked = true;
    
    await saveSettings();
  }
}

document.addEventListener('DOMContentLoaded', init);
