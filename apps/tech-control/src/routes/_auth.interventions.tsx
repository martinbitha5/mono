import { createFileRoute } from '@tanstack/react-router';
import { InterventionsPage } from '../pages/Interventions';
export const Route = createFileRoute('/_auth/interventions')({ component: InterventionsPage });
