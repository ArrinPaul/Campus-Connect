'use client';
import GenericErrorPage from './v2/(components)/errors/GenericErrorPage';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <html>
      <body>
        <GenericErrorPage title="Something catastrophic happened" message={error.message} reset={reset} />
      </body>
    </html>
  );
}
