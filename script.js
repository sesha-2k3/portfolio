// Wait for DOM and deferred scripts to load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Lucide icons (with fallback check)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn('Lucide icons failed to load');
    }

    // ========================================
    // COURSEWORK DROPDOWN TOGGLE
    // ========================================
    const courseworkToggles = document.querySelectorAll('.coursework-toggle');

    courseworkToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            const courseworkList = toggle.nextElementSibling;

            // Toggle state
            toggle.setAttribute('aria-expanded', !isExpanded);
            toggle.classList.toggle('active');
            courseworkList.classList.toggle('open');
        });
    });

    // ========================================
    // NAVIGATION FUNCTIONALITY
    // ========================================
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Throttle function for performance
    function throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Scroll effect for navigation (throttled)
    const handleNavScroll = throttle(() => {
        if (window.pageYOffset > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // ========================================
    // SCROLL ANIMATIONS (Intersection Observer)
    // ========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // ========================================
    // ACTIVE NAV LINK HIGHLIGHTING (throttled)
    // ========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-link');

    const handleActiveLink = throttle(() => {
        const scrollY = window.pageYOffset;
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinksAll.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, 150);

    window.addEventListener('scroll', handleActiveLink, { passive: true });

    // ========================================
    // FAST SMOOTH SCROLL FOR ANCHOR LINKS
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                // Use faster scroll with reduced duration
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // FORM HANDLING (Formspree Integration)
    // ========================================
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // Helper function to show status message
    function showStatus(type, message) {
        formStatus.className = 'form-status show ' + type;
        formStatus.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success'
                ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
            }
        </svg>
        ${message}
    `;

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                formStatus.classList.remove('show');
            }, 5000);
        }
    }

    // Form submission handler
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if form is configured
        const formAction = contactForm.getAttribute('action');
        if (formAction.includes('YOUR_FORM_ID')) {
            showStatus('error', 'Form not configured. Replace YOUR_FORM_ID in the HTML with your Formspree form ID.');
            return;
        }

        // Set loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        formStatus.classList.remove('show');

        try {
            const formData = new FormData(contactForm);

            const response = await fetch(formAction, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showStatus('success', 'Message sent successfully! I\'ll get back to you soon.');
                contactForm.reset();
            } else {
                const data = await response.json();
                if (data.errors) {
                    showStatus('error', data.errors.map(err => err.message).join(', '));
                } else {
                    showStatus('error', 'Something went wrong. Please try again or email me directly.');
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showStatus('error', 'Network error. Please check your connection or email me directly.');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // Real-time validation feedback
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.validity.valid) {
                input.style.borderColor = 'rgba(34, 197, 94, 0.5)';
            } else if (input.value) {
                input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }
        });

        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--color-accent-primary)';
        });
    });

}); // End DOMContentLoaded