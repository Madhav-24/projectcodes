/**
 * Project Manager Messages Page
 * Communication hub for all users (Admin, Supervisors, Engineers)
 * Uses standardized PageShell and MessageChat template
 */
import PageShell from '../../components/layout/PageShell.jsx';
import MessageChat from '../../components/common/MessageChat.jsx';

function ProjectManagerMessagesPage() {
  return (
    <PageShell title="Messages" description="Communicate with admin, supervisors, and engineers across all projects.">
      <MessageChat excludeRole="project_manager" />
    </PageShell>
  );
}

export default ProjectManagerMessagesPage;
