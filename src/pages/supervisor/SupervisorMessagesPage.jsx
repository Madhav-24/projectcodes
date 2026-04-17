import PageShell from '../../components/layout/PageShell.jsx';
import MessageChat from '../../components/common/MessageChat.jsx';

function SupervisorMessagesPage() {
  return (
    <PageShell title="Messages" description="Coordinate with authorized personnel using permission-based communication.">
      <MessageChat />
    </PageShell>
  );
}

export default SupervisorMessagesPage;
