import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'iphone-todo-pwa.tasks.v1';

const starterTasks = [
  'Learning Programming by 12PM',
  'Learn how to cook by 1PM',
  'Learn how to play at 2PM',
  'Have lunch at 4PM',
  'Going to travel 6PM',
  'Learning Programming by 12PM',
  'Going to travel 6PM',
].map((title, index) => ({
  id: `starter-active-${index}`,
  title,
  status: 'active',
  previousStatus: null,
  createdAt: new Date(2026, 4, 31, 9, index).toISOString(),
  completedAt: null,
}));

const starterBacklog = ['Убраться на кухне', 'Постирать вещи'].map((title, index) => ({
  id: `starter-backlog-${index}`,
  title,
  status: 'backlog',
  previousStatus: null,
  createdAt: new Date(2026, 4, 31, 10, index).toISOString(),
  completedAt: null,
}));

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [...starterTasks, ...starterBacklog];
  } catch {
    return [...starterTasks, ...starterBacklog];
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [menuTaskId, setMenuTaskId] = useState(null);

  // Keep React state and localStorage in sync so tasks survive reloads and PWA launches.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const groupedTasks = useMemo(
    () => ({
      active: tasks.filter((task) => task.status === 'active'),
      backlog: tasks.filter((task) => task.status === 'backlog'),
      completed: tasks.filter((task) => task.status === 'completed'),
    }),
    [tasks],
  );

  function addTask(event) {
    event.preventDefault();
    const title = draftTitle.trim();

    if (!title) return;

    setTasks((currentTasks) => [
      {
        id: crypto.randomUUID(),
        title,
        status: 'active',
        previousStatus: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      ...currentTasks,
    ]);
    setDraftTitle('');
    setIsComposerOpen(false);
  }

  function toggleCompleted(task) {
    setTasks((currentTasks) =>
      currentTasks.map((item) => {
        if (item.id !== task.id) return item;

        if (item.status === 'completed') {
          return {
            ...item,
            status: item.previousStatus || 'active',
            previousStatus: null,
            completedAt: null,
          };
        }

        return {
          ...item,
          status: 'completed',
          previousStatus: item.status,
          completedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function moveTask(task) {
    const nextStatus = task.status === 'active' ? 'backlog' : 'active';

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: nextStatus,
              previousStatus: null,
              completedAt: null,
            }
          : item,
      ),
    );
    setMenuTaskId(null);
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    setMenuTaskId(null);
  }

  return (
    <main className="app-shell" onClick={() => setMenuTaskId(null)}>
      <section className="phone-frame">
        <Header onAdd={() => setIsComposerOpen(true)} />

        <section className="task-area">
          <SectionTitle>Активные задачи</SectionTitle>

          {isComposerOpen && (
            <form className="composer" onSubmit={addTask} onClick={(event) => event.stopPropagation()}>
              <input
                autoFocus
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Новая задача"
                aria-label="Название новой задачи"
              />
              <button type="submit">Добавить</button>
            </form>
          )}

          <TaskList
            tasks={groupedTasks.active}
            menuTaskId={menuTaskId}
            onToggle={toggleCompleted}
            onOpenMenu={setMenuTaskId}
            onMove={moveTask}
            onDelete={deleteTask}
          />

          <ToggleSection
            label="Показать беклог"
            isOpen={isBacklogOpen}
            count={groupedTasks.backlog.length}
            variant="backlog"
            onClick={() => setIsBacklogOpen((value) => !value)}
          />

          {isBacklogOpen && (
            <TaskList
              tasks={groupedTasks.backlog}
              menuTaskId={menuTaskId}
              onToggle={toggleCompleted}
              onOpenMenu={setMenuTaskId}
              onMove={moveTask}
              onDelete={deleteTask}
              variant="backlog"
            />
          )}

          <ToggleSection
            label="Показать выполненные задачи"
            isOpen={isCompletedOpen}
            count={groupedTasks.completed.length}
            variant="completed"
            onClick={() => setIsCompletedOpen((value) => !value)}
          />

          {isCompletedOpen && (
            <TaskList
              tasks={groupedTasks.completed}
              menuTaskId={menuTaskId}
              onToggle={toggleCompleted}
              onOpenMenu={setMenuTaskId}
              onMove={moveTask}
              onDelete={deleteTask}
              variant="completed"
            />
          )}
        </section>
      </section>
    </main>
  );
}

function Header({ onAdd }) {
  return (
    <header className="header">
      <div className="status-row" aria-hidden="true">
        <span>9:30 PM</span>
        <span className="status-icons">
          <span className="cellular">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="wifi">
            <i />
          </span>
          <span className="battery">
            <i />
          </span>
        </span>
      </div>
      <div className="title-row">
        <h1>Дела на день</h1>
        <button className="add-button" type="button" onClick={onAdd} aria-label="Добавить задачу">
          +
        </button>
      </div>
    </header>
  );
}

function SectionTitle({ children }) {
  return <h2 className="section-title">{children}</h2>;
}

function ToggleSection({ label, count, variant, onClick }) {
  return (
    <button className={`toggle-section toggle-section--${variant}`} type="button" onClick={onClick}>
      <span>{label}</span>
      <span className="section-count">{count}</span>
    </button>
  );
}

function TaskList({ tasks, menuTaskId, onToggle, onOpenMenu, onMove, onDelete, variant = 'active' }) {
  if (tasks.length === 0) {
    return <p className={`empty-state empty-state--${variant}`}>Пока пусто</p>;
  }

  return (
    <ul className={`task-list task-list--${variant}`}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isMenuOpen={menuTaskId === task.id}
          onToggle={onToggle}
          onOpenMenu={onOpenMenu}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TaskItem({ task, isMenuOpen, onToggle, onOpenMenu, onMove, onDelete }) {
  const [isSwiped, setIsSwiped] = useState(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);

  function clearLongPress() {
    window.clearTimeout(longPressTimer.current);
  }

  function handlePointerDown(event) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    setIsSwiped(false);

    // A short timer keeps long press simple and predictable on touch screens.
    longPressTimer.current = window.setTimeout(() => {
      onOpenMenu(task.id);
    }, 520);
  }

  function handlePointerMove(event) {
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = Math.abs(event.clientY - pointerStart.current.y);

    if (Math.abs(deltaX) > 8 || deltaY > 8) clearLongPress();

    // Lightweight left-swipe: reveal delete after a deliberate horizontal move.
    if (deltaX < -48 && deltaY < 32) {
      setIsSwiped(true);
    }
  }

  function handlePointerUp() {
    clearLongPress();
  }

  const canMove = task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  return (
    <li className={`task-row ${isSwiped ? 'is-swiped' : ''} ${isCompleted ? 'is-completed' : ''}`}>
      <button className="delete-button" type="button" onClick={() => onDelete(task.id)}>
        Удалить
      </button>
      <div
        className="task-content"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={clearLongPress}
      >
        <button className="checkbox" type="button" onClick={() => onToggle(task)} aria-label="Изменить статус задачи">
          {isCompleted ? '✓' : ''}
        </button>
        <span className="task-title">{task.title}</span>
      </div>

      {isMenuOpen && (
        <div className="task-menu" onClick={(event) => event.stopPropagation()}>
          {canMove && (
            <button type="button" onClick={() => onMove(task)}>
              {task.status === 'active' ? 'Переместить в беклог' : 'Вернуть в активные'}
            </button>
          )}
          <button type="button" onClick={() => onDelete(task.id)}>
            Удалить
          </button>
        </div>
      )}
    </li>
  );
}

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // The app still works without offline caching, so registration failures are intentionally quiet.
    });
  });
}
