// ============================================
// Hash Future School - Interactive JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components safely so one failure doesn't block others
    const initializers = [
        initNavbar,
        initMobileMenu,
        initFAQ,
        initStickyBar,
        initAnimateOnScroll,
        initCounterAnimation,
        initSmoothScroll,
        initAdmissionModal,
        initGoogleReviewsPopup,
        initAwardsModal
    ];

    initializers.forEach(initFn => {
        try {
            initFn();
        } catch (error) {
            console.error(`Init failed: ${initFn.name}`, error);
        }
    });
});

// ============================================
// Navbar Scroll Effect
// ============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============================================
// Mobile Menu Toggle
// ============================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
}

// ============================================
// FAQ Accordion
// ============================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// ============================================
// Sticky Bottom Bar
// ============================================
function initStickyBar() {
    const stickyBar = document.getElementById('stickyBar');
    const hero = document.getElementById('hero');

    if (!stickyBar || !hero) return;

    const heroHeight = hero.offsetHeight;

    window.addEventListener('scroll', () => {
        if (window.scrollY > heroHeight - 200) {
            stickyBar.classList.add('visible');
        } else {
            stickyBar.classList.remove('visible');
        }
    });
}

// ============================================
// Animate Elements on Scroll
// ============================================
function initAnimateOnScroll() {
    const animatedElements = document.querySelectorAll(
        '.problem-card, .outcome-card, .who-card, .curriculum-card, .video-card, .testimonial-card, .facilitator-card, .award-card'
    );

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered animation delay
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// ============================================
// Counter Animation
// ============================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    };

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href === '#') return;

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Video Lazy Loading Enhancement
// ============================================
function initVideoLazyLoad() {
    const videoWrappers = document.querySelectorAll('.video-wrapper');

    const observerOptions = {
        threshold: 0.25
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const iframe = entry.target.querySelector('iframe');
                if (iframe && iframe.dataset.src) {
                    iframe.src = iframe.dataset.src;
                    iframe.removeAttribute('data-src');
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    videoWrappers.forEach(wrapper => {
        observer.observe(wrapper);
    });
}

// ============================================
// Parallax Effect for Hero Background
// ============================================
function initParallax() {
    const heroCircles = document.querySelectorAll('.hero-circle');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        heroCircles.forEach((circle, index) => {
            const speed = (index + 1) * 0.1;
            circle.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
}

// ============================================
// Form Validation (for future form integration)
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
}

// ============================================
// Track CTA Clicks (for analytics integration)
// ============================================
function trackCTAClick(ctaName) {
    // Google Analytics or other tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'cta_click', {
            'event_category': 'engagement',
            'event_label': ctaName
        });
    }

    // Console log for debugging
    console.log('CTA Clicked:', ctaName);
}

// Add click tracking to all CTA buttons
document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta, .sticky-bar-cta').forEach(button => {
    button.addEventListener('click', function () {
        trackCTAClick(this.textContent.trim());
    });
});

// ============================================
// Loading State Handler
// ============================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // Initialize parallax after load
    initParallax();

    // Initialize video lazy loading
    initVideoLazyLoad();
});

// ============================================
// Handle Window Resize
// ============================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalculate sticky bar trigger point
        initStickyBar();
    }, 250);
});

// ============================================
// Keyboard Navigation Support
// ============================================
document.addEventListener('keydown', (e) => {
    // Close mobile menu on Escape
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    }
});

// ============================================
// Touch Device Detection
// ============================================
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Adjust hover effects for touch devices
if (isTouchDevice()) {
    document.body.classList.add('touch-device');
}

