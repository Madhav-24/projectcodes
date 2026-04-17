import PageShell from '../../components/layout/PageShell.jsx';
import MessageChat from '../../components/common/MessageChat.jsx';

function MessagesPage() {
  return (
    <PageShell title="Messages" description="Access role-based chat streams and manage communication across teams.">
      <MessageChat excludeRole="admin" />
    </PageShell>
  );
}

export default MessagesPage;
