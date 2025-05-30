import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faTags,
  faBoxes,
  faUsers,
  faShoppingCart,
  faSignInAlt,
  faSignOutAlt,
  faTag,
  faStore,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../Provider/AuthProvider";

const MenuItem = ({ to, icon, children, isActive }) => (
  <Link to={to} className={`flex items-center px-6 py-3 ${isActive}`}>
    <FontAwesomeIcon icon={icon} className="mr-3" />
    <span>{children}</span>
  </Link>
);

const Sidebar = ({ isAdmin = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "bg-gray-800 text-white"
      : "text-gray-400 hover:bg-gray-700 hover:text-white";

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate("/admin/login");
    } else {
      console.error("Logout failed:", result.message);
    }
  };

  const adminMenuItems = [
    { to: "/admin/dashboard", icon: faTachometerAlt, label: "Tổng quan" },
    { to: "/admin/categories", icon: faTags, label: "Danh mục" },
    { to: "/admin/products", icon: faBoxes, label: "Sản phẩm" },
    { to: "/admin/users", icon: faUsers, label: "Người dùng" },
    { to: "/admin/discounts", icon: faTag, label: "Mã giảm giá" },
    { to: "/admin/stores", icon: faStore, label: "Quản lý kho" },
    { to: "/admin/orders", icon: faShoppingCart, label: "Đơn hàng" },
  ];

  const nonAdminMenuItems = adminMenuItems.map((item) => ({
    ...item,
    to: "/admin/login", // Chuyển đến trang đăng nhập nếu chưa đăng nhập
  }));

  return (
    <div className="bg-gray-900 w-64 flex-shrink-0 h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <span className="text-white font-bold text-xl">Admin Panel</span>
      </div>
      <nav className="mt-6">
        {isAdmin ? (
          <>
            {adminMenuItems.map((item) => (
              <MenuItem key={item.to} to={item.to} icon={item.icon} isActive={isActive(item.to)}>
                {item.label}
              </MenuItem>
            ))}
            <div className="mt-auto pt-6 pb-3 px-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center py-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {nonAdminMenuItems.map((item) => (
              <div
                key={item.to}
                className="flex items-center px-6 py-3 text-gray-400 cursor-pointer"
                onClick={() => navigate(item.to)}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3" />
                <span>{item.label}</span>
              </div>
            ))}
            <div className="mt-auto pt-6 pb-3 px-6">
              <Link
                to="/admin/login"
                className="w-full flex items-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                <FontAwesomeIcon icon={faSignInAlt} className="ml-3 mr-3" />
                <span>Đăng nhập</span>
              </Link>
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
