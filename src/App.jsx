import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { AuthProvider, useAuth } from "./Provider/AuthProvider";
import OrderManagement from "./pages/admin/OrderManagement";
import DiscountManagement from "./pages/admin/DiscountManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
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

// Component bảo vệ routes admin - sửa lại để tránh lỗi maximum update depth
const ProtectedAdminRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Khi đang loading, hiển thị indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  // Kiểm tra quyền truy cập dựa vào role
  // Thay vì gọi hàm checkPermission, chúng ta sẽ kiểm tra trực tiếp
  const hasPermission =
    !requiredRole ||
    user.role === requiredRole ||
    (requiredRole === "staff" && user.role === "admin");

  if (!hasPermission) {
    // Hiển thị thông báo lỗi truy cập (thông qua context)
    // Sử dụng useEffect để tránh lỗi max update depth
    useEffect(() => {
      if (!loading && !permissionChecked) {
        // Import từ AuthProvider
        const { setAccessError } = useAuth();
        setAccessError({
          message: "Bạn không có quyền truy cập tính năng này",
          type: "ACCESS_DENIED",
        });
        setPermissionChecked(true);
      }
    }, [loading, permissionChecked]);

    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
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
          {/* Route mặc định */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Route Dashboard - Tất cả các role đều có quyền xem */}
          <Route
            path="dashboard"
            element={
              <ProtectedAdminRoute>
                <Dashboard />
              </ProtectedAdminRoute>
            }
          />

          {/* Route Products - Chỉ admin và staff mới được truy cập */}
          <Route
            path="products"
            element={
              <ProtectedAdminRoute requiredRole="staff">
                <ProductManagement />
              </ProtectedAdminRoute>
            }
          />

          {/* Route Categories - Chỉ admin và staff mới được truy cập */}
          <Route
            path="categories"
            element={
              <ProtectedAdminRoute requiredRole="staff">
                <CategoryManagement />
              </ProtectedAdminRoute>
            }
          />

          {/* Route Users - Chỉ admin mới có quyền */}
          <Route
            path="users"
            element={
              <ProtectedAdminRoute requiredRole="admin">
                <UserManagement />
              </ProtectedAdminRoute>
            }
          />

          {/* Route Discounts - Chỉ admin mới có quyền */}
          <Route
            path="discounts"
            element={
              <ProtectedAdminRoute requiredRole="admin">
                <DiscountManagement />
              </ProtectedAdminRoute>
            }
          />

          {/* Route Orders - Admin và staff đều có thể xem */}
          <Route
            path="orders"
            element={
              <ProtectedAdminRoute requiredRole="staff">
                <OrderManagement />
              </ProtectedAdminRoute>
            }
          />

          {/* Route Stores/Inventory - Admin và staff đều có thể xem */}
          <Route
            path="stores"
            element={
              <ProtectedAdminRoute requiredRole="staff">
                <InventoryManagement />
              </ProtectedAdminRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Client Routes - tất cả các route không bắt đầu bằng /admin */}
        <Route path="/*" element={<ClientApp />} />
      </Routes>
    </Router>
  );
};

export default App;
