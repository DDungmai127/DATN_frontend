import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faEye,
  faExclamationCircle,
  faBox,
  faTruck,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const CurrentOrdersPanel = ({ onViewDetails }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCurrentOrders();
  }, []);

  const fetchCurrentOrders = async () => {
    try {
      setLoading(true);
      setError("");

      // const token = localStorage.getItem("authToken");
      // if (!token) {
      //   throw new Error("Bạn cần đăng nhập lại");
      // }

      const response = await axios.get("http://localhost:3000/api/orders/current", {
        withCredentials: true,
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

      const response = await axios.post(`http://localhost:3000/api/orders/${orderId}/cancel`, {
        withCredentials: true,
      });

      if (response.data.success) {
        // Loại bỏ đơn đã hủy khỏi danh sách đơn hàng đang đặt
        setOrders(orders.filter((order) => order.orderId !== orderId));
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

  const calculateOrderTotal = (order) => {
    // Tính tổng từ các orderItems
    return order.orderItems.reduce((total, item) => {
      return total + +item.amount;
    }, 0);
  };

  // Lọc đơn hàng theo tìm kiếm
  const filteredOrders = orders.filter((order) => {
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

  // Phiên bản đơn giản chỉ lấy ngày/tháng/năm
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    // Kiểm tra nếu date không hợp lệ
    if (isNaN(date.getTime())) return "N/A";

    // Lấy ngày, tháng, năm và thêm số 0 phía trước nếu cần
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const year = date.getFullYear();

    // Trả về định dạng dd/mm/yyyy
    return `${day}/${month}/${year}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-500" />;
      case "Đang xử lý":
        return <FontAwesomeIcon icon={faBox} className="text-blue-500" />;
      case "Đang giao":
        return <FontAwesomeIcon icon={faTruck} className="text-blue-500" />;
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Đơn hàng đang đặt</h2>

      {/* Thanh tìm kiếm */}
      <div className="mb-6 flex gap-4">
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

        <button
          onClick={fetchCurrentOrders}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center"
          disabled={loading}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "Làm mới"}
        </button>
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
                  <span>{order.orderId}</span>
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
                    <p className="font-medium">{order.customerName}</p>
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

                <div className="flex flex-wrap justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Tổng tiền</p>
                    <p className="font-bold text-red-600">
                      {formatPrice(calculateOrderTotal(order))}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => onViewDetails(order.orderId)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      Chi tiết
                    </button>

                    {order.status === "Chờ xử lý" && (
                      <button
                        onClick={() => handleCancelOrder(order.orderId)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">📦</div>
          <p className="text-gray-500 mb-2">Bạn chưa có đơn hàng nào đang xử lý</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Mua sắm ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default CurrentOrdersPanel;
