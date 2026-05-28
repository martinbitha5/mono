import { createFileRoute } from '@tanstack/react-router';
import { DailyChecklistPage } from '../pages/DailyChecklist';
export const Route = createFileRoute('/_auth/checklist')({ component: DailyChecklistPage });
