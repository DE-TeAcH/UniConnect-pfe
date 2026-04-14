export interface EventForPDF {
  title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  creator_name?: string;
  is_paid: boolean;
  price?: number;
  registration_count?: number;
}

export interface ApplicantForPDF {
  full_name?: string;
  username?: string;
  email?: string;
  registered_at?: string;
  redirected_at?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function exportEventApplicantsPDF(event: EventForPDF, applicants: ApplicantForPDF[] = []): void {
  const applicantRows = applicants.map((a, idx) => {
    const name = a.full_name || a.username || 'Guest';
    const email = a.email || '—';
    const date = formatShortDate(a.registered_at || a.redirected_at);
    return `
      <tr style="border-bottom:1px solid #e2e8f0;${idx % 2 === 0 ? '' : 'background:#f8fafc;'}">
        <td style="padding:8px 10px;color:#64748b;text-align:center;font-size:12px;">${idx + 1}</td>
        <td style="padding:8px 10px;font-weight:600;font-size:12px;">${name}</td>
        <td style="padding:8px 10px;color:#475569;font-size:12px;">${email}</td>
        <td style="padding:8px 10px;color:#64748b;font-size:11px;white-space:nowrap;">${date}</td>
      </tr>`;
  }).join('');

  const applicantsSection = applicants.length > 0 ? `
  <div style="margin-top:24px;">
    <div style="font-size:13px;font-weight:700;color:#1e3a8a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #3b82f6;">
      ${event.is_paid ? 'Payment Page Visits' : 'Registered Applicants'}
      <span style="font-weight:400;color:#64748b;margin-left:8px;">(${applicants.length})</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#1e3a8a;color:#fff;">
          <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:600;width:40px;">#</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:600;">Name</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:600;">Email</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:600;">${event.is_paid ? 'Visited At' : 'Registered At'}</th>
        </tr>
      </thead>
      <tbody>${applicantRows}</tbody>
    </table>
  </div>` : `
  <div style="margin-top:24px;text-align:center;color:#94a3b8;font-size:13px;padding:20px 0;">
    No applicants recorded yet.
  </div>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Event Report – ${event.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 32px; font-size: 13px; }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { font-size: 22px; font-weight: 700; color: #1e3a8a; }
    .header .meta { text-align: right; color: #64748b; line-height: 1.8; }
    .meta span { display: block; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; background: #f8fafc; padding: 16px; border-radius: 8px; }
    .info-item label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-item span { font-weight: 600; color: #1e293b; font-size: 13px; }
    .footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 14px; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:11px;color:#6366f1;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">UniConnect — Event Report</div>
      <h1>${event.title}</h1>
    </div>
    <div class="meta">
      <span><strong>Generated:</strong> ${formatDate(new Date().toISOString())}</span>
      <span><strong>Type:</strong> ${event.is_paid ? `Paid (${(event.price || 0).toFixed(2)} DZD)` : 'Free'}</span>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><label>Creator</label><span>${event.creator_name || '—'}</span></div>
    <div class="info-item"><label>Location</label><span>${event.location || '—'}</span></div>
    <div class="info-item"><label>Dates</label><span>${new Date(event.start_date).toLocaleDateString()} → ${new Date(event.end_date).toLocaleDateString()}</span></div>
    <div class="info-item"><label>Registrations</label><span>${event.registration_count || applicants.length || 0}</span></div>
  </div>

  ${applicantsSection}

  <div class="footer">
    <span>UniConnect — By TE4CH</span>
    <span>Page 1 of 1</span>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onafterprint = () => URL.revokeObjectURL(url);
  }
}
