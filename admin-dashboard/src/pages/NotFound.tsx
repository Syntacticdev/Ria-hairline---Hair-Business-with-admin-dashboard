import { Link } from 'react-router-dom';

export const NotFound = () => (
  <div style={{ padding: '80px 20px', textAlign: 'center' }}>
    <h1 style={{ fontSize: 44, fontWeight: 800 }}>404</h1>
    <p className="text-muted" style={{ margin: '10px 0 24px' }}>This page does not exist.</p>
    <Link to="/admin" className="btn">Back to dashboard</Link>
  </div>
);