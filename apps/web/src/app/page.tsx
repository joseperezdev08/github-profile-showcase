import { ActivitySection } from '@/components/activity-section';
import { ProfileCard } from '@/components/profile-card';
import { PublicWork } from '@/components/public-work';
import { getProfile } from '@/lib/github';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const profile = await getProfile();

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Encabezado del perfil">
        <span className="wordmark">GH / PROFILE</span>
        <span className="tech-label">ACTIVIDAD PÚBLICA · SSR</span>
      </header>

      <ProfileCard profile={profile} />
      <ActivitySection profile={profile} />
      <PublicWork profile={profile} />

      <footer className="site-footer">
        <p>Datos públicos obtenidos mediante GitHub GraphQL API.</p>
        <p>NestJS API → Next.js Server Component</p>
      </footer>
    </main>
  );
}
