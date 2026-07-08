"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/loading-state";
import { useCreateTask, useTasks } from "@/hooks/use-tasks";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { TASK_TYPE_COLOR } from "@/lib/task-colors";
import type { TaskType } from "@/types/api";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  VISIT: "Visita",
  CALL: "Ligação",
  FOLLOW_UP: "Follow-up",
  OTHER: "Outro",
};

export default function LeadsCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<TaskType>("FOLLOW_UP");
  const [newTaskTime, setNewTaskTime] = useState("09:00");

  const gridStart = startOfWeek(startOfMonth(currentMonth), {
    weekStartsOn: 0,
  });
  const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const { data: tasks, isLoading } = useTasks({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
  });
  const createTask = useCreateTask();

  const tasksByDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof tasks>>();
    for (const task of tasks ?? []) {
      const key = format(new Date(task.dueAt), "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = selectedDay
    ? (tasksByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? [])
    : [];

  function handleCreateTask() {
    if (!selectedDay || !newTaskTitle.trim()) return;
    const [hours, minutes] = newTaskTime.split(":").map(Number);
    const dueAt = new Date(selectedDay);
    dueAt.setHours(hours || 0, minutes || 0, 0, 0);

    createTask.mutate(
      { title: newTaskTitle, type: newTaskType, dueAt: dueAt.toISOString() },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          toast.success("Tarefa criada");
        },
        onError: (error) => {
          const msg =
            error instanceof ApiError
              ? error.message
              : "Não foi possível criar a tarefa.";
          toast.error(msg);
        },
      },
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft />
          </Button>
          <h2 className="w-40 text-center text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoje
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {Object.entries(TASK_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: TASK_TYPE_COLOR[type as TaskType] }}
                aria-hidden
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando calendário..." />
      ) : (
        <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="bg-muted/50 p-2 text-center text-xs font-medium"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(key) ?? [];
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "bg-background hover:bg-muted/40 flex min-h-20 flex-col items-start gap-1 border-t p-1.5 text-left transition-colors",
                  !isSameMonth(day, currentMonth) &&
                    "bg-muted/20 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs",
                    isToday(day) && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex w-full flex-col gap-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] text-white"
                      style={{ backgroundColor: TASK_TYPE_COLOR[task.type] }}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-muted-foreground text-[10px]">
                      +{dayTasks.length - 3} mais
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay &&
                format(selectedDay, "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
            </DialogTitle>
            <DialogDescription>
              Visitas, ligações e follow-ups agendados para o dia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {selectedDayTasks.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Nenhuma tarefa agendada.
              </p>
            )}
            {selectedDayTasks.map((task) => (
              <div key={task.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={task.completedAt ? "line-through" : undefined}
                  >
                    {task.title}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] text-white"
                    style={{ backgroundColor: TASK_TYPE_COLOR[task.type] }}
                  >
                    {TASK_TYPE_LABELS[task.type]}
                  </span>
                </div>
                {task.lead && (
                  <p className="text-muted-foreground text-xs">
                    {task.lead.development?.name ?? task.lead.company?.name}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {format(new Date(task.dueAt), "HH:mm")}
                  {task.assignee ? ` · ${task.assignee.name}` : ""}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={newTaskType}
                onValueChange={(v) => setNewTaskType(v as TaskType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
              />
            </div>
            <Input
              placeholder="Título da tarefa..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleCreateTask}
              disabled={createTask.isPending || !newTaskTitle.trim()}
            >
              <Plus />
              {createTask.isPending ? "Criando..." : "Nova tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
