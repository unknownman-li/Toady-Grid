const STORAGE_KEY = "daily-checkin-board-v1";
const AUDIO_STATE_KEY = "todaygrid-audio-state";

const state = {
  selectedDate: getToday(),
  tasksByDate: loadTasks(),
  editingTaskId: null,
  filter: "all",
};

const elements = {
  datePicker: document.querySelector("#datePicker"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  prevDayBtn: document.querySelector("#prevDayBtn"),
  nextDayBtn: document.querySelector("#nextDayBtn"),
  taskForm: document.querySelector("#taskForm"),
  titleInput: document.querySelector("#titleInput"),
  noteInput: document.querySelector("#noteInput"),
  priorityInput: document.querySelector("#priorityInput"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  formMessage: document.querySelector("#formMessage"),
  taskList: document.querySelector("#taskList"),
  emptyState: document.querySelector("#emptyState"),
  clearCompletedBtn: document.querySelector("#clearCompletedBtn"),
  totalCount: document.querySelector("#totalCount"),
  completedCount: document.querySelector("#completedCount"),
  pendingCount: document.querySelector("#pendingCount"),
  completionRate: document.querySelector("#completionRate"),
  progressBar: document.querySelector("#progressBar"),
  summaryPill: document.querySelector("#summaryPill"),
  summaryText: document.querySelector("#summaryText"),
  focusTaskTitle: document.querySelector("#focusTaskTitle"),
  focusTaskHint: document.querySelector("#focusTaskHint"),
  filterGroup: document.querySelector("#filterGroup"),
  audioToggleBtn: document.querySelector("#audioToggleBtn"),
  audioVolume: document.querySelector("#audioVolume"),
  audioStatus: document.querySelector("#audioStatus"),
  rainScene: document.querySelector("#rainScene"),
  taskItemTemplate: document.querySelector("#taskItemTemplate"),
};

class RainScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.streaks = [];
    this.glassDrops = [];
    this.lights = [];
    this.time = 0;
    this.resize();
    this.seed();
  }

  seed() {
    const streakCount = Math.max(180, Math.floor(window.innerWidth / 7));
    const glassCount = Math.max(42, Math.floor(window.innerWidth / 28));
    const lightCount = 9;

    this.streaks = Array.from({ length: streakCount }, () => this.createStreak(true));
    this.glassDrops = Array.from({ length: glassCount }, () => this.createGlassDrop(true));
    this.lights = Array.from({ length: lightCount }, (_, index) => ({
      x: (index + 1) / (lightCount + 1),
      y: 0.2 + Math.random() * 0.56,
      radius: 80 + Math.random() * 160,
      color: [
        [108, 199, 255],
        [204, 160, 255],
        [255, 176, 124],
        [122, 255, 215],
      ][index % 4],
      alpha: 0.1 + Math.random() * 0.08,
    }));
  }

  createStreak(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -40,
      length: 18 + Math.random() * 54,
      speed: 280 + Math.random() * 420,
      drift: -35 + Math.random() * 70,
      alpha: 0.12 + Math.random() * 0.26,
      width: 1 + Math.random() * 2.4,
    };
  }

  createGlassDrop(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -40,
      radius: 8 + Math.random() * 22,
      speed: 16 + Math.random() * 40,
      wobble: Math.random() * Math.PI * 2,
      trail: 30 + Math.random() * 96,
      alpha: 0.14 + Math.random() * 0.16,
    };
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      this.time += dt;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    this.streaks.forEach((drop) => {
      drop.y += drop.speed * dt;
      drop.x += drop.drift * dt;
      if (drop.y - drop.length > this.height || drop.x < -60 || drop.x > this.width + 60) {
        Object.assign(drop, this.createStreak());
      }
    });

    this.glassDrops.forEach((drop) => {
      drop.y += drop.speed * dt;
      drop.x += Math.sin(this.time * 0.8 + drop.wobble) * 9 * dt;
      if (drop.y - drop.radius > this.height + drop.trail) {
        Object.assign(drop, this.createGlassDrop());
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#162438");
    sky.addColorStop(0.38, "#0a1220");
    sky.addColorStop(1, "#04070d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawBokeh();
    this.drawFarRain();
    this.drawMist();
    this.drawGlassDrops();
  }

  drawBokeh() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    this.lights.forEach((light) => {
      const x = light.x * this.width + Math.sin(this.time * 0.16 + light.y * 10) * 12;
      const y = light.y * this.height;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, light.radius);
      gradient.addColorStop(0, `rgba(${light.color[0]}, ${light.color[1]}, ${light.color[2]}, ${light.alpha})`);
      gradient.addColorStop(1, `rgba(${light.color[0]}, ${light.color[1]}, ${light.color[2]}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, light.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawFarRain() {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = "round";
    this.streaks.forEach((drop) => {
      const gradient = ctx.createLinearGradient(drop.x, drop.y, drop.x + drop.drift * 0.08, drop.y + drop.length);
      gradient.addColorStop(0, "rgba(220, 235, 255, 0)");
      gradient.addColorStop(1, `rgba(220, 235, 255, ${drop.alpha})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = drop.width;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.drift * 0.08, drop.y + drop.length);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawMist() {
    const ctx = this.ctx;
    ctx.save();
    const mist = ctx.createLinearGradient(0, this.height * 0.08, 0, this.height);
    mist.addColorStop(0, "rgba(120, 152, 186, 0.02)");
    mist.addColorStop(0.45, "rgba(120, 152, 186, 0.08)");
    mist.addColorStop(1, "rgba(130, 148, 188, 0.16)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  drawGlassDrops() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    this.glassDrops.forEach((drop) => {
      const trailGradient = ctx.createLinearGradient(drop.x, drop.y - drop.trail, drop.x, drop.y + drop.radius);
      trailGradient.addColorStop(0, "rgba(190, 220, 255, 0)");
      trailGradient.addColorStop(1, `rgba(220, 238, 255, ${drop.alpha * 0.92})`);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = Math.max(1.8, drop.radius * 0.2);
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y - drop.trail);
      ctx.lineTo(drop.x + Math.sin(this.time + drop.wobble) * 4, drop.y);
      ctx.stroke();

      const gradient = ctx.createRadialGradient(drop.x - drop.radius * 0.24, drop.y - drop.radius * 0.32, drop.radius * 0.1, drop.x, drop.y, drop.radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha + 0.18})`);
      gradient.addColorStop(0.42, `rgba(164, 210, 255, ${drop.alpha + 0.08})`);
      gradient.addColorStop(1, "rgba(164, 210, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(drop.x, drop.y, drop.radius * 0.74, drop.radius, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

class AmbientAudio {
  constructor({ toggleButton, volumeSlider, statusNode }) {
    this.toggleButton = toggleButton;
    this.volumeSlider = volumeSlider;
    this.statusNode = statusNode;
    this.ctx = null;
    this.masterGain = null;
    this.rainGain = null;
    this.padGain = null;
    this.pulseGain = null;
    this.noiseNode = null;
    this.chordTimer = null;
    this.pulseTimer = null;
    this.active = false;
    this.volume = 0.4;
  }

  restore() {
    try {
      const raw = localStorage.getItem(AUDIO_STATE_KEY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw);
      if (typeof saved.volume === "number") {
        this.volume = saved.volume;
        this.volumeSlider.value = String(Math.round(this.volume * 100));
      }
    } catch (error) {
      console.error("Failed to restore audio state:", error);
    }
  }

  async toggle() {
    try {
      if (!this.ctx) {
        this.createGraph();
      }

      if (!this.ctx) {
        return;
      }

      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }

      this.active = !this.active;
      this.masterGain.gain.setTargetAtTime(this.active ? this.volume : 0, this.ctx.currentTime, 0.4);
      this.toggleButton.textContent = this.active ? "关闭氛围音" : "开启氛围音";
      this.statusNode.textContent = this.active
        ? "雨声、低频环境铺底和柔和和声已开启。建议配合 20%-45% 音量。"
        : "当前已静音。点击后会播放雨声、低频环境铺底和柔和和声。";

      this.persist();
    } catch (error) {
      console.error("Audio toggle failed:", error);
      this.statusNode.textContent = "当前浏览器拦截了音频初始化，请刷新后再点一次开启氛围音。";
    }
  }

  setVolume(value) {
    this.volume = clamp(value, 0, 1);
    if (this.ctx && this.masterGain && this.active) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.2);
    }
    this.persist();
  }

  createGraph() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      this.statusNode.textContent = "当前浏览器不支持 Web Audio API。";
      this.toggleButton.disabled = true;
      return;
    }

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.26;
    this.rainGain.connect(this.masterGain);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.16;
    this.padGain.connect(this.masterGain);

    this.pulseGain = this.ctx.createGain();
    this.pulseGain.gain.value = 0.08;
    this.pulseGain.connect(this.masterGain);

    this.createRainNoise();
    this.startPadChords();
    this.startPulseNotes();
  }

  createRainNoise() {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < channel.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      channel[i] = last * 3.5;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2200;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;

    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    this.noiseNode.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(this.rainGain);

    this.noiseNode.start();
    lfo.start();
  }

  startPadChords() {
    const chords = [
      [220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66],
      [174.61, 220.0, 261.63],
      [164.81, 207.65, 246.94],
    ];

    let index = 0;
    const playChord = () => {
      const now = this.ctx.currentTime;
      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0.0001, now);
      chordGain.gain.linearRampToValueAtTime(1, now + 2.8);
      chordGain.gain.linearRampToValueAtTime(0.0001, now + 11);
      chordGain.connect(this.padGain);

      chords[index].forEach((frequency, voiceIndex) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1200 - voiceIndex * 140;
        osc.type = voiceIndex === 1 ? "triangle" : "sine";
        osc.frequency.value = frequency;
        osc.detune.value = (voiceIndex - 1) * 4;
        osc.connect(filter);
        filter.connect(chordGain);
        osc.start(now);
        osc.stop(now + 12);
      });

      index = (index + 1) % chords.length;
    };

    playChord();
    this.chordTimer = window.setInterval(playChord, 8000);
  }

  startPulseNotes() {
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99];
    let index = 0;

    const playPulse = () => {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      osc.type = "sine";
      osc.frequency.value = notes[index % notes.length];
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.55, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.pulseGain);
      osc.start(now);
      osc.stop(now + 2.6);
      index += Math.random() > 0.72 ? 2 : 1;
    };

    playPulse();
    this.pulseTimer = window.setInterval(playPulse, 4600);
  }

  persist() {
    localStorage.setItem(AUDIO_STATE_KEY, JSON.stringify({ volume: this.volume }));
  }
}

const rainScene = new RainScene(elements.rainScene);
const ambientAudio = new AmbientAudio({
  toggleButton: elements.audioToggleBtn,
  volumeSlider: elements.audioVolume,
  statusNode: elements.audioStatus,
});

init();

function init() {
  elements.datePicker.value = state.selectedDate;
  bindEvents();
  rainScene.start();
  ambientAudio.restore();
  render();
}

function bindEvents() {
  elements.prevDayBtn.addEventListener("click", () => shiftDate(-1));
  elements.nextDayBtn.addEventListener("click", () => shiftDate(1));
  elements.datePicker.addEventListener("change", handleDateChange);
  elements.taskForm.addEventListener("submit", handleTaskSubmit);
  elements.cancelEditBtn.addEventListener("click", resetForm);
  elements.clearCompletedBtn.addEventListener("click", clearCompletedTasks);
  elements.filterGroup.addEventListener("click", handleFilterClick);
  elements.audioToggleBtn.addEventListener("click", () => ambientAudio.toggle());
  elements.audioVolume.addEventListener("input", (event) => {
    ambientAudio.setVolume(Number(event.target.value) / 100);
  });
  window.addEventListener("resize", () => rainScene.resize());
}

function handleFilterClick(event) {
  const button = event.target.closest("[data-filter]");
  if (!button) {
    return;
  }

  state.filter = button.dataset.filter;
  render();
}

function handleDateChange(event) {
  state.selectedDate = event.target.value || getToday();
  resetForm();
  render();
}

function shiftDate(offset) {
  state.selectedDate = formatDate(addDays(new Date(`${state.selectedDate}T00:00:00`), offset));
  elements.datePicker.value = state.selectedDate;
  resetForm();
  render();
}

function handleTaskSubmit(event) {
  event.preventDefault();

  const title = elements.titleInput.value.trim();
  const note = elements.noteInput.value.trim();
  const priority = elements.priorityInput.value;

  if (!title) {
    setFormMessage("请输入任务名称");
    elements.titleInput.focus();
    return;
  }

  if (state.editingTaskId) {
    updateTask(state.editingTaskId, { title, note, priority });
    setFormMessage("任务已更新");
  } else {
    const task = {
      id: createTaskId(),
      title,
      note,
      priority,
      status: "pending",
      createdAt: new Date().toISOString(),
      completedAt: "",
    };

    getTasksForSelectedDate().unshift(task);
    state.filter = "all";
    setFormMessage("任务已新增");
  }

  persistTasks();
  resetForm();
  render();
}

function clearCompletedTasks() {
  const tasks = getTasksForSelectedDate();
  const hasCompleted = tasks.some((task) => task.status === "completed");

  if (!hasCompleted) {
    setFormMessage("当前日期没有已完成任务可清除");
    return;
  }

  const confirmed = window.confirm("确认清除当前日期下所有已完成任务吗？");
  if (!confirmed) {
    return;
  }

  state.tasksByDate[state.selectedDate] = tasks.filter((task) => task.status !== "completed");
  persistTasks();
  render();
  setFormMessage("已清除已完成任务");
}

function render() {
  const allTasks = sortTasks(getTasksForSelectedDate());
  const visibleTasks = filterTasks(allTasks, state.filter);

  elements.selectedDateLabel.textContent = formatDisplayDate(state.selectedDate);
  elements.datePicker.value = state.selectedDate;
  elements.taskList.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", visibleTasks.length > 0);
  elements.clearCompletedBtn.disabled = !allTasks.some((task) => task.status === "completed");

  syncFilterButtons();
  visibleTasks.forEach(renderTaskItem);
  renderStats(allTasks);
  renderSummary(allTasks);
  renderFocusTask(allTasks);
}

function renderStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.totalCount.textContent = String(total);
  elements.completedCount.textContent = String(completed);
  elements.pendingCount.textContent = String(pending);
  elements.completionRate.textContent = `${rate}%`;
  elements.progressBar.style.width = `${rate}%`;
}

function renderSummary(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = total - completed;

  if (total === 0) {
    elements.summaryPill.textContent = "刚开始";
    elements.summaryText.textContent = "今天还没有任务，先添加一项开始吧。";
    return;
  }

  if (pending === 0) {
    elements.summaryPill.textContent = "已清空";
    elements.summaryText.textContent = `今晚一共完成了 ${completed} 项任务，节奏很完整。`;
    return;
  }

  if (completed === 0) {
    elements.summaryPill.textContent = "待启动";
    elements.summaryText.textContent = `今天有 ${pending} 项任务待完成，先拿下一项最重要的。`;
    return;
  }

  elements.summaryPill.textContent = "推进中";
  elements.summaryText.textContent = `已完成 ${completed} 项，还剩 ${pending} 项，继续保持这个雨夜里的专注感。`;
}

function renderFocusTask(tasks) {
  const pendingTasks = tasks.filter((task) => task.status !== "completed");
  const focusTask = pendingTasks[0];

  if (!focusTask) {
    elements.focusTaskTitle.textContent = "今天的任务已经全部完成";
    elements.focusTaskHint.textContent = "可以切换日期回顾，或者提前把明天的重点记下来。";
    return;
  }

  elements.focusTaskTitle.textContent = focusTask.title;
  elements.focusTaskHint.textContent = focusTask.note || `${getPriorityLabel(focusTask.priority)}，建议先把这件事推进一小步。`;
}

function renderTaskItem(task) {
  const fragment = elements.taskItemTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".task-item");
  const badge = fragment.querySelector(".priority-badge");
  const time = fragment.querySelector(".task-time");
  const title = fragment.querySelector(".task-title");
  const note = fragment.querySelector(".task-note");
  const toggleBtn = fragment.querySelector(".action-toggle");
  const editBtn = fragment.querySelector(".action-edit");
  const deleteBtn = fragment.querySelector(".action-delete");

  item.dataset.id = task.id;
  item.classList.toggle("is-complete", task.status === "completed");

  badge.dataset.priority = task.priority;
  badge.textContent = getPriorityLabel(task.priority);
  time.textContent = getTaskTimeLabel(task);
  title.textContent = task.title;
  toggleBtn.title = task.status === "completed" ? "取消完成" : "打卡完成";
  toggleBtn.setAttribute("aria-label", task.status === "completed" ? "取消完成" : "打卡完成");

  if (task.note) {
    note.textContent = task.note;
    note.classList.remove("hidden");
  }

  toggleBtn.addEventListener("click", () => toggleTask(task.id));
  editBtn.addEventListener("click", () => startEditTask(task.id));
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  elements.taskList.appendChild(fragment);
}

function syncFilterButtons() {
  const buttons = elements.filterGroup.querySelectorAll("[data-filter]");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function filterTasks(tasks, filter) {
  if (filter === "pending") {
    return tasks.filter((task) => task.status !== "completed");
  }

  if (filter === "completed") {
    return tasks.filter((task) => task.status === "completed");
  }

  return tasks;
}

function sortTasks(tasks) {
  const priorityWeight = { high: 0, medium: 1, low: 2 };

  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "completed" ? 1 : -1;
    }

    const priorityDiff = (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function toggleTask(taskId) {
  const task = findTask(taskId);
  if (!task) {
    return;
  }

  const isCompleted = task.status === "completed";
  task.status = isCompleted ? "pending" : "completed";
  task.completedAt = isCompleted ? "" : new Date().toISOString();

  persistTasks();
  render();
}

function startEditTask(taskId) {
  const task = findTask(taskId);
  if (!task) {
    return;
  }

  state.editingTaskId = taskId;
  elements.titleInput.value = task.title;
  elements.noteInput.value = task.note;
  elements.priorityInput.value = task.priority;
  elements.submitButton.textContent = "保存修改";
  elements.cancelEditBtn.classList.remove("hidden");
  setFormMessage("正在编辑任务");
  elements.titleInput.focus();
}

function updateTask(taskId, payload) {
  const task = findTask(taskId);
  if (!task) {
    return;
  }

  task.title = payload.title;
  task.note = payload.note;
  task.priority = payload.priority;
}

function deleteTask(taskId) {
  const confirmed = window.confirm("确认删除该任务吗？");
  if (!confirmed) {
    return;
  }

  state.tasksByDate[state.selectedDate] = getTasksForSelectedDate().filter((task) => task.id !== taskId);

  if (state.editingTaskId === taskId) {
    resetForm();
  }

  persistTasks();
  render();
  setFormMessage("任务已删除");
}

function resetForm() {
  state.editingTaskId = null;
  elements.taskForm.reset();
  elements.priorityInput.value = "medium";
  elements.submitButton.textContent = "新增任务";
  elements.cancelEditBtn.classList.add("hidden");
  setFormMessage("");
}

function findTask(taskId) {
  return getTasksForSelectedDate().find((task) => task.id === taskId);
}

function getTasksForSelectedDate() {
  if (!state.tasksByDate[state.selectedDate]) {
    state.tasksByDate[state.selectedDate] = [];
  }

  return state.tasksByDate[state.selectedDate];
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasksByDate));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to read local tasks:", error);
    return {};
  }
}

function setFormMessage(message) {
  elements.formMessage.textContent = message;
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getPriorityLabel(priority) {
  const labels = {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };

  return labels[priority] || "普通";
}

function getTaskTimeLabel(task) {
  const createdAt = formatTime(task.createdAt);
  if (task.status === "completed" && task.completedAt) {
    return `创建于 ${createdAt} · 完成于 ${formatTime(task.completedAt)}`;
  }

  return `创建于 ${createdAt}`;
}

function formatDisplayDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getToday() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
