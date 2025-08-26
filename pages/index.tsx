import { useCurrentUser } from '@lib/context';
import { Space, Prisma } from '@prisma/client';
import Spaces from 'components/Spaces';
import WithNavBar from 'components/WithNavBar';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { getEnhancedPrisma } from 'server/enhanced-db';
import { Beth_Ellen } from 'next/font/google';
const bethEllen = Beth_Ellen({
  weight: '400',
  subsets: ['latin'],
});

const SPACE_CARD_SELECT = { id: true, slug: true, name: true } as const
type SpaceCard = Prisma.SpaceGetPayload<{ select: typeof SPACE_CARD_SELECT }>


type Props = { spaces: SpaceCard[] };

const Home: NextPage<Props> = ({ spaces }) => {
    const user = useCurrentUser();

    return (
        <WithNavBar>
            {user && (
                <div className="min-h-screen w-full bg-[#A6847C]">
                <div className="mt-8 text-center flex flex-col items-center w-full">
                    <h1 className={`${bethEllen.className} text-2xl md:text-2xl leading-tight text-white mb-6`}>Welcome {user.name || user.email}!</h1>

                    <div className="w-full p-8">
                        <h2 className="font-serif text-lg md:text-xl text-left mb-8 text-white-700">
                            Choose a space to start, or{' '}
                            <Link href="/create-space" className="text-white">
                                create a new one.
                            </Link>
                        </h2>
                        <Spaces spaces={spaces} />
                    </div>
                </div>
                </div>
            )}
        </WithNavBar>
    );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res }) => {
  const db = await getEnhancedPrisma({ req, res })
  const spaces = await db.space.findMany({
    // whatever filters you need...
    select: SPACE_CARD_SELECT,     // <-- JSON-safe (no createdAt)
    orderBy: { name: 'asc' },      // can order by fields you didn't select
  })
  return { props: { spaces } }
}

export default Home;
