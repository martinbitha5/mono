import { createFileRoute } from '@tanstack/react-router';
import { IncidentsPage } from '../pages/Incidents';

export const Route = createFileRoute('/_auth/incidents')({
  component: IncidentsPage,
});
