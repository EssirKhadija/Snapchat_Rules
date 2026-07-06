import prisma from '../../prisma/client';

export interface LogsQuery {
  search?: string;
  matched?: boolean;
  simulated?: boolean;
  ruleId?: string;
  targetId?: string;
  page?: number;
  pageSize?: number;
}

export async function getLogs(userId: string, query: LogsQuery = {}) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const where: any = { userId };

  if (typeof query.matched === 'boolean') where.matched = query.matched;
  if (typeof query.simulated === 'boolean') where.simulated = query.simulated;
  if (query.ruleId) where.ruleId = query.ruleId;
  if (query.targetId) where.targetId = query.targetId;

  if (query.search) {
    where.OR = [
      { targetName: { contains: query.search } },
      { rule: { name: { contains: query.search } } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.ruleExecutionLog.findMany({
      where,
      include: { rule: true },
      orderBy: { executedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.ruleExecutionLog.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
