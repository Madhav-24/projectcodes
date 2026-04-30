// Module: Supervisor Settings Page
// Purpose: Provide supervisor-facing account security settings.
import PageShell from '../../components/layout/PageShell.jsx';
import PasswordSecurityCard from '../../frontend/components/settings/PasswordSecurityCard.jsx';

function SupervisorSettingsPage() {
  return (
    <PageShell title="Settings" description="Manage your account security.">
      <PasswordSecurityCard />
    </PageShell>
  );
}

export default SupervisorSettingsPage;
