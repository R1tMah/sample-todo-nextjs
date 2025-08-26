// components/ChangeTaskModal.tsx
import { useState } from 'react';
import { useCreateTask, useFindManyTask, useUpdateTodo } from '@lib/hooks';

type Props = {
  spaceId: string;
  todoId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ChangeTaskModal({ spaceId, todoId, userId, isOpen, onClose }: Props) {
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: results } = useFindManyTask(
    {
      where: {
        spaceId,
        title: q ? { contains: q, mode: 'insensitive' } : undefined,
      },
      take: q ? 8 : 0,
      orderBy: { title: 'asc' } as const,
    },
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const { trigger: createTask } = useCreateTask({ optimisticUpdate: true });
  const { trigger: updateTodo } = useUpdateTodo({ optimisticUpdate: true });

  if (!isOpen) return null;

  const confirm = async () => {
    let taskId = selectedId;
    const title = q.trim();
    if (!taskId && title) {
      const created = await createTask({
        data: {
          title,
          space: { connect: { id: spaceId } },
          owner: { connect: { id: userId } },
        },
      });
      taskId = created?.id ?? null;
    }
    if (!taskId) return;

    await updateTodo({
      where: { id: todoId },
      data: { task: { connect: { id: taskId } } },
      include: { owner: true, task: true },
    });
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-black font-bold text-lg mb-3">Change Task</h3>

        <input
          className="text-black input input-bordered w-full"
          placeholder="Search tasks or type a new title…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSelectedId(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') void confirm(); }}
        />

        {q && (
          <ul className="menu bg-base-100 rounded-box shadow mt-2 max-h-56 overflow-auto">
            {(results ?? []).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className={selectedId === t.id ? 'active justify-start' : 'justify-start'}
                  onClick={() => {
                    setSelectedId(t.id);
                    setQ(t.title);
                  }}
                >
                  <div className="text-sm">
                    <div className="text-black font-medium">{t.title}</div>
                    {t.description && <div className="text-xs opacity-70 line-clamp-1">{t.description}</div>}
                  </div>
                </button>
              </li>
            ))}
            {results?.length === 0 && (
              <li className="pointer-events-none px-3 py-2 text-sm opacity-70">No matches, press Enter to create</li>
            )}
          </ul>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void confirm()}>
            {selectedId ? 'Use Selected' : q.trim() ? `Create “${q.trim()}”` : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