// ============================================
// Admission Modal Logic
// ============================================
function initAdmissionModal() {
    const modal = document.getElementById('admissionModal');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('demoBookingForm');

    if (!modal || !closeBtn) return;

    // Open modal function
    const openModal = () => {
        modal.style.display = 'block';
        // Use setTimeout to allow display:block to apply before adding class for transition
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    // Trigger buttons
    document.querySelectorAll('.open-admission-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    // Auto open after 2 minutes (120000ms)
    setTimeout(() => {
        // Only open if not already open
        if (!modal.classList.contains('show')) {
            openModal();
        }
    }, 120000);

    // Close modal function
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Handle Form Submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            // Clear previous messages
            const messageDiv = document.getElementById('formMessage');
            messageDiv.className = 'form-message';
            messageDiv.textContent = '';

            // 1. Check ReCAPTCHA
            const captchaResponse = grecaptcha.getResponse();
            if (captchaResponse.length === 0) {
                messageDiv.textContent = 'Please complete the CAPTCHA verification.';
                messageDiv.classList.add('error');
                return; // Stop submission
            }

            // Note: Ideally, you should verify the 'captchaResponse' token on your server (PHP) 
            // using your Secret Key to ensure the request is genuine.

            btn.textContent = 'Submitting...';
            btn.disabled = true;

            const formData = new FormData(form);
            const payload = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                age: formData.get('childAge'), // Map childAge to API's expected 'age' field
                location: formData.get('location')
            };

            try {
                // 1. Try the PHP Proxy (Standard for shared hosting/cPanel)
                // This bypasses CORS by making the request Server-to-Server
                let response;
                const proxyUrl = 'admissions-proxy.php';
                const directUrl = 'https://futureassist.hashfuture.school/api/admissions/demo';

                try {
                    response = await fetch(proxyUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } catch (err) {
                    console.log('PHP Proxy connection failed/missing, trying direct...');
                }

                // 2. If PHP proxy fails (e.g. static hosting, 404, or 500 error), try direct connection
                // This is a fallback for testing or CORS-enabled environments
                if (!response || !response.ok) {
                    // Only retry direct if the proxy explicitly failed (404/504) or network error
                    // If proxy returned 400/403/etc from the *real* API, we shouldn't retry, but for simplicity we fall through
                    if (!response || response.status === 404 || response.status === 405) {
                        console.log('Falling back to direct API connection...');
                        response = await fetch(directUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    }
                }

                if (response.ok) {
                    // SUCCESS: Hide form fields and show big success message with animation
                    form.innerHTML = `
                        <div style="text-align: center; padding: 40px 0; animation: fadeInUp 0.5s ease;">
                            <div style="width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h3 style="color: var(--text-dark); margin-bottom: 10px; font-size: 1.5rem;">Thank You!</h3>
                            <p style="color: var(--text-medium); font-size: 1.1rem; max-width: 400px; margin: 0 auto;">
                                Your demo request has been received. Our team will contact you shortly to schedule your personalized session.
                            </p>
                            <button onclick="document.querySelector('.close-modal').click()" class="btn-primary" style="margin-top: 30px; padding: 12px 24px; font-size: 1rem;">Close</button>
                        </div>
                    `;
                    // Don't modify modal header, just the form body
                    document.querySelector('.modal-header').style.display = 'none'; // Hide the "Book a Demo" header too for a cleaner look

                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Submission failed:', errorData);
                    throw new Error(errorData.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);

                // Show error message inline
                let errorMsg = 'We encountered a temporary issue. Please try again.';

                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    errorMsg = 'Submission Warning (Localhost): CORs restriction prevented submission. Use server for testing.';
                }

                messageDiv.textContent = errorMsg;
                messageDiv.classList.add('error');

                // Reset button
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}

// ============================================
// Google Reviews Popup
// ============================================
function initGoogleReviewsPopup() {
    const reviewsBtn = document.getElementById('googleReviewsBtn');

    if (!reviewsBtn) return;

    const reviewsUrl = "https://www.google.com/search?sca_esv=262b8e8005cfc964&biw=1366&bih=646&aic=0&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOU-zxeFMVASMyjyDK65iUocHVVh1EBBXSU6qgJFwXPdmTX6yp2uKN2JlBqbhZEGgYclxVXgWke2Ore_qCsRvkInIhfXz&q=%23FUTURE+SCHOOL+Reviews&sa=X&ved=2ahUKEwjRgrac56iSAxWzRmwGHfXNMIAQ0bkNegQIGxAH";

    const openPopup = () => {
        // Calculate center of screen
        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            reviewsUrl,
            'GoogleReviews',
            `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
        );
    };

    reviewsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openPopup();
    });

    // Allow keyboard activation (Enter key)
    reviewsBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPopup();
        }
    });
}

// ============================================
// Awards Read More Modal
// ============================================
function initAwardsModal() {
    const modal = document.getElementById('awardsModal');
    const modalTitle = document.getElementById('awardsModalTitle');
    const modalBody = document.getElementById('awardsModalBody');
    const closeBtn = document.querySelector('.awards-close-modal');
    const triggerButtons = document.querySelectorAll('.award-read-more');

    if (!modal || !modalTitle || !modalBody || !closeBtn) return;

    const openModal = (title, detailId) => {
        const source = document.getElementById(detailId);
        if (!source) return;

        modalTitle.textContent = title;
        modalBody.innerHTML = source.innerHTML;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modalBody.innerHTML = '';
        document.body.style.overflow = '';
    };

    // Global fallback for inline onclick, independent from other initializers.
    window.openAwardsModal = (detailId, title = 'Award Details') => {
        openModal(title, detailId);
    };

    triggerButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const title = button.getAttribute('data-award-title') || 'Award Details';
            const detailId = button.getAttribute('data-award-detail-id');
            openModal(title, detailId);
        });
    });

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}
