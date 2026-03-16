/**
 * TeachJS UI Scripts
 * Handles navigation, copy-to-clipboard, and interactive content logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCodeBlocks();
  initHintsAndSolutions();
});

// Sidebar Highlighting
function initNavigation() {
  const sections = document.querySelectorAll('.section');
  const navItems = document.querySelectorAll('.nav-item');
  if (!sections.length || !navItems.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navItems.forEach(n => n.classList.remove('active'));
        const id = e.target.id;
        const active = document.querySelector(`.nav-item[href="#${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(s => observer.observe(s));
}

// Code Block Interaction (Copy & Try It)
function initCodeBlocks() {
  document.querySelectorAll('.code-block').forEach(block => {
    const header = block.querySelector('.code-header');
    const pre = block.querySelector('pre');
    if (!header || !pre) return;

    // 1. Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i data-lucide="copy"></i> Copy';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.innerText).then(() => {
        copyBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = '<i data-lucide="copy"></i> Copy';
          copyBtn.classList.remove('copied');
          if (window.lucide) lucide.createIcons();
        }, 2000);
        if (window.lucide) lucide.createIcons();
      });
    });

    // 2. Try It Button
    const tryBtn = document.createElement('button');
    tryBtn.className = 'try-btn';
    tryBtn.innerHTML = '<i data-lucide="play"></i> Try it';
    tryBtn.style.marginRight = '8px';

    tryBtn.addEventListener('click', () => {
      if (typeof runnerEditor !== 'undefined') {
        runnerEditor.value = pre.innerText.trim();
        toggleRunner(true);
        if (typeof runnerOutput !== 'undefined') {
           runnerOutput.innerHTML = '<div class="runner-output-line info">// Press Run or Ctrl+Enter to execute</div>';
        }
      }
    });

    header.appendChild(tryBtn);
    header.appendChild(copyBtn);
  });
  
  if (window.lucide) lucide.createIcons();
}

// Hints and Solutions Toggle
function initHintsAndSolutions() {
  // Existing toggles already have inline onclick="..." or logic, 
  // but we ensure consistency here if needed.
  // Standardizing the toggle experience:
}

// Global toggle for solution/hint blocks
function toggleVisibility(el, className = 'open') {
  el.classList.toggle(className);
}