import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Protected, AdminLayout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductForm } from './pages/ProductForm';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Transactions } from './pages/Transactions';
import { Users } from './pages/Users';
import { Reviews } from './pages/Reviews';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route element={<Protected />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/:id" element={<ProductForm />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/orders/:id" element={<OrderDetail />} />
            <Route path="/admin/transactions" element={<Transactions />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/reviews" element={<Reviews />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;