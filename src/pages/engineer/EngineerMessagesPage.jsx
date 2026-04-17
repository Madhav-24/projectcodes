import PageShell from '../../components/layout/PageShell.jsx';
import MessageChat from '../../components/common/MessageChat.jsx';

function EngineerMessagesPage() {
  return (
    <PageShell title="Messages" description="Chat with authorized personnel for coordination and alerts.">
      <MessageChat />
    </PageShell>
  );
}

export default EngineerMessagesPage;
