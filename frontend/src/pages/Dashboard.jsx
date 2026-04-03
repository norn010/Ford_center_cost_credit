import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchDatabases, sendToAutomate } from '../services/api';
import SalesTable from '../components/SalesTable';
import AutomateButton from '../components/AutomateButton';

// Icon Components
const ExcelIcon = () => (
  <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 4h7v5h5v11H6V4zm2 8h8v2H8v-2zm0 4h8v2H8v-2z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-10 h-10 text-slate-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

function Dashboard() {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [brand, setBrand] = useState('Ford'); // 'Ford' or 'Nissan'
  const [salesFile, setSalesFile] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingAutomate, setLoadingAutomate] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Custom Scrollbar CSS (Injection)
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    async function loadDatabases() {
      try {
        const dbs = await fetchDatabases();
        setDatabases(dbs);
        if (dbs.length > 0) {
          setSelectedDatabase(dbs[0].id);
        }
      } catch (err) {
        setError('Failed to load databases.');
      }
    }
    loadDatabases();
  }, []);

  const readExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array', cellDates: false });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          // Find header row: look for row containing 'เลขที่ใบกำกับภาษี'
          let headerRowIndex = rawData.findIndex(
            (row) =>
              Array.isArray(row) &&
              row.some((cell) => {
                const s = String(cell || '');
                return s.includes('เลขที่ใบกำกับภาษี') || s.includes('เลขที่ใบกำกับ') || s.includes('No.');
              }),
          );

          if (headerRowIndex === -1) headerRowIndex = 0;

          const headers = rawData[headerRowIndex].map((h) => String(h || '').trim());
          const records = rawData
            .slice(headerRowIndex + 1)
            .filter((row) => row && row.some((cell) => cell !== ''))
            .map((row) => {
              const obj = { _raw: row };
              headers.forEach((h, i) => {
                if (h) obj[h] = row[i];
              });
              return obj;
            });

          resolve(records);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const formatDate = (val) => {
    if (!val) return null;
    if (typeof val === 'number') {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (val instanceof Date) {
      const year = val.getUTCFullYear();
      const month = String(val.getUTCMonth() + 1).padStart(2, '0');
      const day = String(val.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Handle dd/mm/yyyy string format from this Excel
    if (typeof val === 'string') {
      const ddmmyyyy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return val;
  };

  async function handleProcess() {
    if (!salesFile) {
      setError(`กรุณาเลือกไฟล์ข้อมูล ${brand}`);
      return;
    }
    setLoadingSales(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const rawData = await readExcel(salesFile);

      const getVal = (row, key) => {
        if (row[key] !== undefined && row[key] !== '') return row[key];
        const actualKey = Object.keys(row).find((k) => k.trim() === key.trim());
        return actualKey ? row[actualKey] : undefined;
      };

      let resultData = [];

      if (brand === 'Nissan') {
        // Nissan Mapping: Group by TAXNO and sum financial columns
        const order = [];
        const grouped = rawData.reduce((acc, row) => {
          const invoiceNo = getVal(row, 'TAXNO');
          if (!invoiceNo || invoiceNo === '' || invoiceNo === 'None') return acc;

          if (!acc[invoiceNo]) {
            order.push(invoiceNo);
            const branchChar = String(invoiceNo)[0];
            acc[invoiceNo] = {
              Brand: 'Nissan',
              สาขา: branchChar ? '0' + branchChar : null,
              เลขที่ใบกำกับภาษี: invoiceNo,
              วันที่ใบกำกับภาษี: formatDate(getVal(row, 'TAXDATE')),
              รายได้ค่าอะไหล่: 0,
              รายได้ค่าแรง: 0,
              รายได้ค่างานนอก: 0,
              รายได้ค่าน้ำมัน: 0,
              ต้นทุนอะไหล่: 0,
              ต้นทุนงานนอก: 0,
              ต้นทุนน้ำมัน: 0,
              รวมต้นทุน: 0,
              ราคาขายรวมภาษี: 0,
              ออกใบกำกับในนาม: getVal(row, 'CUSTAXNAME') || null,
              รหัสลูกค้าที่ออกใบกำกับ: getVal(row, 'CUSTAX') || null,
            };
          }

          // Financial sums
          acc[invoiceNo]['รายได้ค่าอะไหล่'] += Number(getVal(row, 'PARTNET') || 0);
          acc[invoiceNo]['รายได้ค่าแรง']    += Number(getVal(row, 'SERVNET') || 0);
          acc[invoiceNo]['รายได้ค่างานนอก'] += Number(getVal(row, 'OUTNET')  || 0);
          acc[invoiceNo]['รายได้ค่าน้ำมัน'] += Number(getVal(row, 'OILNET')  || 0);
          acc[invoiceNo]['ต้นทุนอะไหล่']    += Number(getVal(row, 'PARTCOS') || 0);
          acc[invoiceNo]['ต้นทุนงานนอก']   += Number(getVal(row, 'OUTCOS')  || 0);
          acc[invoiceNo]['ต้นทุนน้ำมัน']    += Number(getVal(row, 'OILCOS')  || 0);
          acc[invoiceNo]['รวมต้นทุน']       += Number(getVal(row, 'TOTALCOS') || 0);

          // Calculate Price + VAT for this row
          const totalNet = Number(getVal(row, 'TOTALNET') || 0);
          const vatPercent = Number(getVal(row, 'VAT') || 0);
          const priceIncVat = totalNet + (vatPercent/100 * totalNet);
          acc[invoiceNo]['ราคาขายรวมภาษี'] += priceIncVat;

          return acc;
        }, {});

        resultData = order.map((id) => grouped[id]);
      } else {
        // Ford: Group by เลขที่ใบกำกับภาษี and sum all numeric columns
        const order = [];
        const grouped = rawData.reduce((acc, row) => {
          const invoiceNo = getVal(row, 'เลขที่ใบกำกับภาษี');
          if (!invoiceNo || invoiceNo === '' || invoiceNo === 'None') return acc;

          if (!acc[invoiceNo]) {
            order.push(invoiceNo);
            acc[invoiceNo] = {
              Brand: 'Ford',
              สาขา: getVal(row, 'สาขา') || null,
              เลขที่ใบกำกับภาษี: invoiceNo,
              วันที่ใบกำกับภาษี: formatDate(getVal(row, 'วันที่ใบกำกับภาษี')),
              รายได้ค่าอะไหล่: 0,
              รายได้ค่าแรง: 0,
              รายได้ค่างานนอก: 0,
              รายได้ค่าน้ำมัน: 0,
              ต้นทุนอะไหล่: 0,
              ต้นทุนงานนอก: 0,
              ต้นทุนน้ำมัน: 0,
              รวมต้นทุน: 0,
              ราคาขายรวมภาษี: 0,
              ออกใบกำกับในนาม: getVal(row, 'ออกใบกำกับในนาม') || null,
              รหัสลูกค้าที่ออกใบกำกับ: getVal(row, 'รหัสลูกค้าที่ออกใบกำกับ') || null,
            };
          }
          acc[invoiceNo]['รายได้ค่าอะไหล่'] += Number(getVal(row, 'รายได้ค่าอะไหล่') || 0);
          acc[invoiceNo]['รายได้ค่าแรง']    += Number(getVal(row, 'รายได้ค่าแรง')    || 0);
          acc[invoiceNo]['รายได้ค่างานนอก'] += Number(getVal(row, 'รายได้ค่างานนอก') || 0);
          acc[invoiceNo]['รายได้ค่าน้ำมัน'] += Number(getVal(row, 'รายได้ค่าน้ำมัน') || 0);
          acc[invoiceNo]['ต้นทุนอะไหล่']    += Number(getVal(row, 'ต้นทุนอะไหล่')    || 0);
          acc[invoiceNo]['ต้นทุนงานนอก']   += Number(getVal(row, 'ต้นทุนงานนอก')   || 0);
          acc[invoiceNo]['ต้นทุนน้ำมัน']    += Number(getVal(row, 'ต้นทุนน้ำมัน')    || 0);
          acc[invoiceNo]['รวมต้นทุน']       += Number(getVal(row, 'รวมต้นทุน')       || 0);
          acc[invoiceNo]['ราคาขายรวมภาษี']  += Number(getVal(row, 'ราคาขายรวมภาษี')  || 0);
          return acc;
        }, {});

        resultData = order.map((id) => grouped[id]);
      }

      // Sort by date ASC then invoice number ASC
      resultData.sort((a, b) => {
        const dateA = new Date(a['วันที่ใบกำกับภาษี'] || 0);
        const dateB = new Date(b['วันที่ใบกำกับภาษี'] || 0);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return String(a['เลขที่ใบกำกับภาษี'] || '').localeCompare(String(b['เลขที่ใบกำกับภาษี'] || ''));
      });

      if (resultData.length === 0) {
        setError(`ไม่พบข้อมูลที่ต้องการในไฟล์ ${brand} กรุณาตรวจสอบรูปแบบไฟล์`);
        setSalesData([]);
        return;
      }

      setSalesData(resultData);
      setSelectedRows([]);
      setSuccessMessage('ประมวลผลข้อมูลเสร็จสิ้นเรียบร้อยแล้ว');
      setTimeout(() => {
        document.getElementById('sales-data-table')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel: ' + err.message);
    } finally {
      setLoadingSales(false);
    }
  }

  async function handleSendToAutomate() {
    if (!selectedDatabase || selectedRows.length === 0) {
      if (!selectedDatabase) setError('ไม่มีข้อมูลฐานข้อมูลปลายทาง');
      return;
    }
    setLoadingAutomate(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dataToSend = selectedRows.map((row) => ({
        ...row,
        ยอดตัดแล้ว: 0.00,
        ยอดคงเหลือ: row.ราคาขายรวมภาษี || 0,
      }));

      const result = await sendToAutomate(selectedDatabase, dataToSend);
      setSuccessMessage(`ส่งข้อมูลไปที่ DB: Ford_center_cost_credit ตาราง: Automation_Queue_Center_Cost_Credit สำเร็จ (${result.inserted} รายการ)`);
      setSelectedRows([]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message;
      setError(detail ? `ส่งข้อมูลเข้าคิวล้มเหลว: ${detail}` : 'ส่งข้อมูลเข้าคิวล้มเหลว');
    } finally {
      setLoadingAutomate(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/20 custom-scrollbar overflow-y-auto p-4 md:p-8 lg:p-12">
      <div className="max-w-[1700px] mx-auto w-full space-y-8 pb-20">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard {brand}</h1>
            <p className="text-lg text-slate-500 font-medium">
              จัดการข้อมูลความเคลื่อนไหวอะไหล่เงินเชื่อและต้นทุนผ่าน Excel
            </p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => { setBrand('Ford'); setSalesFile(null); setSalesData([]); }}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${brand === 'Ford' ? 'bg-white text-primary-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Ford
            </button>
            <button
              onClick={() => { setBrand('Nissan'); setSalesFile(null); setSalesData([]); }}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${brand === 'Nissan' ? 'bg-white text-primary-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Nissan
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 text-rose-800 border-l-4 border-rose-500 p-6 rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-rose-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold text-lg">{error}</span>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <CheckIcon />
              </div>
              <span className="font-semibold text-lg">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Single Upload Zone */}
        <div className="grid grid-cols-1 gap-8 items-start">
          <div className={`relative group bg-white border-2 border-dashed ${salesFile ? 'border-primary-500 bg-primary-50/20' : 'border-slate-200 hover:border-primary-400'} rounded-3xl p-10 transition-all duration-300 shadow-sm hover:shadow-md h-[250px] flex flex-col items-center justify-center cursor-pointer`}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setSalesFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-5 rounded-2xl ${salesFile ? 'bg-primary-100 shadow-inner' : 'bg-slate-50 group-hover:shadow-lg group-hover:scale-110'} transition-all duration-300`}>
                <UploadIcon />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">
                  {brand === 'Ford' ? 'ข้อมูลรายได้และต้นทุน (BP Ford)' : 'ข้อมูล Nissan (Excel File)'}
                </h3>
                <p className="text-sm text-slate-500 font-medium">ลากและวางไฟล์ .xlsx หรือ .xls ที่นี่</p>
              </div>
              {salesFile && (
                <div className="bg-white px-4 py-2 rounded-xl border border-primary-200 flex items-center gap-3 shadow-sm scale-105 transition-transform">
                  <ExcelIcon />
                  <span className="text-sm font-bold text-primary-700 truncate max-w-[350px]">{salesFile.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {salesFile && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl sticky top-4 z-40 animate-in slide-in-from-top-8 duration-500">
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status</div>
              <div className="text-sm bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-100 font-bold flex items-center gap-3">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Ready for Processing
              </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={loadingSales || !salesFile}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-extrabold py-5 px-16 rounded-2xl shadow-2xl shadow-primary-200 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-4 text-xl"
            >
              {loadingSales ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังประมวลผล...</span>
                </>
              ) : 'ประมวลผลข้อมูล'}
            </button>
          </div>
        )}

        <div id="sales-data-table" className="flex flex-col gap-6 pt-4 animate-in fade-in duration-700">
          <div className="shrink-0 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="bg-white px-6 py-2.5 rounded-2xl shadow-sm border border-slate-200 text-sm font-extrabold text-primary-700 flex items-center gap-3">
                <span className="text-primary-400">Total</span>
                {salesData.length.toLocaleString()} รายการ
              </div>
              <div className="text-sm text-slate-500 font-bold bg-slate-100/50 px-4 py-2 rounded-xl border border-slate-200">
                {selectedRows.length > 0
                  ? `${selectedRows.length.toLocaleString()} แถวที่เลือกคัดกรอง`
                  : 'ยังไม่ได้เลือกแถวรายการ'}
              </div>
            </div>
            <AutomateButton
              disabled={!selectedDatabase || selectedRows.length === 0}
              selectedCount={selectedRows.length}
              onClick={handleSendToAutomate}
              loading={loadingAutomate}
            />
          </div>
          <div className="flex-1 min-h-[600px] flex flex-col">
            <SalesTable
              data={salesData}
              onSelectionChange={setSelectedRows}
              loading={loadingSales}
              brand={brand}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
