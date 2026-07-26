/**
 * Accessibility enhancements for Kitchen Rescue public pages.
 * - FAQ accordions: real buttons, aria-expanded / aria-controls
 * - Orphan labels: wire label[for] when a sibling control has an id
 * - Quote email modal: dialog semantics
 */
(function () {
    'use strict';

    function setFaqOpen(card, question, answer, open) {
        card.classList.toggle('active', open);
        card.classList.toggle('open', open);
        question.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (answer) {
            answer.style.display = open ? 'block' : 'none';
            answer.hidden = !open;
        }
        var icon = question.querySelector('.faq-icon');
        if (icon) icon.textContent = open ? '−' : '+';
    }

    function enhanceFaqs() {
        var cards = document.querySelectorAll('.faq-card, .faq-item');
        cards.forEach(function (card, index) {
            var question = card.querySelector('.faq-question, .faq-btn');
            var answer = card.querySelector('.faq-answer, .faq-panel');
            if (!question || !answer) return;

            var panelId = answer.id || ('faq-panel-' + index);
            answer.id = panelId;

            if (question.tagName !== 'BUTTON') {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = question.className;
                btn.innerHTML = question.innerHTML;
                question.parentNode.replaceChild(btn, question);
                question = btn;
            } else {
                question.type = 'button';
            }

            question.removeAttribute('onclick');
            question.setAttribute('aria-expanded', 'false');
            question.setAttribute('aria-controls', panelId);
            answer.setAttribute('role', 'region');

            var usesCssOpen = card.classList.contains('faq-item');
            if (!usesCssOpen) {
                answer.hidden = true;
                if (!answer.style.display || answer.style.display === '') {
                    answer.style.display = 'none';
                }
            }

            var icon = question.querySelector('.faq-icon, .faq-chevron');
            if (icon) icon.setAttribute('aria-hidden', 'true');

            if (question.dataset.a11yBound === '1') return;
            question.dataset.a11yBound = '1';

            question.addEventListener('click', function () {
                var open = question.getAttribute('aria-expanded') !== 'true';
                if (usesCssOpen) {
                    document.querySelectorAll('.faq-item').forEach(function (item) {
                        item.classList.remove('open');
                        var q = item.querySelector('.faq-btn');
                        var a = item.querySelector('.faq-answer');
                        if (q) q.setAttribute('aria-expanded', 'false');
                        if (a) a.hidden = true;
                    });
                    if (open) {
                        card.classList.add('open');
                        question.setAttribute('aria-expanded', 'true');
                        answer.hidden = false;
                    }
                } else {
                    setFaqOpen(card, question, answer, open);
                }
            });
        });
    }

    function wireOrphanLabels() {
        document.querySelectorAll('label:not([for])').forEach(function (label) {
            var field = label.parentElement && label.parentElement.querySelector('input, textarea, select');
            if (!field) return;
            if (!field.id) {
                field.id = 'field-' + Math.random().toString(36).slice(2, 9);
            }
            label.setAttribute('for', field.id);
        });
    }

    function enhanceEmailModal() {
        var overlay = document.getElementById('emailModal');
        if (!overlay) return;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'emailModalTitle');
        var title = overlay.querySelector('h3');
        if (title && !title.id) title.id = 'emailModalTitle';
    }

    window.toggleFAQ = function (element) {
        var card = element.closest
            ? (element.closest('.faq-card') || element.closest('.faq-item'))
            : element.parentElement;
        if (!card) return;
        var question = card.querySelector('.faq-question, .faq-btn') || element;
        question.click();
    };

    function init() {
        enhanceFaqs();
        wireOrphanLabels();
        enhanceEmailModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
