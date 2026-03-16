/**
 * TeachJS Code Runner
 * Handles sandboxed JS execution via iframe srcdoc
 */

const runnerPanel = document.getElementById('runnerPanel');
const runnerEditor = document.getElementById('runnerEditor');
const runnerOutput = document.getElementById('runnerOutput');
const runnerResizer = document.getElementById('runnerResizer');

// Toggle Runner
function toggleRunner(open) {
  if (!runnerPanel) return;
  runnerPanel.classList.toggle('open', open);
  if (open) runnerEditor.focus();
  if (window.lucide) lucide.createIcons();
}

// Clear Output
function clearRunner() {
  if (!runnerEditor || !runnerOutput) return;
  runnerEditor.value = '';
  runnerOutput.innerHTML = '<div class="runner-output-line info">// Output will appear here</div>';
  runnerEditor.focus();
}

// Append specialized output lines
function appendOutput(text, type) {
  const line = document.createElement('div');
  line.className = 'runner-output-line' + (type ? ' ' + type : '');
  line.textContent = text;
  
  // Remove placeholder if it exists
  const info = runnerOutput.querySelector('.info');
  if (info) info.remove();
  
  runnerOutput.appendChild(line);
  runnerOutput.scrollTop = runnerOutput.scrollHeight;
}

// Execute Code
function runCode() {
  const code = runnerEditor.value.trim();
  if (!code) return;
  
  // Flash effect on run
  runnerOutput.innerHTML = '<div class="runner-output-line info">// Running...</div>';

  // Create disposable sandboxed iframe
  const iframe = document.createElement('iframe');
  iframe.sandbox = 'allow-scripts';
  iframe.style.cssText = 'display:none;position:absolute;width:0;height:0;';
  document.body.appendChild(iframe);

  const handler = (e) => {
    if (e.source !== iframe.contentWindow) return;
    if (e.data.type === 'log') appendOutput(e.data.data);
    if (e.data.type === 'error') appendOutput('⚠ ' + e.data.data, 'error');
    if (e.data.type === 'done') {
      window.removeEventListener('message', handler);
      setTimeout(() => document.body.removeChild(iframe), 100);
    }
  };

  window.addEventListener('message', handler);

  // The secret sauce: srcdoc allows content to run with its own 'origin', 
  // resolving the SecurityError when running from file://
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <script>
        (function() {
          const _log = console.log.bind(console);
          const _error = console.error.bind(console);
          
          console.log = (...args) => {
            const processed = args.map(a => {
              if (a === null) return 'null';
              if (a === undefined) return 'undefined';
              if (typeof a === 'object') {
                try { return JSON.stringify(a); } catch(e) { return String(a); }
              }
              return String(a);
            }).join(' ');
            window.parent.postMessage({ type: 'log', data: processed }, '*');
            _log(...args);
          };

          console.error = (...args) => {
            const processed = args.map(String).join(' ');
            window.parent.postMessage({ type: 'error', data: processed }, '*');
            _error(...args);
          };

          window.onerror = (msg, url, line) => {
            window.parent.postMessage({ type: 'error', data: msg + " (Line " + line + ")" }, '*');
          };

          try {
            ${code}
          } catch(e) {
            window.parent.postMessage({ type: 'error', data: e.toString() }, '*');
          } finally {
            window.parent.postMessage({ type: 'done' }, '*');
          }
        })();
      </script>
    </body>
    </html>
  `;

  iframe.srcdoc = html;
}

// Resizer Logic
let isResizing = false;
if (runnerResizer) {
  runnerResizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    runnerPanel.style.transition = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const height = window.innerHeight - e.clientY;
    if (height > 100 && height < window.innerHeight * 0.9) {
      runnerPanel.style.height = height + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      runnerPanel.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }
  });
}

// Keyboard shortcuts
runnerEditor?.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
});