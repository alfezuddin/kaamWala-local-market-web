import { APP_NAME } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import type { Transaction } from "@/types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string, strong = false) {
  const weight = strong ? "600" : "400";
  return `<tr>
    <td style="padding:6px 0;color:#64748b;font-weight:400">${escapeHtml(label)}</td>
    <td style="padding:6px 0;text-align:right;font-weight:${weight}">${escapeHtml(value)}</td>
  </tr>`;
}

function documentShell(title: string, inner: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color:#0f172a; margin:0; padding:32px; background:#f8fafc; }
  .sheet { max-width:720px; margin:0 auto; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:32px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .muted { color:#64748b; font-size:13px; }
  .rule { height:1px; background:#e2e8f0; margin:20px 0; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  .brand { font-size:18px; font-weight:700; letter-spacing:-0.01em; }
  @media print { body { background:#fff; padding:0; } .sheet { border:0; } }
</style>
</head>
<body><div class="sheet">${inner}</div></body>
</html>`;
}

function openPrintable(html: string) {
  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}

export function invoiceHtml(transaction: Transaction) {
  return documentShell(
    `Invoice ${transaction.invoiceNo}`,
    `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
      <div>
        <p class="brand">${APP_NAME}</p>
        <p class="muted">Tax invoice</p>
      </div>
      <div style="text-align:right">
        <h1>${escapeHtml(transaction.invoiceNo)}</h1>
        <p class="muted">Ref ${escapeHtml(transaction.reference)}</p>
      </div>
    </div>
    <div class="rule"></div>
    <table>
      <tbody>
        ${row("Booking reference", transaction.bookingId)}
        ${row("Payment date", new Date(transaction.createdAt).toLocaleString("en-IN"))}
        ${row("Payment method", transaction.method)}
        ${row("Status", transaction.status)}
      </tbody>
    </table>
    <div class="rule"></div>
    <table>
      <tbody>
        ${row("Service amount", formatINR(transaction.amount - transaction.platformFee))}
        ${row("Platform fee (incl. GST)", formatINR(transaction.platformFee))}
        ${row("Total paid", formatINR(transaction.amount), true)}
      </tbody>
    </table>
    <div class="rule"></div>
    <p class="muted">This is a computer-generated invoice and does not require a signature. For any query, contact support through the ${APP_NAME} app.</p>
  `,
  );
}

export function receiptHtml(transaction: Transaction) {
  return documentShell(
    `Receipt ${transaction.reference}`,
    `
    <p class="brand" style="text-align:center">${APP_NAME}</p>
    <h1 style="text-align:center;margin-top:16px">Payment receipt</h1>
    <p class="muted" style="text-align:center">Ref ${escapeHtml(transaction.reference)}</p>
    <div class="rule"></div>
    <table>
      <tbody>
        ${row("Booking", transaction.bookingId)}
        ${row("Method", transaction.method)}
        ${row("Date", new Date(transaction.createdAt).toLocaleString("en-IN"))}
        ${row("Amount paid", formatINR(transaction.amount), true)}
      </tbody>
    </table>
    <div class="rule"></div>
    <p class="muted" style="text-align:center">Thank you for choosing ${APP_NAME}.</p>
  `,
  );
}

export function printReceipt(transaction: Transaction): boolean {
  return openPrintable(receiptHtml(transaction));
}

export function downloadInvoice(transaction: Transaction) {
  const blob = new Blob([invoiceHtml(transaction)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${transaction.invoiceNo}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printHtml(html: string) {
  return openPrintable(html);
}
