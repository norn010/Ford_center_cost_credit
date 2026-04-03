import { useEffect, useMemo, useState } from 'react';
import { fetchAutomateQueue, updateAutomateQueueRow } from '../services/api';

const SEND_BP_FILTER_OPTIONS = [
  { value: 'ส่งให้BP', label: 'ส่งให้BP' },
  { value: 'BPส่งกลับ', label: 'BPส่งกลับ' },
  { value: 'ทั้งหมด', label: 'ทั้งหมด' },
];

function BPReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [filterSendBp, setFilterSendBp] = useState('ส่งให้BP');
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [confirmRow, setConfirmRow] = useState(null);

  const brands = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (row.database_name) set.add(row.database_name);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filterSendBp === 'ทั้งหมด') return rows;
    return rows.filter((r) => r['ส่งBP'] === filterSendBp);
  }, [rows, filterSendBp]);

  function getAgingDays(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.floor((today - d) / (1000 * 60 * 60 * 24));
  }

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      if (sortKey === 'aging') {
        const va = getAgingDays(a['วันที่ใบกำกับ']);
        const vb = getAgingDays(b['วันที่ใบกำกับ']);
        if (va == null && vb == null) return 0;
        if (va == null) return sortAsc ? 1 : -1;
        if (vb == null) return sortAsc ? -1 : 1;
        return sortAsc ? va - vb : vb - va;
      }
      let va = a[sortKey];
      let vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return sortAsc ? 1 : -1;
      if (vb == null) return sortAsc ? -1 : 1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      const da = new Date(va).getTime();
      const db = new Date(vb).getTime();
      if (!Number.isNaN(da) && !Number.isNaN(db)) {
        return sortAsc ? da - db : db - da;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      const cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredRows, sortKey, sortAsc]);

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  async function loadData(brand = selectedBrand) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAutomateQueue({
        status: 'เสร็จแล้ว',
        database: brand || undefined,
      });
      setRows(data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(selectedBrand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand]);

  function updateLocalRow(id, patch) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  async function handleSaveConfirm() {
    if (!confirmRow) return;
    const row = confirmRow;
    setConfirmRow(null);
    setSavingId(row.id);
    setError(null);
    try {
      await updateAutomateQueueRow(row.id, {
        ประเภท: row['ประเภท'] || null,
        BankStatement: row.BankStatement || null,
        ส่งBP: 'BPส่งกลับ',
        หมายเหตุ: row['หมายเหตุ'] || null,
        หักค่าธรรมเนียม: row['หักค่าธรรมเนียม'] ?? null,
        ส่วนต่างเดบิต: row['ส่วนต่างเดบิต'] ?? null,
        ส่วนต่างเครดิต: row['ส่วนต่างเครดิต'] ?? null,
      });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <header className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">BPรายงานตัดชำระหนี้</h1>
          <p className="text-sm text-slate-500">
            แก้ไขหมายเหตุแล้วกด Save เพื่อเปลี่ยนเป็น BPส่งกลับ (แถวจะหายจากรายการ)
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex flex-col min-w-[140px]">
            <label className="text-xs font-medium text-slate-600 mb-1">ส่งBP</label>
            <select
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={filterSendBp}
              onChange={(e) => setFilterSendBp(e.target.value)}
            >
              {SEND_BP_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col min-w-[160px]">
            <label className="text-xs font-medium text-slate-600 mb-1">Brand / Database</label>
            <select
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border border-rose-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">รายการ (ส่งBP = {filterSendBp})</h2>
          <p className="text-xs text-slate-500">
            {loading ? 'Loading...' : `${filteredRows.length.toLocaleString()} รายการ`}
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                {[
                  ['aging', 'Aging', 'right'],
                  ['database_name', 'Database', 'left'],
                  ['เลขที่ใบกำกับ', 'เลขที่ใบกำกับ', 'left'],
                  ['เลขที่ใบเบิก', 'เลขที่ใบเบิก', 'left'],
                  ['สาขา', 'สาขา', 'left'],
                  ['วันที่ใบกำกับ', 'วันที่ใบกำกับ', 'left'],
                  ['ยอดสุทธิ', 'ยอดสุทธิ', 'right'],
                  ['ส่งBP', 'ส่งBP', 'left'],
                  ['ประเภท', 'ประเภท', 'left'],
                  ['หมายเหตุ', 'หมายเหตุ', 'left'],
                  
                ].map(([key, label, align]) => (
                  <th
                    key={key}
                    className={`px-3 py-2 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 select-none ${
                      align === 'right' ? 'text-right' : 'text-left'
                    }`}
                    onClick={() => toggleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {sortKey === key && (
                        <span className="text-[10px] text-slate-400">
                          {sortAsc ? '▲' : '▼'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-semibold text-slate-600 w-24">Save</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const agingDays = getAgingDays(row['วันที่ใบกำกับ']);
                const agingColor =
                  agingDays == null
                    ? ''
                    : agingDays <= 14
                      ? 'bg-blue-100 text-blue-800'
                      : agingDays <= 28
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800';
                return (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={`px-3 py-2 text-right font-medium ${agingColor}`}>
                      {agingDays != null ? agingDays : ''}
                    </td>
                    <td className="px-3 py-2">{row.database_name}</td>
                    <td className="px-3 py-2">{row['เลขที่ใบกำกับ']}</td>
                    <td className="px-3 py-2">{row['เลขที่ใบเบิก']}</td>
                    <td className="px-3 py-2">{row['สาขา']}</td>
                    <td className="px-3 py-2">
                      {row['วันที่ใบกำกับ']
                        ? new Date(row['วันที่ใบกำกับ']).toLocaleString()
                        : ''}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row['ยอดสุทธิ'] != null
                        ? Number(row['ยอดสุทธิ']).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : ''}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row['ส่งBP'] || '-'}</td>
                    <td className="px-3 py-2">{row['ประเภท'] || '-'}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="min-w-[120px] w-full max-w-[200px] px-2 py-1 border border-slate-300 rounded text-xs"
                        value={row['หมายเหตุ'] || ''}
                        onChange={(e) => updateLocalRow(row.id, { หมายเหตุ: e.target.value })}
                        placeholder="หมายเหตุ"
                      />
                    </td>
                    
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setConfirmRow(row)}
                        disabled={savingId === row.id}
                        className="px-3 py-1 rounded bg-primary-600 text-white text-xs hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedRows.length === 0 && !loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={11}>
                    No records.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={11}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">ยืนยันการบันทึก</h3>
            <p className="text-sm mb-2 px-3 py-2 rounded-md bg-emerald-100 text-emerald-800 font-medium">
              Database: {confirmRow.database_name ?? '-'}
              {' · '}
              เลขที่ใบกำกับ: {confirmRow['เลขที่ใบกำกับ'] ?? '-'}
            </p>
            <p className="text-sm text-slate-600 mb-4">
              แถวนี้จะเปลี่ยนสถานะ ส่งBP เป็น &quot;BPส่งกลับ&quot; และจะไม่แสดงในหน้านี้อีก (กรองส่งให้BP อยู่)
              ยืนยันหรือไม่?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRow(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveConfirm}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BPReport;
