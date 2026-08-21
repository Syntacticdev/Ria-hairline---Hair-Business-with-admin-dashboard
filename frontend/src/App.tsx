import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RequireAuth } from './components/RequireAuth';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { OrderDetail } from './pages/OrderDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AccountLayout } from './pages/account/AccountLayout';
import { Profile } from './pages/account/Profile';
import { Orders } from './pages/account/Orders';
import { AddressBook } from './pages/account/AddressBook';
import { Password } from './pages/account/Password';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-success" element={<OrderSuccess />} />

            <Route element={<RequireAuth />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:id" element={<OrderDetail />} />
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<Profile />} />
                <Route path="orders" element={<Orders />} />
                <Route path="addresses" element={<AddressBook />} />
                <Route path="password" element={<Password />} />
              </Route>
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;