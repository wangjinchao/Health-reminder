import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCutoffTime, isTaskCutoffReached, canTaskRemind } from './task-schedule.js';

const water = { enabled: true, cutoffTime: '21:00' };
const at = (hour, minute = 0, second = 0, day = 23) => new Date(2026, 9, day, hour, minute, second);

test('cutoff is optional and invalid settings do not suppress reminders', () => {
  for (const cutoffTime of [undefined, '', 'invalid', '24:00', '21:60']) {
    const task = { enabled: true, cutoffTime };
    assert.equal(isTaskCutoffReached(task, at(23)), false);
    assert.equal(canTaskRemind(task, 3600, at(23)), true);
  }
  assert.equal(normalizeCutoffTime(' 9:5 '), '09:05');
});

test('reminders stop at the exact cutoff and become eligible the next day', () => {
  assert.equal(canTaskRemind(water, 0, at(20, 59, 59)), true);
  assert.equal(isTaskCutoffReached(water, at(21)), true);
  assert.equal(canTaskRemind(water, 0, at(23, 59, 59)), false);
  assert.equal(canTaskRemind(water, 0, at(0, 0, 0, 24)), true);
  assert.equal(canTaskRemind({ ...water, enabled: false }, 0, at(12)), false);
});

test('pre-notifications do not announce reminders at or beyond the cutoff', () => {
  assert.equal(canTaskRemind(water, 5, at(20, 59, 54)), true);
  assert.equal(canTaskRemind(water, 5, at(20, 59, 55)), false);
  assert.equal(canTaskRemind(water, 300, at(20, 59)), false);
});

test('a configured cutoff never carries an old countdown across midnight', () => {
  const task = { enabled: true, cutoffTime: '23:59' };
  assert.equal(canTaskRemind(task, 120, at(23, 58)), false);
  assert.equal(canTaskRemind({ ...task, cutoffTime: '00:00' }, 0, at(0)), false);
});

test('queued reminders with a cutoff are discarded after their original day', () => {
  const task = { ...water, queuedDate: at(20).toDateString() };
  assert.equal(canTaskRemind(task, 0, at(20)), true);
  assert.equal(canTaskRemind(task, 0, at(8, 0, 0, 24)), false);
});
