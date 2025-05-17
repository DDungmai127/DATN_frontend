import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignInAlt,
  faSignOutAlt,
  faUserCircle,
  faSearch,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../Provider/AuthProvider";
import logo from "../../assets/logo.png";
const Header = ({ showSearch = true }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const [adminName, setAdminName] = useState("");
  useEffect(() => {
    const checkAdmin = () => {
      try {
        if (user && user.fullName) return;

        // Nếu không, kiểm tra localStorage
        const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
        if (adminInfo && adminInfo.isLoggedIn && adminInfo.fullName) {
          setAdminName(adminInfo.fullName);
        }
      } catch (error) {
        console.error("Error checking admin info:", error);
      }
    };

    checkAdmin();
  }, [user]);

  // HỖ TRỢ ĐỐNG DROPDOWN ĐĂNG XUẤT
  useEffect(() => {
    // Hàm để đóng dropdown khi click ra ngoài
    const closeDropdown = (e) => {
      // Nếu không click vào phần tử có class 'dropdown-toggle'
      if (!e.target.closest(".dropdown-toggle") && showDropdown) {
        setShowDropdown(false);
      }
    };

    // Chỉ thêm event listener khi dropdown đang mở
    if (showDropdown) {
      document.addEventListener("mousedown", closeDropdown);
    }

    // Cleanup khi unmount hoặc khi showDropdown thay đổi
    return () => {
      document.removeEventListener("mousedown", closeDropdown);
    };
  }, [showDropdown]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      // Nếu logout từ context tồn tại, sử dụng nó
      if (typeof logout === "function") {
        const result = await logout();
        if (result.success) {
          navigate("/admin/login");
        } else {
          console.error("Logout failed:", result.message);
        }
      } else {
        localStorage.removeItem("adminInfo");

        // Gọi API đăng xuất
        try {
          const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
          await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (apiError) {
          console.error("API logout error:", apiError);
        }
        // Chuyển hướng về trang đăng nhập
        navigate("/admin/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Vẫn chuyển hướng về trang đăng nhập để tránh người dùng bị kẹt
      navigate("/admin/login");
    } finally {
      // Đóng dropdown
      setShowDropdown(false);
    }
  };

  return (
    <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-12 w-12 mr-2" />
        <h1 className="text-2xl font-bold text-gray-700">GroceryStore</h1>
      </div>

      {/* User menu */}
      <div className="relative">
        {isAuthenticated ? (
          <div className="flex items-center">
            <button
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none dropdown-toggle"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
              <span className="hidden md:inline">{adminName}</span>
              <FontAwesomeIcon icon={faCaretDown} className="text-xs ml-1" />
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border dropdown-toggle">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            onClick={() => navigate("/admin/login")}
          >
            <FontAwesomeIcon icon={faSignInAlt} className="mr-1" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
