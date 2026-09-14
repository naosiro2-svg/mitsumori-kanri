import React, { useState, useEffect } from 'react';
import { UserPlus, Building2, Phone, Mail, MapPin, StickyNote, RotateCcw, Check } from 'lucide-react';
import { Customer } from '../types/customer';

interface CustomerFormProps {
  onSubmitCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  editingCustomer?: Customer | null;
  onCancelEdit?: () => void;
}

const emptyForm = { companyName: '', contactName: '', phone: '', email: '', address: '', notes: '' };

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmitCustomer, editingCustomer, onCancelEdit }) => {
  const [form, setForm] = useState(emptyForm);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setForm({
        companyName: editingCustomer.companyName,
        contactName: editingCustomer.contactName,
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        address: editingCustomer.address || '',
        notes: editingCustomer.notes || '',
      });
    }
  }, [editingCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim()) {
      alert('会社名と担当者名を入力してください。');
      return;
    }

    await onSubmitCustomer({
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    if (!editingCustomer) {
      setForm(emptyForm);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-300 shadow-md overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{editingCustomer ? '顧客情報の編集' : '顧客の新規登録'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">会社名・担当者・連絡先を登録して顧客データを蓄積します。</p>
          </div>
        </div>
        {editingCustomer && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-slate-700 font-bold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>編集キャンセル</span>
          </button>
        )}
      </div>

      {showSuccessToast && (
        <div className="bg-emerald-600 text-white px-5 py-3 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>顧客情報を登録しました！</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              会社名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 株式会社サンプル物産"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              担当者名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 山田 太郎"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              電話番号
            </label>
            <input
              type="text"
              placeholder="例: 03-1234-5678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              メールアドレス
            </label>
            <input
              type="email"
              placeholder="例: yamada@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            住所
          </label>
          <input
            type="text"
            placeholder="例: 東京都千代田区..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-blue-600" />
            備考
          </label>
          <textarea
            rows={2}
            placeholder="取引条件、注意事項など"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>{editingCustomer ? '顧客情報を更新する' : '顧客を登録する'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
