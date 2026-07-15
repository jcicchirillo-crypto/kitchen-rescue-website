const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('./lib/supabaseAdmin');

// Use admin client if available (bypasses RLS)
const supabase = supabaseAdmin;
const useSupabase = !!supabaseAdmin;

if (useSupabase) {
    console.log('✅ Using Supabase admin client for tasks storage (bypasses RLS)');
} else {
    console.log('⚠️ Supabase admin client not available - falling back to file system (will not work on Vercel!)');
}

// Get all tasks
async function getAllTasks() {
    if (useSupabase && supabase) {
        try {
            console.log('📥 Fetching tasks from Supabase (admin client)...');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌❌❌ SUPABASE TASKS SELECT ERROR ❌❌❌');
                console.error('Error object:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                
                // Check if table doesn't exist
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.error('⚠️⚠️⚠️ TASKS TABLE DOES NOT EXIST IN SUPABASE!');
                    console.error('⚠️⚠️⚠️ Please run SUPABASE_TASKS_SETUP.sql in Supabase SQL Editor');
                }
                
                return [];
            }
            
            console.log(`✅ Fetched ${data?.length || 0} tasks from Supabase`);
            
            // Map Supabase schema to expected format
            const mappedData = (data || []).map(task => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                priority: task.priority || 'medium',
                project: task.project || '',
                completed: task.completed || false,
                date: task.date || null,
                assignee: task.assignee || 'joe',
                rolledOver: !!task.rolled_over,
                originalDate: task.original_date || null,
                createdAt: task.created_at
            }));
            
            return mappedData;
        } catch (error) {
            console.error('❌ Exception reading tasks from Supabase:', error);
            console.error('Error stack:', error.stack);
            return [];
        }
    } else {
        console.log('⚠️ Using file system (Supabase admin client not available)');
        // Fall back to file system for local development
        const tasksPath = path.join(__dirname, '..', 'tasks.json');
        try {
            const data = fs.readFileSync(tasksPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return empty array
            return [];
        }
    }
}

