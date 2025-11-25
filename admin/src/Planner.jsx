import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, startOfMonth, endOfMonth, startOfDay } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Circle, ListTodo, ArrowLeft, Clock, LogOut, Settings, Trash2, Edit2, ArrowUp } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";

const PRIORITY_LEVELS = [
  { id: "high", name: "High", color: "bg-red-100 text-red-700 border-red-300" },
  { id: "medium", name: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { id: "low", name: "Low", color: "bg-green-100 text-green-700 border-green-300" },
];

const PROJECT_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-300",
  "bg-purple-100 text-purple-700 border-purple-300",
  "bg-orange-100 text-orange-700 border-orange-300",
  "bg-pink-100 text-pink-700 border-pink-300",
  "bg-indigo-100 text-indigo-700 border-indigo-300",
  "bg-teal-100 text-teal-700 border-teal-300",
];

const DEFAULT_PROJECTS = ["Kitchen Rescue", "Sun Tan Business", "House Build"];

function TaskItem({ task, onToggle, onDelete, onDragStart, onEdit, projectColor, onTouchStart, isDragging }) {
  const priority = PRIORITY_LEVELS.find(p => p.id === task.priority) || PRIORITY_LEVELS[1];
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onTouchStart) {
          onTouchStart(e, task);
        }
      }}
      className={`p-2 rounded-lg border-2 cursor-move transition-all hover:shadow-md ${
        task.completed ? "opacity-60 line-through" : ""
      } ${projectColor || "bg-gray-100"} ${isDragging ? "opacity-50 scale-95 shadow-lg" : ""}`}
      style={{ 
        touchAction: 'none', 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <div className="flex items-start gap-1.5">
        <button onClick={() => onToggle(task.id)} className="mt-0.5 flex-shrink-0">
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs leading-tight cursor-pointer hover:text-blue-600" onClick={() => onEdit(task)}>{task.title}</div>
          {task.description && (
            <div className="text-[10px] text-gray-600 mt-0.5 line-clamp-1">{task.description}</div>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <Badge className={priority.color} style={{ fontSize: "9px", padding: "1px 4px", lineHeight: "1.2" }}>
              {priority.name}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="text-gray-400 hover:text-blue-500 flex-shrink-0" title="Edit task">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-gray-400 hover:text-red-500 flex-shrink-0" title="Delete task">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarDay({ day, tasks, onDrop, onDragOver, isCurrentMonth, view, projects, onDragStart, onEdit, onUnschedule, onTouchStart }) {
  const dayTasks = tasks.filter(t => t.date && isSameDay(new Date(t.date), day));
  const isTodayDate = isToday(day);

  const getProjectColor = (projectName) => {
    const index = projects.indexOf(projectName);
    return PROJECT_COLORS[index % PROJECT_COLORS.length] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <div
      data-day={format(day, "yyyy-MM-dd")}
      className={`min-h-[200px] md:min-h-[120px] rounded-lg border-2 p-1.5 md:p-2 ${
        isTodayDate ? "border-red-500 bg-red-50" : "border-gray-200"
      } ${!isCurrentMonth ? "opacity-40" : ""}`}
      onDrop={(e) => onDrop(e, day)}
      onDragOver={onDragOver}
    >
      <div className={`text-xs font-semibold mb-1 ${isTodayDate ? "text-red-600" : "text-gray-600"}`}>
        {format(day, "d")}
      </div>
      <div className="space-y-1">
        {dayTasks.map((task) => {
          const projectColor = getProjectColor(task.project);
          const priority = PRIORITY_LEVELS.find(p => p.id === task.priority) || PRIORITY_LEVELS[1];
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              onTouchStart={(e) => {
                e.stopPropagation();
                onTouchStart && onTouchStart(e, task);
              }}
              className={`text-[10px] px-2 py-1 rounded cursor-move ${projectColor} ${
                task.completed ? "opacity-60 line-through" : ""
              } hover:shadow-sm transition-shadow group relative`}
              style={{ touchAction: 'none' }}
              title={`${task.project} - ${task.title} (${priority.name} priority) - Drag to move or click to edit`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate flex-1" onClick={() => onEdit(task)}>{task.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnschedule(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-600 flex-shrink-0"
                  title="Move back to Tasks to Do"
                >
                  <ArrowUp className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ week, tasks, onDrop, onDragOver, projects, onDragStart, onEdit, onUnschedule, onTouchStart }) {
  const days = eachDayOfInterval({ start: startOfWeek(week), end: endOfWeek(week) });

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[700px] md:min-w-0">
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
          projects={projects}
          onDragStart={onDragStart}
          onEdit={onEdit}
          onUnschedule={onUnschedule}
          onTouchStart={onTouchStart}
        />
      ))}
      </div>
    </div>
  );
}

function MonthView({ month, tasks, onDrop, onDragOver, projects, onDragStart, onEdit, onUnschedule, onTouchStart }) {
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
          projects={projects}
          onDragStart={onDragStart}
          onEdit={onEdit}
          onUnschedule={onUnschedule}
          onTouchStart={onTouchStart}
        />
        ))}
      </div>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("adminToken", data.token);
      onLogin();
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Task Planner</CardTitle>
          <CardDescription>Sign in to access your planner</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="planner-username">Username</Label>
              <Input
                id="planner-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="planner-password">Password</Label>
              <Input
                id="planner-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <Button className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Planner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [showManageProjects, setShowManageProjects] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", project: "" });
  const [editingTask, setEditingTask] = useState(null);
  const [editTask, setEditTask] = useState({ title: "", description: "", priority: "medium", project: "" });
  const [draggedTask, setDraggedTask] = useState(null);
  const [touchDraggedTask, setTouchDraggedTask] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState(null);
  const [touchCurrentPos, setTouchCurrentPos] = useState(null);
  const [syncStatus, setSyncStatus] = useState(""); // "syncing", "synced", "error"
  const rolloverChecked = useRef(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Load tasks and projects from API
  const fetchTasks = async () => {
    try {
      console.log('📥 Fetching tasks from API...');
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      
      if (!res.ok) {
        console.error(`❌ API returned status ${res.status}`);
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(`✅ Loaded ${data.length} tasks from Supabase`);
      
      // Migrate old tasks: add project if missing, convert category to priority
      const migrated = data.map(task => {
        if (!task.project && DEFAULT_PROJECTS.length > 0) {
          task.project = DEFAULT_PROJECTS[0];
        }
        if (task.category && !task.priority) {
          task.priority = "medium";
          delete task.category;
        }
        if (!task.priority) {
          task.priority = "medium";
        }
        return task;
      });
      setTasks(migrated);
      
      // If Supabase is empty but localStorage has tasks, migrate them
      if (data.length === 0) {
        const savedTasks = localStorage.getItem("planner-tasks");
        if (savedTasks) {
          try {
            const parsed = JSON.parse(savedTasks);
            if (parsed.length > 0) {
              console.log(`🔄 Found ${parsed.length} tasks in localStorage, migrating to Supabase...`);
              // Migrate tasks to Supabase
              for (const task of parsed) {
                try {
                  await fetch("/api/tasks", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                    },
                    body: JSON.stringify(task),
                  });
                } catch (e) {
                  console.error("Error migrating task:", e);
                }
              }
              // Reload tasks after migration
              setTimeout(() => fetchTasks(), 500);
            }
          } catch (err) {
            console.error("Error parsing localStorage tasks:", err);
          }
        }
      }
    } catch (e) {
      console.error("❌ Error loading tasks from API:", e);
      // Fallback to localStorage if API fails
      const savedTasks = localStorage.getItem("planner-tasks");
      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          console.log(`⚠️ Using localStorage fallback: ${parsed.length} tasks`);
          setTasks(parsed);
        } catch (err) {
          console.error("Error loading from localStorage:", err);
        }
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProjects(data);
        } else {
          setProjects(DEFAULT_PROJECTS);
        }
      }
    } catch (e) {
      console.error("Error loading projects:", e);
      // Fallback to localStorage
      const savedProjects = localStorage.getItem("planner-projects");
      if (savedProjects) {
        try {
          setProjects(JSON.parse(savedProjects));
        } catch (err) {
          setProjects(DEFAULT_PROJECTS);
        }
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
      fetchProjects();
    }
  }, [isLoggedIn]);

  // Auto-rollover incomplete tasks from past dates to today
  useEffect(() => {
    if (!isLoggedIn || rolloverChecked.current) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const lastRolloverDate = localStorage.getItem("planner-last-rollover");
    
    // Only rollover once per day
    if (lastRolloverDate === today) {
      rolloverChecked.current = true;
      return;
    }

    // Check for incomplete tasks from past dates
    setTasks(currentTasks => {
      const hasIncompletePastTasks = currentTasks.some(
        task => task.date && !task.completed && task.date < today
      );

      if (!hasIncompletePastTasks) {
        rolloverChecked.current = true;
        localStorage.setItem("planner-last-rollover", today);
        return currentTasks;
      }

      const updatedTasks = currentTasks.map(task => {
        // If task has a date in the past and is not completed, move it to today
        if (task.date && !task.completed && task.date < today) {
          const updated = { ...task, date: today };
          // Save to API
          fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: JSON.stringify({ date: today }),
          }).catch(e => console.error("Error updating rolled-over task:", e));
          return updated;
        }
        return task;
      });
      
      rolloverChecked.current = true;
      localStorage.setItem("planner-last-rollover", today);
      return updatedTasks;
    });
  }, [isLoggedIn]); // Run once when user logs in

  // Set default project for new task
  useEffect(() => {
    if (projects.length > 0 && !newTask.project) {
      setNewTask(prev => ({ ...prev, project: projects[0] }));
    }
  }, [projects]);

  // Save tasks to localStorage as backup (tasks are saved to Supabase immediately on each action)
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("planner-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save projects to API
  useEffect(() => {
    if (!isLoggedIn || projects.length === 0) return;
    
    const saveProjects = async () => {
      try {
        await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ projects }),
        });
        // Also save to localStorage as backup
        localStorage.setItem("planner-projects", JSON.stringify(projects));
      } catch (e) {
        console.error("Error saving projects:", e);
        // Fallback to localStorage
        localStorage.setItem("planner-projects", JSON.stringify(projects));
      }
    };
    
    // Debounce project saves
    const timeout = setTimeout(saveProjects, 1000);
    return () => clearTimeout(timeout);
  }, [projects, isLoggedIn]);

  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.project) return;
    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      project: newTask.project,
      completed: false,
      date: null,
      createdAt: new Date().toISOString(),
    };
    
    // Optimistically add to UI
    setTasks([...tasks, task]);
    setNewTask({ title: "", description: "", priority: "medium", project: projects[0] || "" });
    setShowAddTask(false);
    
    // Save to API immediately
    setSyncStatus("syncing");
    try {
      console.log('💾 Saving task to Supabase:', task.id);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(task),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`❌ Failed to save task: ${res.status}`, errorData);
        setSyncStatus("error");
        // Remove from UI if save failed
        setTasks(tasks.filter(t => t.id !== task.id));
        alert('Failed to save task. Please check if Supabase tables are created and try again.');
        setTimeout(() => setSyncStatus(""), 3000);
      } else {
        console.log('✅ Task saved to Supabase successfully');
        setSyncStatus("synced");
        // Also save to localStorage as backup
        localStorage.setItem("planner-tasks", JSON.stringify([...tasks, task]));
        setTimeout(() => setSyncStatus(""), 2000);
      }
    } catch (e) {
      console.error("❌ Error saving task:", e);
      setSyncStatus("error");
      // Remove from UI if save failed
      setTasks(tasks.filter(t => t.id !== task.id));
      alert('Failed to save task. Please check your connection and try again.');
      setTimeout(() => setSyncStatus(""), 3000);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updated = { ...task, completed: !task.completed };
    // Optimistically update UI
    setTasks(tasks.map(t => t.id === id ? updated : t));
    
    // Save to API immediately
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ completed: updated.completed }),
      });
      
      if (!res.ok) {
        console.error(`❌ Failed to update task: ${res.status}`);
        // Revert UI change
        setTasks(tasks);
      } else {
        console.log('✅ Task updated in Supabase');
        // Update localStorage backup
        localStorage.setItem("planner-tasks", JSON.stringify(tasks.map(t => t.id === id ? updated : t)));
      }
    } catch (e) {
      console.error("❌ Error updating task:", e);
      // Revert UI change
      setTasks(tasks);
    }
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    // Optimistically remove from UI
    setTasks(tasks.filter(t => t.id !== id));
    
    // Delete from API immediately
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      
      if (!res.ok) {
        console.error(`❌ Failed to delete task: ${res.status}`);
        // Restore task if delete failed
        if (taskToDelete) {
          setTasks([...tasks, taskToDelete]);
        }
        alert('Failed to delete task. Please try again.');
      } else {
        console.log('✅ Task deleted from Supabase');
        // Update localStorage backup
        localStorage.setItem("planner-tasks", JSON.stringify(tasks.filter(t => t.id !== id)));
      }
    } catch (e) {
      console.error("❌ Error deleting task:", e);
      // Restore task if delete failed
      if (taskToDelete) {
        setTasks([...tasks, taskToDelete]);
      }
      alert('Failed to delete task. Please check your connection and try again.');
    }
  };

  const addProject = () => {
    if (!newProjectName.trim() || projects.includes(newProjectName.trim())) return;
    const updated = [...projects, newProjectName.trim()];
    setProjects(updated);
    setNewProjectName("");
    // Projects will be saved automatically via useEffect
  };

  const removeProject = (projectName) => {
    const projectTasks = tasks.filter(t => t.project === projectName && !t.completed);
    if (projectTasks.length > 0) {
      if (!confirm(`This project has ${projectTasks.length} active task(s). Are you sure you want to remove it?`)) {
        return;
      }
      // Remove tasks or reassign them
      setTasks(tasks.filter(t => t.project !== projectName));
    }
    setProjects(projects.filter(p => p !== projectName));
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = useCallback(async (e, day) => {
    e.preventDefault();
    const taskToDrop = draggedTask || touchDraggedTask;
    if (!taskToDrop) return;

    const dateStr = format(startOfDay(day), "yyyy-MM-dd");
    const originalTask = taskToDrop;
    const updated = { ...taskToDrop, date: dateStr };
    
    // Optimistically update UI
    setTasks(prevTasks => prevTasks.map(t =>
      t.id === taskToDrop.id ? updated : t
    ));
    setDraggedTask(null);
    setTouchDraggedTask(null);
    setTouchStartPos(null);
    
    // Save to API immediately
    try {
      const res = await fetch(`/api/tasks/${taskToDrop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ date: dateStr }),
      });
      
      if (!res.ok) {
        console.error(`❌ Failed to update task date: ${res.status}`);
        // Revert UI change
        setTasks(prevTasks => prevTasks.map(t => t.id === taskToDrop.id ? originalTask : t));
      } else {
        console.log('✅ Task date updated in Supabase');
      }
    } catch (e) {
      console.error("❌ Error updating task date:", e);
      // Revert UI change
      setTasks(prevTasks => prevTasks.map(t => t.id === taskToDrop.id ? originalTask : t));
    }
  }, [draggedTask, touchDraggedTask]);

  // Global touch handler for mobile drag and drop - must be after handleDrop is defined
  useEffect(() => {
    if (!touchDraggedTask) return;

    const handleGlobalTouchMove = (e) => {
      if (touchDraggedTask && e.touches[0]) {
        e.preventDefault();
        const touch = e.touches[0];
        setTouchCurrentPos({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleGlobalTouchEnd = async (e) => {
      if (!touchDraggedTask || !touchStartPos) return;

      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);
      
      if (deltaX < 15 && deltaY < 15) {
        setTouchDraggedTask(null);
        setTouchStartPos(null);
        setTouchCurrentPos(null);
        return;
      }

      e.preventDefault();
      await new Promise(resolve => setTimeout(resolve, 50));

      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!element) {
        setTouchDraggedTask(null);
        setTouchStartPos(null);
        setTouchCurrentPos(null);
        return;
      }

      let dayElement = element;
      let maxDepth = 15;
      while (dayElement && maxDepth > 0 && !dayElement.dataset?.day) {
        dayElement = dayElement.parentElement;
        maxDepth--;
      }

      if (dayElement && dayElement.dataset?.day) {
        try {
          const day = new Date(dayElement.dataset.day);
          if (!isNaN(day.getTime())) {
            await handleDrop(e, day);
            return;
          }
        } catch (err) {
          console.error("Error parsing date:", err);
        }
      }

      setTouchDraggedTask(null);
      setTouchStartPos(null);
      setTouchCurrentPos(null);
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [touchDraggedTask, touchStartPos, handleDrop]);

  // Mobile touch handlers - improved version
  const handleTouchStart = (e, task) => {
    e.preventDefault(); // Prevent text selection
    e.stopPropagation();
    const touch = e.touches[0];
    if (touch) {
      setTouchDraggedTask(task);
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setTouchCurrentPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (!touchDraggedTask) return;
    e.preventDefault(); // Prevent scrolling while dragging
    e.stopPropagation();
    const touch = e.touches[0];
    setTouchCurrentPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = async (e) => {
    e.stopPropagation();
    
    if (!touchDraggedTask || !touchStartPos) {
      setTouchDraggedTask(null);
      setTouchStartPos(null);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    console.log('📱 Touch end:', { deltaX, deltaY, x: touch.clientX, y: touch.clientY });
    
    // Only treat as drag if moved more than 15px (increased threshold for mobile)
    if (deltaX < 15 && deltaY < 15) {
      // It's a tap, not a drag - allow normal click behavior
      console.log('📱 Tap detected, not drag');
      setTouchDraggedTask(null);
      setTouchStartPos(null);
      return;
    }

    // Prevent click event from firing after drag
    e.preventDefault();
    e.stopPropagation();

    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 50));

    // Find the element at the touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    console.log('📱 Element at point:', element?.className, element?.dataset);
    
    if (!element) {
      console.log('📱 No element found at touch point');
      setTouchDraggedTask(null);
      setTouchStartPos(null);
      return;
    }

    // Find the calendar day element (look for data-day attribute in element or parents)
    let dayElement = element;
    let maxDepth = 15; // Increased depth
    while (dayElement && maxDepth > 0 && !dayElement.dataset?.day) {
      dayElement = dayElement.parentElement;
      maxDepth--;
    }

    console.log('📱 Day element found:', dayElement?.dataset?.day);

    if (dayElement && dayElement.dataset?.day) {
      try {
        const day = new Date(dayElement.dataset.day);
        if (!isNaN(day.getTime())) {
          console.log('📱 Dropping task on:', day);
          await handleDrop(e, day);
          return;
        } else {
          console.log('📱 Invalid date parsed');
        }
      } catch (err) {
        console.error("📱 Error parsing date from data-day:", err);
      }
    } else {
      console.log('📱 No valid day element found');
    }
    
    // If we couldn't find a valid day, reset
    setTouchDraggedTask(null);
    setTouchStartPos(null);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      project: task.project || projects[0] || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTask.title.trim() || !editTask.project) return;
    const originalTask = editingTask;
    const updated = {
      ...editingTask,
      title: editTask.title,
      description: editTask.description,
      priority: editTask.priority,
      project: editTask.project
    };
    
    // Optimistically update UI
    setTasks(tasks.map(t =>
      t.id === editingTask.id ? updated : t
    ));
    setEditingTask(null);
    setEditTask({ title: "", description: "", priority: "medium", project: "" });
    
    // Save to API immediately
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          title: editTask.title,
          description: editTask.description,
          priority: editTask.priority,
          project: editTask.project
        }),
      });
      
      if (!res.ok) {
        console.error(`❌ Failed to update task: ${res.status}`);
        // Revert UI change
        setTasks(tasks.map(t => t.id === editingTask.id ? originalTask : t));
        alert('Failed to save changes. Please try again.');
      } else {
        console.log('✅ Task updated in Supabase');
        // Update localStorage backup
        localStorage.setItem("planner-tasks", JSON.stringify(tasks.map(t => t.id === editingTask.id ? updated : t)));
      }
    } catch (e) {
      console.error("❌ Error updating task:", e);
      // Revert UI change
      setTasks(tasks.map(t => t.id === editingTask.id ? originalTask : t));
      alert('Failed to save changes. Please check your connection and try again.');
    }
  };

  const handleUnschedule = async (taskId) => {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;
    
    // Optimistically update UI
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, date: null } : t
    ));
    
    // Save to API immediately
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ date: null }),
      });
      
      if (!res.ok) {
        console.error(`❌ Failed to unschedule task: ${res.status}`);
        // Revert UI change
        setTasks(tasks.map(t => t.id === taskId ? originalTask : t));
      } else {
        console.log('✅ Task unscheduled in Supabase');
        // Update localStorage backup
        localStorage.setItem("planner-tasks", JSON.stringify(tasks.map(t => t.id === taskId ? { ...t, date: null } : t)));
      }
    } catch (e) {
      console.error("❌ Error unscheduling task:", e);
      // Revert UI change
      setTasks(tasks.map(t => t.id === taskId ? originalTask : t));
    }
  };

  const todaysTasks = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return tasks.filter(t => t.date === today);
  }, [tasks]);

  const unassignedTasks = useMemo(() => {
    return tasks.filter(t => !t.date && !t.completed);
  }, [tasks]);

  const tasksByProjectAndPriority = useMemo(() => {
    const grouped = {};
    projects.forEach(project => {
      grouped[project] = {
        high: [],
        medium: [],
        low: [],
      };
      unassignedTasks
        .filter(t => t.project === project)
        .forEach(task => {
          const priority = task.priority || "medium";
          if (grouped[project][priority]) {
            grouped[project][priority].push(task);
          }
        });
    });
    return grouped;
  }, [unassignedTasks, projects]);

  const getProjectColor = (projectName) => {
    const index = projects.indexOf(projectName);
    return PROJECT_COLORS[index % PROJECT_COLORS.length] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const todaysTasksByProject = useMemo(() => {
    const grouped = {};
    todaysTasks.forEach(task => {
      if (!grouped[task.project]) {
        grouped[task.project] = [];
      }
      grouped[task.project].push(task);
    });
    return grouped;
  }, [todaysTasks]);

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            <span className="font-semibold">Task Planner</span>
            {syncStatus && (
              <span className={`text-xs px-2 py-1 rounded ${
                syncStatus === "synced" ? "bg-green-100 text-green-700" :
                syncStatus === "syncing" ? "bg-blue-100 text-blue-700" :
                "bg-red-100 text-red-700"
              }`}>
                {syncStatus === "synced" ? "✓ Synced" :
                 syncStatus === "syncing" ? "Syncing..." :
                 "Sync Error"}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowManageProjects(!showManageProjects)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Projects
            </Button>
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
        {/* Manage Projects Modal */}
        {showManageProjects && (
          <Card className="mb-4 bg-white border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Manage Projects</span>
                <Button variant="ghost" size="sm" onClick={() => setShowManageProjects(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addProject()}
                  />
                  <Button onClick={addProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${getProjectColor(project).split(" ")[0]}`}></span>
                        <span className="font-medium">{project}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProject(project)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="space-y-4">
                {Object.entries(todaysTasksByProject).map(([project, projectTasks]) => (
                  <div key={project}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded ${getProjectColor(project).split(" ")[0]}`}></span>
                      {project}
                    </h3>
                    <div className="space-y-2">
                      {projectTasks.map((task) => {
                        const priority = PRIORITY_LEVELS.find(p => p.id === task.priority) || PRIORITY_LEVELS[1];
                        return (
                          <div
                            key={task.id}
                            className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                              task.completed ? "opacity-60 line-through" : ""
                            } ${getProjectColor(task.project)}`}
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
                            <Badge className={priority.color}>
                              {priority.name}
                            </Badge>
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-gray-400 hover:text-blue-500"
                              title="Edit task"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tasks by Project and Priority */}
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
            <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
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
                        value={newTask.project}
                        onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                      >
                        {projects.map((project) => (
                          <option key={project} value={project}>
                            {project}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      >
                        {PRIORITY_LEVELS.map((priority) => (
                          <option key={priority.id} value={priority.id}>
                            {priority.name} Priority
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

              {projects.map((project) => {
                const projectTasks = tasksByProjectAndPriority[project] || { high: [], medium: [], low: [] };
                const totalTasks = projectTasks.high.length + projectTasks.medium.length + projectTasks.low.length;
                
                if (totalTasks === 0 && !showAddTask) return null;

                return (
                  <div key={project} className="space-y-2">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-1">
                      <span className={`w-3 h-3 rounded ${getProjectColor(project).split(" ")[0]}`}></span>
                      {project}
                      <span className="text-xs font-normal text-gray-500">({totalTasks})</span>
                    </h2>
                    
                    {PRIORITY_LEVELS.map((priority) => {
                      const priorityTasks = projectTasks[priority.id] || [];
                      if (priorityTasks.length === 0) return null;
                      
                      return (
                        <div key={priority.id} className="ml-4 space-y-1">
                          <h3 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded ${priority.color.split(" ")[0]}`}></span>
                            {priority.name} Priority ({priorityTasks.length})
                          </h3>
                          <div className="space-y-1">
                            {priorityTasks.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onDragStart={handleDragStart}
                                onEdit={handleEdit}
                                projectColor={getProjectColor(task.project)}
                                onTouchStart={handleTouchStart}
                                isDragging={touchDraggedTask?.id === task.id || draggedTask?.id === task.id}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                  projects={projects}
                  onDragStart={handleDragStart}
                  onEdit={handleEdit}
                  onUnschedule={handleUnschedule}
                  onTouchStart={handleTouchStart}
                />
              ) : (
                <MonthView
                  month={currentDate}
                  tasks={tasks}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  projects={projects}
                  onDragStart={handleDragStart}
                  onEdit={handleEdit}
                  onUnschedule={handleUnschedule}
                  onTouchStart={handleTouchStart}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Edit Task</span>
                  <Button variant="ghost" size="sm" onClick={() => setEditingTask(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Task Title</Label>
                    <Input
                      value={editTask.title}
                      onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                      placeholder="Task title"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Input
                      value={editTask.description}
                      onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <Label>Project</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={editTask.project}
                      onChange={(e) => setEditTask({ ...editTask, project: e.target.value })}
                    >
                      {projects.map((project) => (
                        <option key={project} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={editTask.priority}
                      onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                    >
                      {PRIORITY_LEVELS.map((priority) => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name} Priority
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingTask(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
