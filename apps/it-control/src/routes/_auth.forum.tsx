import { createFileRoute } from '@tanstack/react-router';
import { ForumPage } from '../pages/Forum';

export const Route = createFileRoute('/_auth/forum')({
  component: ForumPage,
});
