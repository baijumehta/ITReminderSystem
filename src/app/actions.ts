"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, today } from "@/lib/dates";
import { runReminders } from "@/lib/reminders";
import {
  PRIORITIES,
  RECURRENCES,
  completeTask,
  createTask,
  deleteTask,
  reopenTask,
  snoozeTask,
  updateTask,
  type Priority,
  type Recurrence,
  type TaskInput,
} from "@/lib/tasks";

function text(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function parseTask(form: FormData): TaskInput {
  const title = text(form, "title");
  const due = text(form, "due_date");
  if (!title) throw new Error("Title is required");
  if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error("A valid due date is required");

  const priority = text(form, "priority") as Priority;
  const recurrence = text(form, "recurrence") as Recurrence;
  const remind = Number(text(form, "remind_days_before") ?? 14);
  const cost = text(form, "cost");

  return {
    title,
    description: text(form, "description"),
    category: text(form, "category") ?? "General",
    vendor: text(form, "vendor"),
    asset: text(form, "asset"),
    priority: PRIORITIES.includes(priority) ? priority : "normal",
    due_date: due,
    remind_days_before: Number.isFinite(remind) && remind >= 0 ? Math.round(remind) : 14,
    recurrence: recurrence in RECURRENCES ? recurrence : "none",
    cost: cost ? Number(cost.replace(/[$,]/g, "")) || null : null,
  };
}

const id = (form: FormData) => Number(form.get("id"));

export async function createTaskAction(form: FormData) {
  const newId = await createTask(parseTask(form));
  revalidatePath("/");
  redirect(`/tasks/${newId}?saved=1`);
}

export async function updateTaskAction(form: FormData) {
  await updateTask(id(form), parseTask(form));
  revalidatePath("/");
  redirect(`/tasks/${id(form)}?saved=1`);
}

export async function completeTaskAction(form: FormData) {
  const nextId = await completeTask(id(form), text(form, "completion_notes"));
  revalidatePath("/");
  redirect(nextId ? `/tasks/${nextId}?next=1` : `/tasks/${id(form)}?done=1`);
}

export async function reopenTaskAction(form: FormData) {
  await reopenTask(id(form));
  revalidatePath("/");
  redirect(`/tasks/${id(form)}`);
}

export async function snoozeTaskAction(form: FormData) {
  const days = Number(form.get("days"));
  await snoozeTask(id(form), days > 0 ? addDays(today(), days) : null);
  revalidatePath("/");
  redirect(`/tasks/${id(form)}`);
}

export async function deleteTaskAction(form: FormData) {
  await deleteTask(id(form));
  revalidatePath("/");
  redirect("/?deleted=1");
}

export async function sendRemindersNowAction() {
  const result = await runReminders("manual");
  revalidatePath("/");
  redirect(`/preview?sent=${result.status}`);
}
