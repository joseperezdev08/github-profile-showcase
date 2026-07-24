import Image from 'next/image';
import { getProfile } from '@/lib/github';

export const dynamic = 'force-dynamic';

function externalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function accountYear(date: string): string {
  return new Intl.DateTimeFormat('es-MX', { year: 'numeric' }).format(
    new Date(date),
  );
}

export default async function Home() {
  const profile = await getProfile();

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Encabezado del proyecto">
        <span className="wordmark">GH / PROFILE</span>
        <span className="tech-label">SSR · NEXT.JS 16</span>
      </header>

      <article className="profile-card" id="perfil">
        <aside className="identity-panel">
          <div className="avatar-frame">
            <Image
              className="avatar"
              src={profile.avatarUrl}
              alt={`Avatar de ${profile.name ?? profile.username}`}
              width={220}
              height={220}
              sizes="(max-width: 720px) 144px, 220px"
              preload
            />
          </div>

          <div className="public-status">
            <span className="status-dot" aria-hidden="true" />
            Perfil público
          </div>

          <p className="member-since">
            En GitHub desde <strong>{accountYear(profile.createdAt)}</strong>
          </p>
        </aside>

        <section className="profile-content">
          <p className="username">@{profile.username}</p>
          <h1>{profile.name ?? profile.username}</h1>

          {profile.bio && <p className="bio">{profile.bio}</p>}

          <dl className="stats" aria-label="Estadísticas públicas de GitHub">
            <div>
              <dt>Repositorios</dt>
              <dd>{profile.publicRepositories}</dd>
            </div>
            <div>
              <dt>Seguidores</dt>
              <dd>{profile.followers}</dd>
            </div>
            <div>
              <dt>Siguiendo</dt>
              <dd>{profile.following}</dd>
            </div>
          </dl>

          <div className="details" aria-label="Información del perfil">
            {profile.location && (
              <p>
                <span>Ubicación</span>
                {profile.location}
              </p>
            )}
            {profile.company && (
              <p>
                <span>Compañía</span>
                {profile.company}
              </p>
            )}
            {profile.email && (
              <p>
                <span>Contacto</span>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </p>
            )}
            {profile.website && (
              <p>
                <span>Sitio web</span>
                <a
                  href={externalUrl(profile.website)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {profile.website}
                </a>
              </p>
            )}
            {profile.twitterUsername && (
              <p>
                <span>Social</span>
                <a
                  href={`https://x.com/${profile.twitterUsername}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  @{profile.twitterUsername}
                </a>
              </p>
            )}
          </div>

          <a
            className="github-link"
            href={profile.profileUrl}
            rel="noreferrer"
            target="_blank"
          >
            Ver perfil en GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </section>
      </article>

      <footer className="site-footer">
        <p>Datos obtenidos desde la API pública de GitHub.</p>
        <p>NestJS API → Next.js Server Component</p>
      </footer>
    </main>
  );
}
