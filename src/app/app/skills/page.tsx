import { requireUser } from '@/libs/Session';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { SKILLS } from '@/libs/Skills';
import { SkillsToggle } from './toggle';

export const metadata = { title: 'Skills' };
export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  const user = await requireUser();
  const [agent] = await db.select().from(agents).where(eq(agents.userId, user.id)).limit(1);
  const enabled = new Set(agent?.enabledSkills ?? []);
  return (
    <div className="card">
      <h1 className="text-2xl font-semibold text-ink-950">Skills</h1>
      <p className="mt-1 text-ink-600">
        20 preinstalled skills. Toggle to give your agent more or less capability.
      </p>
      <SkillsToggle skills={SKILLS} initialEnabled={[...enabled]} />
    </div>
  );
}
