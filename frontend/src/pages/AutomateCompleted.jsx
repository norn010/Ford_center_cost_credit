import { useEffect, useMemo, useState } from 'react';
import {
  createSettlement,
  fetchSettlementCandidates,
} from '../services/api';

function getAgingDays(invoiceDate) {
  if (!invoiceDate) return null;
  const parsed = new Date(invoiceDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getAgingClass(days) {
  if (days == null) return 'bg-slate-100 text-slate-600';
  if (days <= 14) return 'bg-sky-100 text-sky-700';
  if (days <= 29) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-700';
}

function toNumberOrZero(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function AutomateCompleted() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [submittingSettlement, setSubmittingSettlement] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    rs_no: '',
    received_amount_ex: '',
    withholding_tax: '',
    fee: '',
    diff_debit: '',
    diff_credit: '',
    diff_credit: '',
  });
  const [allocationByRowId, setAllocationByRowId] = useState({});

  const branches = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (row['สาขา']) set.add(row['สาขา']);
    });
    return Array.from(set).sort();
  }, [rows]);

  async function loadData(branch = selectedBranch) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSettlementCandidates({ branch: branch || null });
      setRows(data || []);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลคิวที่เสร็จแล้วได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(selectedBranch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);


  const [sortConfig, setSortConfig] = useState({ key: 'Aging', direction: 'desc' });

  // Sorting logic
  const sortedRows = useMemo(() => {
    let sortableItems = [...rows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Custom handling for numeric/aging values
        if (['ราคาขายรวมภาษี', 'ยอดตัดแล้ว', 'ยอดคงเหลือ', 'id'].includes(sortConfig.key)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else if (sortConfig.key === 'Aging') {
          aVal = getAgingDays(a['วันที่ใบกำกับภาษี']) || 0;
          bVal = getAgingDays(b['วันที่ใบกำกับภาษี']) || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [rows, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="opacity-10 group-hover:opacity-50 ml-1">↕</span>;
    return <span className="text-primary-500 ml-1 font-black">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowIds.includes(row.id)),
    [rows, selectedRowIds],
  );

  const totalAllocated = useMemo(
    () => selectedRows.reduce((sum, row) => sum + toNumberOrZero(allocationByRowId[row.id]), 0),
    [allocationByRowId, selectedRows],
  );

  const receivedAmountEx = toNumberOrZero(settlementForm.received_amount_ex);
  const canSubmitSettlement = selectedRows.length > 0 && receivedAmountEx > 0 && totalAllocated > 0 && totalAllocated <= receivedAmountEx;

  function setRowValue(id, key, value) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }


  function toggleRowSelection(rowId) {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  }

  function toggleSelectAllVisible(checked) {
    if (checked) {
      setSelectedRowIds(rows.map((row) => row.id));
    } else {
      setSelectedRowIds([]);
    }
  }

  function openSettlementModal() {
    const initialAllocation = {};
    selectedRows.forEach((row) => {
      // Use "ยอดคงเหลือ" in our data
      initialAllocation[row.id] = row['ยอดคงเหลือ'] || '';
    });
    setAllocationByRowId(initialAllocation);
    setSettlementForm({
      rs_no: '',
      received_amount_ex: '',
      withholding_tax: '',
      fee: '',
      diff_debit: '',
      diff_credit: '',
      remark: '',
    });
    setIsSettlementModalOpen(true);
  }

  function closeSettlementModal() {
    setIsSettlementModalOpen(false);
  }

  async function handleCreateSettlement() {
    if (!canSubmitSettlement) {
      setError('กรุณาตรวจสอบยอดรับชำระและยอดจัดสรร');
      return;
    }
    const items = selectedRows
      .map((row) => ({
        queue_id: row.id,
        invoice_no: row['เลขที่ใบกำกับภาษี'],
        amount_ex: toNumberOrZero(allocationByRowId[row.id]),
      }))
      .filter((item) => item.amount_ex > 0);

    const overAllocated = selectedRows.find(
      (row) => toNumberOrZero(allocationByRowId[row.id]) > toNumberOrZero(row['ยอดคงเหลือ']),
    );
    if (overAllocated) {
      setError(`ยอดจัดสรรเกินยอดคงเหลือของรายการ ${overAllocated.id}`);
      return;
    }

    setSubmittingSettlement(true);
    setError(null);
    try {
      await createSettlement({
        header: {
          Brand: selectedRows[0]?.Brand || 'Ford',
          branch: selectedRows[0]?.['สาขา'] || '',
          customer_code: selectedRows[0]?.['รหัสลูกค้าที่ออกใบกำกับ'] || '',
          customer_name: selectedRows[0]?.['ออกใบกำกับในนาม'] || '',
          rs_no: settlementForm.rs_no || null,
          received_amount_ex: receivedAmountEx,
          withholding_tax: toNumberOrZero(settlementForm.withholding_tax),
          fee: toNumberOrZero(settlementForm.fee),
          diff_debit: toNumberOrZero(settlementForm.diff_debit),
          diff_credit: toNumberOrZero(settlementForm.diff_credit),
        },
        items,
      });
      setSelectedRowIds([]);
      closeSettlementModal();
      await loadData(selectedBranch);
    } catch (err) {
      setError(err?.response?.data?.error || 'สร้างรายการตัดชำระไม่สำเร็จ');
    } finally {
      setSubmittingSettlement(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-8 p-4 md:p-8">
      <header className="shrink-0 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">รายงานตัดชำระหนี้ ศูนย์ต้นทุนเงินเชื่อ</h1>
          <p className="text-slate-500 font-medium text-lg">
            แสดงเฉพาะรายการที่ automate_status เป็น เสร็จแล้ว
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex flex-col min-w-[200px]">
            <label className="text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">สาขา</label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">ทั้งหมด (All)</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openSettlementModal}
            disabled={selectedRowIds.length === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-extrabold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
          >
            สร้างรายการตัดชำระ ({selectedRowIds.length})
          </button>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Queue เสร็จแล้ว</h2>
            <p className="text-sm font-bold text-slate-500">{loading ? 'กำลังโหลด...' : `${rows.length.toLocaleString()} รายการทั้งหมด`}</p>
          </div>
          <button
            type="button"
            onClick={() => loadData(selectedBranch)}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            Refresh
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.length > 0 && selectedRowIds.length === rows.length}
                    onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {[
                  { key: 'Aging', label: 'Aging' },
                  { key: 'สาขา', label: 'สาขา' },
                  { key: 'เลขที่ใบกำกับภาษี', label: 'เลขที่ใบกำกับภาษี' },
                  { key: 'วันที่ใบกำกับภาษี', label: 'วันที่ใบกำกับภาษี' },
                  { key: 'ราคาขายรวมภาษี', label: 'ราคาขายรวมภาษี', align: 'right' },
                  { key: 'ยอดตัดแล้ว', label: 'ยอดตัดแล้ว', align: 'right' },
                  { key: 'ยอดคงเหลือ', label: 'ยอดคงเหลือ', align: 'right' },
                  { key: 'ออกใบกำกับในนาม', label: 'ออกใบกำกับในนาม' },
                  { key: 'รหัสลูกค้าที่ออกใบกำกับ', label: 'รหัสลูกค้าที่ออกใบกำกับ' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    className={`px-6 py-4 font-extrabold text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <div className={`flex items-center ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                      {col.label}
                      <SortIcon columnKey={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((row) => (
                <tr key={row.id} className="hover:bg-primary-50/30 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const days = getAgingDays(row['วันที่ใบกำกับภาษี']);
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getAgingClass(days)}`}>
                          {days == null ? '-' : `${days} วัน`}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{row['สาขา']}</td>
                  <td className="px-6 py-4 font-bold text-primary-700 whitespace-nowrap">{row['เลขที่ใบกำกับภาษี']}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {row['วันที่ใบกำกับภาษี'] ? new Date(row['วันที่ใบกำกับภาษี']).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary-600 whitespace-nowrap">
                    {row['ราคาขายรวมภาษี']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-600 whitespace-nowrap">
                    {row['ยอดตัดแล้ว']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                    {row['ยอดคงเหลือ']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-slate-700 truncate max-w-[200px]" title={row['ออกใบกำกับในนาม']}>
                    {row['ออกใบกำกับในนาม']}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-bold">{row['รหัสลูกค้าที่ออกใบกำกับ']}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-20 text-center text-slate-400 font-medium" colSpan={10}>
                    ไม่พบข้อมูลที่เสร็จแล้ว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-2xl font-extrabold text-slate-900">สร้างรายการตัดชำระ (Settlement)</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">ตัดชำระซ้ำได้จนกว่ายอดคงเหลือจะเป็น 0</p>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">ยอดรับชำระส่วนขยาย</div>
                  <div className="text-3xl font-black text-emerald-700">
                    ฿{receivedAmountEx.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ยอดจัดสรร / คงเหลือ</div>
                  <div className="text-xl font-bold flex items-center gap-2">
                    <span className="text-primary-600">฿{totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className="text-slate-300">/</span>
                    <span className={receivedAmountEx - totalAllocated < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      ฿{(receivedAmountEx - totalAllocated).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">เลขที่ RS</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="เช่น RS6701-001"
                    value={settlementForm.rs_no}
                    onChange={(e) => setSettlementForm((p) => ({ ...p, rs_no: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">ยอดรับชำระ (received_amount_ex)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                    value={settlementForm.received_amount_ex}
                    onChange={(e) => setSettlementForm((p) => ({ ...p, received_amount_ex: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">หัก ณ ที่จ่าย</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                    value={settlementForm.withholding_tax}
                    onChange={(e) => setSettlementForm((p) => ({ ...p, withholding_tax: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">ค่าธรรมเนียม</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                    value={settlementForm.fee}
                    onChange={(e) => setSettlementForm((p) => ({ ...p, fee: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">ส่วนต่างเดบิต</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                    value={settlementForm.diff_debit}
                    onChange={(e) => setSettlementForm((p) => ({ ...p, diff_debit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">ส่วนต่างเครดิต</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                    value={settlementForm.diff_credit}
                    onChange={(e) => setSettlementForm((p) => ({ ...p, diff_credit: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left font-bold text-slate-600">ID</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">เลขที่ใบกำกับภาษี</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">ยอดคงเหลือรวมภาษี</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">ยอดตัดครั้งนี้</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-bold text-slate-400">{row.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{row['เลขที่ใบกำกับภาษี']}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          {row['ยอดคงเหลือ']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right w-48">
                          {(() => {
                            const maxVal = toNumberOrZero(row['ยอดคงเหลือ']);
                            const curVal = toNumberOrZero(allocationByRowId[row.id]);
                            const overLimit = curVal > maxVal;
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <input
                                  type="number"
                                  className={`w-full px-3 py-1.5 border rounded-lg text-xs font-black text-right outline-none transition-all ${overLimit ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white focus:ring-2 focus:ring-primary-500'}`}
                                  value={allocationByRowId[row.id] ?? ''}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const num = Number(raw);
                                    if (raw !== '' && Number.isFinite(num) && num > maxVal) {
                                      setAllocationByRowId((p) => ({ ...p, [row.id]: String(maxVal) }));
                                    } else {
                                      setAllocationByRowId((p) => ({ ...p, [row.id]: raw }));
                                    }
                                  }}
                                  placeholder="0.00"
                                />
                                {overLimit && <span className="text-[10px] font-bold text-rose-500">เกินยอดคงเหลือ!</span>}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
              <button
                type="button"
                onClick={closeSettlementModal}
                disabled={submittingSettlement}
                className="px-6 py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-white transition-all active:scale-95"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateSettlement}
                disabled={!canSubmitSettlement || submittingSettlement}
                className="px-8 py-3 rounded-xl bg-primary-600 text-white font-black shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
              >
                {submittingSettlement ? 'กำลังบันทึก...' : 'ยืนยันสร้างรายการตัดชำระ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomateCompleted;

