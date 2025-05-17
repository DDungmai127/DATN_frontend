import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Cart from "./pages/client/Cart";
import Layout_Client from "./pages/client/Layout";
import Login from "./pages/client/Login";
import Register from "./pages/client/Register";
import AccountManagement from "./pages/client/AccountManagement";
import ProductDetails from "./pages/client/ProductDetails";
import CheckoutPage from "./pages/client/CheckoutPage";
import CategoryManagement from "./pages/admin/CategoryManagement";
import UserManagement from "./pages/admin/UserManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import Dashboard from "./pages/admin/DashBoard";
import AdminLogin from "./pages/admin/AdminLogin";
import Layout from "./pages/admin/Layout";
import { AuthProvider } from "./Provider/AuthProvider";
import OrderManagement from "./pages/admin/OrderManagement";
import DiscountManagement from "./pages/admin/DiscountManagement";
import HomePage from "./pages/client/Home";
import CategoryPage from "./pages/client/CategoryPage";
const isLoggedIn = () => {
  try {
    // Thống nhất sử dụng clientInfo cho client
    const userInfoStr = localStorage.getItem("clientInfo");
    console.log("Checking client login with key clientInfo:", !!userInfoStr);

    // Kiểm tra cả key cũ để xử lý trường hợp chưa được cập nhật
    if (!userInfoStr) {
      const oldUserInfo =
        localStorage.getItem("userInfo") || localStorage.getItem("clientUserInfo");
      if (oldUserInfo) {
        // Di chuyển dữ liệu từ key cũ sang key mới
        localStorage.setItem("clientInfo", oldUserInfo);
        console.log("Migrated old auth data to clientInfo");
        // Xóa key cũ
        localStorage.removeItem("userInfo");
        localStorage.removeItem("clientUserInfo");
      }
    }

    return userInfoStr && JSON.parse(userInfoStr).isLoggedIn;
  } catch (e) {
    console.error("Error checking login status:", e);
    return false;
  }
};

// Component cho routes phía người dùng (client)
const ClientApp = () => {
  console.log("ClientApp rendered");
  return (
    <Layout_Client>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="product" element={<ProductDetails />} />
        <Route path="product/:slug" element={<ProductDetails />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="account" element={<AccountManagement />} />
        <Route path="account/current-orders" element={<AccountManagement />} />
        <Route path="account/order-history" element={<AccountManagement />} />
        <Route path="account/orders" element={<AccountManagement />} />
        <Route path="checkout" element={<CheckoutPage />} />
      </Routes>
    </Layout_Client>
  );
};
// Component cho routes phía quản trị (admin)
const AdminApp = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route path="" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="discounts" element={<DiscountManagement />} />
          <Route path="orders" element={<OrderManagement />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

// Thay thế toàn bộ phần App component với giải pháp dưới đây
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}

        {/* Client Routes - tất cả các route không bắt đầu bằng /admin */}
        <Route path="/*" element={<ClientApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </Router>
  );
};

// Thêm dòng này vào cuối file
export default App;
