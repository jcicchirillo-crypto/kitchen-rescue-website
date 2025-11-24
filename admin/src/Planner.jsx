import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, startOfMonth, endOfMonth, startOfDay } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Circle, ListTodo, ArrowLeft, Clock, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";

const TASK_CATEGORIES = [
  { id: "deliveries", name: "Deliveries", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "collections", name: "Collections", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "maintenance", name: "Maintenance", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "admin", name: "Admin", color: "bg-green-100 text-green-700 border-green-300" },
  { id: "follow-up", name: "Follow-ups", color: "bg-pink-100 text-pink-700 border-pink-300" },
  { id: "other", name: "Other", color: "bg-gray-100 text-gray-700 border-gray-300" },
];

function TaskItem({ task, onToggle, onDelete, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className={`p-3 rounded-lg border-2 cursor-move transition-all hover:shadow-md ${
        task.completed ? "opacity-60 line-through" : ""
      } ${TASK_CATEGORIES.find(c => c.id === task.category)?.color || "bg-gray-100"}`}
    >
      <div className="flex items-start gap-2">
        <button onClick={() => onToggle(task.id)} className="mt-0.5">
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{task.title}</div>
          {task.description && (
            <div className="text-xs text-gray-600 mt-1">{task.description}</div>
          )}
        </div>
        <button onClick={() => onDelete(task.id)} className="text-gray-400 hover:text-red-500">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CalendarDay({ day, tasks, onDrop, onDragOver, isCurrentMonth, view }) {
  const dayTasks = tasks.filter(t => t.date && isSameDay(new Date(t.date), day));
  const isTodayDate = isToday(day);

  return (
    <div
      className={`min-h-[120px] rounded-lg border-2 p-2 ${
        isTodayDate ? "border-red-500 bg-red-50" : "border-gray-200"
      } ${!isCurrentMonth ? "opacity-40" : ""}`}
      onDrop={(e) => onDrop(e, day)}
      onDragOver={onDragOver}
    >
      <div className={`text-xs font-semibold mb-1 ${isTodayDate ? "text-red-600" : "text-gray-600"}`}>
        {format(day, "d")}
      </div>
      <div className="space-y-1">
        {dayTasks.map((task) => (
          <div
            key={task.id}
            className={`text-[10px] px-2 py-1 rounded truncate ${
              TASK_CATEGORIES.find(c => c.id === task.category)?.color || "bg-gray-100"
            } ${task.completed ? "opacity-60 line-through" : ""}`}
          >
            {task.title}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ week, tasks, onDrop, onDragOver }) {
  const days = eachDayOfInterval({ start: startOfWeek(week), end: endOfWeek(week) });

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => (
        <div key={dayName} className="text-center text-xs font-medium text-gray-500 mb-1">
          {dayName}
        </div>
      ))}
      {days.map((day) => (
        <CalendarDay
          key={+day}
          day={day}
          tasks={tasks}
          onDrop={onDrop}
          onDragOver={onDragOver}
          isCurrentMonth={true}
          view="week"
        />
      ))}
    </div>
  );
}

function MonthView({ month, tasks, onDrop, onDragOver }) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDay = startOfMonth(month);
  const startDay = startOfWeek(firstDay);
  const endDay = endOfWeek(endOfMonth(month));
  const allDays = eachDayOfInterval({ start: startDay, end: endDay });

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
        <div key={dayName} className="text-center text-xs font-medium text-gray-500 mb-1">
          {dayName}
        </div>
      ))}
      {allDays.map((day) => (
        <CalendarDay
          key={+day}
          day={day}
          tasks={tasks}
          onDrop={onDrop}
          onDragOver={onDragOver}
          isCurrentMonth={day >= firstDay && day <= endOfMonth(month)}
          view="month"
        />
      ))}
    </div>
  );
}

export default function Planner() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("week"); // "week" or "month"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "other" });
  const [draggedTask, setDraggedTask] = useState(null);

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("planner-tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading tasks:", e);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (tasks.length > 0 || localStorage.getItem("planner-tasks")) {
      localStorage.setItem("planner-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      completed: false,
      date: null,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setNewTask({ title: "", description: "", category: "other" });
    setShowAddTask(false);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    if (!draggedTask) return;

    const dateStr = format(startOfDay(day), "yyyy-MM-dd");
    setTasks(tasks.map(t =>
      t.id === draggedTask.id ? { ...t, date: dateStr } : t
    ));
    setDraggedTask(null);
  };

  const todaysTasks = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return tasks.filter(t => t.date === today);
  }, [tasks]);

  const unassignedTasks = useMemo(() => {
    return tasks.filter(t => !t.date && !t.completed);
  }, [tasks]);

  const tasksByCategory = useMemo(() => {
    const grouped = {};
    TASK_CATEGORIES.forEach(cat => {
      grouped[cat.id] = unassignedTasks.filter(t => t.category === cat.id);
    });
    return grouped;
  }, [unassignedTasks]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            <span className="font-semibold">Task Planner</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              localStorage.removeItem("adminToken");
              window.location.href = "/admin";
            }}>
              <LogOut className="h-4 w-4" />Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {/* Today's Summary */}
        <Card className="mb-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Tasks - {format(new Date(), "EEEE, MMMM d")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks scheduled for today. Enjoy your day!</p>
            ) : (
              <div className="space-y-2">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                      task.completed ? "opacity-60 line-through" : ""
                    } ${TASK_CATEGORIES.find(c => c.id === task.category)?.color || "bg-gray-100"}`}
                  >
                    <button onClick={() => toggleTask(task.id)}>
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-600">{task.description}</div>
                      )}
                    </div>
                    <Badge className={TASK_CATEGORIES.find(c => c.id === task.category)?.color}>
                      {TASK_CATEGORIES.find(c => c.id === task.category)?.name}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tasks by Category */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Tasks to Do
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddTask(!showAddTask)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Drag tasks to calendar to schedule them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddTask && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={newTask.category}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      >
                        {TASK_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addTask} className="flex-1">
                          Add Task
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddTask(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {TASK_CATEGORIES.map((category) => {
                const categoryTasks = tasksByCategory[category.id] || [];
                if (categoryTasks.length === 0 && !showAddTask) return null;
                return (
                  <div key={category.id}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded ${category.color.split(" ")[0]}`}></span>
                      {category.name} ({categoryTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {categoryTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                          onDelete={deleteTask}
                          onDragStart={handleDragStart}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {unassignedTasks.length === 0 && !showAddTask && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No unassigned tasks. Add one to get started!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Calendar
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("week")}
                  >
                    Week
                  </Button>
                  <Button
                    variant={view === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("month")}
                  >
                    Month
                  </Button>
                </div>
              </div>
              <CardDescription>
                {view === "week" ? "Week view" : "Month view"} - Drop tasks here to schedule them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(view === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">
                  {view === "week"
                    ? `Week of ${format(startOfWeek(currentDate), "MMM d")}`
                    : format(currentDate, "MMMM yyyy")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(view === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {view === "week" ? (
                <WeekView
                  week={currentDate}
                  tasks={tasks}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                />
              ) : (
                <MonthView
                  month={currentDate}
                  tasks={tasks}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

