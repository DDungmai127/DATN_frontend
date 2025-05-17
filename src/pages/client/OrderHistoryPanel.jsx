import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faEye,
  faCheck,
  faTimes,
  faSearch,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const OrderHistoryPanel = ({ onViewDetails }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'completed', 'cancelled'

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Bạn cần đăng nhập lại");
      }

      const response = await axios.get("http://localhost:3000/api/orders/user/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setError("Không thể tải lịch sử đơn hàng");
      }
    } catch (err) {
      console.error("Error fetching order history:", err);
      setError("Có lỗi xảy ra khi tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Lọc đơn hàng theo tìm kiếm và trạng thái
  const filteredOrders = orders.filter((order) => {
    // Lọc theo trạng thái
    if (filter === "completed" && order.status !== "Đã giao") return false;
    if (filter === "cancelled" && order.status !== "Đã hủy") return false;

    // Lọc theo tìm kiếm
    if (!searchTerm) return true;

    const searchTermLower = searchTerm.toLowerCase();
    return (
      order.orderCode.toLowerCase().includes(searchTermLower) ||
      order.receiver.toLowerCase().includes(searchTermLower) ||
      order.status.toLowerCase().includes(searchTermLower) ||
      order.address.toLowerCase().includes(searchTermLower) ||
      order.phoneNumber.includes(searchTerm)
    );
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
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
      case "Đã giao":
        return <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
      case "Đã hủy":
        return <FontAwesomeIcon icon={faTimes} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Đã giao":
        return "bg-green-100 text-green-800";
      case "Đã hủy":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Lịch sử đơn hàng</h2>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FontAwesomeIcon icon={faSearch} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="all">Tất cả</option>
              <option value="completed">Đơn thành công</option>
              <option value="cancelled">Đơn đã hủy</option>
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faFilter} />
            </div>
          </div>

          <button
            onClick={fetchOrderHistory}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "Làm mới"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && !error ? (
        <div className="flex justify-center items-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-red-600" />
          <span className="ml-2">Đang tải dữ liệu...</span>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header của đơn hàng */}
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Mã đơn:</span>
                  <span>{order.orderCode}</span>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusClass(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-2">{order.status}</span>
                </div>
              </div>

              {/* Nội dung đơn hàng */}
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

                {order.completedDate && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">Ngày hoàn thành</p>
                    <p className="font-medium">{formatDate(order.completedDate)}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Địa chỉ giao hàng</p>
                  <p className="font-medium">{order.address}</p>
                </div>

                <div className="flex flex-wrap justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Tổng tiền</p>
                    <p
                      className={`font-bold ${
                        order.status === "Đã giao" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatPrice(order.totalPrice)}
                    </p>
                  </div>

                  <button
                    onClick={() => onViewDetails(order.orderId)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-2" />
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">📝</div>
          <p className="text-gray-500">Không tìm thấy đơn hàng nào trong lịch sử</p>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPanel;
