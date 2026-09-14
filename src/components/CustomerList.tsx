import React, { useState } from 'react';
import { Search, Trash2, Edit3, Building2, Phone, Mail, MapPin, FileText, Users } from 'lucide-react';
import { Customer } from '../types/customer';

interface CustomerListProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onCreateQuoteForCustomer: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEditCustomer,
  onDeleteCustomer,
  onCreateQuoteForCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const visibleCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const text = `${c.companyName} ${c.contactName} ${c.phone || ''} ${c.email || ''} ${c.address || ''} ${c.notes || ''}`.toLowerCase();
    return text.includes(q);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>顧客一覧・検索</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">登録済みの顧客データを検索できます。</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="会社名、担当者、電話、メールで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs">
        <span className="text-slate-400">該当顧客数:</span>
        <strong className="text-white font-mono text-sm">{visibleCustomers.length}</strong>
        <span className="text-slate-400">/ 全 {customers.length} 件</span>
      </div>

      <div className="divide-y divide-slate-200 overflow-y-auto max-h-[700px]">
        {visibleCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">該当する顧客が見つかりません</p>
            <p className="text-xs text-slate-400">上のフォームから顧客を登録してください。</p>
          </div>
        ) : (
          visibleCustomers.map((customer) => (
            <div key={customer.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{customer.companyName}</p>
                    <p className="text-xs text-slate-500">{customer.contactName} 様</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => onCreateQuoteForCustomer(customer)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[11px] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>見積り作成</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditCustomer(customer)}
                    title="編集"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomer(customer.id)}
                    title="削除"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pl-10.5">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {customer.email}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {customer.address}
                  </span>
                )}
              </div>

              {customer.notes && (
                <p className="text-xs text-slate-500 pl-10.5 leading-relaxed">{customer.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
