import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../../components/admin/SideBar";
import Header from "../../components/admin/Header";
import { useAuth } from "../../Provider/AuthProvider";

const Layout = () => {
  const { user, isAuthenticated, loading } = useAuth();

  console.log("Layout render:", { isAuthenticated, loading, user });

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Kiểm tra đăng nhập
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/admin/login" replace />;
  }

  // Kiểm tra quyền (admin hoặc staff)
  const hasAccess = user && (user.role === "admin" || user.role === "staff");

  if (!hasAccess) {
    console.log("No admin access, redirecting to login");
    // Điều hướng đến trang đăng nhập với thông báo
    return (
      <Navigate
        to="/admin/login"
        state={{ accessError: "Tài khoản của bạn không có quyền truy cập vào trang quản trị" }}
        replace
      />
    );
  }

  // Hiển thị layout khi đã đăng nhập và có quyền truy cập
  return (
    <div className="flex h-screen">
      <Sidebar isAdmin={user.role === "admin"} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
