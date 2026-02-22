'use client';
import GenericErrorPage from './v2/(components)/errors/GenericErrorPage';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return <GenericErrorPage title="Application Error" message={error.message} reset={reset} />;
}
