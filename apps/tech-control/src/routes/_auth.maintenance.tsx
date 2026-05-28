import { createFileRoute } from '@tanstack/react-router';
import { MaintenancePage } from '../pages/Maintenance';
export const Route = createFileRoute('/_auth/maintenance')({ component: MaintenancePage });
