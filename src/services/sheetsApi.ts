import { Customer, Quote, QuoteItem, SpreadsheetInfo } from '../types/customer';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export const CUSTOMER_SHEET_NAME = '顧客データ';
export const QUOTE_SHEET_NAME = '見積り明細データ';

export const CUSTOMER_HEADERS = [
  '顧客ID',
  '会社名',
  '担当者名',
  '電話番号',
  'メールアドレス',
  '住所',
  '備考',
  '登録日時',
];

export const QUOTE_HEADERS = [
  '見積り番号',
  '顧客ID',
  '顧客名',
  '発行日',
  '有効期限',
  '明細番号',
  '品目名',
  '数量',
  '単位',
  '単価',
  '金額',
  '小計',
  '消費税額',
  '合計金額',
  '備考',
  '登録日時',
  '見積りID',
];

async function apiFetch(url: string, accessToken: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Google APIの呼び出しに失敗しました');
  }
  return response.json();
}

/**
 * Lists user's spreadsheets in Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const data = await apiFetch(
      `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=15`,
      accessToken
    );
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      lastSynced: file.modifiedTime,
    }));
  } catch (err) {
    console.error('Error listing spreadsheets:', err);
    return [];
  }
}

/**
 * Creates a new dedicated Customer & Quote management spreadsheet
 */
export async function createQuoteSpreadsheet(
  accessToken: string,
  title: string = '顧客・見積り管理台帳'
): Promise<SpreadsheetInfo> {
  const payload = {
    properties: {
      title,
      locale: 'ja_JP',
      timeZone: 'Asia/Tokyo',
    },
    sheets: [
      { properties: { title: CUSTOMER_SHEET_NAME, gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: QUOTE_SHEET_NAME, gridProperties: { frozenRowCount: 1 } } },
    ],
  };

  const result = await apiFetch(SHEETS_API_BASE, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const spreadsheetId = result.spreadsheetId;
  const sheetUrl = result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize header rows
  await apiFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(CUSTOMER_SHEET_NAME)}!A1:H1?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${CUSTOMER_SHEET_NAME}!A1:H1`,
        majorDimension: 'ROWS',
        values: [CUSTOMER_HEADERS],
      }),
    }
  );

  await apiFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(QUOTE_SHEET_NAME)}!A1:Q1?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${QUOTE_SHEET_NAME}!A1:Q1`,
        majorDimension: 'ROWS',
        values: [QUOTE_HEADERS],
      }),
    }
  );

  return {
    id: spreadsheetId,
    name: title,
    url: sheetUrl,
    lastSynced: new Date().toISOString(),
    sheetsCount: 2,
  };
}

// ---------------- Customers ----------------

function customerToRow(c: Customer): any[] {
  return [
    c.id,
    c.companyName,
    c.contactName,
    c.phone || '',
    c.email || '',
    c.address || '',
    c.notes || '',
    c.createdAt ? new Date(c.createdAt).toLocaleString('ja-JP') : new Date().toLocaleString('ja-JP'),
  ];
}

export async function appendCustomerToSheet(
  accessToken: string,
  spreadsheetId: string,
  customer: Customer
): Promise<void> {
  const range = `${encodeURIComponent(CUSTOMER_SHEET_NAME)}!A:H`;
  await apiFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        range: `${CUSTOMER_SHEET_NAME}!A:H`,
        majorDimension: 'ROWS',
        values: [customerToRow(customer)],
      }),
    }
  );
}

export async function syncAllCustomersToSheet(
  accessToken: string,
  spreadsheetId: string,
  customers: Customer[]
): Promise<void> {
  const rows = [CUSTOMER_HEADERS, ...customers.map(customerToRow)];
  await apiFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(CUSTOMER_SHEET_NAME)}!A1:H${rows.length + 10}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${CUSTOMER_SHEET_NAME}!A1:H${rows.length + 10}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );
}

