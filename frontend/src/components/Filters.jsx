import { useEffect } from 'react';

const BRANCH_OPTIONS = ['01', '02', '03', '04', '10'];

function Filters({
  databases,
  selectedDatabase,
  onDatabaseChange,
  filters,
  onFiltersChange,
  onSearch,
  loading,
}) {
  useEffect(() => {
    if (!selectedDatabase && databases.length > 0) {
      onDatabaseChange(databases[0].id);
    }
  }, [databases, onDatabaseChange, selectedDatabase]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 mb-1">Database</label>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={selectedDatabase || ''}
            onChange={(e) => onDatabaseChange(e.target.value || null)}
          >
            <option value="">Select database</option>
            {databases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 mb-1">Branch</label>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.branch || ''}
            onChange={(e) => onFiltersChange({ ...filters, branch: e.target.value || null })}
          >
            <option value="">All branches</option>
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600 mb-1">Invoice start date</label>
          <input
            type="date"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.startDate || ''}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || null })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600 mb-1">Invoice end date</label>
          <input
            type="date"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.endDate || ''}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || null })}
          />
        </div>

        <div className="flex flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 mb-1">Search document number</label>
          <input
            type="text"
            placeholder="เลขที่เอกสาร"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.docNo || ''}
            onChange={(e) => onFiltersChange({ ...filters, docNo: e.target.value || null })}
          />
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={loading || !selectedDatabase}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
    </div>
  );
}

export default Filters;

