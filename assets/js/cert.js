/**
 * TeachJS Certificate Issuance
 * Handles student data management and ProofDeck API calls
 */

function openCertModal() { 
  const overlay = document.getElementById('certOverlay');
  if (overlay) {
    overlay.classList.add('open');
    if (window.lucide) lucide.createIcons();
    // Auto-focus first input
    overlay.querySelector('input')?.focus();
  }
}

function closeCertModal() { 
  const overlay = document.getElementById('certOverlay');
  if (overlay) overlay.classList.remove('open');
}

// Close on backdrop click
document.getElementById('certOverlay')?.addEventListener('click', function(e) {
  if (e.target === this) closeCertModal();
});

function addStudentRow() {
  const list = document.getElementById('certStudentsList');
  if (!list) return;
  
  const row = document.createElement('div');
  row.className = 'cert-student-row';
  row.innerHTML = `
    <input class="cert-input" type="text" placeholder="Full name" />
    <input class="cert-input" type="email" placeholder="email@example.com" />
    <button class="cert-remove-btn" onclick="removeStudentRow(this)" title="Remove"><i data-lucide="x"></i></button>`;
  
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

async function issueCertificates() {
  const rows = document.querySelectorAll('.cert-student-row');
  const students = [];
  
  for (const row of rows) {
    const inputs = row.querySelectorAll('input');
    const name = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    if (name && email) students.push({ name, email });
  }

  const result = document.getElementById('certResult');
  const btn = document.getElementById('certSubmitBtn');

  if (students.length === 0) {
    showCertResult('Please add at least one student with a name and email.', 'error');
    return;
  }

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Issuing...';
  if (result) {
    result.className = 'cert-result';
    result.style.display = 'none';
  }

  const today = new Date().toISOString().slice(0, 10);
  const issued = [], failed = [];

  for (const student of students) {
    try {
      const res = await fetch('/api/issue-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: student.name,
          recipient_email: student.email,
          issue_date: today
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

  btn.disabled = false;
  btn.textContent = originalText;

  let msg = '';
  if (issued.length) msg += '✦ Certificate' + (issued.length > 1 ? 's' : '') + ' sent to: ' + issued.join(', ') + '. ';
  if (failed.length) msg += '⚠ Failed: ' + failed.join(', ') + '.';
  
  showCertResult(msg.trim(), failed.length && !issued.length ? 'error' : 'success');
}

function showCertResult(msg, type) {
  const el = document.getElementById('certResult');
  if (!el) return;
  el.textContent = msg;
  el.className = 'cert-result ' + type;
}
