import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer style={{ borderTop: '1px solid var(--c-border)', marginTop: 80 }}>
    <div className="container" style={{ padding: '32px 20px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>RIA HAIRLINE</div>
        <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
          Premium hair products, delivered.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <Link to="/shop">Shop</Link>
        <Link to="/account">My Account</Link>
        <Link to="/cart">Cart</Link>
      </div>
      <div className="text-muted" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' }}>
        <span>© {new Date().getFullYear()} Ria Hairline</span>
        <span>Customer support: support@riahairline.com</span>
      </div>
    </div>
  </footer>
);