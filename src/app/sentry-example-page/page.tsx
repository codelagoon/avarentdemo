"use client"

export default function SentryExamplePage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Sentry Test Page</h1>
      <button
        onClick={() => {
          throw new Error("Sentry Frontend Error");
        }}
        style={{ padding: '1rem', background: 'red', color: 'white', cursor: 'pointer' }}
      >
        Throw error!
      </button>
    </div>
  );
}
