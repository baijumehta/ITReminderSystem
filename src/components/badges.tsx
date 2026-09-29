import { formatDate, relativeDays } from "@/lib/dates";
import type { Priority, Task, TaskState } from "@/lib/tasks";

const STATE_STYLE: Record<TaskState, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800 ring-red-200" },
  "due-soon": { label: "Due this week", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  reminding: { label: "Reminding daily", className: "bg-blue-100 text-blue-800 ring-blue-200" },
  snoozed: { label: "Snoozed", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  upcoming: { label: "Scheduled", className: "bg-slate-50 text-slate-600 ring-slate-200" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
};

export function StateBadge({ state }: { state: TaskState }) {
  const s = STATE_STYLE[state];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}>
      {s.label}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  critical: "text-red-700",
  high: "text-orange-700",
  normal: "text-slate-600",
  low: "text-slate-400",
};

export function PriorityLabel({ priority }: { priority: Priority }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${PRIORITY_STYLE[priority]}`}>
      {priority}
    </span>
  );
}

export function DueDate({ task }: { task: Task }) {
  const late = task.status === "open" && task.days_until < 0;
  return (
    <div className="whitespace-nowrap">
      <div className="font-medium text-slate-900">{formatDate(task.due_date)}</div>
      {task.status === "open" && (
        <div className={`text-xs ${late ? "font-semibold text-red-700" : "text-slate-500"}`}>
          {relativeDays(task.days_until)}
        </div>
      )}
    </div>
  );
}

export function money(value: string | number | null) {
  if (value === null || value === "") return null;
  return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
