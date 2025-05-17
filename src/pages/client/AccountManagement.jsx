import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faClipboardList,
  faSignOutAlt,
  faSpinner,
  faHistory,
  faShoppingBag,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ProfilePanel from "./ProfilePanel";
import CurrentOrdersPanel from "./CurrentOrdersPanel";
import OrderHistoryPanel from "./OrderHistoryPanel";
import OrderDetailPanel from "./OrderDetailPanel";

const API_URL = "http://localhost:3000/api";

const AccountManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePanel, setActivePanel] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderIdToView, setOrderIdToView] = useState(null);

  // Hàm làm mới token
  const refreshAuth = async () => {
    try {
      // Gọi API để làm mới token (nếu có)
      const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        console.log("Auth token refreshed successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing auth token:", error);
      return false;
    }
  };

  // Xác định panel nào đang active dựa trên URL
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (lastSegment === "account") {
      setActivePanel("profile");
    } else if (lastSegment === "orders" && location.search) {
      // Nếu có query parameter cho orderId
      const params = new URLSearchParams(location.search);
      const orderId = params.get("id");
      if (orderId) {
        setActivePanel("order-detail");
        setOrderIdToView(orderId);
      } else {
        setActivePanel("current-orders");
      }
    } else {
      setActivePanel(lastSegment || "profile");
    }
  }, [location]);

  // Cập nhật hàm fetchUserData
  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Kiểm tra trong localStorage trước
      const clientInfoStr = localStorage.getItem("clientInfo");
      if (!clientInfoStr) {
        console.log("No client info in localStorage, redirecting to login");
        navigate("/login");
        return;
      }

      // Parse thông tin người dùng
      try {
        const clientInfo = JSON.parse(clientInfoStr);

        // Thử lấy thông tin người dùng từ API
        let response;
        try {
          // Gọi API với cookie (không cần gửi token qua header)
          response = await axios.get(`${API_URL}/auth/me`, {
            withCredentials: true, // Đảm bảo gửi cookie
          });

          console.log("API response:", response.data);

          if (response.data && response.data.success) {
            const userData = response.data.data?.user || response.data.data;
            setUser(userData);

            // Cập nhật thông tin mới nhất vào localStorage (không lưu token)
            localStorage.setItem(
              "clientInfo",
              JSON.stringify({
                ...userData,
                isLoggedIn: true,
              })
            );
            return;
          }
        } catch (apiError) {
          console.log("API call failed, using localStorage data");

          // Nếu gọi API thất bại, sử dụng dữ liệu từ localStorage
          setUser(clientInfo);
        }
      } catch (parseError) {
        console.error("Error parsing client info:", parseError);
        // Xóa dữ liệu không hợp lệ
        localStorage.removeItem("clientInfo");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error checking authentication:", error);

      // Xử lý lỗi 401 cụ thể
      if (error.response && error.response.status === 401) {
        console.log("Authentication failed (401), redirecting to login");
        // Xóa thông tin đăng nhập không còn hợp lệ
        localStorage.removeItem("clientInfo");
        navigate("/login");
      } else {
        setError("Đã xảy ra lỗi khi tải thông tin người dùng");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      try {
        // Gọi API đăng xuất với withCredentials: true
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            withCredentials: true,
          }
        );

        // Xóa thông tin từ localStorage
        localStorage.removeItem("clientInfo");

        // Chuyển hướng về trang chủ
        window.location.href = "/";
      } catch (err) {
        console.error("Logout error:", err);

        // Vẫn xóa dữ liệu cục bộ để đảm bảo đăng xuất
        localStorage.removeItem("clientInfo");

        alert("Có lỗi xảy ra khi đăng xuất. Bạn vẫn đã được đăng xuất khỏi ứng dụng.");
        window.location.href = "/";
      }
    }
  };

  const handlePanelChange = (panel) => {
    setActivePanel(panel);

    // Cập nhật URL mà không làm tải lại trang
    if (panel === "profile") {
      navigate("/account");
    } else if (panel === "order-detail") {
      navigate(`/account/orders?id=${orderIdToView}`);
    } else {
      navigate(`/account/${panel}`);
    }
  };

  const handleViewOrderDetail = (orderId) => {
    setOrderIdToView(orderId);
    setActivePanel("order-detail");
    navigate(`/account/orders?id=${orderId}`);
  };

  const handleBackToOrders = (isCurrentOrder) => {
    if (isCurrentOrder) {
      setActivePanel("current-orders");
      navigate("/account/current-orders");
    } else {
      setActivePanel("order-history");
      navigate("/account/order-history");
    }
    setOrderIdToView(null);
  };

  // Hàm xử lý cập nhật profile
  const handleProfileUpdate = async (updatedUserData) => {
    // Cập nhật state user
    setUser(updatedUserData);

    // Thử làm mới token sau khi cập nhật profile
    try {
      await refreshAuth();
    } catch (err) {
      console.log("Failed to refresh auth token after profile update");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-red-600" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    );
  }

  const renderActivePanel = () => {
    switch (activePanel) {
      case "profile":
        return <ProfilePanel user={user} onProfileUpdate={handleProfileUpdate} />;
      case "current-orders":
        return <CurrentOrdersPanel onViewDetails={handleViewOrderDetail} />;
      case "order-history":
        return <OrderHistoryPanel onViewDetails={handleViewOrderDetail} />;
      case "order-detail":
        // Truyền thêm thông tin là đơn hàng hiện tại hay đã hoàn thành
        return (
          <OrderDetailPanel
            orderId={orderIdToView}
            onBack={(isCurrentOrder) => handleBackToOrders(isCurrentOrder)}
          />
        );
      default:
        return <ProfilePanel user={user} setUser={setUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Quản lý tài khoản</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white shadow-md p-4 rounded-lg">
              {/* User info */}
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {user?.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user?.fullName || "Người dùng"}</h3>
                  <p className="text-gray-600">{user?.phoneNumber || ""}</p>
                </div>
              </div>

              {/* Navigation links */}
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handlePanelChange("profile")}
                    className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${
                      activePanel === "profile" ? "bg-red-100 text-red-600" : "hover:bg-gray-100"
                    }`}
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-3" />
                    Thông tin tài khoản
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handlePanelChange("current-orders")}
                    className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${
                      activePanel === "current-orders"
                        ? "bg-red-100 text-red-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <FontAwesomeIcon icon={faShoppingBag} className="mr-3" />
                    Đơn hàng đang đặt
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handlePanelChange("order-history")}
                    className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${
                      activePanel === "order-history"
                        ? "bg-red-100 text-red-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <FontAwesomeIcon icon={faHistory} className="mr-3" />
                    Lịch sử đơn hàng
                  </button>
                </li>
                <li className="border-t mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                    Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Main content */}
          <div className="w-full md:w-3/4">
            <div className="bg-white p-6 rounded-lg shadow-md">{renderActivePanel()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
