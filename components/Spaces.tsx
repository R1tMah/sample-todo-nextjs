import { useCountList } from '@lib/hooks';
import type { Prisma } from '@prisma/client';
import Link from 'next/link';

export const SPACE_CARD_SELECT = { id: true, slug: true, name: true } as const;
export type SpaceCard = Prisma.SpaceGetPayload<{ select: typeof SPACE_CARD_SELECT }>;

type Props = { spaces: SpaceCard[] };

function SpaceItem({ space }: { space: SpaceCard }) {
  const { data: listCount } = useCountList({ where: { spaceId: space.id } });

  return (
    <div className="w-full h-full flex relative justify-center items-center">
      <div className="badge badge-outline badge-accent badge-sm absolute top-4 right-4">
        {listCount ?? 0}
      </div>
      <Link href={`/space/${space.slug}`}>
        <div
          className="card-body"
          title={`${space.name}${listCount ? `: ${listCount} lists` : ''}`}
        >
          <h2 className="card-title line-clamp-1">{space.name}</h2>
        </div>
      </Link>
    </div>
  );
}

export default function Spaces({ spaces }: Props) {
  return (
    <ul className="flex flex-wrap gap-4">
      {spaces?.map((space) => (
        <li
          className="card w-80 h-32 flex justify-center shadow-xl text-gray-600 cursor-pointer hover:bg-gray-50 border"
          key={space.id}
        >
          <SpaceItem space={space} />
        </li>
      ))}
    </ul>
  );
}
