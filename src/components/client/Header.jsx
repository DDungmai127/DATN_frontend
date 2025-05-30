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
  faStore,
  faMapMarkerAlt,
  faSpinner,
  faCrosshairs,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import logo from "../../assets/logo.png";

// Đảm bảo axios luôn gửi cookie
axios.defaults.withCredentials = true;

// API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const storeDropdownRef = useRef(null);

  // State cho user và auth status
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [user, setUser] = useState(getUser());

  // State cho cửa hàng
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchStoreText, setSearchStoreText] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);

  // Fetch danh sách cửa hàng khi component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/stores`);
        if (response.data && response.data.data) {
          setStores(response.data.data);
          setFilteredStores(response.data.data);

          // Lấy cửa hàng đã lưu từ localStorage
          const savedStoreId = localStorage.getItem("selectedStoreId");

          if (savedStoreId) {
            const savedStore = response.data.data.find((store) => store.storeId === savedStoreId);
            if (savedStore) {
              setSelectedStore(savedStore);
            } else if (response.data.data.length > 0) {
              setSelectedStore(response.data.data[0]);
            }
          } else if (response.data.data.length > 0) {
            setSelectedStore(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };

    fetchStores();
  }, []);

  // Lọc cửa hàng khi người dùng tìm kiếm
  useEffect(() => {
    if (searchStoreText.trim() === "") {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(
        (store) =>
          store.storeName.toLowerCase().includes(searchStoreText.toLowerCase()) ||
          (store.storeAddress &&
            store.storeAddress.toLowerCase().includes(searchStoreText.toLowerCase()))
      );
      setFilteredStores(filtered);
    }
  }, [searchStoreText, stores]);

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
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target)) {
        setStoreDropdownOpen(false);
      }
    }

    // Thêm event listener khi dropdown đang mở
    if (dropdownOpen || storeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, storeDropdownOpen]);

  // Hàm toggle dropdown đơn giản
  const handleToggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);
  };

  // Hàm toggle store dropdown
  const handleToggleStoreDropdown = () => {
    setStoreDropdownOpen((prevState) => !prevState);
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
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

  // Helper function để tính khoảng cách giữa 2 điểm theo công thức Haversine
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper function để chuyển độ sang radian
  const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  // Xử lý tìm cửa hàng gần nhất
  const findNearestStore = () => {
    setLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Nếu có danh sách cửa hàng, tìm cửa hàng gần nhất
            if (stores && stores.length > 0) {
              // Thêm khoảng cách vào mỗi cửa hàng
              const storesWithDistance = stores.map((store) => {
                if (store.latitude && store.longitude) {
                  const distance = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(store.latitude),
                    parseFloat(store.longitude)
                  );
                  return {
                    ...store,
                    distance: distance.toFixed(2),
                    distanceRaw: distance, // Dùng để sắp xếp
                  };
                }
                return {
                  ...store,
                  distance: "N/A",
                  distanceRaw: Infinity,
                };
              });

              // Sắp xếp theo khoảng cách
              const sortedStores = [...storesWithDistance].sort(
                (a, b) => a.distanceRaw - b.distanceRaw
              );
              setFilteredStores(sortedStores);

              // Chọn cửa hàng gần nhất
              if (sortedStores.length > 0 && sortedStores[0].distanceRaw !== Infinity) {
                const nearest = sortedStores[0];
                setSelectedStore(nearest);
                localStorage.setItem("selectedStoreId", nearest.storeId);
              }
            }
          } catch (error) {
            console.error("Error finding nearest store:", error);
          } finally {
            setLoadingLocation(false);
            // Đóng dropdown sau khi đã tìm thấy cửa hàng gần nhất
            setTimeout(() => setStoreDropdownOpen(false), 1000);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoadingLocation(false);
          alert("Không thể lấy vị trí của bạn. Vui lòng cho phép quyền truy cập vị trí.");
        }
      );
    } else {
      setLoadingLocation(false);
      alert("Trình duyệt của bạn không hỗ trợ định vị.");
    }
  };

  // Xử lý khi chọn cửa hàng
  const handleSelectStore = (store) => {
    setSelectedStore(store);
    localStorage.setItem("selectedStoreId", store.storeId);
    setStoreDropdownOpen(false);
  };

  return (
    <header className="bg-red-600 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo và tên shop */}
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img src={logo} alt="Logo" className="h-12 w-12 mr-2" />
            <h1 className="text-xl font-bold">Grocery Shop</h1>
          </a>
        </div>

        {/* Khung tìm kiếm sản phẩm */}
        <div className="relative w-1/3">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." className="p-2 rounded-md w-full" />
        </div>

        {/* Nhóm nút bên phải */}
        <div className="flex items-center space-x-3">
          {/* Thay đổi nút chọn cửa hàng */}
          <div className="relative" ref={storeDropdownRef}>
            <button
              onClick={handleToggleStoreDropdown}
              className="bg-white text-red-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center min-w-[160px] justify-between"
            >
              <div className="flex items-center">
                <FontAwesomeIcon icon={faStore} className="h-5 w-5 mr-3" />
                <span className="truncate max-w-[140px] font-medium">
                  {selectedStore
                    ? selectedStore.storeName // Hiển thị đầy đủ tên cửa hàng
                    : "Chọn cửa hàng"}
                </span>
              </div>
              <div className="flex items-center">
                {selectedStore && selectedStore.distance && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full mx-2">
                    {selectedStore.distance} km
                  </span>
                )}
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`transition-transform duration-200 ml-1 ${
                    storeDropdownOpen ? "transform rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {storeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 dropdown-animation text-gray-800">
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {selectedStore ? "Thay đổi cửa hàng" : "Chọn cửa hàng"}
                    </h3>
                    <button
                      onClick={findNearestStore}
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                      disabled={loadingLocation}
                    >
                      {loadingLocation ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                      ) : (
                        <FontAwesomeIcon icon={faCrosshairs} className="mr-1" />
                      )}
                      <span>Tìm gần nhất</span>
                    </button>
                  </div>
                  <div className="mt-2 relative">
                    <input
                      type="text"
                      placeholder="Tìm theo tên, địa chỉ..."
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={searchStoreText}
                      onChange={(e) => setSearchStoreText(e.target.value)}
                    />
                  </div>
                </div>

                {selectedStore && (
                  <div className="px-4 py-2 bg-blue-50 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-full mr-3">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 font-medium">Cửa hàng hiện tại</p>
                        <p className="font-medium">{selectedStore.storeName}</p>
                        <p className="text-xs text-gray-600">{selectedStore.storeAddress}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto">
                  {filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                      <div
                        key={store.storeId}
                        onClick={() => handleSelectStore(store)}
                        className={`px-4 py-3 hover:bg-gray-100 cursor-pointer ${
                          selectedStore && selectedStore.storeId === store.storeId
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="p-2 bg-orange-100 rounded-full mr-3">
                            <FontAwesomeIcon icon={faStore} className="text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{store.storeName}</p>
                            <p className="text-xs text-gray-600">{store.storeAddress}</p>
                            {store.storePhoneNumber && (
                              <p className="text-xs text-gray-500">{store.storePhoneNumber}</p>
                            )}
                            {store.distance && (
                              <span className="text-xs font-medium text-blue-600">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                {store.distance} km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">
                      Không tìm thấy cửa hàng phù hợp
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
                <span className="hidden md:inline">
                  {user?.fullName?.split(" ").pop() || "Tài khoản"}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`md:ml-2 text-xs transition-transform duration-200 ${
                    dropdownOpen ? "transform rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 dropdown-animation">
                  {/* Nội dung dropdown menu giữ nguyên */}
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
              <span className="hidden md:inline">Tài khoản</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
