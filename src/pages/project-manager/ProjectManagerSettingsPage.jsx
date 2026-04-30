// Module: Project Manager Settings Page
// Purpose: Provide project manager-facing account security settings.
import PageShell from '../../components/layout/PageShell.jsx';
import PasswordSecurityCard from '../../frontend/components/settings/PasswordSecurityCard.jsx';

function ProjectManagerSettingsPage() {
  return (
    <PageShell title="Settings" description="Manage your account security.">
      <PasswordSecurityCard />
    </PageShell>
  );
}

export default ProjectManagerSettingsPage;
