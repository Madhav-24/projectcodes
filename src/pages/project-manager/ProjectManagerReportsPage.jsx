import { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaDownload, FaFileAlt } from 'react-icons/fa';
import PageShell from '../../components/layout/PageShell.jsx';

function formatDate(value) {
  if (!value) return 'Unknown';
  if (value?.toDate) return value.toDate().toLocaleDateString();
  return new Date(value).toLocaleDateString();
}

// Type badge color map matching the image
const TYPE_COLORS = {
  Safety:    { bg: 'rgba(220,38,38,0.15)',   text: '#f87171', border: 'rgba(220,38,38,0.4)' },
  Layers:    { bg: 'rgba(234,88,12,0.15)',   text: '#fb923c', border: 'rgba(234,88,12,0.4)' },
  Equipment: { bg: 'rgba(217,119,6,0.15)',   text: '#fbbf24', border: 'rgba(217,119,6,0.4)' },
  Progress:  { bg: 'rgba(37,99,235,0.15)',   text: '#60a5fa', border: 'rgba(37,99,235,0.4)' },
  Analytics: { bg: 'rgba(124,58,237,0.15)',  text: '#a78bfa', border: 'rgba(124,58,237,0.4)' },
  General:   { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
};

function TypeBadge({ type }) {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.General;
  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      display: 'inline-block',
    }}>
      {type}
    </span>
  );
}

// Default static data shown in the image
const DEFAULT_REPORTS = [
  { id: 'd1', name: 'Daily Safety Compliance Report',  date: 'Feb 28, 2026', type: 'Safety',    size: '2.4 MB' },
  { id: 'd2', name: 'Weekly Road Layer Progress',       date: 'Feb 25, 2026', type: 'Layers',    size: '3.8 MB' },
  { id: 'd3', name: 'PPE Compliance Monthly',           date: 'Feb 22, 2026', type: 'Safety',    size: '5.1 MB' },
  { id: 'd4', name: 'Equipment Utilization Report',     date: 'Feb 20, 2026', type: 'Equipment', size: '1.8 MB' },
  { id: 'd5', name: 'Chainage-wise Progress Q1',        date: 'Feb 15, 2026', type: 'Progress',  size: '4.2 MB' },
  { id: 'd6', name: 'AI Detection Analytics',           date: 'Feb 10, 2026', type: 'Analytics', size: '3.2 MB' },
];

function ProjectManagerReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reports will be fetched from the PostgreSQL backend in a future iteration.

  const firestoreRows = useMemo(
    () => reports.map((report) => ({
      id: report.id,
      name: report.name || report.title || 'Untitled Report',
      date: formatDate(report.createdAt),
      type: report.type || 'General',
      size: report.size || '—',
    })),
    [reports]
  );

  // Use Firestore data if available, else show the default static rows
  const reportRows = firestoreRows.length > 0 ? firestoreRows : DEFAULT_REPORTS;

  return (
    <PageShell title="Reports" description="Generate and download site reports.">
      <div className="space-y-6">
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(51,65,85,0.6)',
          borderRadius: '16px',
          padding: '20px 28px',
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Reports</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Generate and download site reports</p>
          </div>
          <button style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >
            + Generate New
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(51,65,85,0.6)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading reports...</div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1.2fr 1fr 0.8fr 1fr',
                padding: '10px 24px',
                borderBottom: '1px solid rgba(51,65,85,0.5)',
                background: 'rgba(15,23,42,0.9)',
              }}>
                {['Report Name', 'Date', 'Type', 'Size', 'Actions'].map((col) => (
                  <div key={col} style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {col}
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              <div>
                {reportRows.map((report, idx) => (
                  <div
                    key={report.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 1.2fr 1fr 0.8fr 1fr',
                      padding: '14px 24px',
                      alignItems: 'center',
                      borderBottom: idx < reportRows.length - 1 ? '1px solid rgba(51,65,85,0.35)' : 'none',
                      transition: 'background 0.15s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{report.name}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{report.date}</div>
                    <div><TypeBadge type={report.type} /></div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{report.size}</div>
                    <div>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#60a5fa',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: 0,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
                        onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
                      >
                        <FaDownload size={12} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default ProjectManagerReportsPage;
