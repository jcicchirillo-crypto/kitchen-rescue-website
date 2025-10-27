// Initialize Lucide icons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Set current year in footer
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Postcode availability check
    const postcodeInput = document.getElementById('postcode');
    const postcodeBtn = document.querySelector('.postcode-btn');
    
    if (postcodeBtn && postcodeInput) {
        postcodeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkAvailability();
        });
        
        postcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAvailability();
            }
        });
    }
    
    // Quote form submission
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleQuoteSubmission();
        });
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll effect to header
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add CSS for header transition
    const style = document.createElement('style');
    style.textContent = `
        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            transition: transform 0.3s ease-in-out;
        }
        
        body {
            padding-top: 80px; /* Adjust based on header height */
        }
        
        @media (max-width: 767px) {
            body {
                padding-top: 70px;
            }
        }
    `;
    document.head.appendChild(style);
});

// Check availability function
function checkAvailability() {
    const postcodeInput = document.getElementById('postcode');
    const postcode = postcodeInput.value.trim();
    
    if (!postcode) {
        alert('Please enter a postcode');
        return;
    }
    
    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
        alert('Please enter a valid UK postcode (e.g., EN10, SW1A 1AA)');
        return;
    }
    
    // Simulate API call
    const btn = document.querySelector('.postcode-btn');
    const originalText = btn.textContent;
    
    btn.textContent = 'Checking...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        
        // Removed postcode area restriction - now accepting all UK postcodes
        // Delivery charges will be calculated based on distance in the booking flow

        // Open availability page with postcode prefilled
        const encodedPc = encodeURIComponent(postcode.toUpperCase());
        window.location.href = `availability.html?postcode=${encodedPc}`;
    }, 1500);
}

// Handle quote form submission
function handleQuoteSubmission() {
    const form = document.getElementById('quoteForm');
    const formData = new FormData(form);
    const submitBtn = form.querySelector('.form-submit');
    const originalText = submitBtn.textContent;
    
    // Basic form validation
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#dc2626';
        } else {
            input.style.borderColor = '#d1d5db';
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Simulate form submission
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        alert('Thank you! We\'ll reply within one business day with your personalized quote.');
        
        // Reset form
        form.reset();
        
        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 2000);
}

// Add loading animation for images (when they're added)
function addImageLoadingAnimation() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
    });
}

// Add intersection observer for animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Add animation styles
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        .feature-card,
        .faq-card,
        .gallery-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
    `;
    document.head.appendChild(animationStyle);
    
    // Observe elements
    const animatedElements = document.querySelectorAll('.feature-card, .faq-card, .gallery-item');
    animatedElements.forEach(el => observer.observe(el));
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addScrollAnimations();
});

// Add click tracking for analytics (placeholder)
function trackEvent(eventName, properties = {}) {
    // This would integrate with your analytics service
    console.log('Event tracked:', eventName, properties);
    
    // Example: Google Analytics 4
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', eventName, properties);
    // }
}

// Track button clicks
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-primary')) {
        trackEvent('cta_click', {
            button_text: e.target.textContent,
            section: e.target.closest('section')?.id || 'unknown'
        });
    }
    
    if (e.target.matches('.postcode-btn')) {
        trackEvent('availability_check', {
            postcode: document.getElementById('postcode')?.value || 'unknown'
        });
    }
    
    if (e.target.matches('.form-submit')) {
        trackEvent('quote_request', {
            form_section: e.target.closest('section')?.id || 'unknown'
        });
    }
});

// Add error handling for missing elements
function safeQuerySelector(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn(`Element not found: ${selector}`);
        return null;
    }
}

// Add responsive image handling
function handleResponsiveImages() {
    const imagePlaceholders = document.querySelectorAll('.image-placeholder');
    
    imagePlaceholders.forEach(placeholder => {
        placeholder.addEventListener('click', function() {
            // This would open a lightbox or modal
            console.log('Image placeholder clicked:', this.textContent);
        });
    });
}

// Initialize responsive images
document.addEventListener('DOMContentLoaded', function() {
    handleResponsiveImages();
});
