import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import ProductNew from './pages/ProductNew.jsx'
import ProductManage from './pages/ProductManage.jsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/products" element={<ProductManage />} />
      <Route path="/admin/products/new" element={<ProductNew />} />
    </Routes>
  )
}
