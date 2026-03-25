const STORAGE_KEY = "daily-checkin-board-v1";

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
  taskItemTemplate: document.querySelector("#taskItemTemplate"),
};

init();

function init() {
  elements.datePicker.value = state.selectedDate;
  bindEvents();
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
    elements.summaryText.textContent = `今天一共完成了 ${completed} 项任务，状态很好。`;
    return;
  }

  if (completed === 0) {
    elements.summaryPill.textContent = "待启动";
    elements.summaryText.textContent = `今天有 ${pending} 项任务待完成，先拿下一项最重要的。`;
    return;
  }

  elements.summaryPill.textContent = "推进中";
  elements.summaryText.textContent = `已完成 ${completed} 项，还剩 ${pending} 项，继续保持节奏。`;
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
