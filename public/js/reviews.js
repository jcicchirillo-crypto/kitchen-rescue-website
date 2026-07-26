/**
 * Kitchen Rescue reviews
 *
 * Add real customer quotes below when you have them. The homepage section
 * stays hidden until at least one testimonial is listed.
 * Review requests are handled by your own follow-up emails — not on the site.
 */
(function () {
    /** @type {{ quote: string, name: string, source?: string }[]} */
    var testimonials = [
        // Example (uncomment and replace with a real review):
        // { quote: 'The pod arrived on time and made our renovation so much easier.', name: 'Sarah, Hertford', source: 'Google' },
    ];

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function render() {
        var section = document.getElementById('reviews');
        var grid = document.getElementById('reviewsGrid');
        if (!section || !grid) return;

        if (!testimonials.length) {
            section.hidden = true;
            return;
        }

        section.hidden = false;
        grid.innerHTML = testimonials.map(function (t) {
            var source = t.source ? '<span class="review-source">' + escapeHtml(t.source) + '</span>' : '';
            return (
                '<blockquote class="review-quote">' +
                '<p>“' + escapeHtml(t.quote) + '”</p>' +
                '<footer>' + escapeHtml(t.name) + source + '</footer>' +
                '</blockquote>'
            );
        }).join('');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
