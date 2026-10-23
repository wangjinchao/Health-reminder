export function normalizeCutoffTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function isTaskCutoffReached(task, now = new Date()) {
  const cutoff = normalizeCutoffTime(task?.cutoffTime);
  if (!cutoff) return false;
  const [hour, minute] = cutoff.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
}

export function canTaskRemind(task, delaySeconds = 0, now = new Date()) {
  if (!task?.enabled || isTaskCutoffReached(task, now)) return false;
  if (!normalizeCutoffTime(task.cutoffTime)) return true;
  if (task.queuedDate && task.queuedDate !== now.toDateString()) return false;
  const target = new Date(now.getTime() + delaySeconds * 1000);
  // 跨日后会重新计时，不能提前预告前一天的提醒。
  return target.toDateString() === now.toDateString() && !isTaskCutoffReached(task, target);
}
