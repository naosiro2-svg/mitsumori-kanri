import React, { useState } from 'react';
import { Search, Trash2, Edit3, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Quote } from '../types/customer';

interface QuoteListProps {
  quotes: Quote[];
  onEditQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({ quotes, onEditQuote, onDeleteQuote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleQuotes = quotes.filter((q) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const text = `${q.customerName} ${q.quoteNumber} ${q.items.map((i) => i.itemName).join(' ')}`.toLowerCase();
    return text.includes(query);
  });

  const totalVisibleAmount = visibleQuotes.reduce((sum, q) => sum + q.totalAmount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>見積り書一覧・検索</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">作成済みの見積り書を検索・確認できます。</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="顧客名、見積り番号、品目で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 flex items-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">該当見積り数:</span>
          <strong className="text-white font-mono text-sm">{visibleQuotes.length}</strong>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-slate-400">合計金額:</span>
          <strong className="text-emerald-400 font-mono text-sm">{totalVisibleAmount.toLocaleString()} 円</strong>
        </div>
      </div>

      <div className="divide-y divide-slate-200 overflow-y-auto max-h-[700px]">
        {visibleQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">該当する見積り書がありません</p>
            <p className="text-xs text-slate-400">左のフォームから見積り書を作成してください。</p>
          </div>
        ) : (
          visibleQuotes.map((quote) => {
            const isExpanded = expandedId === quote.id;
            return (
              <div key={quote.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <div className="bg-slate-900 text-white px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{quote.issueDate}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{quote.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{quote.quoteNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-sm font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                      {quote.totalAmount.toLocaleString()} 円
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditQuote(quote)}
                      title="編集"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuote(quote.id)}
                      title="削除"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5 text-xs">
                    {quote.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-800 font-medium">{item.itemName}</span>
                        <span className="font-mono text-slate-600">
                          {item.quantity}
                          {item.unit} × {item.unitPrice.toLocaleString()}円 ={' '}
                          <strong>{(item.quantity * item.unitPrice).toLocaleString()}円</strong>
                        </span>
                      </div>
                    ))}
                    {quote.notes && (
                      <p className="text-slate-500 pt-1">【備考】{quote.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
