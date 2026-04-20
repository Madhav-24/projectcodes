import PageShell from '../../components/layout/PageShell.jsx';
import SafetyAlertsBoard from '../../components/alerts/SafetyAlertsBoard.jsx';

function SupervisorAlertsPage() {
  return (
    <PageShell title="Safety Alerts" description="Real-time alerts across all sites">
      <SafetyAlertsBoard roleKey="supervisor" allowGenerateReport />
    </PageShell>
  );
}

export default SupervisorAlertsPage;
