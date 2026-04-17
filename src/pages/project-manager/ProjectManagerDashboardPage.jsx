import { useEffect, useMemo, useState } from 'react';
import { collection, getFirestore, onSnapshot, query } from 'firebase/firestore';
import { FaUsers, FaChartLine, FaExclamationTriangle, FaCoins, FaVideo, FaShieldAlt, FaClock } from 'react-icons/fa';
import app from '../../firebase/firebaseConfig.js';
import Sidebar from '../../components/layout/Sidebar.jsx';
import KpiMetric from '../../components/cards/KpiMetric.jsx';
import AIPredictiveCard from '../../components/common/AIPredictiveCard.jsx';
import PPEComplianceChart from '../../components/charts/PPEComplianceChart.jsx';
import WeeklyWorkersChart from '../../components/charts/WeeklyWorkersChart.jsx';
import PlannedVsActualChart from '../../components/charts/PlannedVsActualChart.jsx';
import BudgetBurnChart from '../../components/charts/BudgetBurnChart.jsx';
import SafetyLeaderboard from '../../components/common/SafetyLeaderboard.jsx';
import SiteMap from '../../components/maps/SiteMap.jsx';
import LayerComparisonChart from '../../components/charts/LayerComparisonChart.jsx';
import LiveClock from '../../components/common/LiveClock.jsx';

const db = getFirestore(app);

function ProjectManagerDashboardPage() {
  const [sites, setSites] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);

  useEffect(() => {
    const siteQuery = query(collection(db, 'sites'));
    const unsubscribeSites = onSnapshot(siteQuery, (snapshot) => {
      setSites(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const dashboardQuery = query(collection(db, 'dashboardData'));
    const unsubscribeDashboard = onSnapshot(dashboardQuery, (snapshot) => {
      setDashboardData(snapshot.docs.map((doc) => ({ siteId: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeSites();
      unsubscribeDashboard();
    };
  }, []);

  const totals = useMemo(() => {
    const allProgress = dashboardData.reduce((sum, item) => sum + (item.progress || 0), 0);
    const totalSites = dashboardData.length || 1;
    return {
      workers: 300,
      progress: 73,
      ppeCompliance: 93,
      alerts: 10,
      cpi: 0.94,
      budgetBurn: 79,
      cameras: '10/11',
    };
  }, [dashboardData]);

  const siteStatusItems = [
    { name: 'Site 1 – Earthwork & Structural', icon: '⛏️', progress: 72, label: 'On Track', labelColor: 'text-emerald-400', barColor: '#22c55e', alerts: 2 },
    { name: 'Site 2 – Girder Casting Yard', icon: '🛠️', progress: 58, label: 'Caution', labelColor: 'text-amber-400', barColor: '#f59e0b', alerts: 4 },
    { name: 'Site 3 – Piling Process', icon: '🧱', progress: 44, label: 'Delayed', labelColor: 'text-red-500', barColor: '#ef4444', alerts: 6 },
    { name: 'Site 4 – Express Highway', icon: '🚧', progress: 81, label: 'On Track', labelColor: 'text-emerald-400', barColor: '#22c55e', alerts: 1 },
    { name: 'Site 5 – Asphalt / DBM', icon: '🛣️', progress: 36, label: 'Caution', labelColor: 'text-amber-400', barColor: '#f59e0b', alerts: 3 },
    { name: 'Site 6 – Safety Command', icon: '🛡️', progress: 95, label: 'Near Complete', labelColor: 'text-sky-400', barColor: '#0ea5e9', alerts: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="lg:ml-72">
        <div className="px-6 py-6">
          <div className="mb-8 flex items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white">AI Road Construction Monitor</h1>
            </div>
            <div className="hidden lg:block">
              <LiveClock />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
            <KpiMetric label="TOTAL WORKERS" value={totals.workers} subtitle="Across all sites" icon={<FaUsers />} color="green" />
            <KpiMetric label="AVG PROGRESS" value={`${totals.progress}%`} subtitle="On average" icon={<FaChartLine />} color="blue" />
            <KpiMetric label="PPE COMPLIANCE" value={`${totals.ppeCompliance}%`} subtitle="Safety adherence" icon={<FaShieldAlt />} color="cyan" />
            <KpiMetric label="TOTAL ALERTS" value={totals.alerts} subtitle="Needs action" icon={<FaExclamationTriangle />} color="red" />
            <KpiMetric label="CPI" value={"0.94"} subtitle="Cost budget" icon={<FaCoins />} color="red" />
            <KpiMetric label="BUDGET BURN" value={`${totals.budgetBurn}%`} subtitle="Spent so far" icon={<FaClock />} color="orange" />
            <KpiMetric label="LIVE CAMERAS" value={totals.cameras} subtitle="Online/Total" icon={<FaVideo />} color="purple" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-white">📍 Chennai - Ennore Port Corridor</h3>
                <p className="mt-1 text-xs text-slate-400">All S1 - NKE25 - Click a pin to select site</p>
                <div className="mt-4 h-56 rounded-lg bg-slate-900 overflow-hidden">
                  <SiteMap sites={sites.filter((site) => site.location && site.location.lat && site.location.lng)} />
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Map focused on Chennai Ennore Port Corridor. Select markers to view site details.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Site Status</h3>
                    <p className="text-xs text-slate-400">Overview of current site progress</p>
                  </div>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300">All Sites</span>
                </div>
                <div className="mt-6 space-y-4">
                  {siteStatusItems.map((item) => (
                    <div key={item.name} className="rounded-3xl border border-slate-700 bg-slate-950/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-lg">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{item.name}</p>
                            <p className={`text-xs font-semibold ${item.labelColor}`}>{item.label}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${item.labelColor}`}>{item.progress}%</p>
                          <p className="text-xs text-slate-500">▲ {item.alerts} alerts</p>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
                        <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.barColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AIPredictiveCard />
                <PPEComplianceChart />
              </div>
              <WeeklyWorkersChart />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <PlannedVsActualChart />
            <BudgetBurnChart />
            <LayerComparisonChart />
            <div className="xl:col-span-3">
              <SafetyLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagerDashboardPage;
