import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faArrowLeft,
  faExclamationCircle,
  faCheck,
  faTimes,
  faTruck,
  faBox,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const OrderDetailPanel = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCurrentOrder, setIsCurrentOrder] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Bạn cần đăng nhập lại");
      }

      const response = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrder(response.data.data);

        // Kiểm tra xem đây có phải đơn hàng đang xử lý hay không
        const status = response.data.data.status;
        setIsCurrentOrder(
          status === "Chờ xác nhận" || status === "Đang xử lý" || status === "Đang giao"
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

  const handleCancelOrder = async () => {
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
        setOrder({ ...order, status: "Đã hủy" });
        setIsCurrentOrder(false);
        alert("Hủy đơn hàng thành công");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => onBack(isCurrentOrder)}
            className="mr-3 text-gray-600 hover:text-gray-800 flex items-center"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            Quay lại
          </button>
          <h2 className="text-xl font-semibold">Chi tiết đơn hàng</h2>
        </div>

        {order && order.status === "Chờ xác nhận" && (
          <button
            onClick={handleCancelOrder}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
            ) : (
              "Hủy đơn hàng"
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && !error ? (
        <div className="flex justify-center items-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-red-600" />
          <span className="ml-2">Đang tải thông tin đơn hàng...</span>
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div>
                <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                <span className="ml-2 font-semibold">{order.orderCode}</span>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${getStatusClass(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-2">{order.status}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Ngày đặt:</p>
                <p className="font-medium">{formatDate(order.orderDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Phương thức thanh toán:</p>
                <p className="font-medium">{order.paymentMethod || "Thanh toán khi nhận hàng"}</p>
              </div>

              {order.completedDate && (
                <div>
                  <p className="text-gray-600 text-sm">Ngày hoàn thành:</p>
                  <p className="font-medium">{formatDate(order.completedDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin giao hàng */}
          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Thông tin giao hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
              <div>
                <p className="text-gray-600 text-sm">Người nhận:</p>
                <p className="font-medium">{order.receiver}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Số điện thoại:</p>
                <p className="font-medium">{order.phoneNumber}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-600 text-sm">Địa chỉ:</p>
                <p className="font-medium">{order.address}</p>
              </div>
              {order.note && (
                <div className="md:col-span-2">
                  <p className="text-gray-600 text-sm">Ghi chú:</p>
                  <p className="font-medium">{order.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chi tiết sản phẩm */}
          <div className="rounded-lg border overflow-hidden">
            <h3 className="font-semibold text-lg p-4 border-b">Chi tiết sản phẩm</h3>

            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4">Sản phẩm</th>
                    <th className="text-center p-4">Đơn giá</th>
                    <th className="text-center p-4">Số lượng</th>
                    <th className="text-right p-4">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.orderDetails &&
                    order.orderDetails.map((item, index) => (
                      <tr key={index}>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 mr-4">
                              {item.product?.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.productName}
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">No image</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/product/${item.productId}`}
                                className="font-medium text-gray-800 hover:text-red-600"
                              >
                                {item.product.productName}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">{formatPrice(item.price)}</td>
                        <td className="p-4 text-center">{item.quantity}</td>
                        <td className="p-4 text-right font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Tổng tiền */}
            <div className="bg-gray-50 p-4">
              <div className="flex flex-col items-end">
                <div className="w-full sm:w-72 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">
                      {formatPrice(order.subtotal || order.totalPrice)}
                    </span>
                  </div>

                  {order.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="font-medium">{formatPrice(order.shippingFee)}</span>
                    </div>
                  )}

                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="text-red-600">-{formatPrice(order.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold">Tổng cộng:</span>
                    <span className="font-bold text-xl text-red-600">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <p className="text-gray-500">Không tìm thấy thông tin đơn hàng</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPanel;
