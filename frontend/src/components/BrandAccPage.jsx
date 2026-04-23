import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Check, X, Search, ChevronUp, ChevronDown } from 'lucide-react';

export default function BrandAccPage() {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Form State
  const [formData, setFormData] = useState({
    Brand: '',
    Branch: '',
    Shorts: '',
    Acc1: '',
    Acc2: '',
    Acc3: '',
    Acc4: '',
    Acc5: '',
    Acc6: ''
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/spare-credit/brand-acc');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditData({ ...editData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAdd = async () => {
    try {
      if (!formData.Brand || !formData.Branch) return alert('Brand and Branch are required!');
      await api.post('/spare-credit/brand-acc', formData);
      setIsAdding(false);
      setFormData({ Brand: '', Branch: '', Shorts: '', Acc1: '', Acc2: '', Acc3: '', Acc4: '', Acc5: '', Acc6: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error adding data');
    }
  };

  const handleEditClick = (index, item) => {
    setEditIndex(index);
    setEditData({ ...item, oldBrand: item.Brand, oldBranch: item.Branch });
  };

  const handleSaveEdit = async () => {
    try {
      const { oldBrand, oldBranch, ...updateData } = editData;
      await api.put(`/spare-credit/brand-acc/${oldBrand}/${oldBranch}`, updateData);
      setEditIndex(-1);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating data');
    }
  };

  const handleDelete = async (brand, branch) => {
    if (window.confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
      try {
        await api.delete(`/spare-credit/brand-acc/${brand}/${branch}`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Error deleting data');
      }
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = [...data]
    .filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = String(a[sortConfig.key] || '').toLowerCase();
      const bVal = String(b[sortConfig.key] || '').toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <Search size={12} className="opacity-0 group-hover:opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-800">Brand Account Management</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
            {searchTerm ? `${filteredAndSortedData.length} of ${data.length}` : `${data.length}`} Records
          </span>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search data..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Add New
          </button>
        </div>
      </div>

      <div className="overflow-x-auto ring-1 ring-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold tracking-wider">
              {['Brand', 'Branch', 'Shorts', 'รายได้ขายศูนย์', 'รายได้ค่าแรง', 'รายได้งานนอก', 'ต้นทุนศูนย์', 'ต้นทุนsublet', 'สินค้าคงเหลือ'].map((col) => (
                <th 
                  key={col} 
                  className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => requestSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col}
                    <SortIcon column={col} />
                  </div>
                </th>
              ))}
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* INLINE ADD ROW */}
            {isAdding && (
              <tr className="bg-indigo-50/50">
                <td className="p-3">
                  <input name="Brand" list="brand-list" value={formData.Brand} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Brand" />
                  <datalist id="brand-list">
                    {[...new Set(data.map(i => i.Brand))].map(b => <option key={b} value={b} />)}
                  </datalist>
                </td>
                <td className="p-3">
                  <input name="Branch" list="branch-list" value={formData.Branch} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Branch" />
                  <datalist id="branch-list">
                    {[...new Set(data.map(i => i.Branch))].map(b => <option key={b} value={b} />)}
                  </datalist>
                </td>
                <td className="p-3">
                  <input name="Shorts" list="shorts-list" value={formData.Shorts} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Shorts" />
                  <datalist id="shorts-list">
                    {[...new Set(data.map(i => i.Shorts))].map(b => <option key={b} value={b} />)}
                  </datalist>
                </td>
                <td className="p-3"><input name="Acc1" value={formData.Acc1} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acc1" /></td>
                <td className="p-3"><input name="Acc2" value={formData.Acc2} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acc2" /></td>
                <td className="p-3"><input name="Acc3" value={formData.Acc3} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acc3" /></td>
                <td className="p-3"><input name="Acc4" value={formData.Acc4} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acc4" /></td>
                <td className="p-3"><input name="Acc5" value={formData.Acc5} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acc5" /></td>
                <td className="p-3"><input name="Acc6" value={formData.Acc6} onChange={e => handleChange(e)} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acc6" /></td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={handleAdd} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"><Check size={16} /></button>
                    <button onClick={() => setIsAdding(false)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"><X size={16} /></button>
                  </div>
                </td>
              </tr>
            )}

            {/* DATA ROWS */}
            {filteredAndSortedData.map((item, idx) => {
              // Find original index for editing
              const originalIndex = data.findIndex(d => d.Brand === item.Brand && d.Branch === item.Branch);
              const isEditing = editIndex === originalIndex;
              
              return (
                <tr key={`${item.Brand}-${item.Branch}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Brand" list="brand-list-edit" value={editData.Brand} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Brand}
                    {isEditing && <datalist id="brand-list-edit">{[...new Set(data.map(i => i.Brand))].map(b => <option key={b} value={b} />)}</datalist>}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Branch" list="branch-list-edit" value={editData.Branch} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Branch}
                    {isEditing && <datalist id="branch-list-edit">{[...new Set(data.map(i => i.Branch))].map(b => <option key={b} value={b} />)}</datalist>}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Shorts" list="shorts-list-edit" value={editData.Shorts} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Shorts}
                    {isEditing && <datalist id="shorts-list-edit">{[...new Set(data.map(i => i.Shorts))].map(b => <option key={b} value={b} />)}</datalist>}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Acc1" value={editData.Acc1} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Acc1}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Acc2" value={editData.Acc2} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Acc2}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Acc3" value={editData.Acc3} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Acc3}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Acc4" value={editData.Acc4} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Acc4}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Acc5" value={editData.Acc5} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Acc5}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {isEditing ? <input name="Acc6" value={editData.Acc6} onChange={e => handleChange(e, true)} className="w-full border rounded p-1" /> : item.Acc6}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"><Check size={16} /></button>
                          <button onClick={() => setEditIndex(-1)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditClick(originalIndex, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(item.Brand, item.Branch)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedData.length === 0 && !isAdding && (
              <tr>
                <td colSpan="10" className="p-8 text-center text-slate-400">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
