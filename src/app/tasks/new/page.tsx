import { createTaskAction } from "@/app/actions";
import { TaskForm } from "@/components/TaskForm";

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">New task</h1>
      <TaskForm action={createTaskAction} submitLabel="Create task" cancelHref="/" />
    </div>
  );
}
