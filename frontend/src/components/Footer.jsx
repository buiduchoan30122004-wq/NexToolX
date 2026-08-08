import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ShieldCheck } from 'lucide-react';

function Footer({ menuItems }) {
  // Chia đôi menuItems hoặc lọc các liên kết quan trọng
  const mainExplore = menuItems.filter(item => ['Home', 'Browse', 'Categories', 'Collections', 'Deals'].includes(item.label));
  const submitAndBlog = menuItems.filter(item => ['Blog', 'Submit Tool'].includes(item.label));

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="footer-info">
            <Link to="/" className="logo-link" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              <div className="logo-icon">
                <Sparkles size={20} fill="#fff" />
              </div>
              <span>Nex<span style={{ color: 'var(--primary)' }}>ToolX</span></span>
            </Link>
            <p>
              NexToolX is the next-generation directory of artificial intelligence tools. Discover, compare, and leverage AI to supercharge your daily workflow.
            </p>
            <div className="social-links" style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <a href="#" className="footer-link-icon" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="footer-link-icon" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
              <a href="#" className="footer-link-icon" aria-label="Email"><Mail size={20} /></a>
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="footer-col">
            <h4 className="footer-col-title">Explore</h4>
            <ul className="footer-menu-list">
              {mainExplore.map((item) => (
                <li key={item.id}>
                  <Link to={item.path} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Công ty */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-menu-list">
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
              {submitAndBlog.map((item) => (
                <li key={item.id}>
                  <Link to={item.path} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Pháp lý */}
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <ul className="footer-menu-list">
              <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="footer-link">Terms of Service</Link></li>
              <li><Link to="/terms#refund" className="footer-link">Refund Policy</Link></li>
              <li><Link to="/privacy#cookies" className="footer-link">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Phần dưới cùng: Bản quyền, Các cổng thanh toán & Nhãn bảo mật */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>&copy; {new Date().getFullYear()} NexToolX. All rights reserved.</span>
          </div>

          <div className="footer-bottom-right" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Nhãn bảo mật SSL */}
            <div className="secure-badge">
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              <span>SSL Secured Payment</span>
            </div>

            {/* Các biểu tượng thanh toán SVG */}
            <div className="payment-methods">
              {/* PayPal */}
              <div className="payment-icon" title="PayPal">
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="38" height="24" rx="4" fill="#003087"/>
                  <path d="M14.5 17h-2.5l1.8-9h4c2 0 3.2.8 3.2 2.5 0 1.8-1.2 3-3.2 3h-1.8l-1.5 3.5zm3.5-6.5c0-.6-.4-1-1.2-1h-1.5l-.8 4h1.2c.8 0 1.5-.4 1.8-1 .2-.3.5-.6.5-2z" fill="#00B2FF"/>
                  <path d="M17.5 19.5h-2.5l1.8-9h4c2 0 3.2.8 3.2 2.5 0 1.8-1.2 3-3.2 3h-1.8l-1.5 3.5zm3.5-6.5c0-.6-.4-1-1.2-1h-1.5l-.8 4h1.2c.8 0 1.5-.4 1.8-1 .2-.3.5-.6.5-2z" fill="#0079C1" opacity="0.85"/>
                </svg>
              </div>

              {/* Visa */}
              <div className="payment-icon" title="Visa">
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="38" height="24" rx="4" fill="#1A1F71"/>
                  <path d="M15.4 16.2l1.6-9.5h2.6l-1.6 9.5H15.4zm7.9-9.2c-.5-.2-1.3-.4-2.2-.4-2.4 0-4.1 1.2-4.1 3 0 1.3 1.2 2 2.1 2.4.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-1 0-1.5-.1-2.3-.5l-.3-.1-.4 2.3c.6.3 1.8.5 3 .5 2.5 0 4.1-1.2 4.2-3.1 0-1-.6-1.8-2-2.5-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.8 1.3-.8.8 0 1.4.2 1.8.4l.2.1.4-2.3zm6.3 2.7c.2-.5.8-2 1-2.6.1-.1.2.2.3.4l.7 3.5h-2zm3-3.2h-2c-.6 0-1.1.3-1.3.9l-3.8 8.8h2.7l.5-1.5h3.3l.3 1.5h2.4L32.6 6.5zm-22.1 9.7l2.5-6.4.3-1.4c0-.1-.1-.3-.2-.4-.4-.3-1.2-.6-2-.8l-.1.3 4.2 8.7h2.8z" fill="#FFF"/>
                </svg>
              </div>

              {/* Mastercard */}
              <div className="payment-icon" title="Mastercard">
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="38" height="24" rx="4" fill="#222"/>
                  <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                  <circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8"/>
                </svg>
              </div>

              {/* Stripe */}
              <div className="payment-icon" title="Stripe">
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="38" height="24" rx="4" fill="#635BFF"/>
                  <path d="M16.5 13.5c0 .7.6 1 1.5 1 1.2 0 2.2-.4 2.2-1.2 0-.6-.5-.9-1.5-1.1l-.8-.2c-1.3-.3-2.2-.8-2.2-2.1 0-1.5 1.5-2.2 3-2.2 1.1 0 2 .3 2.5.6l-.3 1.5c-.5-.2-1.2-.5-2.2-.5-.9 0-1.5.4-1.5 1 0 .6.5.8 1.4 1l1 .2c1.3.3 2.1.9 2.1 2.1 0 1.6-1.5 2.3-3.2 2.3-1.2 0-2.4-.4-3-.8l.4-1.6zm7.2-4.8h1.8V7.2h-1.8v1.5zm0 1.2h1.8v6.2h-1.8v-6.2zm-9.3 0h1.8v1c.4-.6 1.1-1.2 2.2-1.2v1.8c-1.2 0-2.2.6-2.2 1.8v2.8h-1.8v-6.2z" fill="#FFF"/>
                </svg>
              </div>

              {/* Apple Pay */}
              <div className="payment-icon" title="Apple Pay">
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="38" height="24" rx="4" fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <path d="M17.5 12.8c-.8.5-1.4.8-2.1.8-.8 0-1.3-.4-1.3-1.1 0-.9 1-.1 1.8-.6.7-.4 1.2-.8 1.2-1.1v-.1c-.4.1-.8.2-1.3.2-1.2 0-1.8-.6-1.8-1.5 0-.9.8-1.6 1.8-1.6 1 0 1.5.6 1.7 1.2h.1c.2-.6.7-1.2 1.6-1.2.6 0 1 .3 1.2.7h.1c.2-.5.7-.7 1.3-.7 1 0 1.7.8 1.7 1.9v2.2c0 .6.1 1.1.3 1.3h-1.2c-.1-.2-.2-.5-.2-.9h-.1c-.3.5-.8.9-1.5.9-.8 0-1.3-.5-1.3-1.2 0-.8.7-1.1 1.6-1.4.6-.2 9-.4 9-.6V12c0-.6-.3-.9-.9-.9-.5 0-.9.3-1.1.7h-.1c0-.4-.3-.7-.9-.7-.6 0-1 .4-1.1.9v2zm1.6-4.6c0-.5-.3-.8-.8-.8-.6 0-.9.4-.9.9V10h1.7V9.2zm3.8 2.2c-.4.2-.8.4-.8.7 0 .3.2.5.6.5.6 0 1-.4 1-1v-.2h-.8z" fill="#FFF"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
