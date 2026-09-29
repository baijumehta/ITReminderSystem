import Link from "next/link";
import { CATEGORIES, PRIORITIES, RECURRENCES, type Task } from "@/lib/tasks";

type Props = {
  action: (form: FormData) => Promise<void>;
  task?: Task;
  submitLabel: string;
  cancelHref: string;
};

export function TaskForm({ action, task, submitLabel, cancelHref }: Props) {
  return (
    <form action={action} className="card space-y-5 p-5">
      {task && <input type="hidden" name="id" value={task.id} />}

      <div>
        <label className="label" htmlFor="title">What needs to be done?</label>
        <input id="title" name="title" required defaultValue={task?.title} className="field"
          placeholder="e.g. Renew wildcard SSL certificate" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="due_date">Due date</label>
          <input id="due_date" name="due_date" type="date" required defaultValue={task?.due_date} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="remind_days_before">Start reminding</label>
          <div className="flex items-center gap-2">
            <input id="remind_days_before" name="remind_days_before" type="number" min={0} max={365}
              defaultValue={task?.remind_days_before ?? 14} className="field w-24" />
            <span className="text-sm text-slate-500">days before</span>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="recurrence">Repeats</label>
          <select id="recurrence" name="recurrence" defaultValue={task?.recurrence ?? "none"} className="field">
            {Object.entries(RECURRENCES).map(([value, r]) => (
              <option key={value} value={value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="category">Category</label>
          <input id="category" name="category" list="categories" defaultValue={task?.category ?? "General"} className="field" />
          <datalist id="categories">
            {CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="priority">Priority</label>
          <select id="priority" name="priority" defaultValue={task?.priority ?? "normal"} className="field capitalize">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cost">Cost (optional)</label>
          <input id="cost" name="cost" inputMode="decimal" defaultValue={task?.cost ?? ""} className="field" placeholder="$" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="vendor">Vendor</label>
          <input id="vendor" name="vendor" defaultValue={task?.vendor ?? ""} className="field" placeholder="e.g. Fortinet, DigiCert" />
        </div>
        <div>
          <label className="label" htmlFor="asset">Asset / system</label>
          <input id="asset" name="asset" defaultValue={task?.asset ?? ""} className="field" placeholder="e.g. FortiGate 100F, *.contoso.com" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">Notes / how-to</label>
        <textarea id="description" name="description" rows={4} defaultValue={task?.description ?? ""} className="field"
          placeholder="Steps, contacts, where the credentials live…" />
      </div>

      <div className="flex gap-3">
        <button className="btn btn-primary">{submitLabel}</button>
        <Link href={cancelHref} className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
