import { Link, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Empty, Guard } from './components/ui'
import { Account, Forgot, Login, Register } from './pages/Auth'
import { GroupDetails, Grouped, Home, ProductDetails, Products } from './pages/Catalog'
import { Cart, Checkout, Orders, Wishlist } from './pages/Shop'

export default function App() {
  return <><Navbar /><main><Routes>
    <Route path="/" element={<Home />} /><Route path="/products" element={<Products />} /><Route path="/products/:id" element={<ProductDetails />} />
    <Route path="/categories" element={<Grouped kind="categories" />} /><Route path="/categories/:id" element={<GroupDetails kind="categories" />} />
    <Route path="/brands" element={<Grouped kind="brands" />} /><Route path="/brands/:id" element={<GroupDetails kind="brands" />} />
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot" element={<Forgot />} />
    <Route path="/cart" element={<Guard><Cart /></Guard>} /><Route path="/wishlist" element={<Guard><Wishlist /></Guard>} />
    <Route path="/checkout" element={<Guard><Checkout /></Guard>} /><Route path="/orders" element={<Guard><Orders /></Guard>} /><Route path="/allorders" element={<Guard><Orders /></Guard>} />
    <Route path="/account" element={<Guard><Account /></Guard>} />
    <Route path="*" element={<Empty text="That page doesn't exist." to="/" cta="Go home" />} />
  </Routes></main><footer className="wrap foot">FreshCart · <Link to="/products">Shop all</Link></footer></>
}
