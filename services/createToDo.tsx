// Minimal service the tests expect
type DB = {
  task: { findFirst: Function; create: Function };
  todo: { create: Function };
};

export async function createTodo({
  prisma, listId, ownerId, spaceId, title, description,
}: {
  prisma: DB;
  listId: string;
  ownerId: string;
  spaceId: string;
  title: string;
  description?: string;
}) {
  const existing = await prisma.task.findFirst({
    where: { spaceId, title },
  });
  const task = existing ?? await prisma.task.create({
    data: { spaceId, ownerId, title, description },
  });

  if (task.spaceId !== spaceId) {
    throw new Error('cross-space');
  }

  return prisma.todo.create({
    data: {
      listId,
      ownerId,
      task: { connect: { id: task.id } },
    },
  });
}
