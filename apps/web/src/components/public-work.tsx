import { formatDate, formatNumber } from '@/lib/profile-formatters';
import type { GitHubUser } from '@/types/github-user';

function pullRequestState(
  state: 'OPEN' | 'CLOSED' | 'MERGED',
  isDraft: boolean,
): string {
  if (isDraft) {
    return 'Borrador';
  }

  return {
    OPEN: 'Abierto',
    CLOSED: 'Cerrado',
    MERGED: 'Integrado',
  }[state];
}

export function PublicWork({ profile }: { profile: GitHubUser }) {
  return (
    <section className="public-work" aria-label="Impacto y contribuciones">
      <article className="impact-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Código público</p>
            <h2>Impacto</h2>
          </div>
        </div>

        <dl className="impact-stats">
          <div>
            <dt>Estrellas recibidas</dt>
            <dd>{formatNumber(profile.repositoryMetrics.starsReceived)}</dd>
          </div>
          <div>
            <dt>Forks recibidos</dt>
            <dd>{formatNumber(profile.repositoryMetrics.forksReceived)}</dd>
          </div>
          <div>
            <dt>Gists públicos</dt>
            <dd>{formatNumber(profile.publicGists)}</dd>
          </div>
        </dl>

        <div className="languages">
          <p className="metric-label">Lenguajes principales</p>
          {profile.repositoryMetrics.topLanguages.length > 0 ? (
            <ul>
              {profile.repositoryMetrics.topLanguages.map((language) => (
                <li key={language.name}>
                  <span
                    className="language-dot"
                    style={{
                      backgroundColor: language.color ?? 'var(--accent)',
                    }}
                    aria-hidden="true"
                  />
                  <span>{language.name}</span>
                  <small>
                    {formatNumber(language.repositoryCount)}{' '}
                    {language.repositoryCount === 1 ? 'repo' : 'repos'}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">
              GitHub todavía no reporta lenguajes para estos repositorios.
            </p>
          )}
        </div>
      </article>

      <article className="pull-requests-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Colaboración abierta</p>
            <h2>Pull requests públicos</h2>
          </div>
        </div>

        {profile.publicPullRequests.recent.length > 0 ? (
          <ol className="pull-request-list">
            {profile.publicPullRequests.recent.map((pullRequest) => (
              <li key={pullRequest.url}>
                <a href={pullRequest.url} rel="noreferrer" target="_blank">
                  <span className="pull-request-meta">
                    <span
                      className="pull-request-state"
                      data-state={pullRequest.state.toLowerCase()}
                    >
                      {pullRequestState(pullRequest.state, pullRequest.isDraft)}
                    </span>
                    <span>{formatDate(pullRequest.createdAt)}</span>
                  </span>
                  <strong>{pullRequest.title}</strong>
                  <span className="repository-name">
                    {pullRequest.repository}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-copy">
            No hay pull requests públicos disponibles para mostrar.
          </p>
        )}
      </article>
    </section>
  );
}
