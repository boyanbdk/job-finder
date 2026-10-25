import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();

  try {
    const rows = await p.$queryRawUnsafe<any[]>(
      `SELECT id, score, substr(title,1,80) as title, substr(company,1,30) as company, substr(location,1,30) as loc, source, url
       FROM Job WHERE eligible=1 AND senior=0 AND status='new' AND score>=16
       ORDER BY score DESC LIMIT 60`
    );

    for (const r of rows) {
      console.log(`${r.id} | ${r.score} | ${r.title} | ${r.company} | ${r.loc} | ${r.source} | ${r.url}`);
    }
  } finally {
    await p.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
