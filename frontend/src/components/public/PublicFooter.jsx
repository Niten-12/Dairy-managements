import { useNavigate } from 'react-router-dom'

const LINKS = {
  company:  ['About Us', 'Our Farms', 'Careers', 'Blog', 'Press'],
  products: ['Fresh Milk', 'A2 Milk', 'Paneer', 'Pure Ghee', 'Curd', 'Farm Eggs'],
  support:  ['Help Center', 'Contact Us', 'Delivery Areas', 'Refund Policy', 'Privacy Policy'],
}

const SOCIALS = [
  { icon: '📘', label: 'Facebook' },
  { icon: '📸', label: 'Instagram' },
  { icon: '🐦', label: 'Twitter' },
  { icon: '▶️', label: 'YouTube' },
]

function PublicFooter() {
  const navigate = useNavigate()

  return (
    <footer className="pub-footer">
      <div className="pub-container">
        <div className="pub-footer-grid">

          {/* Brand column */}
          <div>
            <a href="/" className="pub-logo">
              <div className="pub-logo-icon">🥛</div>
              <span className="pub-logo-text">
                Dairy<span className="pub-logo-accent">Fresh</span>
              </span>
            </a>
            <p className="pub-footer-desc">
              From farm to your doorstep — delivering pure, fresh dairy products every morning.
              No adulteration. No preservatives. Just nature&apos;s best.
            </p>
            <div className="pub-footer-socials">
              {SOCIALS.map((s) => (
                <a key={s.label} href="#" className="pub-footer-social" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="pub-footer-col-title">Company</h4>
            <div className="pub-footer-links">
              {LINKS.company.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="pub-footer-col-title">Products</h4>
            <div className="pub-footer-links">
              {LINKS.products.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="pub-footer-col-title">Support</h4>
            <div className="pub-footer-links">
              {LINKS.support.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
            <div style={{ marginTop: 24 }}>
              <h4 className="pub-footer-col-title" style={{ marginBottom: 10 }}>Contact</h4>
              <div className="pub-footer-links">
                <a href="#">📞 1800-XXX-XXXX (Free)</a>
                <a href="#">📧 hello@dairyfresh.in</a>
                <a href="#">📍 Delhi, Mumbai, Bengaluru & more</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pub-footer-bar">
          <span className="pub-footer-copy">
            © {new Date().getFullYear()} DairyFresh Pvt. Ltd. Made with ❤️ in India
          </span>
          <div className="pub-footer-tags">
            <span className="pub-footer-tag">🌿 100% Natural</span>
            <span className="pub-footer-tag">🔒 Secure Payments</span>
            <span className="pub-footer-tag">🥛 Farm Fresh</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