export async function fetchCustomersFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Customer[]> {
  const range = `${encodeURIComponent(CUSTOMER_SHEET_NAME)}!A2:H5000`;
  try {
    const data = await apiFetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`, accessToken);
    const rows: any[][] = data.values || [];
    return rows
      .filter((row) => row && row.length >= 2 && row[0] !== '顧客ID')
      .map((row) => ({
        id: String(row[0] || `cust-${Date.now()}`),
        companyName: String(row[1] || ''),
        contactName: String(row[2] || ''),
        phone: row[3] ? String(row[3]) : undefined,
        email: row[4] ? String(row[4]) : undefined,
        address: row[5] ? String(row[5]) : undefined,
        notes: row[6] ? String(row[6]) : undefined,
        createdAt: row[7] ? String(row[7]) : new Date().toISOString(),
        syncedToSheets: true,
      }));
  } catch (err) {
    return [];
  }
}

// ---------------- Quotes ----------------

function quoteToRows(quote: Quote): any[][] {
  const items = quote.items.length > 0 ? quote.items : [];
  return items.map((item, idx) => {
    const amount = Number(item.quantity) * Number(item.unitPrice);
    return [
      quote.quoteNumber,
      quote.customerId || '',
      quote.customerName,
      quote.issueDate,
      quote.validUntil || '',
      `${idx + 1}/${items.length}`,
      item.itemName,
      item.quantity,
      item.unit,
      item.unitPrice,
      amount.toFixed(0),
      quote.subtotal.toFixed(0),
      quote.taxAmount.toFixed(0),
      quote.totalAmount.toFixed(0),
      quote.notes || '',
      quote.createdAt ? new Date(quote.createdAt).toLocaleString('ja-JP') : new Date().toLocaleString('ja-JP'),
      quote.id,
    ];
  });
}

export async function appendQuoteToSheet(
  accessToken: string,
  spreadsheetId: string,
  quote: Quote
): Promise<void> {
  const range = `${encodeURIComponent(QUOTE_SHEET_NAME)}!A:Q`;
  await apiFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        range: `${QUOTE_SHEET_NAME}!A:Q`,
        majorDimension: 'ROWS',
        values: quoteToRows(quote),
      }),
    }
  );
}

export async function syncAllQuotesToSheet(
  accessToken: string,
  spreadsheetId: string,
  quotes: Quote[]
): Promise<void> {
  const allRows: any[][] = [];
  quotes.forEach((q) => allRows.push(...quoteToRows(q)));
  const rows = [QUOTE_HEADERS, ...allRows];
  await apiFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(QUOTE_SHEET_NAME)}!A1:Q${rows.length + 10}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${QUOTE_SHEET_NAME}!A1:Q${rows.length + 10}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );
}

export async function fetchQuotesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Quote[]> {
  const range = `${encodeURIComponent(QUOTE_SHEET_NAME)}!A2:Q5000`;
  try {
    const data = await apiFetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`, accessToken);
    const rows: any[][] = data.values || [];

    const quoteMap = new Map<string, Quote>();

    rows.forEach((row) => {
      if (!row || row.length < 7) return;
      if (row[0] === '見積り番号') return; // header row safeguard

      const quoteId = String(row[16] || `${row[0]}-${row[1]}`);
      const item: QuoteItem = {
        id: `item-${quoteId}-${quoteMap.get(quoteId)?.items.length ?? 0}`,
        itemName: String(row[6] || ''),
        quantity: parseFloat(row[7]) || 0,
        unit: String(row[8] || ''),
        unitPrice: parseFloat(row[9]) || 0,
      };

      if (quoteMap.has(quoteId)) {
        quoteMap.get(quoteId)!.items.push(item);
      } else {
        quoteMap.set(quoteId, {
          id: quoteId,
          quoteNumber: String(row[0] || ''),
          customerId: row[1] ? String(row[1]) : undefined,
          customerName: String(row[2] || ''),
          issueDate: String(row[3] || ''),
          validUntil: row[4] ? String(row[4]) : undefined,
          items: [item],
          subtotal: parseFloat(row[11]) || 0,
          taxRate: 0.1,
          taxAmount: parseFloat(row[12]) || 0,
          totalAmount: parseFloat(row[13]) || 0,
          notes: row[14] ? String(row[14]) : undefined,
          createdAt: row[15] ? String(row[15]) : new Date().toISOString(),
          syncedToSheets: true,
        });
      }
    });

    return Array.from(quoteMap.values()).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  } catch (err) {
    return [];
  }
}
