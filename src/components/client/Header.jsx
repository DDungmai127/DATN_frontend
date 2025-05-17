import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faShoppingCart,
  faSignOutAlt,
  faClipboardList,
  faHistory,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import logo from "../../assets/logo.png";

// Đảm bảo axios luôn gửi cookie
axios.defaults.withCredentials = true;

// Hàm kiểm tra đăng nhập
const isLoggedIn = () => {
  try {
    // Kiểm tra cả clientInfo và userInfo vì có thể bạn đang sử dụng một trong hai
    const userInfoStr = localStorage.getItem("userInfo") || localStorage.getItem("clientInfo");
    return userInfoStr && JSON.parse(userInfoStr).isLoggedIn;
  } catch (e) {
    console.error("Error checking login status:", e);
    return false;
  }
};

// Hàm lấy thông tin người dùng
const getUser = () => {
  try {
    // Kiểm tra cả clientInfo và userInfo
    const userInfoStr = localStorage.getItem("userInfo") || localStorage.getItem("clientInfo");
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (e) {
    console.error("Error getting user info:", e);
    return null;
  }
};

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // State cho user và auth status
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [user, setUser] = useState(getUser());

  // Thêm CSS animation cho dropdown
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes dropdownFade {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .dropdown-animation {
        animation: dropdownFade 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Cập nhật state khi component mount và khi localStorage thay đổi
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isLoggedIn();
      const userData = getUser();
      console.log("Auth check:", { loggedIn, userData });
      setIsAuthenticated(loggedIn);
      setUser(userData);
    };

    checkAuth(); // Kiểm tra ngay khi component mount

    // Lắng nghe thay đổi localStorage từ tab/window khác
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Xử lý click bên ngoài dropdown để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    // Chỉ thêm event listener khi dropdown đang mở
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]); // Phụ thuộc vào dropdownOpen

  // Hàm toggle dropdown đơn giản
  const handleToggleDropdown = () => {
    console.log("Toggle dropdown", { current: dropdownOpen });
    setDropdownOpen((prevState) => !prevState);
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

      // Gọi API đăng xuất với withCredentials để gửi cookie
      try {
        await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      } catch (err) {
        console.error("Logout API error:", err);
      }

      // Xóa tất cả thông tin đăng nhập từ localStorage
      localStorage.removeItem("clientInfo");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("clientUserInfo");

      // Cập nhật state
      setIsAuthenticated(false);
      setUser(null);
      setDropdownOpen(false);

      // Chuyển hướng về trang chủ
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.");
    }
  };

  console.log("Render header:", { isAuthenticated, user, dropdownOpen });

  return (
    <header className="bg-red-600 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img src={logo} alt="Logo" className="h-12 w-12 mr-2" />
            <h1 className="text-xl font-bold">Grocery Shop</h1>
          </a>
        </div>

        <div className="relative w-1/3">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." className="p-2 rounded-md w-full" />
        </div>

        <div className="flex items-center space-x-4">
          {/* Giỏ hàng */}
          <a
            href="/cart"
            className="bg-white text-red-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center"
          >
            <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5 mr-2" />
            Giỏ hàng
          </a>

          {/* Tài khoản với dropdown */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleToggleDropdown}
                type="button"
                className="bg-white text-red-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-2" />
                {user?.fullName?.split(" ").pop() || "Tài khoản"}
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`ml-2 text-xs transition-transform duration-200 ${
                    dropdownOpen ? "transform rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 dropdown-animation">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-800">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">{user?.phoneNumber}</p>
                    {user?.email && <p className="text-sm text-gray-500 truncate">{user.email}</p>}
                  </div>

                  <a
                    href="/account"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-2 w-5 h-5 text-gray-500" />
                    <span>Thông tin tài khoản</span>
                  </a>

                  <a
                    href="/account/current-orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FontAwesomeIcon
                      icon={faClipboardList}
                      className="mr-2 w-5 h-5 text-gray-500"
                    />
                    <span>Đơn hàng đang đặt</span>
                  </a>

                  <a
                    href="/account/order-history"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FontAwesomeIcon icon={faHistory} className="mr-2 w-5 h-5 text-gray-500" />
                    <span>Lịch sử đơn hàng</span>
                  </a>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      type="button"
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 w-5 h-5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login?redirect=/account"
              className="bg-white text-red-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-2" />
              Tài khoản
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
