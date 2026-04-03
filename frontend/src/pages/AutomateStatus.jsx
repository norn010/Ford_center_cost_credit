import { useEffect, useMemo, useState } from 'react';
import { fetchAutomateQueue } from '../services/api';
import QueueTable from '../components/QueueTable';

function AutomateStatus() {
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAutomateQueue({
        status: 'กำลังAutomate'
      });
      setQueueData(data);
    } catch (err) {
      setError('Failed to load automation queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
    const interval = setInterval(() => loadQueue(), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-8 p-4 md:p-8">
      <header className="shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Automation Status</h1>
          <p className="text-slate-500 font-medium text-lg">
            ติดตามสถานะการกู้คืนและประมวลผลอะไหล่เงินเชื่อจากคิวงาน
          </p>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border border-rose-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <QueueTable data={queueData} loading={loading} onRefresh={() => loadQueue()} />
      </div>
    </div>
  );
}

export default AutomateStatus;

