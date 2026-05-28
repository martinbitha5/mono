import { createFileRoute } from '@tanstack/react-router';
import { EquipmentPage } from '../pages/Equipment';

export const Route = createFileRoute('/_auth/equipment')({
  component: EquipmentPage,
});
