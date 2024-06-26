import type { Context } from "hono";

import db from "utils/database";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";
import withCache from "utils/request-cache";
import type { Assignment, AssignmentTask } from "@prisma/client";

function transformAssignment(assignment: Assignment): Assignment {
  // turn joined data into array
  if (assignment.progress !== null && assignment.progress !== undefined) {
    (assignment as any).progress = assignment.progress.split(",").map(Number);
  }

  // turn joined data into array
  if ((assignment as any).tasks?.length) {
    for (const task of (assignment as any).tasks as AssignmentTask[]) {
      (task as any).valueTypes = task.valueTypes.split(",").map(Number);
      (task as any).values = task.values.split(",").map(Number);
    }
  }

  return assignment;
}

export const getAssignmentById = await withCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const assignment = await db.assignment.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!assignment) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Assignment with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: transformAssignment(assignment), error: null });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllAssignments = await withCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, assignments] = await Promise.all([
      db.assignment.count({ where: query.where }),
      db.assignment.findMany(query),
    ]);

    return ctx.json({
      data: assignments.map(transformAssignment),
      error: null,
      pagination: {
        page: query.skip / query.take + 1,
        pageSize: query.take,
        pageCount: Math.ceil((count as number) / query.take),
        total: count,
      },
    });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAssignmentReward = await withCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const reward = await db.reward.findFirst({
      where: { assignment: { id } },
    });

    if (!reward) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: {
          details: [`Assignment with id (${id}) appears to have no reward`],
        },
      });
    }

    return ctx.json({ data: reward, error: null });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
