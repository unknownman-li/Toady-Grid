const STORAGE_KEY = "todaygrid-monthly-records-v1";
const AUDIO_STATE_KEY = "todaygrid-audio-state";

const state = {
  selectedDate: getToday(),
  viewMonth: getMonthStart(getToday()),
  recordsByDate: loadRecords(),
  editingRecordId: null,
};

const elements = {
  currentMonthLabel: document.querySelector("#currentMonthLabel"),
  activeDaysCount: document.querySelector("#activeDaysCount"),
  entryCount: document.querySelector("#entryCount"),
  selectedDateShort: document.querySelector("#selectedDateShort"),
  calendarGrid: document.querySelector("#calendarGrid"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  selectedDateHint: document.querySelector("#selectedDateHint"),
  selectedEntryCount: document.querySelector("#selectedEntryCount"),
  summaryPill: document.querySelector("#summaryPill"),
  summaryText: document.querySelector("#summaryText"),
  progressBar: document.querySelector("#progressBar"),
  prevMonthBtn: document.querySelector("#prevMonthBtn"),
  nextMonthBtn: document.querySelector("#nextMonthBtn"),
  todayBtn: document.querySelector("#todayBtn"),
  recordForm: document.querySelector("#recordForm"),
  titleInput: document.querySelector("#titleInput"),
  categoryInput: document.querySelector("#categoryInput"),
  noteInput: document.querySelector("#noteInput"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  formMessage: document.querySelector("#formMessage"),
  recordList: document.querySelector("#recordList"),
  emptyState: document.querySelector("#emptyState"),
  audioToggleBtn: document.querySelector("#audioToggleBtn"),
  audioVolume: document.querySelector("#audioVolume"),
  audioStatus: document.querySelector("#audioStatus"),
  rainScene: document.querySelector("#rainScene"),
  recordItemTemplate: document.querySelector("#recordItemTemplate"),
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
  bindEvents();
  rainScene.start();
  ambientAudio.restore();
  render();
}

function bindEvents() {
  elements.prevMonthBtn.addEventListener("click", () => shiftMonth(-1));
  elements.nextMonthBtn.addEventListener("click", () => shiftMonth(1));
  elements.todayBtn.addEventListener("click", jumpToToday);
  elements.recordForm.addEventListener("submit", handleRecordSubmit);
  elements.cancelEditBtn.addEventListener("click", resetForm);
  elements.audioToggleBtn.addEventListener("click", () => ambientAudio.toggle());
  elements.audioVolume.addEventListener("input", (event) => {
    ambientAudio.setVolume(Number(event.target.value) / 100);
  });
  window.addEventListener("resize", () => rainScene.resize());
}

function shiftMonth(offset) {
  state.viewMonth = addMonths(state.viewMonth, offset);
  render();
}

function jumpToToday() {
  state.selectedDate = getToday();
  state.viewMonth = getMonthStart(state.selectedDate);
  resetForm();
  render();
}

function handleRecordSubmit(event) {
  event.preventDefault();

  const title = elements.titleInput.value.trim();
  const category = elements.categoryInput.value;
  const note = elements.noteInput.value.trim();

  if (!title) {
    setFormMessage("请输入当天做过的事情");
    elements.titleInput.focus();
    return;
  }

  if (state.editingRecordId) {
    updateRecord(state.editingRecordId, { title, category, note });
    setFormMessage("记录已更新");
  } else {
    const record = {
      id: createRecordId(),
      title,
      category,
      note,
      createdAt: new Date().toISOString(),
    };
    getRecordsForSelectedDate().unshift(record);
    setFormMessage("记录已保存");
  }

  persistRecords();
  resetForm();
  render();
}

function render() {
  renderMonthHeader();
  renderCalendar();
  renderSelectedDay();
  renderMonthStats();
  renderDailySummary();
  renderRecordList();
}

function renderMonthHeader() {
  elements.currentMonthLabel.textContent = formatMonthLabel(state.viewMonth);
  elements.selectedDateShort.textContent = formatDateShort(state.selectedDate);
}

function renderCalendar() {
  const monthDates = buildCalendarDates(state.viewMonth);
  const monthKey = state.viewMonth.slice(0, 7);
  elements.calendarGrid.innerHTML = "";

  monthDates.forEach((dateString) => {
    const button = document.createElement("button");
    const records = getRecordsForDate(dateString);
    const isCurrentMonth = dateString.startsWith(monthKey);
    const isSelected = dateString === state.selectedDate;
    const isToday = dateString === getToday();

    button.type = "button";
    button.className = "calendar-day";
    button.classList.toggle("is-outside", !isCurrentMonth);
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-today", isToday);
    button.classList.toggle("has-records", records.length > 0);
    button.dataset.date = dateString;
    button.innerHTML = `
      <span class="calendar-day__number">${getDayNumber(dateString)}</span>
      <span class="calendar-day__count">${records.length > 0 ? `${records.length} 条` : ""}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedDate = dateString;
      resetForm();
      render();
    });
    elements.calendarGrid.appendChild(button);
  });
}

function renderSelectedDay() {
  elements.selectedDateLabel.textContent = formatDisplayDate(state.selectedDate);
  elements.selectedDateHint.textContent = "记录这一天真正做过的事情，而不是计划。";
}

function renderMonthStats() {
  const monthPrefix = state.viewMonth.slice(0, 7);
  const entries = Object.entries(state.recordsByDate).filter(([date]) => date.startsWith(monthPrefix));
  const activeDays = entries.filter(([, records]) => Array.isArray(records) && records.length > 0).length;
  const totalEntries = entries.reduce((sum, [, records]) => sum + records.length, 0);

  elements.activeDaysCount.textContent = String(activeDays);
  elements.entryCount.textContent = String(totalEntries);
}

function renderDailySummary() {
  const records = getRecordsForSelectedDate();
  const count = records.length;
  const monthlyPeak = Math.max(getMonthlyPeakCount(state.viewMonth), 1);
  const progress = Math.min(Math.round((count / monthlyPeak) * 100), 100);

  elements.selectedEntryCount.textContent = String(count);
  elements.progressBar.style.width = `${progress}%`;

  if (count === 0) {
    elements.summaryPill.textContent = "空白";
    elements.summaryText.textContent = "这一天还没有内容，可以从一件已完成的小事开始记录。";
    return;
  }

  if (count < 3) {
    elements.summaryPill.textContent = "开始记录";
    elements.summaryText.textContent = `这一天已经记录了 ${count} 条，继续补充会更完整。`;
    return;
  }

  if (count < 6) {
    elements.summaryPill.textContent = "有内容";
    elements.summaryText.textContent = `这一天已经沉淀了 ${count} 条记录，回顾起来会很清晰。`;
    return;
  }

  elements.summaryPill.textContent = "丰富";
  elements.summaryText.textContent = `这一天已经留下 ${count} 条内容，是这个月里比较充实的一天。`;
}

function renderRecordList() {
  const records = sortRecords(getRecordsForSelectedDate());
  elements.recordList.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", records.length > 0);

  records.forEach((record) => {
    const fragment = elements.recordItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".record-item");
    const category = fragment.querySelector(".record-category");
    const time = fragment.querySelector(".record-time");
    const title = fragment.querySelector(".record-title");
    const note = fragment.querySelector(".record-note");
    const editBtn = fragment.querySelector(".action-edit");
    const deleteBtn = fragment.querySelector(".action-delete");

    item.dataset.id = record.id;
    category.dataset.category = record.category;
    category.textContent = getCategoryLabel(record.category);
    time.textContent = formatTime(record.createdAt);
    title.textContent = record.title;

    if (record.note) {
      note.textContent = record.note;
      note.classList.remove("hidden");
    }

    editBtn.addEventListener("click", () => startEditRecord(record.id));
    deleteBtn.addEventListener("click", () => deleteRecord(record.id));

    elements.recordList.appendChild(fragment);
  });
}

function startEditRecord(recordId) {
  const record = findRecord(recordId);
  if (!record) {
    return;
  }

  state.editingRecordId = recordId;
  elements.titleInput.value = record.title;
  elements.categoryInput.value = record.category;
  elements.noteInput.value = record.note;
  elements.submitButton.textContent = "保存修改";
  elements.cancelEditBtn.classList.remove("hidden");
  setFormMessage("正在编辑当天记录");
  elements.titleInput.focus();
}

function updateRecord(recordId, payload) {
  const record = findRecord(recordId);
  if (!record) {
    return;
  }

  record.title = payload.title;
  record.category = payload.category;
  record.note = payload.note;
}

function deleteRecord(recordId) {
  const confirmed = window.confirm("确认删除这条当天记录吗？");
  if (!confirmed) {
    return;
  }

  state.recordsByDate[state.selectedDate] = getRecordsForSelectedDate().filter((record) => record.id !== recordId);
  if (state.editingRecordId === recordId) {
    resetForm();
  }
  persistRecords();
  render();
  setFormMessage("记录已删除");
}

function resetForm() {
  state.editingRecordId = null;
  elements.recordForm.reset();
  elements.categoryInput.value = "work";
  elements.submitButton.textContent = "保存记录";
  elements.cancelEditBtn.classList.add("hidden");
  setFormMessage("");
}

function getRecordsForSelectedDate() {
  return getRecordsForDate(state.selectedDate);
}

function getRecordsForDate(dateString) {
  if (!state.recordsByDate[dateString]) {
    state.recordsByDate[dateString] = [];
  }
  return state.recordsByDate[dateString];
}

function findRecord(recordId) {
  return getRecordsForSelectedDate().find((record) => record.id === recordId);
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recordsByDate));
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to read local records:", error);
    return {};
  }
}

function setFormMessage(message) {
  elements.formMessage.textContent = message;
}

function sortRecords(records) {
  return [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function createRecordId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getCategoryLabel(category) {
  const labels = {
    work: "工作 / 学习",
    life: "生活",
    health: "健康",
    idea: "想法 / 灵感",
  };
  return labels[category] || "记录";
}

function getMonthlyPeakCount(monthDate) {
  const monthPrefix = monthDate.slice(0, 7);
  return Object.entries(state.recordsByDate)
    .filter(([date]) => date.startsWith(monthPrefix))
    .reduce((peak, [, records]) => Math.max(peak, records.length), 0);
}

function buildCalendarDates(monthString) {
  const firstDay = new Date(`${monthString}-01T00:00:00`);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = addDaysToDate(firstDay, -firstWeekday);
  const dates = [];

  for (let index = 0; index < 42; index += 1) {
    dates.push(formatDate(addDaysToDate(startDate, index)));
  }

  return dates;
}

function formatMonthLabel(monthString) {
  const date = new Date(`${monthString}-01T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(date);
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

function formatDateShort(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getMonthStart(dateString) {
  return dateString.slice(0, 7);
}

function getDayNumber(dateString) {
  return String(new Date(`${dateString}T00:00:00`).getDate());
}

function addMonths(monthString, offset) {
  const date = new Date(`${monthString}-01T00:00:00`);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

function addDaysToDate(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
