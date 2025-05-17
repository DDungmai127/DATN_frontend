import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faSearch,
  faEye,
  faExclamationCircle,
  faCheck,
  faTimes,
  faTruck,
  faBox,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const OrdersPanel = ({ onViewDetails }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ xác nhận" },
    { id: "processing", label: "Đang xử lý" },
    { id: "shipping", label: "Đang giao" },
    { id: "completed", label: "Đã giao" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Bạn cần đăng nhập lại");
      }

      const response = await axios.get("http://localhost:3000/api/orders/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setError("Không thể tải danh sách đơn hàng");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Có lỗi xảy ra khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Hàm lọc đơn hàng theo tab và tìm kiếm
  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Lọc theo tab trạng thái
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => {
        // Map activeTab với trạng thái thực tế của đơn hàng
        const statusMap = {
          pending: "Chờ xác nhận",
          processing: "Đang xử lý",
          shipping: "Đang giao",
          completed: "Đã giao",
          cancelled: "Đã hủy",
        };

        return order.status === statusMap[activeTab];
      });
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderCode.toLowerCase().includes(query) ||
          order.receiver.toLowerCase().includes(query) ||
          order.phoneNumber.includes(query) ||
          order.address.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Bạn cần đăng nhập lại");
      }

      const response = await axios.post(
        `http://localhost:3000/api/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Cập nhật trạng thái đơn hàng trong danh sách
        setOrders(
          orders.map((order) =>
            order.orderId === orderId ? { ...order, status: "Đã hủy" } : order
          )
        );
      } else {
        alert(response.data.message || "Không thể hủy đơn hàng");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Có lỗi xảy ra khi hủy đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-500" />;
      case "Đang xử lý":
        return <FontAwesomeIcon icon={faBox} className="text-blue-500" />;
      case "Đang giao":
        return <FontAwesomeIcon icon={faTruck} className="text-blue-500" />;
      case "Đã giao":
        return <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
      case "Đã hủy":
        return <FontAwesomeIcon icon={faTimes} className="text-red-500" />;
      default:
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return "bg-yellow-100 text-yellow-800";
      case "Đang xử lý":
        return "bg-blue-100 text-blue-800";
      case "Đang giao":
        return "bg-blue-100 text-blue-800";
      case "Đã giao":
        return "bg-green-100 text-green-800";
      case "Đã hủy":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Đơn hàng của tôi</h2>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng, tên người nhận..."
                className="w-full px-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto whitespace-nowrap -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && !error ? (
        <div className="text-center py-10">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-500" />
          <p className="mt-2 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.orderId} className="border rounded-lg overflow-hidden">
              {/* Order header */}
              <div className="bg-gray-50 px-4 py-3 flex flex-wrap justify-between items-center">
                <div>
                  <span className="font-medium">Mã đơn: </span>
                  <span>{order.orderCode}</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </span>
                </div>
              </div>

              {/* Order content */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">Người nhận</p>
                    <p className="font-medium">{order.receiver}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Số điện thoại</p>
                    <p className="font-medium">{order.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Ngày đặt</p>
                    <p className="font-medium">{formatDate(order.orderDate)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Địa chỉ giao hàng</p>
                  <p className="font-medium">{order.address}</p>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Sản phẩm đã đặt</p>
                  <p className="font-medium">
                    {order.orderDetails
                      ? `${order.orderDetails.length} sản phẩm`
                      : "Không có thông tin"}
                  </p>
                </div>

                <div className="flex flex-wrap justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Tổng tiền</p>
                    <p className="text-red-600 font-bold text-lg">
                      {formatPrice(order.totalPrice)}
                    </p>
                  </div>
                  <div className="flex space-x-2 mt-2 md:mt-0">
                    <button
                      onClick={() => onViewDetails(order.orderId)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      Chi tiết
                    </button>

                    {order.status === "Chờ xác nhận" && (
                      <button
                        onClick={() => handleCancelOrder(order.orderId)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;
