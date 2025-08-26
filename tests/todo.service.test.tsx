import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { createTodo } from '../services/createToDo'; 

let prisma: DeepMockProxy<PrismaClient>;

beforeEach(() => {
  prisma = mockDeep<PrismaClient>();
  mockReset(prisma);
});

describe('Todo create flow', () => {
  const spaceId = 'space_1';
  const ownerId = 'user_1';
  const listId = 'list_1';

  test('connects to existing Task in same space', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 't1', spaceId, title: 'Alpha' } as any);

    await createTodo({ prisma, listId, ownerId, spaceId, title: 'Alpha' });

    expect(prisma.todo.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ task: { connect: { id: 't1' } } }),
    }));
  });

  test('creates Task once & links (de-dupe)', async () => {
    prisma.task.findFirst.mockResolvedValue(null);
    prisma.task.create.mockResolvedValue({ id: 't2', spaceId, title: 'Beta' } as any);

    await createTodo({ prisma, listId, ownerId, spaceId, title: 'Beta', description: 'desc' });

    expect(prisma.task.create).toHaveBeenCalledTimes(1);
    expect(prisma.todo.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ task: { connect: { id: 't2' } } }),
    }));
  });

  test('blocks cross-space linking', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'tX', spaceId: 'other', title: 'Gamma' } as any);

    await expect(createTodo({ prisma, listId, ownerId, spaceId, title: 'Gamma' }))
      .rejects.toThrow(/cross-space/i);
  });
});
