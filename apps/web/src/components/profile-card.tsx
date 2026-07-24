import Image from 'next/image';
import { accountYear, formatNumber } from '@/lib/profile-formatters';
import type { GitHubUser } from '@/types/github-user';

function externalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function ProfileCard({ profile }: { profile: GitHubUser }) {
  return (
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
        <p className="eyebrow">@{profile.username}</p>
        <h1>{profile.name ?? profile.username}</h1>

        {profile.bio && <p className="bio">{profile.bio}</p>}

        <dl className="stats" aria-label="Estadísticas públicas de GitHub">
          <div>
            <dt>Repos públicos</dt>
            <dd>{formatNumber(profile.publicRepositories)}</dd>
          </div>
          <div>
            <dt>Seguidores</dt>
            <dd>{formatNumber(profile.followers)}</dd>
          </div>
          <div>
            <dt>Siguiendo</dt>
            <dd>{formatNumber(profile.following)}</dd>
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
          className="primary-link"
          href={profile.profileUrl}
          rel="noreferrer"
          target="_blank"
        >
          Ver perfil en GitHub
          <span aria-hidden="true">↗</span>
        </a>
      </section>
    </article>
  );
}
