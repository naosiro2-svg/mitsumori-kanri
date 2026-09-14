import React, { useState, useEffect } from 'react';
import { GoogleUser, googleSignIn, logout } from './services/googleAuth';
import { Customer, Quote, SpreadsheetInfo } from './types/customer';
import {
  fetchCustomersFromSheet,
  appendCustomerToSheet,
  syncAllCustomersToSheet,
  fetchQuotesFromSheet,
  appendQuoteToSheet,
  syncAllQuotesToSheet,
} from './services/sheetsApi';
import { Navbar, TabKey } from './components/Navbar';
import { SheetManagerModal } from './components/SheetManagerModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CustomerForm } from './components/CustomerForm';
import { CustomerList } from './components/CustomerList';
import { QuoteForm } from './components/QuoteForm';
import { QuoteList } from './components/QuoteList';

const LOCAL_STORAGE_CUSTOMERS_KEY = 'mitsumori_customers_v1';
const LOCAL_STORAGE_QUOTES_KEY = 'mitsumori_quotes_v1';
const LOCAL_STORAGE_ACTIVE_SHEET_KEY = 'mitsumori_active_sheet_v1';

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('customers');

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [currentSpreadsheet, setCurrentSpreadsheet] = useState<SpreadsheetInfo | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHEET_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [isSheetManagerOpen, setIsSheetManagerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [presetCustomerForQuote, setPresetCustomerForQuote] = useState<Customer | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (e) {
      // ignore
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(quotes));
    } catch (e) {
      // ignore
    }
  }, [quotes]);

  useEffect(() => {
    if (currentSpreadsheet) {
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_SHEET_KEY, JSON.stringify(currentSpreadsheet));
      } catch (e) {
        // ignore
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SHEET_KEY);
    }
  }, [currentSpreadsheet]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setStatusNotification({ type, message });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setAccessToken(result.accessToken);
      showNotification(`Googleアカウント「${result.user.name || result.user.email}」でログインしました`, 'success');
      if (!currentSpreadsheet) {
        setIsSheetManagerOpen(true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Googleログインに失敗しました', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setAccessToken(null);
    showNotification('ログアウトしました', 'info');
  };

  const handleSelectSpreadsheet = async (sheet: SpreadsheetInfo) => {
    setCurrentSpreadsheet(sheet);
    showNotification(`スプレッドシート「${sheet.name}」を接続しました`, 'success');

    if (accessToken) {
      try {
        const [fetchedCustomers, fetchedQuotes] = await Promise.all([
          fetchCustomersFromSheet(accessToken, sheet.id),
          fetchQuotesFromSheet(accessToken, sheet.id),
        ]);
        if (fetchedCustomers.length > 0) setCustomers(fetchedCustomers);
        if (fetchedQuotes.length > 0) setQuotes(fetchedQuotes);
      } catch (err) {
        console.warn('Failed to load existing sheet data', err);
      }
    }
  };

  // ---------------- Customers ----------------

  const handleSubmitCustomer = async (data: Omit<Customer, 'id' | 'createdAt'>) => {
    if (editingCustomer) {
      const updated: Customer = { ...editingCustomer, ...data };
      const newCustomers = customers.map((c) => (c.id === editingCustomer.id ? updated : c));
      setCustomers(newCustomers);
      setEditingCustomer(null);

      if (accessToken && currentSpreadsheet) {
        try {
          await syncAllCustomersToSheet(accessToken, currentSpreadsheet.id, newCustomers);
          showNotification('顧客情報を更新し、スプレッドシートへ再同期しました', 'success');
        } catch (err) {
          console.warn('Sync failed:', err);
        }
      } else {
        showNotification('顧客情報を更新しました', 'success');
      }
      return;
    }

    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    let synced = false;
    if (accessToken && currentSpreadsheet) {
      try {
        await appendCustomerToSheet(accessToken, currentSpreadsheet.id, newCustomer);
        synced = true;
      } catch (err) {
        console.warn('Append customer failed, saved locally:', err);
      }
    }

    setCustomers((prev) => [{ ...newCustomer, syncedToSheets: synced }, ...prev]);
    showNotification(
      synced ? '顧客を登録し、Googleスプレッドシートへ同期しました！' : '顧客を登録しました（ローカル保存）',
      'success'
    );
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;

    setConfirmDialog({
      isOpen: true,
      title: '顧客の削除確認',
      message: `顧客「${target.companyName}（${target.contactName}）」を削除しますか？\n\nこの操作は取り消せません。`,
      isDestructive: true,
      confirmLabel: '削除する',
      onConfirm: async () => {
        const remaining = customers.filter((c) => c.id !== id);
        setCustomers(remaining);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (accessToken && currentSpreadsheet) {
          try {
            await syncAllCustomersToSheet(accessToken, currentSpreadsheet.id, remaining);
            showNotification('顧客を削除し、スプレッドシートを更新しました', 'success');
          } catch (err) {
            console.warn('Failed to resync after deletion', err);
          }
        } else {
          showNotification('顧客を削除しました', 'success');
        }
      },
    });
  };

  const handleCreateQuoteForCustomer = (customer: Customer) => {
    setPresetCustomerForQuote(customer);
    setActiveTab('quotes');
  };

  // ---------------- Quotes ----------------

  const handleSubmitQuote = async (
    data: Omit<Quote, 'id' | 'createdAt' | 'subtotal' | 'taxAmount' | 'totalAmount'>
  ) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * data.taxRate);
    const totalAmount = subtotal + taxAmount;

    if (editingQuote) {
      const updated: Quote = { ...editingQuote, ...data, subtotal, taxAmount, totalAmount };
      const newQuotes = quotes.map((q) => (q.id === editingQuote.id ? updated : q));
      setQuotes(newQuotes);
      setEditingQuote(null);

      if (accessToken && currentSpreadsheet) {
        try {
          await syncAllQuotesToSheet(accessToken, currentSpreadsheet.id, newQuotes);
          showNotification('見積り書を更新し、スプレッドシートへ再同期しました', 'success');
        } catch (err) {
          console.warn('Sync failed:', err);
        }
      } else {
        showNotification('見積り書を更新しました', 'success');
      }
      return;
    }

    const newQuote: Quote = {
      ...data,
      id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      subtotal,
      taxAmount,
      totalAmount,
    };

    let synced = false;
    if (accessToken && currentSpreadsheet) {
      try {
        await appendQuoteToSheet(accessToken, currentSpreadsheet.id, { ...newQuote, syncedToSheets: true });
        synced = true;
      } catch (err) {
        console.warn('Append quote failed, saved locally:', err);
      }
    }

    setQuotes((prev) => [{ ...newQuote, syncedToSheets: synced }, ...prev]);
    setPresetCustomerForQuote(null);
    showNotification(
      synced ? '見積り書を登録し、Googleスプレッドシートへ同期しました！' : '見積り書を登録しました（ローカル保存）',
      'success'
    );
  };

  const handleDeleteQuote = (id: string) => {
    const target = quotes.find((q) => q.id === id);
    if (!target) return;

    setConfirmDialog({
      isOpen: true,
      title: '見積り書の削除確認',
      message: `見積り書「${target.quoteNumber}」（${target.customerName} / 合計 ${target.totalAmount.toLocaleString()}円）を削除しますか？\n\nこの操作は取り消せません。`,
      isDestructive: true,
      confirmLabel: '削除する',
      onConfirm: async () => {
        const remaining = quotes.filter((q) => q.id !== id);
        setQuotes(remaining);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (accessToken && currentSpreadsheet) {
          try {
            await syncAllQuotesToSheet(accessToken, currentSpreadsheet.id, remaining);
            showNotification('見積り書を削除し、スプレッドシートを更新しました', 'success');
          } catch (err) {
            console.warn('Failed to resync after deletion', err);
          }
        } else {
          showNotification('見積り書を削除しました', 'success');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 font-sans flex flex-col">
      <Navbar
        user={user}
        currentSpreadsheet={currentSpreadsheet}
        onOpenSheetManager={() => setIsSheetManagerOpen(true)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
      />

      {statusNotification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-xs font-bold flex items-center gap-2.5 ${
            statusNotification.type === 'success' ? 'bg-emerald-700' : statusNotification.type === 'error' ? 'bg-rose-700' : 'bg-blue-700'
          }`}
        >
          <span>{statusNotification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeTab === 'customers' ? (
          <>
            <CustomerForm
              onSubmitCustomer={handleSubmitCustomer}
              editingCustomer={editingCustomer}
              onCancelEdit={() => setEditingCustomer(null)}
            />
            <CustomerList
              customers={customers}
              onEditCustomer={(c) => {
                setEditingCustomer(c);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDeleteCustomer={handleDeleteCustomer}
              onCreateQuoteForCustomer={handleCreateQuoteForCustomer}
            />
          </>
        ) : (
          <>
            <QuoteForm
              customers={customers}
              quotes={quotes}
              onSubmitQuote={handleSubmitQuote}
              editingQuote={editingQuote}
              onCancelEdit={() => setEditingQuote(null)}
              presetCustomer={presetCustomerForQuote}
            />
            <QuoteList
              quotes={quotes}
              onEditQuote={(q) => {
                setEditingQuote(q);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDeleteQuote={handleDeleteQuote}
            />
          </>
        )}
      </main>

      <SheetManagerModal
        isOpen={isSheetManagerOpen}
        onClose={() => setIsSheetManagerOpen(false)}
        accessToken={accessToken}
        currentSpreadsheet={currentSpreadsheet}
        onSelectSpreadsheet={handleSelectSpreadsheet}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 顧客・見積り管理システム</p>
          <p className="text-slate-500">Google Sheets API & Google Drive API Integration</p>
        </div>
      </footer>
    </div>
  );
}
