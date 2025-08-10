import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-context';
import db, { CollectionRecord } from '../../../db/json-db';

const collectionName = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);

export const collectionsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      collection: collectionName,
      offset: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(200).optional(),
      where: z.record(z.string(), z.unknown()).optional(),
    }))
    .query(async ({ input }) => {
      const res = await db.list(input.collection, {
        offset: input.offset,
        limit: input.limit,
        where: input.where ?? undefined,
      });
      return res;
    }),

  get: publicProcedure
    .input(z.object({ collection: collectionName, id: z.string().min(1) }))
    .query(async ({ input }) => {
      const item = await db.get(input.collection, input.id);
      return item;
    }),

  create: publicProcedure
    .input(z.object({ collection: collectionName, data: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input }) => {
      const created = await db.create(input.collection, input.data as Record<string, unknown>);
      return created as CollectionRecord;
    }),

  update: publicProcedure
    .input(z.object({ collection: collectionName, id: z.string().min(1), patch: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input }) => {
      const updated = await db.update(input.collection, input.id, input.patch as Record<string, unknown>);
      return updated;
    }),

  remove: publicProcedure
    .input(z.object({ collection: collectionName, id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const ok = await db.remove(input.collection, input.id);
      return { ok };
    }),
});

export type CollectionsRouter = typeof collectionsRouter;
