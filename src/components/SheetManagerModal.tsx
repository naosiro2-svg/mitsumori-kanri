import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  ExternalLink,
  RefreshCw,
  Check,
  X,
  FolderOpen,
  Layers,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import { SpreadsheetInfo } from '../types/customer';
import { createQuoteSpreadsheet, listUserSpreadsheets, CUSTOMER_SHEET_NAME, QUOTE_SHEET_NAME } from '../services/sheetsApi';

interface SheetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  currentSpreadsheet: SpreadsheetInfo | null;
  onSelectSpreadsheet: (sheet: SpreadsheetInfo) => void;
}

export const SheetManagerModal: React.FC<SheetManagerModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  currentSpreadsheet,
  onSelectSpreadsheet,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'drive' | 'manual'>('create');
  const [newTitle, setNewTitle] = useState('顧客・見積り管理台帳');
  const [manualIdOrUrl, setManualIdOrUrl] = useState('');
  const [driveSheets, setDriveSheets] = useState<SpreadsheetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken && activeTab === 'drive') {
      loadDriveSheets();
    }
  }, [isOpen, accessToken, activeTab]);

  if (!isOpen) return null;

  const loadDriveSheets = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const sheets = await listUserSpreadsheets(accessToken);
      setDriveSheets(sheets);
    } catch (err: any) {
      setErrorMsg(err.message || 'ドライブ内のスプレッドシート一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!accessToken) {
      setErrorMsg('Googleアカウントへのログインが必要です');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const created = await createQuoteSpreadsheet(accessToken, newTitle || '顧客・見積り管理台帳');
      onSelectSpreadsheet(created);
      setSuccessMsg(`スプレッドシート「${created.name}」を作成・接続しました`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'スプレッドシート作成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectManual = () => {
    if (!manualIdOrUrl.trim()) {
      setErrorMsg('スプレッドシートのURLまたはIDを入力してください');
      return;
    }
    let id = manualIdOrUrl.trim();
    const match = manualIdOrUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }

    const sheetInfo: SpreadsheetInfo = {
      id,
      name: '指定スプレッドシート',
      url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      lastSynced: new Date().toISOString(),
    };
    onSelectSpreadsheet(sheetInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Googleスプレッドシート連携設定</h2>
              <p className="text-xs text-slate-300">顧客データ・見積りデータの自動記録とスプレッドシート連携</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentSpreadsheet && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-800">接続中スプレッドシート:</span>
              <span className="text-xs font-medium text-emerald-950 truncate max-w-xs">{currentSpreadsheet.name}</span>
            </div>
            <a
              href={currentSpreadsheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              <span>スプレッドシートを開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'create' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>新規台帳を作成（推奨）</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'drive' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Driveから選択</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'manual' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>URL・ID指定</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">スプレッドシート名</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例: 顧客・見積り管理台帳"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>作成時に自動生成されるシート</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-800">1. {CUSTOMER_SHEET_NAME}</span>
                  <p className="text-slate-500 text-[11px]">
                    会社名、担当者名、電話番号、メールアドレス、住所、備考などの顧客情報が記録されます。
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-800">2. {QUOTE_SHEET_NAME}</span>
                  <p className="text-slate-500 text-[11px]">
                    見積り番号、顧客、発行日、品目・数量・単価・金額、小計・消費税・合計金額などが記録されます。
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoading || !accessToken}
                  onClick={handleCreateNew}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Googleスプレッドシートを作成中...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>専用スプレッドシートを新規作成して接続</span>
                    </>
                  )}
                </button>
                {!accessToken && (
                  <p className="text-[11px] text-amber-600 mt-2 text-center">
                    ※ 先に右上の「Google連携」ボタンから認証を行ってください。
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'drive' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Googleドライブ内のスプレッドシート</span>
                <button
                  onClick={loadDriveSheets}
                  disabled={isLoading}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>更新</span>
                </button>
              </div>

              {driveSheets.length === 0 && !isLoading ? (
                <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p>ドライブ内のスプレッドシートが見つかりませんでした。</p>
                  <p className="mt-1 text-slate-400">「新規台帳を作成」タブから新しく作成できます。</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {driveSheets.map((sheet) => {
                    const isSelected = currentSpreadsheet?.id === sheet.id;
                    return (
                      <div
                        key={sheet.id}
                        onClick={() => {
                          onSelectSpreadsheet(sheet);
                          onClose();
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileSpreadsheet className={`w-5 h-5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-emerald-600'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{sheet.name}</p>
                            <p className="text-[10px] text-slate-400">ID: {sheet.id.slice(0, 16)}...</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="text-[11px] font-bold text-blue-600 px-2 py-0.5 bg-blue-100 rounded-md">選択中</span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded bg-slate-100 hover:bg-white border border-slate-200"
                          >
                            選択
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">スプレッドシートのURLまたはシートID</label>
                <input
                  type="text"
                  value={manualIdOrUrl}
                  onChange={(e) => setManualIdOrUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1xxxxxx/edit"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  ブラウザのアドレスバーのURLをそのまま貼り付けできます。
                </p>
              </div>

              <button
                type="button"
                onClick={handleConnectManual}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-colors"
              >
                指定スプレッドシートに接続
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
