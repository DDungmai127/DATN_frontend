import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSpinner,
  faExclamationCircle,
  faBox,
  faTruck,
  faCheck,
  faTimesCircle,
  faMapMarkerAlt,
  faPhoneAlt,
  faCalendarAlt,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

const OrderDetailPanel = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCurrentOrder, setIsCurrentOrder] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        withCredentials: true,
      });

      console.log("Order details response:", response.data);

      if (response.data.success) {
        setOrder(response.data.data);

        // Kiểm tra nếu đơn hàng là đơn hàng hiện tại hay đã hoàn thành
        const status = response.data.data.status;
        setIsCurrentOrder(
          status === "Chờ xử lý" || status === "Đang xử lý" || status === "Đang giao hàng"
        );
      } else {
        setError("Không thể tải thông tin đơn hàng");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Có lỗi xảy ra khi tải thông tin đơn hàng");
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
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  const calculateTotalAmount = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }
    return items.reduce((sum, item) => sum + (+item.amount || 0), 0);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Chờ xử lý":
        return "bg-yellow-100 text-yellow-800";
      case "Đang xử lý":
        return "bg-blue-100 text-blue-800";
      case "Đang giao hàng":
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
        return <FontAwesomeIcon icon={faBox} />;
      case "Đang xử lý":
        return <FontAwesomeIcon icon={faBox} />;
      case "Đang giao hàng":
        return <FontAwesomeIcon icon={faTruck} />;
      case "Đã giao hàng":
        return <FontAwesomeIcon icon={faCheck} />;
      case "Đã hủy":
        return <FontAwesomeIcon icon={faTimesCircle} />;
      default:
        return <FontAwesomeIcon icon={faBox} />;
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Cập nhật lại thông tin đơn hàng
        fetchOrderDetails();
        alert("Đơn hàng đã được hủy thành công");
      } else {
        alert(response.data.message || "Không thể hủy đơn hàng");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-red-600 mb-4" />
        <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-4xl text-red-500 mb-2" />
        <h3 className="text-xl font-semibold text-gray-800 mb-1">Đã xảy ra lỗi</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => onBack(isCurrentOrder)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Trở lại
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-8 text-center">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-4xl text-yellow-500 mb-2" />
        <h3 className="text-xl font-semibold text-gray-800 mb-1">Không tìm thấy đơn hàng</h3>
        <p className="text-gray-600 mb-4">Không thể tìm thấy thông tin của đơn hàng này</p>
        <button
          onClick={() => onBack(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Trở lại
        </button>
      </div>
    );
  }

  const orderCode = order.orderId;
  const orderItems = order.orderItems || [];
  const totalAmount = calculateTotalAmount(orderItems);

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => onBack(isCurrentOrder)}
          className="flex items-center text-red-600 hover:text-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Trở lại {isCurrentOrder ? "đơn hàng đang đặt" : "lịch sử đơn hàng"}
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-xl font-bold mb-2">Chi tiết đơn hàng #{orderCode}</h2>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
              order.status
            )}`}
          >
            {getStatusIcon(order.status)}
            <span className="ml-2">{order.status}</span>
          </div>
        </div>
        <p className="text-gray-500">
          Ngày đặt hàng: {formatDate(order.createdAt || order.orderDate)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-md p-4">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-red-600" />
            Địa chỉ giao hàng
          </h3>
          <p className="font-medium">{order.customerName}</p>
          <p className="flex items-center text-gray-600 mt-1">
            <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" />
            {order.phoneNumber}
          </p>
          <p className="text-gray-600 mt-1">{order.address}</p>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-red-600" />
            Thông tin giao hàng
          </h3>
          <p className="text-gray-600">
            <span className="font-medium">Ngày giao:</span>{" "}
            {order.deliveryDay || "Không có thông tin"}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-medium">Giờ giao:</span>{" "}
            {order.deliveryTime || "Không có thông tin"}
          </p>
          <p className="text-gray-600 mt-1 flex items-center">
            <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
            <span className="font-medium">Thanh toán:</span> {order.paymentMethod}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Sản phẩm đã đặt</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sản phẩm
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Giá
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Số lượng
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderItems.map((item) => (
                <tr key={item.orderItemId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.product && item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl || item.product.thumbnail}
                          alt={item.productName}
                          className="w-10 h-10 object-cover rounded-md mr-3"
                        />
                      )}
                      <div>
                        {console.log(item)}
                        <p className="font-medium text-gray-800">{item.product.productName}</p>
                        <p className="text-xs text-gray-500">ID: {item.productId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {item.orderQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {formatPrice(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="px-6 py-4 text-right font-medium">
                  Tổng tiền:
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-red-600">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {order.store && (
        <div className="mb-6 border p-4 rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Thông tin cửa hàng</h3>
          <p className="font-medium">{order.store.storeName}</p>
          <p className="text-gray-600">{order.store.storeAddress}</p>
          <p className="text-gray-600">SĐT: {order.store.storePhoneNumber}</p>
        </div>
      )}

      <div className="border-t pt-6 mt-6 flex justify-between items-center">
        <button
          onClick={() => onBack(isCurrentOrder)}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Trở lại
        </button>

        {order.status === "Chờ xử lý" && (
          <button
            onClick={handleCancelOrder}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
            Hủy đơn hàng
          </button>
        )}
      </div>

      {order.status === "Đã giao hàng" && (
        <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-700 flex items-center mb-1">
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Đơn hàng đã hoàn thành
          </h3>
          <p className="text-green-600">Cảm ơn bạn đã mua hàng tại cửa hàng chúng tôi!</p>
        </div>
      )}

      {order.status === "Đã hủy" && (
        <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg">
          <h3 className="font-semibold text-red-700 flex items-center mb-1">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
            Đơn hàng đã hủy
          </h3>
          <p className="text-red-600">
            Đơn hàng này đã bị hủy. {order.cancelReason ? `Lý do: ${order.cancelReason}` : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPanel;
