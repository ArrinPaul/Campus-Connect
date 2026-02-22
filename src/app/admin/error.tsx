'use client';
import GenericErrorPage from '../(components)/errors/GenericErrorPage';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return <GenericErrorPage title="Admin Error" message={error.message} reset={reset} />;
}
