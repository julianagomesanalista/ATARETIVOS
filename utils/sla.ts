import { Task, Complexity } from '@/types';

// Days per complexity level
export const COMPLEXITY_DAYS: Record<Complexity, number> = {
  facil: 2,
  medio: 5,
  dificil: 15,
};

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

// Color classes for the progress bar
export const COMPLEXITY_BAR_COLORS: Record<Complexity, string> = {
  facil: 'bg-blue-400',
  medio: 'bg-orange-400',
  dificil: 'bg-red-500',
};

/** Calculate due_date from created_at + complexity */
export function calculateDueDate(createdAt: string | Date, complexity: Complexity): Date {
  const created = new Date(createdAt);
  const due = new Date(created);
  due.setDate(due.getDate() + COMPLEXITY_DAYS[complexity]);
  return due;
}

/** True if the task is past its due_date (and not done) */
export function isOverdue(task: Task): boolean {
  if (task.status === 'done') return false;
  return Date.now() > new Date(task.due_date).getTime();
}

/** 0-100 % of time elapsed relative to total SLA window */
export function getTimeProgress(task: Task): number {
  const created = new Date(task.created_at).getTime();
  const due = new Date(task.due_date).getTime();
  const now = Date.now();
  if (due <= created) return 100;
  const pct = ((now - created) / (due - created)) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

/** Hours remaining (positive) or hours past deadline (negative) */
export function getHoursRemaining(task: Task): number {
  const due = new Date(task.due_date).getTime();
  return Math.floor((due - Date.now()) / (1000 * 60 * 60));
}

/** Human-readable time label for the card footer */
export function formatTimeLabel(task: Task): string {
  const hours = getHoursRemaining(task);
  if (hours < 0) {
    const abs = Math.abs(hours);
    if (abs < 24) return `${abs}h atrasado`;
    return `${Math.floor(abs / 24)}d atrasado`;
  }
  if (hours < 24) return `${hours}h restantes`;
  return `${Math.floor(hours / 24)}d restantes`;
}

/** Bar color - turns red when overdue regardless of complexity */
export function getProgressBarColor(task: Task): string {
  if (isOverdue(task)) return 'bg-red-500';
  if (getTimeProgress(task) > 75) return 'bg-orange-400';
  return COMPLEXITY_BAR_COLORS[task.complexity];
}
