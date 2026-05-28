import { createFileRoute } from '@tanstack/react-router';
import { CarburantPage } from '../pages/Carburant';
export const Route = createFileRoute('/_auth/carburant')({ component: CarburantPage });
