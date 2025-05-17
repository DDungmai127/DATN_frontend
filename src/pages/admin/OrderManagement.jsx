import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faSpinner,
  faSyncAlt,
  faCheck,
  faTruck,
  faBoxOpen,
  faTimes,
  faHourglass,
  faTrash, // Thêm icon thùng rác
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import axios from "axios";
import { toast } from "react-toastify"; // Sử dụng toast đã định nghĩa

const OrderManagement = () => {
  // State cơ bản
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho lọc và tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: "",
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  // Thêm các state liên quan đến xóa đơn hàng
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Hàm tải danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Xây dựng query params cho API
      let queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (statusFilter !== "all") {
        const statusMap = {
          pending: "Chờ xử lý",
          shipping: "Đang giao hàng",
          delivered: "Đã giao hàng",
          cancelled: "Đã hủy",
        };
        queryParams.append("status", statusMap[statusFilter]);
      }

      if (paymentMethodFilter !== "all") {
        queryParams.append("paymentMethod", paymentMethodFilter);
      }

      if (dateRange.fromDate) {
        queryParams.append("fromDate", dateRange.fromDate);
      }

      if (dateRange.toDate) {
        queryParams.append("toDate", dateRange.toDate);
      }

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      // Gọi API với withCredentials: true
      const response = await axios.get(`http://localhost:3000/api/orders/all`, {
        withCredentials: true,
      });

      if (response.data.success) {
        const { data } = response.data;
        const pagination = response.data.pagination || {};

        setOrders(data);
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
        setItemsPerPage(pagination.itemsPerPage || 10);
      } else {
        throw new Error(response.data.message || "Không thể tải dữ liệu đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.response?.data?.message || error.message);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestURL: error.config?.url,
        requestMethod: error.config?.method,
        requestHeaders: error.config?.headers,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm refresh đơn hàng
  const refreshOrders = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  // Fetch orders khi component mount hoặc các filter thay đổi
  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, paymentMethodFilter]); // không thêm searchTerm để tránh call liên tục

  // Hàm xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
    fetchOrders();
  };

  // Hàm xử lý lọc theo ngày
  const handleDateFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset về trang 1 khi lọc
    fetchOrders();
  };

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Hiển thị trạng thái - đảm bảo phù hợp với ENUM trong model
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Chờ xử lý":
        return "bg-yellow-100 text-yellow-800";
      case "Đang giao hàng": // Đúng với ENUM trong model
        return "bg-indigo-100 text-indigo-800";
      case "Đã giao hàng":
        return "bg-green-100 text-green-800";
      case "Đã hủy":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Chờ xử lý":
        return <FontAwesomeIcon icon={faHourglass} className="mr-1" />;
      case "Đang giao hàng": // Đúng với ENUM trong model
        return <FontAwesomeIcon icon={faTruck} className="mr-1" />;
      case "Đã giao hàng":
        return <FontAwesomeIcon icon={faCheck} className="mr-1" />;
      case "Đã hủy":
        return <FontAwesomeIcon icon={faTimes} className="mr-1" />;
      default:
        return null;
    }
  };

  // Xem chi tiết đơn hàng
  const handleViewOrder = async (orderId) => {
    try {
      setLoading(true);

      const response = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Không thể xem chi tiết đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error(error.response?.data?.message || "Không thể xem chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setIsUpdatingStatus(true);

      const response = await axios.put(
        `http://localhost:3000/api/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Cập nhật UI
        setOrders(
          orders.map((order) =>
            order.orderId === orderId ? { ...order, status: newStatus } : order
          )
        );

        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        toast.success("Cập nhật trạng thái đơn hàng thành công!");
      } else {
        throw new Error(response.data.message || "Không thể cập nhật trạng thái đơn hàng");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Thêm hàm xử lý hiển thị dialog xác nhận xóa
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  // Thêm hàm xóa đơn hàng
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);

      const response = await axios.delete(
        `http://localhost:3000/api/orders/${orderToDelete.orderId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Cập nhật UI - loại bỏ đơn hàng đã xóa
        setOrders(orders.filter((order) => order.orderId !== orderToDelete.orderId));
        setTotalItems(totalItems - 1);

        // Recalculate totalPages
        const newTotalPages = Math.ceil((totalItems - 1) / itemsPerPage);
        setTotalPages(newTotalPages);

        // If current page is now empty and not the first page, go back one page
        if (currentPage > 1 && currentPage > newTotalPages) {
          setCurrentPage(currentPage - 1);
        }

        toast.success("Đã xóa đơn hàng thành công!");
        setShowDeleteConfirm(false);
        setOrderToDelete(null);
      } else {
        throw new Error(response.data.message || "Không thể xóa đơn hàng");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error.response?.data?.message || "Không thể xóa đơn hàng");
    } finally {
      setIsDeleting(false);
    }
  };

  // Tính tổng giá trị đơn hàng từ các orderItems
  const calculateOrderTotal = (orderItems) => {
    if (!orderItems || !Array.isArray(orderItems)) return 0;
    return orderItems.reduce((sum, item) => sum + parseFloat(item.price) * item.orderQuantity, 0);
  };

  // Format date from ISO string
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return "N/A";
    }
  };

  // Format time from ISO string or time string
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";

    try {
      // If it's a full ISO string, extract the time part
      if (timeString.includes("T")) {
        return timeString.split("T")[1].substring(0, 5);
      }
      // If it's just a time string
      return timeString.substring(0, 5);
    } catch (error) {
      return timeString;
    }
  };

  // Render phân trang
  const renderPagination = () => {
    const pages = [];

    // Hiển thị nút Previous
    pages.push(
      <button
        key="prev"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || loading}
        className={`px-3 py-1 rounded ${
          currentPage === 1
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        &laquo;
      </button>
    );

    // Hiển thị số trang
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1 rounded mx-1 ${
              currentPage === i
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pages.push(
          <span key={i} className="px-2 py-1">
            ...
          </span>
        );
      }
    }

    // Hiển thị nút Next
    pages.push(
      <button
        key="next"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || loading}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        &raquo;
      </button>
    );

    return <div className="flex justify-center items-center space-x-2 mt-4">{pages}</div>;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Quản lý đơn hàng</h2>

        <button
          onClick={refreshOrders}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          disabled={loading}
        >
          <FontAwesomeIcon
            icon={loading ? faSpinner : faSyncAlt}
            className={loading ? "animate-spin mr-2" : "mr-2"}
          />
          Làm mới
        </button>
      </div>

      {/* Hiển thị lỗi */}
      {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

      {/* Bộ lọc và tìm kiếm */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách hàng hoặc SĐT"
              className="border border-gray-300 rounded-l px-3 py-1.5 flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-1.5 rounded-r hover:bg-blue-600"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        <div className="flex gap-2">
          <select
            className="border border-gray-300 rounded px-3 py-1.5 flex-1"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="delivered">Đã giao hàng</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select
            className="border border-gray-300 rounded px-3 py-1.5 flex-1"
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tất cả phương thức</option>
            <option value="Tiền mặt">Tiền mặt</option>
            <option value="Chuyển khoản">Chuyển khoản</option>
            <option value="Thẻ tín dụng">Thẻ tín dụng</option>
          </select>
        </div>
      </div>

      {/* Lọc theo ngày */}
      <div className="mb-4">
        <form onSubmit={handleDateFilter} className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <label className="mr-2 whitespace-nowrap">Từ ngày:</label>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-1.5"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <label className="mr-2 whitespace-nowrap">Đến ngày:</label>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-1.5"
              value={dateRange.toDate}
              onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600"
          >
            Áp dụng
          </button>
        </form>
      </div>

      {/* Thông tin số lượng */}
      <div className="mb-2 text-sm text-gray-600">
        Hiển thị {orders.length} / {totalItems} đơn hàng
      </div>

      {/* Bảng đơn hàng */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Mã đơn
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Khách hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SĐT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ngày đặt
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tổng tiền
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phương thức
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Tác vụ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
                  <span>Đang tải dữ liệu...</span>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                // Calculate total from orderItems if available
                const orderTotal = calculateOrderTotal(order.orderItems);
                return (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.displayId || order.orderId.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{order.customerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{order.phoneNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(orderTotal)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{order.paymentMethod}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewOrder(order.orderId)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-1" /> Xem
                      </button>

                      {/* Thêm nút xóa, chỉ hiển thị nút xóa cho đơn hàng đã hủy hoặc đã giao */}
                      {(order.status === "Đã hủy" || order.status === "Đã giao hàng") && (
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && renderPagination()}

      {/* Modal Chi tiết đơn hàng */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">
                Đơn hàng #{selectedOrder.displayId || selectedOrder.orderId.substring(0, 8)}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Thông tin đơn hàng</h4>
                  <div className="space-y-1">
                    <p>
                      <span className="text-gray-600">Mã đơn hàng:</span>{" "}
                      {selectedOrder.displayId || selectedOrder.orderId.substring(0, 8)}
                    </p>
                    <p>
                      <span className="text-gray-600">Ngày đặt:</span>{" "}
                      {formatDate(selectedOrder.createdAt)} {formatTime(selectedOrder.createdAt)}
                    </p>
                    <p>
                      <span className="text-gray-600">Ngày giao:</span>{" "}
                      {formatDate(selectedOrder.deliveryDay)}
                    </p>
                    <p>
                      <span className="text-gray-600">Giờ giao:</span>{" "}
                      {formatTime(selectedOrder.deliveryTime)}
                    </p>
                    <p>
                      <span className="text-gray-600">Phương thức thanh toán:</span>{" "}
                      {selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Trạng thái đơn hàng</h4>
                  <div className="flex items-center mb-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mr-2 ${getStatusBadgeClass(
                        selectedOrder.status
                      )}`}
                    >
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </span>

                    {!isUpdatingStatus ? (
                      <select
                        className="ml-2 text-sm border rounded p-1.5"
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(selectedOrder.orderId, e.target.value)}
                        disabled={
                          selectedOrder.status === "Đã hủy" ||
                          selectedOrder.status === "Đã giao hàng"
                        }
                      >
                        <option value="Chờ xử lý">Chờ xử lý</option>
                        <option value="Đang giao hàng">Đang giao hàng</option>
                        <option value="Đã giao hàng">Đã giao hàng</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    ) : (
                      <div className="ml-2 flex items-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
                        <span className="text-sm">Đang cập nhật...</span>
                      </div>
                    )}
                  </div>

                  {(selectedOrder.status === "Đã hủy" ||
                    selectedOrder.status === "Đã giao hàng") && (
                    <p className="text-xs text-gray-500">
                      Không thể thay đổi trạng thái của đơn hàng đã{" "}
                      {selectedOrder.status.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>

              {/* Thông tin khách hàng và giao hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Thông tin khách hàng */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                  <div className="space-y-1">
                    <p>
                      <span className="text-gray-600">Tên:</span> {selectedOrder.customerName}
                    </p>
                    <p>
                      <span className="text-gray-600">SĐT:</span> {selectedOrder.phoneNumber}
                    </p>
                    <p>
                      <span className="text-gray-600">Địa chỉ:</span> {selectedOrder.address}
                    </p>
                  </div>
                </div>

                {/* Thông tin khách hàng đăng nhập (nếu có) */}
                {selectedOrder.userId && selectedOrder.user && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-2">Thông tin tài khoản</h4>
                    <div className="space-y-1">
                      <p>
                        <span className="text-gray-600">Tên tài khoản:</span>{" "}
                        {selectedOrder.user.customerName}
                      </p>
                      <p>
                        <span className="text-gray-600">Email:</span> {selectedOrder.user.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm */}
              <h4 className="font-medium mb-3">Sản phẩm trong đơn hàng</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Giá
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                      selectedOrder.orderItems.map((item) => (
                        <tr key={item.orderItemId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {item.product && item.product.image && (
                                <img
                                  src={item.product.image}
                                  alt={item.productName}
                                  className="w-12 h-12 object-cover rounded mr-3"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-500">
                                  ID: {item.productId.substring(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{item.orderQuantity}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {formatCurrency(parseFloat(item.price))}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {formatCurrency(
                              item.amount || parseFloat(item.price) * item.orderQuantity
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                          Không có thông tin sản phẩm
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng tiền */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền sản phẩm:</span>
                  <span className="font-medium">
                    {formatCurrency(calculateOrderTotal(selectedOrder.orderItems))}
                  </span>
                </div>
                <div className="flex justify-between my-1">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span>
                    {selectedOrder.shippingFee !== undefined
                      ? formatCurrency(selectedOrder.shippingFee)
                      : "0 đ"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Tổng cộng:</span>
                  <span>
                    {formatCurrency(
                      selectedOrder.totalAmount || calculateOrderTotal(selectedOrder.orderItems)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-between">
              {/* Nút xóa - chỉ hiển thị cho đơn đã hủy hoặc đã giao */}
              {(selectedOrder.status === "Đã hủy" || selectedOrder.status === "Đã giao hàng") && (
                <button
                  onClick={() => {
                    handleDeleteClick(selectedOrder);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Xóa đơn hàng
                </button>
              )}

              {/* Để trống ở giữa để nút căn đều */}
              <div></div>

              {/* Nút đóng */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa đơn hàng */}
      {showDeleteConfirm && orderToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow max-w-md w-full">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Xác nhận xóa đơn hàng</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa đơn hàng{" "}
                <span className="font-medium">
                  {orderToDelete.displayId || orderToDelete.orderId.substring(0, 8)}
                </span>
                ?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  )}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog xác nhận xóa */}
      {showDeleteConfirm && orderToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa đơn hàng</h3>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa đơn hàng
              <span className="font-semibold">
                {" "}
                {orderToDelete.displayId || orderToDelete.orderId.substring(0, 8)}{" "}
              </span>
              của khách hàng <span className="font-semibold">{orderToDelete.customerName}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteOrder}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
