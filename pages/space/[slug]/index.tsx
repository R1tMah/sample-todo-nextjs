import { SpaceContext } from '@lib/context'
import { useCreateList, useFindManyList } from '@lib/hooks'
import type { Prisma } from '@prisma/client'
import BreadCrumb from 'components/BreadCrumb'
import SpaceMembers from 'components/SpaceMembers'
import TodoList from 'components/TodoList'
import WithNavBar from 'components/WithNavBar'
import type { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { ChangeEvent, FormEvent, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { getEnhancedPrisma } from 'server/enhanced-db'
import { useSession } from 'next-auth/react';
// ---------- JSON-safe selects + types ----------
const SPACE_SELECT = { id: true, slug: true, name: true } as const
type SpaceUI = Prisma.SpaceGetPayload<{ select: typeof SPACE_SELECT }>

const LIST_SELECT = {
  id: true,
  title: true,
  spaceId: true,
  private: true,
  ownerId: true,
  owner: { select: { id: true, name: true, email: true, image: true } },
} as const
type ListUI = Prisma.ListGetPayload<{ select: typeof LIST_SELECT }>

function CreateDialog() {
  const space = useContext(SpaceContext)
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [_private, setPrivate] = useState(false)
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { trigger: createList } = useCreateList({
    optimisticUpdate: true,
    onError: (err: any) => {
      // show the real reason instead of generic "An error occurred while fetching the data"
      const msg =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Create list failed';
      toast.error(msg);
      console.error('createList error:', err);
    },
    onSuccess: () => {
      toast.success('List created successfully!')
      setTitle('')
      setPrivate(false)
      setModalOpen(false)
    },
  })

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (modalOpen) inputRef.current?.focus() }, [modalOpen])

const onSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const titleTrimmed = title.trim();
  if (!titleTrimmed) {
    toast.error('Please enter a list title.');
    return;
  }
  if (!space?.id) {
    toast.error('Missing space id');
    return;
  }
  if (!userId) {
    toast.error('You must be signed in');
    return;
  }

    await createList({
      data: { title, private: _private,         space: { connect: { id: space.id } },
        owner: { connect: { id: userId } }, }, select: LIST_SELECT,  
    })
  }

  return (
    <>
    <div className="min-h-screen w-full bg-[#A6847C]">
      <input
        type="checkbox"
        id="create-list-modal"
        className="modal-toggle"
        checked={modalOpen}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setModalOpen(e.currentTarget.checked)}
      />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-xl mb-8">Create a Todo list</h3>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col space-y-4"> <div className="flex items-center"> <label htmlFor="title" className="text-lg inline-block w-20">Title</label> <input id="title" type="text" required placeholder="Title of your list" ref={inputRef} className="input input-bordered w-full max-w-xs mt-2" value={title} onChange={(e) => setTitle(e.currentTarget.value)} /> </div> <div className="flex items-center"> <label htmlFor="private" className="text-lg inline-block w-20">Private</label> <input id="private" type="checkbox" className="checkbox" onChange={(e) => setPrivate(e.currentTarget.checked)} /> </div> </div>
            <div className="modal-action">
              <input className="btn btn-primary" type="submit" value="Create" />
              <label htmlFor="create-list-modal" className="btn btn-outline">Cancel</label>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
    
  )
}

type Props = { space: SpaceUI; lists: ListUI[] }

export default function SpaceHome(props: Props) {
  const router = useRouter()

  const { data: lists } = useFindManyList(
    {
      where: { space: { slug: router.query.slug as string } },
      select: LIST_SELECT,                // <-- align with Props
      orderBy: { updatedAt: 'desc' } as const,
    },
    {
      disabled: !router.query.slug,
      fallbackData: props.lists,          // <-- types now match
    }
  )

  return (
    <WithNavBar>
        <div className="min-h-screen w-full bg-[#A6847C]">
      <div className="px-8 py-2">
        <BreadCrumb space={props.space} /> {/* expects {id, slug, name} */}
      </div>
      <div className="p-8">
        <div className="w-full flex flex-col md:flex-row mb-8 space-y-4 md:space-y-0 md:space-x-4">
          <label htmlFor="create-list-modal" className="font-sans btn btn-primary btn-wide modal-button">Create a list</label>
          <SpaceMembers />
        </div>

        <ul className="flex flex-wrap gap-6">
          {lists?.map((list) => (
            <li key={list.id}>
              {/* TodoList should accept the slim ListCard type (id,title,spaceId,private,ownerId,owner) */}
              <TodoList value={list as any} />
            </li>
          ))}
        </ul>

        <CreateDialog />
      </div>
      </div>
    </WithNavBar>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, params }) => {
  const db = await getEnhancedPrisma({ req, res })

  const space = await db.space.findUnique({
    where: { slug: params!.slug as string },
    select: SPACE_SELECT,                 // <-- JSON-safe
  })
  if (!space) return { notFound: true }

  const lists = await db.list.findMany({
    where: { space: { slug: params!.slug as string } },
    select: LIST_SELECT,                  // <-- JSON-safe
    orderBy: { updatedAt: 'desc' },
  })

  return { props: { space, lists } }      // <-- no Dates => no serializer needed
}
