import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from '../pages/Reports';

export const Route = createFileRoute('/_auth/reports')({
  component: ReportsPage,
});
