import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faArrowLeft,
  faCalendarAlt,
  faClock,
  faCreditCard,
  faMoneyBill,
  faUniversity,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setUserLoading(true);

      const response = await axios.get("http://localhost:3000/api/users/profile/me", {
        withCredentials: true,
      });

      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        setUser(userData);

        setShippingInfo((prev) => ({
          ...prev,
          name: userData.fullName || userData.username || "",
          phone: userData.phoneNumber || "",
          address: userData.address || "",
          email: userData.email || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    temporaryTotal: 0,
    saved: 0,
    shippingFee: 0,
    total: 0,
  });

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    note: "",
  });

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    if (savedCart.length === 0) {
      alert("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.");
      navigate("/cart");
      return;
    }
    setCartItems(savedCart);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split("T")[0]);
    setDeliveryTime("10:00");
  }, [navigate]);

  useEffect(() => {
    calculateCartSummary();
  }, [cartItems, shippingMethod]);

  useEffect(() => {
    const fetchSelectedStore = async () => {
      try {
        const selectedStoreId = localStorage.getItem("selectedStoreId");
        if (selectedStoreId) {
          const response = await axios.get(`${API_URL}/stores/${selectedStoreId}`);
          if (response.data && response.data.success) {
            setSelectedStore(response.data.data);
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin cửa hàng:", error);
      }
    };

    fetchSelectedStore();
  }, [API_URL]);

  const calculateCartSummary = () => {
    const originalTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalSubtotal = cartItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    const saved = originalTotal - finalSubtotal;
    const shippingFee = shippingMethod === "express" ? 50000 : 30000;
    const actualShippingFee = finalSubtotal >= 300000 ? 0 : shippingFee;
    const total = finalSubtotal + actualShippingFee;

    setCartSummary({
      temporaryTotal: originalTotal,
      finalSubtotal: finalSubtotal,
      saved: saved,
      shippingFee: actualShippingFee,
      total: total,
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo({ ...shippingInfo, [name]: value });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!shippingInfo.name.trim()) {
      errors.name = "Vui lòng nhập họ tên";
    }

    if (!shippingInfo.phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10}$/.test(shippingInfo.phone.trim())) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!shippingInfo.address.trim()) {
      errors.address = "Vui lòng nhập địa chỉ";
    }

    if (shippingInfo.email && !/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!deliveryDate) {
      errors.deliveryDate = "Vui lòng chọn ngày giao hàng";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(deliveryDate);
      if (selectedDate < today) {
        errors.deliveryDate = "Ngày giao hàng không hợp lệ";
      }
    }

    if (!deliveryTime) {
      errors.deliveryTime = "Vui lòng chọn giờ giao hàng";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrder = async () => {
    setApiError(null);

    if (!validateForm()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const selectedStoreId = localStorage.getItem("selectedStoreId");
    if (!selectedStoreId) {
      setApiError("Vui lòng chọn cửa hàng để đặt hàng");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Kiểm tra xem người dùng đã đăng nhập hay chưa
      const clientInfoStr = localStorage.getItem("clientInfo");
      let currentUser = user;

      // Nếu không có thông tin user từ state, thử lấy từ localStorage
      if (!currentUser && clientInfoStr) {
        try {
          const clientInfo = JSON.parse(clientInfoStr);
          if (clientInfo && clientInfo.userId) {
            currentUser = clientInfo;
          }
        } catch (err) {
          console.error("Error parsing client info from localStorage:", err);
        }
      }

      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        customerName: shippingInfo.name,
        phoneNumber: shippingInfo.phone,
        address: shippingInfo.address,
        deliveryDay: deliveryDate,
        deliveryTime: deliveryTime,
        paymentMethod: paymentMethod,
        storeId: selectedStoreId,
        orderItems: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.finalPrice,
          productName: item.name || "",
          amount: item.finalPrice * item.quantity,
        })),
      };

      // Thêm note nếu có
      if (shippingInfo.note && shippingInfo.note.trim()) {
        orderData.note = shippingInfo.note.trim();
      }

      // Thêm userId nếu người dùng đã đăng nhập
      if (currentUser?.userId) {
        orderData.userId = currentUser.userId;
        console.log("Adding userId to order:", currentUser.userId);
      }

      // Kiểm tra thêm nếu có email
      if (shippingInfo.email && shippingInfo.email.trim()) {
        orderData.email = shippingInfo.email.trim();
      }

      console.log("Submitting order data:", orderData);
      const response = await axios.post(`${API_URL}/orders`, orderData, { withCredentials: true });

      if (response.data.success) {
        setOrderSuccess(true);
        setOrderId(response.data.data.orderId || response.data.data.displayId);
        localStorage.removeItem("cart"); // Xóa giỏ hàng sau khi đặt hàng thành công
      } else {
        throw new Error(response.data.message || "Có lỗi xảy ra khi đặt hàng");
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!"
      );
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Đặt hàng thành công!</h2>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là{" "}
              <span className="font-bold text-red-600">{orderId}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Chúng tôi sẽ gửi xác nhận đơn hàng qua tin nhắn đến số điện thoại của bạn.
              {user ? " Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình." : ""}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/"
                className="bg-white border border-red-600 text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition"
              >
                Tiếp tục mua sắm
              </Link>
              {user && (
                <Link
                  to="/account/orders"
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Xem đơn hàng
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link to="/cart" className="text-red-600 hover:text-red-700 flex items-center">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Quay lại giỏ hàng
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 ml-4">Thanh toán</h1>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>

              {userLoading ? (
                <div className="flex items-center justify-center py-3 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                  <span className="text-gray-600">Đang tải thông tin...</span>
                </div>
              ) : user ? (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Thông tin tài khoản của bạn</h3>
                    <button
                      onClick={() => {
                        setShippingInfo({
                          name: user.fullName || user.username || "",
                          phone: user.phoneNumber || "",
                          address: user.address || "",
                          email: user.email || "",
                          note: shippingInfo.note,
                        });
                      }}
                      type="button"
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Áp dụng
                    </button>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>
                      <strong>Họ tên:</strong> {user.fullName || user.username || "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong>Số điện thoại:</strong> {user.phoneNumber || "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong>Địa chỉ:</strong> {user.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên*</label>
                  <input
                    type="text"
                    name="name"
                    value={shippingInfo.name}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className={`border rounded-lg px-4 py-2 w-full ${
                      formErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại*
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    placeholder="0912345678"
                    className={`border rounded-lg px-4 py-2 w-full ${
                      formErrors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ nhận hàng*
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    placeholder="123 Đường ABC, Phường XYZ, Quận/Huyện, Tỉnh/Thành phố"
                    className={`border rounded-lg px-4 py-2 w-full ${
                      formErrors.address ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (không bắt buộc)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    placeholder="example@example.com"
                    className={`border rounded-lg px-4 py-2 w-full ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                    Ngày giao hàng*
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value);
                      if (formErrors.deliveryDate) {
                        setFormErrors((prev) => ({ ...prev, deliveryDate: "" }));
                      }
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`border rounded-lg px-4 py-2 w-full ${
                      formErrors.deliveryDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.deliveryDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.deliveryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faClock} className="mr-2" />
                    Giờ giao hàng*
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => {
                      setDeliveryTime(e.target.value);
                      if (formErrors.deliveryTime) {
                        setFormErrors((prev) => ({ ...prev, deliveryTime: "" }));
                      }
                    }}
                    className={`border rounded-lg px-4 py-2 w-full ${
                      formErrors.deliveryTime ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Chọn giờ giao hàng</option>
                    <option value="08:00">8:00 - 10:00</option>
                    <option value="10:00">10:00 - 12:00</option>
                    <option value="14:00">14:00 - 16:00</option>
                    <option value="16:00">16:00 - 18:00</option>
                    <option value="18:00">18:00 - 20:00</option>
                  </select>
                  {formErrors.deliveryTime && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.deliveryTime}</p>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-4">Phương thức vận chuyển</h2>
              <div className="space-y-3 mb-6">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={shippingMethod === "standard"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-2 h-4 w-4 text-red-600"
                  />
                  <div className="flex-grow">
                    <p className="font-medium">Giao hàng tiêu chuẩn</p>
                    <p className="text-sm text-gray-500">Nhận hàng trong 1-2 ngày</p>
                  </div>
                  <span className="font-medium">
                    {cartSummary.finalSubtotal >= 300000 ? "Miễn phí" : formatPrice(15000)}
                  </span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={shippingMethod === "express"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-2 h-4 w-4 text-red-600"
                  />
                  <div className="flex-grow">
                    <p className="font-medium">Giao hàng nhanh</p>
                    <p className="text-sm text-gray-500">Nhận hàng trong ngày</p>
                  </div>
                  <span className="font-medium">
                    {cartSummary.finalSubtotal >= 300000 ? "Miễn phí" : formatPrice(30000)}
                  </span>
                </label>
                {cartSummary.finalSubtotal >= 300000 && (
                  <p className="text-green-600 text-sm">
                    *Bạn được miễn phí giao hàng cho đơn hàng trên 300,000₫
                  </p>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3 mb-6">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Tiền mặt"
                    checked={paymentMethod === "Tiền mặt"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2 h-4 w-4 text-red-600"
                  />
                  <div className="flex items-center flex-grow">
                    <FontAwesomeIcon icon={faMoneyBill} className="text-green-600 mr-3 text-lg" />
                    <div>
                      <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-500">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Thẻ tín dụng"
                    checked={paymentMethod === "Thẻ tín dụng"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2 h-4 w-4 text-red-600"
                  />
                  <div className="flex items-center flex-grow">
                    <FontAwesomeIcon icon={faCreditCard} className="text-blue-600 mr-3 text-lg" />
                    <div>
                      <p className="font-medium">Thẻ tín dụng/ghi nợ</p>
                      <p className="text-sm text-gray-500">
                        Thanh toán an toàn với thẻ Visa, Mastercard, JCB
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Chuyển khoản"
                    checked={paymentMethod === "Chuyển khoản"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2 h-4 w-4 text-red-600"
                  />
                  <div className="flex items-center flex-grow">
                    <FontAwesomeIcon icon={faUniversity} className="text-purple-600 mr-3 text-lg" />
                    <div>
                      <p className="font-medium">Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-gray-500">
                        Thanh toán bằng chuyển khoản trước khi giao hàng
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sản phẩm trong giỏ hàng</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center">
                    <div className="flex items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.price !== item.finalPrice && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatPrice(item.price)}
                        </p>
                      )}
                      <p className="font-medium text-gray-700">
                        {formatPrice(item.finalPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tổng thanh toán</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatPrice(cartSummary.temporaryTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiết kiệm:</span>
                  <span className="font-medium text-green-600">
                    -{formatPrice(cartSummary.saved)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">{formatPrice(cartSummary.shippingFee)}</span>
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2 mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cửa hàng:</span>
                    {selectedStore ? (
                      <span className="font-medium">{selectedStore.storeName}</span>
                    ) : (
                      <Link to="/" className="text-red-600 hover:text-red-700">
                        Vui lòng chọn cửa hàng
                      </Link>
                    )}
                  </div>
                  {selectedStore && (
                    <p className="text-sm text-gray-500 mt-1">{selectedStore.storeAddress}</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium">Tổng cộng:</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatPrice(cartSummary.total)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOrder}
                disabled={isSubmitting}
                className={`bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition w-full mt-4 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
              </button>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của
                chúng tôi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
