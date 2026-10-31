import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { AreaName, areas } from '../constants/theme';
import { hinduEvents2026 } from '../constants/hinduEvents2026';
import { useAuth } from './useAuth';
import { db } from '../firebase';
export type Task = { id: string; title: string; description: string; dueDate: string | null; completed: boolean };
type TaskMap = Record<AreaName, Task[]>;
type ContextValue = { tasks: TaskMap; addTask: (area: AreaName, title: string, description: string, dueDate: string | null) => Promise<void>; updateTask: (task: Task, title: string, description: string, dueDate: string | null) => Promise<void>; deleteTask: (task: Task) => Promise<void>; toggleTask: (task: Task) => Promise<void>; error: string | null };
const emptyTasks = (): TaskMap => ({ Health: [], Wealth: [], Career: [], Personal: [], Events: [] });
const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localMonthKey = (date = new Date()) => localDateKey(date).slice(0, 7);
const dailyHealthTasks = (dateKey: string) => [
  ...Array.from({ length: 8 }, (_, index) => ({ id: `daily-health-${dateKey}-water-${index + 1}`, title: `Drink a glass of water (${index + 1} of 8)` })),
  { id: `daily-health-${dateKey}-walk`, title: 'Walk for 30–60 minutes' },
];
const monthlyWealthTasks = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const rentDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return [
    { id: `monthly-finance-${monthKey}-rent`, title: 'Check Home Rent', dueDate: rentDate },
    { id: `monthly-finance-${monthKey}-personal-loan`, title: 'Check installment of Personal loan', dueDate: null },
    { id: `monthly-finance-${monthKey}-sip`, title: 'SIP Deduction', dueDate: null },
    { id: `monthly-finance-${monthKey}-home-loans`, title: 'Home loans', dueDate: null },
  ];
};
const annualEventTasks = () => hinduEvents2026.map(event => ({
  id: `hindu-event-2026-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  title: event.title,
  dueDate: event.date,
}));
const TaskContext = createContext<ContextValue | null>(null);
export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskMap>(emptyTasks);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setTasks(emptyTasks()); setError(null);
    if (!db || !user) return;
    const taskCollection = collection(db, 'users', user.uid, 'tasks');
    return onSnapshot(taskCollection, snapshot => {
      const next = emptyTasks();
      snapshot.docs.forEach(document => {
        const data = document.data();
        if (data.deleted === true) return;
        // Daily Health checklists are scoped to today's local date.
        if (document.id.startsWith('daily-health-') && !document.id.startsWith(`daily-health-${localDateKey()}-`)) return;
        // Wealth reminders are a fresh checklist for each calendar month.
        if (document.id.startsWith('monthly-finance-') && !document.id.startsWith(`monthly-finance-${localMonthKey()}-`)) return;
        if (document.id.startsWith('hindu-event-') && !document.id.startsWith('hindu-event-2026-')) return;
        if (areas.includes(data.area) && typeof data.title === 'string') {
          next[data.area as AreaName].push({ id: document.id, title: data.title, description: typeof data.description === 'string' ? data.description : '', dueDate: typeof data.dueDate === 'string' ? data.dueDate : null, completed: data.completed === true });
        }
      });
      Object.values(next).forEach(list => list.sort((left, right) => Number(left.completed) - Number(right.completed)));
      const today = localDateKey();
      next.Events.sort((left, right) => {
        const leftDate = left.dueDate ?? '9999-99-99';
        const rightDate = right.dueDate ?? '9999-99-99';
        const pastOrder = Number(leftDate < today) - Number(rightDate < today);
        return pastOrder || leftDate.localeCompare(rightDate);
      });
      setTasks(next); setError(null);
    }, reason => setError(reason.message || 'Could not load tasks from Firestore.'));
  }, [user?.uid]);
  useEffect(() => {
    if (!db || !user) return;
    const firestore = db;
    const dateKey = localDateKey();
    const monthKey = localMonthKey();
    const taskCollection = collection(firestore, 'users', user.uid, 'tasks');
    let cancelled = false;
    getDocs(taskCollection).then(snapshot => {
      if (cancelled) return;
      const existing = new Set(snapshot.docs.map(item => item.id));
      const defaults = [
        ...dailyHealthTasks(dateKey).map(task => ({ ...task, area: 'Health' as const, dueDate: dateKey })),
        ...monthlyWealthTasks(monthKey).map(task => ({ ...task, area: 'Wealth' as const })),
        ...annualEventTasks().map(task => ({ ...task, area: 'Events' as const })),
      ];
      return Promise.all(defaults.filter(task => !existing.has(task.id)).map(task =>
        setDoc(doc(firestore, 'users', user.uid, 'tasks', task.id), {
          area: task.area, title: task.title, description: '', dueDate: task.dueDate, completed: false, createdAt: serverTimestamp(),
        }).catch(() => {
          // Another signed-in device may have created these defaults first.
        })
      ));
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load daily Health tasks.'));
    return () => { cancelled = true; };
  }, [user?.uid]);
  const value = useMemo<ContextValue>(() => ({
    tasks, error,
    addTask: async (area, title, description, dueDate) => {
      if (!db || !user) throw new Error('Sign in to save tasks.');
      await addDoc(collection(db, 'users', user.uid, 'tasks'), { area, title, description, dueDate, completed: false, createdAt: serverTimestamp() });
    },
    updateTask: async (task, title, description, dueDate) => {
      if (!db || !user) throw new Error('Sign in to update tasks.');
      await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { title, description, dueDate });
    },
    deleteTask: async task => {
      if (!db || !user) throw new Error('Sign in to delete tasks.');
      const reference = doc(db, 'users', user.uid, 'tasks', task.id);
      if (task.id.startsWith('daily-health-') || task.id.startsWith('monthly-finance-') || task.id.startsWith('hindu-event-2026-')) await updateDoc(reference, { deleted: true });
      else await deleteDoc(reference);
    },
    toggleTask: async task => {
      if (!db || !user) throw new Error('Sign in to update tasks.');
      try { await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { completed: !task.completed }); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update this task.'); throw reason; }
    },
  }), [tasks, error, user?.uid]);
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
export function useTasks() { const value = useContext(TaskContext); if (!value) throw new Error('useTasks must be inside TaskProvider'); return value; }
