import { createFileRoute } from '@tanstack/react-router';
import { GsePage } from '../pages/Gse';
export const Route = createFileRoute('/_auth/gse')({ component: GsePage });
