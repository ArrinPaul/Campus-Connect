'use client';
import GenericErrorPage from '../(components)/errors/GenericErrorPage';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return <GenericErrorPage title="Dashboard Error" message={error.message} reset={reset} />;
}
