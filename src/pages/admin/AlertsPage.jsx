import PageShell from '../../components/layout/PageShell.jsx';
import SafetyAlertsBoard from '../../components/alerts/SafetyAlertsBoard.jsx';

function AlertsPage() {
  return (
    <PageShell title="Safety Alerts" description="Real-time alerts across all sites">
      <SafetyAlertsBoard roleKey="admin" allowGenerateReport={false} />
    </PageShell>
  );
}

export default AlertsPage;
