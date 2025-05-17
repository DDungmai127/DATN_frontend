import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faMinus,
  faPlus,
  faShoppingCart,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    temporaryTotal: 0,
    saved: 0,
    shippingFee: 0,
    promotion: 0,
    total: 0,
  });

  // Lấy dữ liệu giỏ hàng từ localStorage khi component được mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(savedCart);
  }, []);

  // Tính toán thông tin giỏ hàng khi cartItems thay đổi
  useEffect(() => {
    calculateCartSummary();
  }, [cartItems]);

  // Hàm tính toán tổng tiền
  const calculateCartSummary = () => {
    // Tính tổng tạm tính (giá gốc)
    const originalTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Tính tổng giá cuối cùng (sau khi giảm giá)
    const finalTotal = cartItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

    // Tính số tiền tiết kiệm được
    const saved = originalTotal - finalTotal;

    // Phí vận chuyển - 20,000 nếu đơn hàng dưới 300,000, miễn phí nếu trên 300,000
    const shippingFee = finalTotal < 300000 ? 20000 : 0;

    // Khuyến mại (nếu có)
    const promotion = 0;

    // Thành tiền cuối cùng
    const total = finalTotal + shippingFee - promotion;

    setCartSummary({
      temporaryTotal: originalTotal,
      finalSubtotal: finalTotal,
      saved: saved,
      shippingFee: shippingFee,
      promotion: promotion,
      total: total,
    });
  };

  // Hàm xử lý tăng số lượng
  const handleIncrease = (productId) => {
    const updatedCart = cartItems.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });

    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Hàm xử lý giảm số lượng
  const handleDecrease = (productId) => {
    const updatedCart = cartItems.map((item) => {
      if (item.productId === productId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });

    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Hàm xóa sản phẩm khỏi giỏ hàng
  const handleRemoveItem = (productId) => {
    const updatedCart = cartItems.filter((item) => item.productId !== productId);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Format giá theo VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Giỏ hàng trống
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-gray-400 text-5xl mb-6">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy tiếp tục mua sắm!
          </p>
          <Link
            to="/"
            className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-[calc(100vh-200px)] flex flex-col lg:flex-row gap-6">
      {/* Danh sách sản phẩm */}
      <div className="lg:w-2/3 bg-white p-4 shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4">Giỏ hàng của bạn ({cartItems.length} sản phẩm)</h2>

        {cartItems.map((item) => (
          <div
            key={item.productId}
            className="flex flex-col md:flex-row items-start md:items-center border-b border-gray-200 pb-4 mb-4"
          >
            {/* Hình ảnh sản phẩm */}
            <div className="w-20 h-20 mr-4 flex-shrink-0 mb-3 md:mb-0">
              <Link to={`/product/${item.productId}`}>
                <img
                  src={`http://localhost:3000${item.imageUrl}`}
                  alt={item.productName}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/80";
                  }}
                />
              </Link>
            </div>

            {/* Thông tin sản phẩm */}
            <div className="flex-grow">
              <Link to={`/product/${item.productId}`}>
                <h3 className="text-lg font-semibold hover:text-red-600 transition">
                  {item.productName}
                </h3>
              </Link>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
                {/* Giá và số lượng */}
                <div className="flex flex-col mb-3 md:mb-0">
                  {item.discount > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-red-600 font-medium">
                        {formatPrice(item.finalPrice)}
                      </span>
                      <span className="text-gray-500 line-through text-sm">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-700">{formatPrice(item.price)}</span>
                  )}
                </div>

                {/* Số lượng */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => handleDecrease(item.productId)}
                      className="px-3 py-1 hover:bg-gray-100 transition"
                      disabled={item.quantity <= 1}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="px-3 py-1 border-l border-r min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrease(item.productId)}
                      className="px-3 py-1 hover:bg-gray-100 transition"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>

                  {/* Xóa sản phẩm */}
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-gray-500 hover:text-red-600 transition"
                    title="Xóa sản phẩm"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              {/* Thành tiền */}
              <div className="mt-2 text-right">
                <span className="font-semibold">
                  Thành tiền:{" "}
                  <span className="text-red-600">
                    {formatPrice(item.finalPrice * item.quantity)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="text-gray-500 italic mt-4">
          *Miễn phí giao hàng cho đơn hàng từ {formatPrice(300000)}
        </div>

        <div className="mt-6">
          <Link to="/" className="text-red-600 hover:text-red-700 flex items-center w-fit">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      {/* Thông tin giỏ hàng */}
      <div className="lg:w-1/3 bg-white p-4 shadow-lg rounded-lg h-fit">
        <h2 className="text-xl font-bold mb-4">Thông tin đơn hàng</h2>

        <div className="flex justify-between mb-2">
          <span>Tạm tính ({cartItems.length} sản phẩm):</span>
          <span className="font-semibold">{formatPrice(cartSummary.temporaryTotal)}</span>
        </div>

        {cartSummary.saved > 0 && (
          <div className="flex justify-between mb-2">
            <span>Tiết kiệm được:</span>
            <span className="font-semibold text-green-600">-{formatPrice(cartSummary.saved)}</span>
          </div>
        )}

        <div className="flex justify-between mb-2">
          <span>Phí vận chuyển:</span>
          <span className="font-semibold">
            {cartSummary.shippingFee > 0 ? formatPrice(cartSummary.shippingFee) : "Miễn phí"}
          </span>
        </div>

        {cartSummary.promotion > 0 && (
          <div className="flex justify-between mb-2">
            <span>Khuyến mại:</span>
            <span className="font-semibold text-green-600">
              -{formatPrice(cartSummary.promotion)}
            </span>
          </div>
        )}

        <div className="flex justify-between mb-4 border-t border-gray-300 pt-4 mt-4">
          <span className="text-lg font-bold">Thành tiền:</span>
          <span className="text-xl font-bold text-red-600">{formatPrice(cartSummary.total)}</span>
        </div>

        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
        >
          <span className="font-medium">Tiến hành thanh toán</span>
        </button>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            * Bằng việc tiến hành thanh toán, bạn đồng ý với các{" "}
            <Link to="/terms" className="text-red-600 hover:underline">
              điều khoản và điều kiện
            </Link>{" "}
            của chúng tôi
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
