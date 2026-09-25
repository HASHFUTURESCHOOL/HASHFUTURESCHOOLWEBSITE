// ============================================
// Shared page chrome (top bar, navigation, footer) for generated pages.
//
// `prefix` is the relative path back to the site root: '' for pages at the
// root, '../' for pages one directory deep such as /global/<page>.
//
// Keeping this in one module means every generated page ships identical,
// accessible navigation and footer markup. scripts/build-global-pages.js and
// scripts/build-city-pages.js both import from here.
// ============================================

import { SITE } from './seo-schema.js';

/**
 * Where every "Schedule a Global Discovery Call" call to action goes.
 *
 * That is the demo request form, which lives on Future Assist rather than this
 * site (the school website's own equivalent is the Book a Free Demo dialog).
 * Kept here so the navigation, the mobile menu and every page-level CTA — global
 * landing pages and city pages — point at one URL.
 */
export const DEMO_URL = 'https://futureassist.hashfuture.school/demo';

/**
 * The "Book a Free Demo" dialog, shared with the generated pages.
 *
 * The ids and classes are the ones index.html and script.js already expect
 * (#admissionModal, .close-modal, #demoBookingForm, #formMessage), so
 * initAdmissionModal() wires it up on these pages with no extra JavaScript.
 *
 * `data-auto-open="false"` keeps the two-minute timed popup off these pages:
 * script.js only auto-opens a dialog that has not opted out, so here the form
 * appears when a CTA is clicked. The CTAs keep a real href (DEMO_URL) as the
 * no-JavaScript fallback.
 */
export function admissionModal() {
    return `    <!-- Book a Free Demo dialog (opens from the .open-admission-modal CTAs) -->
    <div id="admissionModal" class="modal" data-auto-open="false">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-form-container">
                <div class="modal-header">
                    <h2>Book a Free Demo</h2>
                    <p>Experience the future of education with a personalized session.</p>
                </div>
                <form id="demoBookingForm" class="demo-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <input type="text" id="firstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="childAge">Child's Age</label>
                            <input type="number" id="childAge" name="childAge">
                        </div>
                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" id="location" name="location">
                        </div>
                    </div>
                    <div class="form-group" style="display: flex; justify-content: center; margin-top: 10px;">
                        <div class="g-recaptcha" data-sitekey="6LfHmFgsAAAAACbX36yDZ_oIUDjvoBZPVJU8kv0p"></div>
                    </div>

                    <div id="formMessage" class="form-message"></div>
                    <button type="submit" class="btn-primary btn-full">Book Free Demo</button>
                </form>
            </div>
        </div>
    </div>

`;
}

const esc = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function topBar() {
    return `    <!-- Top Bar -->
    <a class="skip-link" href="#main">Skip to main content</a>
    <div class="top-bar">
        <div class="container top-bar-container">
            <div class="contact-group">
                <a href="${SITE.whatsapp}" target="_blank" rel="noopener" class="contact-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                    ${SITE.telephoneDisplay}
                </a>
                <span class="divider" aria-hidden="true">|</span>
                <a href="mailto:${SITE.email}" class="contact-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    ${SITE.email}
                </a>
            </div>
        </div>
    </div>`;
}

export function nav(prefix = '') {
    return `    <!-- Navigation -->
    <nav class="navbar" id="navbar" aria-label="Main navigation">
        <div class="nav-container">
            <a href="${prefix}index.html" class="logo"><img src="${prefix}images/logo.png" alt="Hash Future School logo" class="logo-img" width="122" height="38"></a>
            <div class="nav-links">
                <a href="${prefix}index.html">Home</a>
                <a href="${prefix}iit-madras-school-connect.html" class="iitm-highlight">IIT Madras</a>
                <a href="${prefix}index.html#outcomes">Outcomes</a>
                <a href="${prefix}index.html#curriculum">Curriculum</a>
                <a href="${prefix}index.html#testimonials">Testimonials</a>
                <a href="${prefix}index.html#faq">FAQ</a>
                <a href="${prefix}blog.html">Blog</a>
                <a href="${prefix}student-projects.html">Project Showcase</a>
                <a href="${prefix}super-kids.html" class="superkids-highlight">SuperKids 🚀</a>
            </div>
            <a href="${DEMO_URL}" class="nav-cta open-admission-modal">Schedule a Global Discovery Call</a>
            <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
        </div>
    </nav>

    <div class="mobile-menu" id="mobileMenu">
        <a href="${prefix}index.html">Home</a>
        <a href="${prefix}iit-madras-school-connect.html" class="iitm-highlight" style="display: inline-block; text-align: center;">IIT Madras Partnership</a>
        <a href="${prefix}index.html#outcomes">Outcomes</a>
        <a href="${prefix}index.html#curriculum">Curriculum</a>
        <a href="${prefix}index.html#testimonials">Testimonials</a>
        <a href="${prefix}index.html#faq">FAQ</a>
        <a href="${prefix}blog.html">Blog</a>
        <a href="${prefix}student-projects.html">Project Showcase</a>
        <a href="${prefix}super-kids.html" class="superkids-highlight" style="display: inline-block; text-align: center;">SuperKids 🚀</a>
        <a href="${DEMO_URL}" class="mobile-cta open-admission-modal">Schedule a Global Discovery Call</a>
    </div>`;
}

/**
 * Footer with configurable columns.
 * columns: [{ heading, links: [{ href, label }] }]
 */
export function footer({ prefix = '', columns = [] } = {}) {
    const columnsHtml = columns.map(column => `                    <div class="footer-column">
                        <h4>${esc(column.heading)}</h4>
${column.links.map(link => `                        <a href="${link.href}">${esc(link.label)}</a>`).join('\n')}
                    </div>`).join('\n');

    return `    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <a href="${prefix}index.html" class="logo">
                        <img src="${prefix}images/logo-light.png" alt="Hash Future School" class="logo-img" width="167" height="52">
                    </a>
                    <p>A complete online learning community for families worldwide, following alternative learning methodologies.</p>
                    <div class="footer-social">
                        <a href="https://www.youtube.com/@hashfutureschool" target="_blank" rel="noopener" aria-label="YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                        </a>
                        <a href="https://www.instagram.com/hashfutureschool/" target="_blank" rel="noopener" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                        </a>
                        <a href="${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                        </a>
                    </div>
                </div>
                <div class="footer-links has-pathways">
${columnsHtml}
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Hash Future School. All rights reserved.</p>
            </div>
        </div>
    </footer>

${admissionModal()}    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <script src="${prefix}script.js"></script>
</body>

</html>`;
}
