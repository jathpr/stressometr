// app/actions.ts
// ------------------------------------------------------------------
"use server"; // <<< ПЕРАНОСІМ ДЫРЭКТЫВУ Ў САМЫ ВЕРХ ФАЙЛА
// ------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";

// Выкарыстоўваем глабальны аб'ект для кэшавання PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// ... увесь код getOrCreateDefaultContext застаецца без зменаў ...
async function getOrCreateDefaultContext() {
  // ... ваш код функцыі ...
  const defaultEmail = "default@user.com";
  let user = await prisma.user.findUnique({ where: { email: defaultEmail } });
  if (!user) {
    user = await prisma.user.create({ data: { email: defaultEmail } });
  }

  let meter = await prisma.stressometer.findFirst({
    where: { userId: user.id },
  });
  if (!meter) {
    meter = await prisma.stressometer.create({
      data: { userId: user.id, name: "Асноўны Стрэсометр" },
    });
  }

  return meter.id;
}

// --- Server Actions ---

// Захаваць новы запіс (Тут больш не патрэбны "use server")
export async function saveStressLog(
  level: number,
  note: string,
  tags: string[]
) {
  // 'use server' выдалены
  const meterId = await getOrCreateDefaultContext();

  await prisma.log.create({
    data: {
      level,
      note,
      tags: JSON.stringify(tags),
      meterId,
    },
  });
}

// Атрымаць гісторыю для графіка (Тут больш не патрэбны "use server")
export async function getStressHistory() {
  // 'use server' выдалены
  const meterId = await getOrCreateDefaultContext();

  const logs = await prisma.log.findMany({
    where: { meterId },
    orderBy: { createdAt: "asc" },
  });

  return logs.map((log) => ({
    ...log,
    tags: JSON.parse(log.tags) as string[],
    createdAt: log.createdAt.toISOString(),
  }));
}
