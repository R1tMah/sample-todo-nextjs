import { PlusIcon } from '@heroicons/react/24/outline';
import { useCreateTodo, useFindManyTodo, useCreateTask, useFindManyTask  } from '@lib/hooks';
import { List, Space, Prisma } from '@prisma/client';
import BreadCrumb from 'components/BreadCrumb';
import TodoComponent from 'components/Todo';
import WithNavBar from 'components/WithNavBar';
import { GetServerSideProps } from 'next';
import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { getEnhancedPrisma } from 'server/enhanced-db';
import { useSession } from 'next-auth/react';
import { Beth_Ellen } from 'next/font/google';

const bethEllen = Beth_Ellen({
  weight: '400',
  subsets: ['latin'],
});
const SPACE_SELECT = { id: true, slug: true, name: true } as const;
type SpaceUI = Prisma.SpaceGetPayload<{ select: typeof SPACE_SELECT }>;
const LIST_SELECT = {
  id: true,
  title: true,
  spaceId: true,
  private: true,
  ownerId: true,
} as const;
type ListUI = Prisma.ListGetPayload<{ select: typeof LIST_SELECT }>;
type Props = {
  space: SpaceUI;
  list: ListUI;
};




export default function TodoList(props: Props) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [query, setQuery] = useState('');                  
    const [selectedInModal, setSelectedInModal] = useState<{
        id: string; title: string; description: string | null;
        } | null>(null);
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { trigger: createTodo } = useCreateTodo({ optimisticUpdate: true });
   const { data: todos } = useFindManyTodo(
    {
        where: { listId: props.list.id },
        include: { owner: true, task: true },      // include task as well
        orderBy: { createdAt: 'desc' } as const,
    },
    { keepPreviousData: true }
    );

    const { data: modalMatches } = useFindManyTask(
    {
        where: {
        spaceId: props.space.id,
        title: { contains: formTitle, mode: 'insensitive' },
        },
        take: formTitle ? 8 : 0,                  // don't fetch when empty
        orderBy: { title: 'asc' } as const,
    },
    { keepPreviousData: true, revalidateOnFocus: false }
    );
    
    const { trigger: createTask } = useCreateTask({ optimisticUpdate: true });

    
    return (
        <WithNavBar>
            <div className="min-h-screen w-full bg-[#A6847C]">
            <div className="px-8 py-2">
                <BreadCrumb space={props.space} list={props.list} />
            </div>
            <div className="container w-full flex flex-col items-center py-12 mx-auto">
                <h1 className={`${bethEllen.className} text-5xl md:text-7xl leading-tight text-white mb-6`}>{props.list?.title}</h1>
                <div className="flex space-x-2 items-start">

                    <button
                        className="bg-[#b6b6b6] btn btn-ghost mt-2"
                        onClick={() => {
                        setFormTitle(query.trim());
                        setFormDesc('');
                        setSelectedInModal(null);
                        setShowAddModal(true);
                        }}
                    >
                        ADD NEW TASK
                    </button>
                    
                    </div>

                    {/* Modal for title + description */}
                    {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                    <h3 className="font-bold text-lg mb-3">NEW TASK</h3>

                    <label className="label">TITLE</label>
                    <input
                        className="input input-bordered w-full"
                        value={formTitle}
                        onChange={(e) => {
                        setFormTitle(e.target.value);
                        setSelectedInModal(null); // typing clears selection
                        }}
                    />

                    {/* Suggestions (from current Space) */}
                    {formTitle && (
                        <ul className="menu bg-base-100 rounded-box shadow mt-2 max-h-56 overflow-auto">
                        {(modalMatches ?? []).map((t) => (
                            <li key={t.id}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                setSelectedInModal({ id: t.id, title: t.title, description: t.description ?? null });
                                setFormTitle(t.title);
                                }}
                                className="justify-start"
                            >
                                <div className="text-sm">
                                <div className="font-medium">{t.title}</div>
                                {t.description && <div className="text-xs opacity-70 line-clamp-1">{t.description}</div>}
                                </div>
                            </button>
                            </li>
                        ))}
                        {modalMatches?.length === 0 && (
                            <li className="pointer-events-none px-3 py-2 text-sm opacity-70">No matches</li>
                        )}
                        </ul>
                    )}

                    {/* Only show description if we're creating a NEW Task */}
                    {!selectedInModal && (
                        <>
                        <label className="label mt-3">DESCRIPTION</label>
                        <textarea
                            className="textarea textarea-bordered w-full"
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            rows={3}
                        />
                        </>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                        {selectedInModal && (
                        <>
                            <span className="badge badge-outline">Using existing: {selectedInModal.title}</span>
                            <button className="link text-sm" onClick={() => setSelectedInModal(null)}>Switch to “create new”</button>
                        </>
                        )}
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                        <button
                        className="btn btn-primary"
                        onClick={async () => {
                            if (!userId) return;
                            const title = formTitle.trim();
                            if (!title) return;

                            let taskId = selectedInModal?.id;
                            if (!taskId) {
                            const task = await createTask({
                                data: {
                                title,
                                description: formDesc || null,
                                space: { connect: { id: props.space.id } },
                                owner: { connect: { id: userId } },
                                },
                            });
                            taskId = task?.id;
                            }

                            await createTodo({
                            data: {
                                list:  { connect: { id: props.list.id } },
                                task:  { connect: { id: taskId! } },
                                owner: { connect: { id: userId } },
                            },
                            include: { owner: true, task: true },
                            });

                            setShowAddModal(false);
                            setFormTitle(''); setFormDesc(''); setSelectedInModal(null);
                        }}
                        >
                        Save
                        </button>
                    </div>
                    </div>
                </div>
                )}

                <ul className="flex flex-col space-y-4 py-8 w-11/12 md:w-auto">
                    {todos?.map((todo) => (
                        <TodoComponent key={todo.id} value={todo} optimistic={!!todo.$optimistic} />
                    ))}
                </ul>
            </div>
            </div>
        </WithNavBar>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, params }) => {
  const db = await getEnhancedPrisma({ req, res });

  const space = await db.space.findUnique({
    where: { slug: params!.slug as string },
    select: SPACE_SELECT,
  });
  if (!space) return { notFound: true };

  const list = await db.list.findUnique({
    where: { id: params!.listId as string },
    select: LIST_SELECT,
  });
  if (!list) return { notFound: true };

  return { props: { space, list } };
};
