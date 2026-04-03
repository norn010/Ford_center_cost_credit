import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';

const numCell = ({ getValue }) => {
  const value = getValue();
  if (value == null) return '0.00';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const FORD_COLUMNS = [
  { id: 'select', _isSelect: true, size: 50 },
  { accessorKey: 'สาขา',                  header: 'สาขา',                  size: 90 },
  { accessorKey: 'เลขที่ใบกำกับภาษี',       header: 'เลขที่ใบกำกับภาษี' },
  { accessorKey: 'วันที่ใบกำกับภาษี',       header: 'วันที่ใบกำกับภาษี',     _isDate: true },
  { accessorKey: 'รายได้ค่าอะไหล่',         header: 'รายได้ค่าอะไหล่',       cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รายได้ค่าแรง',            header: 'รายได้ค่าแรง',          cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รายได้ค่างานนอก',         header: 'รายได้ค่างานนอก',       cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รายได้ค่าน้ำมัน',         header: 'รายได้ค่าน้ำมัน',       cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ต้นทุนอะไหล่',            header: 'ต้นทุนอะไหล่',          cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ต้นทุนงานนอก',           header: 'ต้นทุนงานนอก',         cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ต้นทุนน้ำมัน',            header: 'ต้นทุนน้ำมัน',          cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รวมต้นทุน',              header: 'รวมต้นทุน',             cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ราคาขายรวมภาษี',          header: 'ราคาขายรวมภาษี',        cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ออกใบกำกับในนาม',        header: 'ออกใบกำกับในนาม' },
  { accessorKey: 'รหัสลูกค้าที่ออกใบกำกับ', header: 'รหัสลูกค้าที่ออกใบกำกับ' },
];

const NISSAN_COLUMNS = [
  { id: 'select', _isSelect: true, size: 50 },
  { accessorKey: 'สาขา',                  header: 'สาขา',                  size: 90 },
  { accessorKey: 'เลขที่ใบกำกับภาษี',       header: 'เลขที่ใบกำกับภาษี' },
  { accessorKey: 'วันที่ใบกำกับภาษี',       header: 'วันที่ใบกำกับภาษี',     _isDate: true },
  { accessorKey: 'รายได้ค่าอะไหล่',         header: 'รายได้ค่าอะไหล่',       cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รายได้ค่าแรง',            header: 'รายได้ค่าแรง',          cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รายได้ค่างานนอก',         header: 'รายได้ค่างานนอก',       cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รายได้ค่าน้ำมัน',         header: 'รายได้ค่าน้ำมัน',       cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ต้นทุนอะไหล่',            header: 'ต้นทุนอะไหล่',          cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ต้นทุนงานนอก',           header: 'ต้นทุนงานนอก',         cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ต้นทุนน้ำมัน',            header: 'ต้นทุนน้ำมัน',          cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'รวมต้นทุน',              header: 'รวมต้นทุน',             cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ราคาขายรวมภาษี',          header: 'ราคาขายรวมภาษี',        cell: numCell, meta: { isNumeric: true } },
  { accessorKey: 'ออกใบกำกับในนาม',        header: 'ออกใบกำกับในนาม' },
  { accessorKey: 'รหัสลูกค้าที่ออกใบกำกับ', header: 'รหัสลูกค้าที่ออกใบกำกับ' },
];

const selectColumn = {
  id: 'select',
  header: ({ table }) => (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onChange={row.getToggleSelectedHandler()}
    />
  ),
  size: 50,
};

const dateCell = ({ getValue }) => {
  const value = getValue();
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('th-TH');
};

function buildColumns(colDefs) {
  return colDefs.map((col) => {
    if (col._isSelect) return selectColumn;
    const def = { ...col };
    if (col._isDate) { def.cell = dateCell; delete def._isDate; }
    return def;
  });
}

function SalesTable({ data, onSelectionChange, loading, brand = 'Ford' }) {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  const columns = useMemo(
    () => buildColumns(brand === 'Ford' ? FORD_COLUMNS : NISSAN_COLUMNS),
    [brand],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, pagination },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const tableRef = useRef(table);
  tableRef.current = table;

  useEffect(() => {
    setRowSelection({});
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [data]);

  useEffect(() => {
    const selected = tableRef.current.getSelectedRowModel().flatRows.map((row) => row.original);
    onSelectionChange(selected);
  }, [rowSelection, onSelectionChange]);

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0 relative">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary-500 rounded-full" />
          Results Preview
        </h2>
        <div className="flex items-center gap-4">
          {loading && (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-tighter">Processing</span>
            </div>
          )}
          <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm">
            {data.length.toLocaleString()} records
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        <table className="min-w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 sticky top-0 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className={`px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest select-none transition-colors border-b border-slate-200 ${header.column.getCanSort() ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      {header.column.getCanSort() && (
                        <span className="shrink-0 text-slate-300">
                          {header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`group transition-all duration-200 ${row.getIsSelected() ? 'bg-primary-50/80 shadow-inner' : 'hover:bg-slate-50/50'}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 py-2.5 whitespace-nowrap ${cell.column.columnDef.meta?.isNumeric ? 'text-right font-mono' : 'text-left'} text-xs ${row.getIsSelected() ? 'text-primary-800 font-bold' : 'text-slate-600'}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && !loading && (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={columns.length}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-slate-50 p-4 rounded-full">
                      <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No matches found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            PAGE <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{table.getState().pagination.pageIndex + 1}</span> OF {table.getPageCount() || 1}
          </div>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div>
            SHOWING <span className="text-slate-800">{table.getRowModel().rows.length}</span> OF {table.getPrePaginationRowModel().rows.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="group flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-primary-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous Page"
          >
            ←
          </button>
          <button
            type="button"
            className="group flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-primary-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next Page"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SalesTable;
