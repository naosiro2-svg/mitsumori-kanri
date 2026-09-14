import React from 'react';
import { FileSpreadsheet, ExternalLink, LogOut, Settings, Users, FileText } from 'lucide-react';
import { GoogleUser } from '../services/googleAuth';
import { SpreadsheetInfo } from '../types/customer';

export type TabKey = 'customers' | 'quotes';

interface NavbarProps {
  user: GoogleUser | null;
  currentSpreadsheet: SpreadsheetInfo | null;
  onOpenSheetManager: () => void;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: TabKey;
  onSwitchTab: (tab: TabKey) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentSpreadsheet,
  onOpenSheetManager,
  onLogin,
  onLogout,
  activeTab,
  onSwitchTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shrink-0">
              見
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                顧客・見積り管理システム
              </h1>
              <p className="text-[11px] text-slate-400 hidden md:block">
                顧客データの蓄積・検索 / 過去データを活用した見積り書作成
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => onSwitchTab('customers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'customers' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>顧客管理</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab('quotes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'quotes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>見積り作成</span>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-sm">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'User'}
                    className="w-6 h-6 rounded-full border border-blue-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
                <p className="hidden md:block text-xs font-medium text-white truncate max-w-[100px]">
                  {user.name || 'ユーザー'}
                </p>
                <button
                  onClick={onLogout}
                  title="ログアウト"
                  className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-xs active:scale-98"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Google連携</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Googleスプレッドシート台帳:</span>
            {currentSpreadsheet ? (
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{currentSpreadsheet.name}</span>
              </span>
            ) : (
              <span className="text-amber-400 font-medium text-[11px]">未接続（ローカル保存中）</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentSpreadsheet && (
              <a
                href={currentSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 hover:text-white font-medium text-[11px] transition-colors"
              >
                <span>シートを開く</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              type="button"
              onClick={onOpenSheetManager}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>{currentSpreadsheet ? 'シート設定・切替' : 'スプレッドシートを接続'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
