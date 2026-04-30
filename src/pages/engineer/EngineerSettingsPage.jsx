// Module: Engineer Settings Page
// Purpose: Provide engineer-facing account security settings.
import PageShell from '../../components/layout/PageShell.jsx';
import PasswordSecurityCard from '../../frontend/components/settings/PasswordSecurityCard.jsx';

function EngineerSettingsPage() {
  return (
    <PageShell title="Settings" description="Manage your account security.">
      <PasswordSecurityCard />
    </PageShell>
  );
}

export default EngineerSettingsPage;
