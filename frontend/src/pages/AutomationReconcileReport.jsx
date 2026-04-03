import { useEffect, useMemo, useState } from 'react';
import { fetchSettlements, fetchSettlementItems } from '../services/api';

function AutomationReconcileReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Sorting & Filtering state
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('กำลังautomate'); // Default to 'กำลังautomate'

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSettlements({});
        setRows(data);
      } catch (err) {
        setError('Failed to load settlement reports.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedRows = useMemo(() => {
    let filteredItems = [...rows];
    
    // Apply Filtering
    if (filterStatus !== 'all') {
      filteredItems = filteredItems.filter(item => item.automate_status === filterStatus);
    }

    // Apply Sorting
    if (sortConfig.key !== null) {
      filteredItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle numeric values
        if (['received_amount_ex', 'withholding_tax', 'fee', 'diff_debit', 'diff_credit', 'id'].includes(sortConfig.key)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [rows, sortConfig, filterStatus]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  async function handleShowDetails(settlement) {
    setSelectedSettlement(settlement);
    setLoadingDetails(true);
    try {
      const data = await fetchSettlementItems(settlement.id);
      setDetails(data);
    } catch (err) {
      console.error('Failed to fetch settlement items');
    } finally {
      setLoadingDetails(false);
    }
  }

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className={`w-3 h-3 text-primary-500 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 p-4 md:p-8 bg-slate-50/50">
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            รายงานประวัติการตัดชำระหนี้
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
            แสดงประวัติการตัดชำระเงินจากตาราง Settlement (กดที่ชื่อคอลัมน์เพื่อจัดเรียง)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setFilterStatus('กำลังautomate')}
              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${filterStatus === 'กำลังautomate' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              กำลังทำงาน ({rows.filter(r => r.automate_status === 'กำลังautomate').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${filterStatus === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ทั้งหมด ({rows.length})
            </button>
          </div>
          <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-200 text-right min-w-[120px]">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">กำลังแสดง</div>
             <div className="text-xl font-black text-slate-700">
               {loading ? '...' : sortedRows.length.toLocaleString()} <span className="text-sm font-medium text-slate-400">รายการ</span>
             </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-md">
              <tr>
                {[
                  { key: 'id', label: 'ID', align: 'left' },
                  { key: 'rs_no', label: 'RS No', align: 'left' },
                  { key: 'Brand', label: 'ยี่ห้อ', align: 'left' },
                  { key: 'สาขา', label: 'สาขา', align: 'left' },
                  { key: 'created_at', label: 'วันที่สร้าง', align: 'left' },
                  { key: 'received_amount_ex', label: 'ยอดรับชำระ', align: 'right' },
                  { key: 'withholding_tax', label: 'หัก ณ ที่จ่าย', align: 'right' },
                  { key: 'fee', label: 'ค่าธรรมเนียม', align: 'right' },
                  { key: 'diff_credit', label: 'ส่วนต่าง D/C', align: 'right' },
                  { key: 'automate_status', label: 'สถานะ', align: 'center' },
                  { key: 'actions', label: 'รายละเอียด', align: 'center', noSort: true },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => !col.noSort && requestSort(col.key)}
                    className={`px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer group ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      {col.label}
                      {!col.noSort && <SortIcon columnKey={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedRows.map((row) => (
                <tr key={row.id} className="hover:bg-primary-50/40 transition-all">
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">#{row.id}</td>
                  <td className="px-6 py-4 font-bold text-primary-700 whitespace-nowrap">{row.rs_no || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 uppercase tracking-wider">
                      {row.Brand || 'FORD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 truncate max-w-[150px]">{row['สาขา'] || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {row.created_at ? new Date(row.created_at).toLocaleString('th-TH', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                    {row.received_amount_ex?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-rose-500 font-bold tabular-nums">
                    {row.withholding_tax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-medium tabular-nums">
                    {row.fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <div className="flex flex-col items-end">
                      <span className="text-sky-600 text-[10px] font-bold">D: {row.diff_debit?.toFixed(2)}</span>
                      <span className="text-rose-600 text-[10px] font-bold">C: {row.diff_credit?.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.automate_status === 'กำลังautomate' ? (
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                        กำลังAUTOMATE
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                        {row.automate_status || 'เสร็จแล้ว'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleShowDetails(row)}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-[11px] font-bold bg-white text-primary-600 border border-primary-100 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm active:scale-95 group/btn"
                    >
                      เรียกดู
                      <svg className="w-3 h-3 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-20 text-center text-slate-400 font-bold" colSpan={11}>
                    ไม่พบข้อมูลประวัติ Settlement
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <header className="shrink-0 px-8 py-7 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">รายละเอียด Settlement #{selectedSettlement.id}</h3>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">RS DOC: {selectedSettlement.rs_no}</p>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm border border-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-auto p-10 custom-scrollbar">
              {loadingDetails ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-bold text-slate-400">กำลังดึงข้อมูลใบกำกับภาษี...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 017 7v1H1v-1a7 7 0 017-7z" /></svg>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">รหัสลูกค้า</div>
                      <div className="text-sm font-black text-slate-700">{selectedSettlement['รหัสลูกค้าที่ออกใบกำกับ']}</div>
                    </div>
                    <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ออกใบกำกับในนาม</div>
                      <div className="text-sm font-black text-slate-700 leading-relaxed">{selectedSettlement['ออกใบกำกับในนาม']}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">ยอดรับชำระสุทธิ</div>
                      <div className="text-xl font-black text-emerald-700">฿{selectedSettlement.received_amount_ex?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-left font-black text-slate-500 uppercase tracking-widest text-[10px]">เลขที่ใบกำกับภาษี</th>
                          <th className="px-8 py-5 text-right font-black text-slate-500 uppercase tracking-widest text-[10px]">ยอดตัดรอบนี้</th>
                          <th className="px-8 py-5 text-right font-black text-slate-500 uppercase tracking-widest text-[10px]">เวลาบันทึก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {details.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-8 py-5 font-bold text-slate-700">{d['เลขที่ใบกำกับภาษี']}</td>
                            <td className="px-8 py-5 text-right font-black text-primary-600 tabular-nums text-base">
                              ฿{d.amount_ex?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-8 py-5 text-right text-slate-400 font-medium text-xs">
                              {d.created_at ? new Date(d.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationReconcileReport;
