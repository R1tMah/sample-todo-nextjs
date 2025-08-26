// components/EditTaskModal.tsx
import { useState } from 'react';
import { useUpdateTask } from '@lib/hooks';
import type { Prisma } from '@prisma/client';

type TaskLite = Prisma.TaskGetPayload<{}>; // full Task shape is fine here

type Props = {
  task: Pick<TaskLite, 'id' | 'title' | 'description'>;
  isOpen: boolean;
  onClose: () => void;
};

export default function EditTaskModal({ task, isOpen, onClose }: Props) {
  const { trigger: updateTask } = useUpdateTask({ optimisticUpdate: true });
  const [title, setTitle] = useState(task.title ?? '');
  const [desc, setDesc] = useState(task.description ?? '');

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
        
      <div className="modal-box bg-[#b6b6b6] text-white border border-[#7B7C5E]">
        <h3 className="font-bold text-black mb-3">Edit Task</h3>

        <label className="text-black label">Title</label>
        <input
          className="text-black input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="text-black label mt-3">Description</label>
        <textarea
          className="text-black textarea textarea-bordered w-full"
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div className="modal-action">
          <button className="text-black btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const cleanTitle = title.trim();
              await updateTask({
                where: { id: task.id },
                data: {
                  title: cleanTitle || task.title,
                  description: desc.trim() || null,
                },
              });
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
