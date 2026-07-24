export default function Loading() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="Cargando perfil">
      <header className="site-header">
        <span className="wordmark">GH / PROFILE</span>
        <span className="tech-label">CARGANDO</span>
      </header>
      <div className="profile-card skeleton-card">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton-content">
          <div className="skeleton skeleton-line skeleton-short" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-stats" />
        </div>
      </div>
    </main>
  );
}
