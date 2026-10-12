'use client';

import { useEffect } from 'react';

/**
 * Last resort: the root layout itself failed, so none of its CSS, fonts or AppShell exist. This
 * replaces the whole document, hence its own <html><body> and inline styles in the brand's
 * colours (cream ground, ink text, olive button). Logs the digest and error name only.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global error]', { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          textAlign: 'center',
          background: '#F4EFE1',
          color: '#28261A',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <main role="alert" style={{ maxWidth: 420 }}>
          <h1 style={{ margin: '0 0 12px', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 30, lineHeight: 1.2 }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 16, lineHeight: 1.5, color: '#6B6553' }}>
            Fuerte could not load. Try again; if it keeps happening, reload the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: 48,
              padding: '0 24px',
              border: '1px solid #5A6B2C',
              borderRadius: 0,
              background: '#5A6B2C',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
