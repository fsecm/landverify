/**
 * Activity Log Utility
 * Records all officer and citizen actions into persistent audit log
 */

import { ActivityLogItem } from '../types';

const ACTIVITY_STORAGE_KEY = 'landverify_activity_log_v1';

export function getStoredActivities(): ActivityLogItem[] {
  const data = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveStoredActivities(activities: ActivityLogItem[]): void {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
}

/**
 * Creates and prepends a new activity log entry to the history.
 */
export function logActivity(
  actionType: ActivityLogItem['actionType'],
  actorRole: ActivityLogItem['actorRole'],
  title: string,
  details: string,
  status: ActivityLogItem['status'] = 'INFO',
  plotId?: string,
  deedId?: string
): ActivityLogItem {
  const newActivity: ActivityLogItem = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    actionType,
    actorRole,
    title,
    details,
    status,
    plotId,
    deedId,
  };

  const existing = getStoredActivities();
  const updated = [newActivity, ...existing].slice(0, 200); // Keep last 200 actions
  saveStoredActivities(updated);
  return newActivity;
}
