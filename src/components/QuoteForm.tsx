import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  History,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Customer, Quote, QuoteItem } from '../types/customer';

interface QuoteFormProps {
  customers: Customer[];
  quotes: Quote[];
  onSubmitQuote: (data: Omit<Quote, 'id' | 'createdAt' | 'subtotal' | 'taxAmount' | 'totalAmount'>) => Promise<void>;
  editingQuote?: Quote | null;
  onCancelEdit?: () => void;
  presetCustomer?: Customer | null;
}

const createEmptyItem = (): QuoteItem => ({
  id: `item-temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  quantity: 1,
  unit: '式',
  unitPrice: 0,
});

const todayStr = () => new Date().toISOString().split('T')[0];

const validUntilDefault = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export const QuoteForm: React.FC<QuoteFormProps> = ({
  customers,
  quotes,
  onSubmitQuote,
  editingQuote,
  onCancelEdit,
  presetCustomer,
}) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [issueDate, setIssueDate] = useState(todayStr());
  const [validUntil, setValidUntil] = useState(validUntilDefault());
  const [items, setItems] = useState<QuoteItem[]>([createEmptyItem()]);
  const [taxRate, setTaxRate] = useState(0.1);
  const [notes, setNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (presetCustomer) {
      setCustomerId(presetCustomer.id);
      setCustomerName(presetCustomer.companyName);
    }
  }, [presetCustomer]);

  useEffect(() => {
    if (editingQuote) {
      setCustomerId(editingQuote.customerId || '');
      setCustomerName(editingQuote.customerName);
      setIssueDate(editingQuote.issueDate);
      setValidUntil(editingQuote.validUntil || validUntilDefault());
      setItems(editingQuote.items.length > 0 ? editingQuote.items : [createEmptyItem()]);
      setTaxRate(editingQuote.taxRate ?? 0.1);
      setNotes(editingQuote.notes || '');
    }
  }, [editingQuote]);

  // 選択中の顧客に関する過去の見積り履歴（過去データの活用）
  const pastQuotesForCustomer = useMemo(() => {
    if (!customerId && !customerName) return [];
    return quotes
      .filter((q) => (customerId && q.customerId === customerId) || (!customerId && q.customerName === customerName))
      .filter((q) => q.id !== editingQuote?.id)
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }, [quotes, customerId, customerName, editingQuote]);

  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    const found = customers.find((c) => c.id === id);
    setCustomerName(found ? found.companyName : '');
  };

  const handleAddItem = () => setItems([...items, createEmptyItem()]);
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };
  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  // 過去の見積りの明細をそのままコピーして新規見積りの下書きにする
  const handleCopyPastQuote = (past: Quote) => {
    setItems(
      past.items.map((item) => ({
        ...item,
        id: `item-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }))
    );
    setTaxRate(past.taxRate ?? 0.1);
    setNotes(past.notes || '');
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const taxAmount = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('顧客（会社名）を選択または入力してください。');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        alert(`明細 #${i + 1} の品目名を入力してください。`);
        return;
      }
    }

    const quoteNumber = editingQuote?.quoteNumber || `Q-${issueDate.replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    await onSubmitQuote({
      quoteNumber,
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      issueDate,
      validUntil,
      items: items.map((item) => ({
        ...item,
        itemName: item.itemName.trim(),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      })),
      taxRate,
      notes: notes.trim(),
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    if (!editingQuote) {
      setItems([createEmptyItem()]);
      setNotes('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quote Form */}
      <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-300 shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{editingQuote ? '見積り書の編集' : '見積り書の作成'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">品目・数量・単価を入力すると自動で金額を計算します。</p>
            </div>
          </div>
          {editingQuote && (
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
            <span>見積り書（合計 {totalAmount.toLocaleString()}円）を登録しました！</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                顧客（既存から選択） <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
              >
                <option value="">-- 未選択（下に直接入力） --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}（{c.contactName}）
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                会社名（直接入力も可） <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setCustomerId('');
                }}
                placeholder="例: 株式会社サンプル物産"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">発行日</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">有効期限</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">見積り明細</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>明細を追加</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 text-[11px] font-bold text-slate-600">
                <div className="col-span-4">品目名</div>
                <div className="col-span-2">数量</div>
                <div className="col-span-2">単位</div>
                <div className="col-span-2">単価</div>
                <div className="col-span-1 text-right">金額</div>
                <div className="col-span-1"></div>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item, index) => {
                  const amount = Number(item.quantity) * Number(item.unitPrice);
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center bg-white">
                      <input
                        type="text"
                        required
                        placeholder="品目名"
                        value={item.itemName}
                        onChange={(e) => handleUpdateItem(index, 'itemName', e.target.value)}
                        className="col-span-4 px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-md text-xs text-right"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                        className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-md text-xs text-right"
                      />
                      <div className="col-span-1 text-right text-xs font-mono font-bold text-slate-800">
                        {amount.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="col-span-1 flex justify-end text-rose-500 hover:text-rose-700 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">小計</span>
              <span className="font-mono font-bold text-slate-800">{subtotal.toLocaleString()} 円</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5">
                消費税率
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="text-xs border border-slate-300 rounded px-1 py-0.5"
                >
                  <option value={0.1}>10%</option>
                  <option value={0.08}>8%</option>
                  <option value={0}>0%</option>
                </select>
              </span>
              <span className="font-mono font-bold text-slate-800">{taxAmount.toLocaleString()} 円</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-300">
              <span className="font-bold text-slate-800">合計金額</span>
              <span className="font-mono font-bold text-indigo-700 text-lg">{totalAmount.toLocaleString()} 円</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">備考</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="納期、支払条件など"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-98"
            >
              <FileText className="w-4 h-4" />
              <span>{editingQuote ? '見積り書を更新する' : '見積り書を登録する'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Past quotes reference panel (過去データを活用) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="w-full p-4 flex items-center justify-between bg-slate-50 border-b border-slate-200"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <History className="w-4 h-4 text-indigo-600" />
            この顧客の過去の見積り
          </span>
          {showHistory ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showHistory && (
          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
            {!customerId && !customerName ? (
              <p className="text-xs text-slate-400 p-4 text-center">顧客を選択すると、過去の見積り実績がここに表示されます。</p>
            ) : pastQuotesForCustomer.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">この顧客の過去の見積りデータはまだありません。</p>
            ) : (
              pastQuotesForCustomer.map((q) => (
                <div key={q.id} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">{q.issueDate}</span>
                    <span className="font-bold text-indigo-700">{q.totalAmount.toLocaleString()} 円</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {q.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="truncate mr-2">{item.itemName}</span>
                        <span className="font-mono text-slate-500 shrink-0">
                          {item.quantity}
                          {item.unit} × {item.unitPrice.toLocaleString()}円
                        </span>
                      </div>
                    ))}
                    {q.items.length > 3 && <p className="text-slate-400">他 {q.items.length - 3} 件...</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPastQuote(q)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-1.5 rounded-md transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>この明細を新しい見積りにコピー</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
