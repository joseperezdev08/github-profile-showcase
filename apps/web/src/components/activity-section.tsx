import {
  formatDate,
  formatNumber,
  formatPeriod,
} from '@/lib/profile-formatters';
import type { GitHubUser } from '@/types/github-user';

export function ActivitySection({ profile }: { profile: GitHubUser }) {
  const { contributions } = profile;

  return (
    <section className="activity-section" aria-labelledby="activity-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Últimos 12 meses</p>
          <h2 id="activity-title">Actividad en GitHub</h2>
        </div>
        <p className="period">
          {formatPeriod(contributions.from, contributions.to)}
        </p>
      </div>

      <div className="activity-layout">
        <article className="total-card">
          <p className="metric-label">Contribuciones</p>
          <strong>{formatNumber(contributions.total)}</strong>
          <p>
            actividad registrada durante el periodo
            {contributions.restricted > 0 && (
              <>
                , incluyendo {formatNumber(contributions.restricted)} privadas
                compartidas de forma anónima
              </>
            )}
            .
          </p>
        </article>

        <dl className="metric-grid">
          <div>
            <dt>Commits</dt>
            <dd>{formatNumber(contributions.commits)}</dd>
          </div>
          <div>
            <dt>Pull requests</dt>
            <dd>{formatNumber(contributions.pullRequests)}</dd>
          </div>
          <div>
            <dt>Reviews</dt>
            <dd>{formatNumber(contributions.reviews)}</dd>
          </div>
          <div>
            <dt>Issues</dt>
            <dd>{formatNumber(contributions.issues)}</dd>
          </div>
          <div>
            <dt>Repos con commits</dt>
            <dd>{formatNumber(contributions.repositoriesContributedTo)}</dd>
          </div>
          <div>
            <dt>PR públicos históricos</dt>
            <dd>{formatNumber(profile.publicPullRequests.total)}</dd>
          </div>
        </dl>
      </div>

      <article className="calendar-card">
        <div className="calendar-copy">
          <div>
            <p className="metric-label">Mapa de actividad</p>
            <h3>Constancia, día a día</h3>
          </div>
          <div className="calendar-legend" aria-hidden="true">
            <span>Menos</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} data-level={level} />
            ))}
            <span>Más</span>
          </div>
        </div>

        <div className="calendar-scroll">
          <div
            className="contribution-calendar"
            role="img"
            aria-label={`${formatNumber(contributions.total)} contribuciones entre ${formatDate(contributions.from)} y ${formatDate(contributions.to)}`}
          >
            {contributions.calendar.map((day) => (
              <span
                key={day.date}
                data-level={day.level}
                aria-hidden="true"
                title={`${day.date}: ${formatNumber(day.count)} contribuciones`}
              />
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
