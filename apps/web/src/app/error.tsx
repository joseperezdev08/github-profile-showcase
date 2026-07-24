'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="feedback-page">
      <div className="feedback-card">
        <p className="eyebrow">ERROR DE CONEXIÓN</p>
        <h1>No pudimos cargar el perfil.</h1>
        <p>
          Verifica que la API de NestJS esté disponible e intenta nuevamente.
        </p>
        <button type="button" onClick={reset}>
          Reintentar
        </button>
      </div>
    </main>
  );
}
