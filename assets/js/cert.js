/**
 * TeachJS Certificate Issuance
 * Handles student data management and ProofDeck API calls
 */

/* ── Modal open / close ─────────────────────────────── */
function openCertModal() {
  const overlay = document.getElementById('certOverlay');
  if (overlay) {
    overlay.classList.add('open');
    if (window.lucide) lucide.createIcons();
    overlay.querySelector('input')?.focus();
  }
}

function closeCertModal() {
  const overlay = document.getElementById('certOverlay');
  if (overlay) overlay.classList.remove('open');
}

// Close on backdrop click
document.getElementById('certOverlay')?.addEventListener('click', function (e) {
  if (e.target === this) closeCertModal();
});

/* ── Student row management ─────────────────────────── */
function addStudentRow() {
  const list = document.getElementById('certStudentsList');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'cert-student-row';
  row.innerHTML = `
    <input class="cert-input" type="text" placeholder="Full name" />
    <input class="cert-input" type="email" placeholder="email@example.com" />
    <button class="cert-remove-btn" onclick="removeStudentRow(this)" title="Remove row"><i data-lucide="trash-2"></i></button>`;

  list.appendChild(row);
  if (window.lucide) lucide.createIcons();
  row.querySelector('input').focus();
}

function removeStudentRow(btn) {
  const rows = document.querySelectorAll('.cert-student-row');
  if (rows.length > 1) {
    btn.closest('.cert-student-row').remove();
  }
}

function resetCertForm() {
  const list = document.getElementById('certStudentsList');
  if (!list) return;
  // Keep only one empty row
  list.innerHTML = `
    <div class="cert-student-row">
      <input class="cert-input" type="text" placeholder="Full name" />
      <input class="cert-input" type="email" placeholder="email@example.com" />
      <button class="cert-remove-btn" onclick="removeStudentRow(this)" title="Remove row"><i data-lucide="trash-2"></i></button>
    </div>`;
  if (window.lucide) lucide.createIcons();

  const result = document.getElementById('certResult');
  if (result) { result.className = 'cert-result'; result.textContent = ''; }
}

/* ── Issue certificates ─────────────────────────────── */
async function issueCertificates() {
  const rows = document.querySelectorAll('.cert-student-row');
  const students = [];

  for (const row of rows) {
    const inputs = row.querySelectorAll('input');
    const name  = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    if (name && email) students.push({ name, email });
  }

  const btn = document.getElementById('certSubmitBtn');

  if (students.length === 0) {
    showCertResult('Please add at least one student with a name and email.', 'error');
    return;
  }

  // Loading state
  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i data-lucide="loader-2"></i> Issuing…';
  if (window.lucide) lucide.createIcons();

  const result = document.getElementById('certResult');
  if (result) { result.className = 'cert-result'; result.textContent = ''; }

  const today = new Date().toISOString().slice(0, 10);
  const issued = [], failed = [];

  for (const student of students) {
    try {
      const res  = await fetch('/api/issue-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name:  student.name,
          recipient_email: student.email,
          issue_date:      today
        })
      });
      const data = await res.json();
      if (res.ok) {
        issued.push(student.name);
      } else {
        failed.push(student.name + ' (' + (data.error || 'unknown error') + ')');
      }
    } catch (e) {
      failed.push(student.name + ' (network error)');
    }
  }

  // Restore button
  btn.disabled = false;
  btn.innerHTML = originalHTML;
  if (window.lucide) lucide.createIcons();

  if (failed.length === 0) {
    // ✅ Full success — close modal, show toast, reset form
    closeCertModal();
    resetCertForm();
    showCertToast(
      issued.length === 1
        ? `Certificate sent to ${issued[0]}!`
        : `${issued.length} certificates sent successfully!`
    );
  } else if (issued.length > 0) {
    // ⚠️ Partial success — show inline result in modal
    showCertResult(
      'Sent to: ' + issued.join(', ') + '.  Failed: ' + failed.join(', ') + '.',
      'success'
    );
  } else {
    // ❌ Total failure — show inline error
    showCertResult('Failed: ' + failed.join(', ') + '.', 'error');
  }
}

/* ── Inline result (errors / partials) ─────────────── */
function showCertResult(msg, type) {
  const el = document.getElementById('certResult');
  if (!el) return;
  el.textContent = msg;
  el.className = 'cert-result ' + type;
}

/* ── Toast notification (full success) ─────────────── */
function showCertToast(msg) {
  // Remove any existing toast
  document.getElementById('certToast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'certToast';
  toast.className = 'cert-toast';
  toast.innerHTML = `<i data-lucide="check-circle-2"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  // Trigger entrance
  requestAnimationFrame(() => toast.classList.add('cert-toast--visible'));

  // Auto-dismiss after 4 s
  setTimeout(() => {
    toast.classList.remove('cert-toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 4000);
}