// Get all projects
async function getAllProjects() {
    if (useSupabase && supabase) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error fetching projects from Supabase:', error);
                return [];
            }
            
            return (data || []).map(p => p.name);
        } catch (error) {
            console.error('❌ Exception reading projects from Supabase:', error);
            return [];
        }
    } else {
        // Fall back to file system
        const projectsPath = path.join(__dirname, '..', 'projects.json');
        try {
            const data = fs.readFileSync(projectsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
}

// Add a new task
async function addTask(newTask) {
    if (useSupabase && supabase) {
        try {
            const taskData = {
                id: newTask.id,
                title: newTask.title,
                description: newTask.description || null,
                priority: newTask.priority || 'medium',
                project: newTask.project || null,
                completed: newTask.completed || false,
                date: newTask.date || null,
                assignee: newTask.assignee || 'joe',
            };
            
            console.log('💾 Attempting to save task to Supabase:', taskData.id);
            console.log('Task data:', JSON.stringify(taskData, null, 2));
            
            const { data, error } = await supabase
                .from('tasks')
                .insert([taskData])
                .select()
                .single();
            
            if (error) {
                // Retry without assignee if column missing
                if (error.message?.includes('assignee') || error.code === '42703') {
                    const legacy = { ...taskData };
                    delete legacy.assignee;
                    const retry = await supabase.from('tasks').insert([legacy]).select().single();
                    if (retry.error) {
                        console.error('❌ Supabase task insert error:', retry.error.message);
                        return false;
                    }
                    console.log('✅ Task saved (without assignee — run SUPABASE_TASKS_ASSIGNEE_SETUP.sql)');
                    return true;
                }
                console.error('❌❌❌ SUPABASE TASK INSERT ERROR ❌❌❌');
                console.error('Error object:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                
                // Check if table doesn't exist
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.error('⚠️⚠️⚠️ TASKS TABLE DOES NOT EXIST IN SUPABASE!');
                    console.error('⚠️⚠️⚠️ Please run SUPABASE_TASKS_SETUP.sql in Supabase SQL Editor');
                }
                
                return false;
            }
            
            console.log('✅✅✅ Task saved to Supabase successfully:', data?.id);
            return true;
        } catch (error) {
            console.error('❌ Exception saving task to Supabase:', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    } else {
        console.log('⚠️ Supabase not available - attempting file system save (will fail on Vercel)');
        const tasks = await getAllTasks();
        tasks.push(newTask);
        return await saveAllTasks(tasks);
    }
}

// Update a task
async function updateTask(taskId, updates) {
    if (useSupabase && supabase) {
        try {
            // Map camelCase API fields to snake_case columns
            const dbUpdates = { ...updates };
            if (Object.prototype.hasOwnProperty.call(dbUpdates, 'rolledOver')) {
                dbUpdates.rolled_over = !!dbUpdates.rolledOver;
                delete dbUpdates.rolledOver;
            }
            if (Object.prototype.hasOwnProperty.call(dbUpdates, 'originalDate')) {
                dbUpdates.original_date = dbUpdates.originalDate;
                delete dbUpdates.originalDate;
            }
            if (Object.prototype.hasOwnProperty.call(dbUpdates, 'createdAt')) {
                delete dbUpdates.createdAt;
            }

            console.log(`💾 Updating task ${taskId} in Supabase:`, JSON.stringify(dbUpdates, null, 2));

            const { data, error } = await supabase
                .from('tasks')
                .update(dbUpdates)
                .eq('id', taskId)
                .select();

            if (error) {
                // Retry without rollover/assignee columns if migration not applied yet
                if (
                    error.message?.includes('rolled_over')
                    || error.message?.includes('original_date')
                    || error.message?.includes('assignee')
                    || error.code === '42703'
                ) {
                    const legacy = { ...dbUpdates };
                    delete legacy.rolled_over;
                    delete legacy.original_date;
                    delete legacy.assignee;
                    const retry = await supabase
                        .from('tasks')
                        .update(legacy)
                        .eq('id', taskId)
                        .select();
                    if (retry.error) {
                        console.error('❌ Supabase task update error:', retry.error.message);
                        return false;
                    }
                    console.log('✅ Task updated (without newer columns — run SUPABASE_TASKS_* setup SQL)');
                    return true;
                }
                console.error('❌❌❌ SUPABASE TASK UPDATE ERROR ❌❌❌');
                console.error('Error object:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);

                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.error('⚠️⚠️⚠️ TASKS TABLE DOES NOT EXIST IN SUPABASE!');
                    console.error('⚠️⚠️⚠️ Please run SUPABASE_TASKS_SETUP.sql in Supabase SQL Editor');
                }

                return false;
            }

            console.log('✅✅✅ Task updated in Supabase successfully');
            return true;
        } catch (error) {
            console.error('❌ Exception updating task in Supabase:', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    } else {
        const tasks = await getAllTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index === -1) {
            return false;
        }
        tasks[index] = { ...tasks[index], ...updates };
        return await saveAllTasks(tasks);
    }
}

// Delete a task
async function deleteTask(taskId) {
    if (useSupabase && supabase) {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);
            
            if (error) {
                console.error('❌❌❌ SUPABASE TASK DELETE ERROR ❌❌❌');
                console.error('Error object:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                // Check if table doesn't exist
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.error('⚠️⚠️⚠️ TASKS TABLE DOES NOT EXIST IN SUPABASE!');
                    console.error('⚠️⚠️⚠️ Please run SUPABASE_TASKS_SETUP.sql in Supabase SQL Editor');
                }
                
                return false;
            }
            
            console.log('✅✅✅ Task deleted from Supabase successfully');
            return true;
        } catch (error) {
            console.error('Error deleting task from Supabase:', error);
            return false;
        }
    } else {
        const tasks = await getAllTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        return await saveAllTasks(filtered);
    }
}

// Save all tasks (for file system fallback)
async function saveAllTasks(tasks) {
    if (useSupabase && supabase) {
        console.log('Bulk save not supported in Supabase - use addTask or updateTask');
        return true;
    } else {
        const tasksPath = path.join(__dirname, '..', 'tasks.json');
        try {
            fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving tasks to file system:', error);
            return false;
        }
    }
}

// Save all projects
async function saveAllProjects(projects) {
    if (useSupabase && supabase) {
        // For projects, we'll use a simple approach - delete all and reinsert
        try {
            // Delete existing projects
            await supabase.from('projects').delete().neq('id', '0'); // Delete all
            
            // Insert new projects
            if (projects.length > 0) {
                const projectData = projects.map((name, index) => ({
                    id: `project-${index}`,
                    name: name,
                    created_at: new Date().toISOString()
                }));
                
                const { error } = await supabase
                    .from('projects')
                    .insert(projectData);
                
                if (error) {
                    console.error('Error saving projects to Supabase:', error);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error saving projects to Supabase:', error);
            return false;
        }
    } else {
        const projectsPath = path.join(__dirname, '..', 'projects.json');
        try {
            fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving projects to file system:', error);
            return false;
        }
    }
}

module.exports = {
    getAllTasks,
    getAllProjects,
    addTask,
    updateTask,
    deleteTask,
    saveAllTasks,
    saveAllProjects
};

