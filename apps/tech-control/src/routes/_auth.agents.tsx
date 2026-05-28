import { createFileRoute } from '@tanstack/react-router';
import { AgentsPage } from '../pages/Agents';
export const Route = createFileRoute('/_auth/agents')({ component: AgentsPage });
