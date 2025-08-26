import { TrashIcon, PencilSquareIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useDeleteTodo, useUpdateTodo, useCheckTask, useCheckTodo } from '@lib/hooks';
import type { Prisma } from '@prisma/client';
type TodoWithOwnerTask = Prisma.TodoGetPayload<{ include: { owner: true; task: true } }>;
import { ChangeEvent, useState } from 'react';
import Avatar from './Avatar';
import TimeInfo from './TimeInfo';
import EditTaskModal from './EditTaskModal';
import ChangeTaskModal from './ChangeTaskModal';
import { useSession } from 'next-auth/react';
import { Barlow, League_Spartan } from 'next/font/google';

type Props = {
    value: TodoWithOwnerTask;
    optimistic?: boolean;
};

export default function TodoComponent({ value, optimistic }: Props) {
    const { trigger: updateTodo } = useUpdateTodo({ optimisticUpdate: true });
    const { trigger: deleteTodo } = useDeleteTodo({ optimisticUpdate: true });
    const { data: session } = useSession();
    const { data: canEditTask } = useCheckTask({
        operation: 'update',
        where: { id: value.task?.id },
    });
    const [editOpen, setEditOpen] = useState(false);
    const [changeOpen, setChangeOpen] = useState(false);
    const { data: canUpdateTodo } = useCheckTodo({
        operation: 'update',
        where: { id: value.id },
    });
    const onDeleteTodo = () => {
        void deleteTodo({ where: { id: value.id } });
    };

    const toggleCompleted = (completed: boolean) => {
        if (completed === !!value.completedAt) {
            return;
        }
        void updateTodo({
            where: { id: value.id },
            data: { completedAt: completed ? new Date() : null },
        });
    };

    return (
  <div className="border border-[#b6b6b6] bg-[#565759] text-white rounded-2xl px-12 py-8 shadow-2xl w-full lg:w-[960px] min-h-[200px]">
    <div className="flex w-full gap-6">
      {/* LEFT: title + description stacked */}
      <div className="min-w-0 flex-1">
        <h3
          className={`font-sans block text-2xl ${
            value.completedAt ? 'line-through italic opacity-70' : ''
          }`}
        >
          {/* If you want up to 2 lines with ellipsis, add 'line-clamp-2' after text-xl */}
          {value.task?.title ?? 'Untitled Task'}
          {optimistic && <span className="loading loading-spinner loading-sm ml-1" />}
        </h3>

        {value.task?.description && (
          <p
            className={`font-serif mt-2 block w-full leading-relaxed ${value.completedAt ? 'opacity-70' : 'opacity-90'}`}
          >
            {value.task.description}
          </p>
        )}
      </div>
        <div className="mt-2 flex gap-4 text-sm">
            {canEditTask && (
              <button className="text-white/80 hover:text-white" onClick={() => setEditOpen(true)}>
                <span className="inline-flex items-center gap-1">
                  <PencilSquareIcon className="w-4 h-4" /> Edit Task
                </span>
              </button>
            )}
            {canUpdateTodo && (
              <button className="text-white/80 hover:text-white" onClick={() => setChangeOpen(true)}>
                <span className="inline-flex items-center gap-1">
                  <ArrowsRightLeftIcon className="w-4 h-4" /> Change Task
                </span>
              </button>
            )}
          </div>
      {/* RIGHT: actions */}
      <div className="shrink-0 flex items-start gap-3">
        <input
          type="checkbox"
          className="checkbox"
          checked={!!value.completedAt}
          disabled={optimistic}
          onChange={(e) => toggleCompleted(e.currentTarget.checked)}
        />
        <TrashIcon
          className={`w-6 h-6 ${
            optimistic ? 'text-white/40 cursor-not-allowed' : 'text-white/80 hover:text-white cursor-pointer'
          }`}
          onClick={() => {
            if (!optimistic) onDeleteTodo();
          }}
        />
      </div>
    </div>
    {value.task && (
        <EditTaskModal
          task={{ id: value.task.id, title: value.task.title, description: value.task.description }}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
      <ChangeTaskModal
        spaceId={value.task?.spaceId ?? ''} // spaceId is available on Task
        todoId={value.id}
        userId={session?.user?.id ?? ''}
        isOpen={changeOpen}
        onClose={() => setChangeOpen(false)}
      />

    <div className="mt-3 flex justify-end w-full space-x-3">
      <TimeInfo value={value} />
      <Avatar user={value.owner} size={18} />
    </div>
  </div>
);
}
