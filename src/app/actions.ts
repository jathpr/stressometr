// app/actions.ts
// Карыстальніцкая дырэктыва для ўсяго модуля
"use server";

import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------
// Кэшаванне PrismaClient (Крытычна для Vercel/Serverless)
// ---------------------------------------------------

// Выкарыстоўваем глабальны аб'ект для кэшавання, каб прадухіліць стварэнне
// новага інстансу PrismaClient пры кожным выкліку server action.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Калі глабальны інстанс не існуе, ствараем новы
const prisma = global.prisma || new PrismaClient();

// У dev-рэжыме захоўваем інстанс у глабальны аб'ект
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// ---------------------------------------------------
// Дапаможная функцыя для кантэксту Стрэсометра
// ---------------------------------------------------

// Знаходзіць або стварае дэфолтнага карыстальніка і яго асноўны стрэсометр.
async function getOrCreateDefaultContext(): Promise<string> {
  const defaultEmail = "default@user.com";

  // 1. Ствараем ці знаходзім юзера
  let user = await prisma.user.findUnique({ where: { email: defaultEmail } });
  if (!user) {
    console.log("Створаны новы дэфолтны карыстальнік.");
    user = await prisma.user.create({ data: { email: defaultEmail } });
  }

  // 2. Ствараем ці знаходзім яго першы стрэсометр
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

// ---------------------------------------------------
// Server Actions
// ---------------------------------------------------

// Захаваць новы запіс
export async function saveStressLog(
  level: number,
  note: string,
  tags: string[]
) {
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

// Атрымаць гісторыю для графіка
// Вяртае дадзеныя ў тым парадку, які патрэбны для графіка (храналагічны)
export async function getStressHistory() {
  const meterId = await getOrCreateDefaultContext();

  const logs = await prisma.log.findMany({
    where: { meterId },
    orderBy: { createdAt: "asc" },
  });

  // Дэсерыялізацыя і фарматаванне для перадачы на кліент
  return logs.map((log) => ({
    id: log.id,
    level: log.level,
    note: log.note,
    tags: JSON.parse(log.tags as string) as string[],
    createdAt: log.createdAt.toISOString(),
  }));
}
