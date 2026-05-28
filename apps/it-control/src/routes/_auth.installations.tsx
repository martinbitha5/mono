import { createFileRoute } from '@tanstack/react-router';
import { InstallationsPage } from '../pages/Installations';

export const Route = createFileRoute('/_auth/installations')({
  component: InstallationsPage,
});
