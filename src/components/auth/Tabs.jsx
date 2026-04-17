function Tabs({ tabs, activeTabId, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            activeTabId === tab.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
