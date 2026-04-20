import PageShell from '../../components/layout/PageShell.jsx';
import SafetyAlertsBoard from '../../components/alerts/SafetyAlertsBoard.jsx';

function EngineerAlertsPage() {
  return (
    <PageShell title="Safety Alerts" description="Real-time alerts across all sites">
      <SafetyAlertsBoard roleKey="engineer" allowGenerateReport />
    </PageShell>
  );
}

export default EngineerAlertsPage;
