export interface Customer {
  id: string;
  companyName: string; // 会社名
  contactName: string; // 担当者名
  phone?: string; // 電話番号
  email?: string; // メールアドレス
  address?: string; // 住所
  notes?: string; // 備考
  createdAt: string;
  syncedToSheets?: boolean;
}

export interface QuoteItem {
  id: string;
  itemName: string; // 品目名
  quantity: number; // 数量
  unit: string; // 単位
  unitPrice: number; // 単価
}

export interface Quote {
  id: string;
  quoteNumber: string; // 見積り番号
  customerId?: string;
  customerName: string; // 顧客名（会社名）
  issueDate: string; // 発行日
  validUntil?: string; // 有効期限
  items: QuoteItem[];
  subtotal: number; // 小計
  taxRate: number; // 消費税率 (例: 0.1)
  taxAmount: number; // 消費税額
  totalAmount: number; // 合計金額
  notes?: string; // 備考
  createdAt: string;
  syncedToSheets?: boolean;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  lastSynced?: string;
  sheetsCount?: number;
}
