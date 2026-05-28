import { createFileRoute } from '@tanstack/react-router';
import { AttendancePage } from '../pages/Attendance';
export const Route = createFileRoute('/_auth/attendance')({ component: AttendancePage });
