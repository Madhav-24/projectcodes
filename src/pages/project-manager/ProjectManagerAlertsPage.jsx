import PageShell from '../../components/layout/PageShell.jsx';
import SafetyAlertsBoard from '../../components/alerts/SafetyAlertsBoard.jsx';

function ProjectManagerAlertsPage() {
  return (
    <PageShell title="Safety Alerts" description="Real-time alerts across all sites">
      <SafetyAlertsBoard roleKey="project_manager" allowGenerateReport={false} />
    </PageShell>
  );
}

export default ProjectManagerAlertsPage;
