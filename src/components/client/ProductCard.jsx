import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Toast from "../admin/Toast";
import React, { useState } from "react";
const ProductCard = ({ product }) => {
  // Kiểm tra nếu product không tồn tại
  if (!product || typeof product !== "object") {
    console.error("ProductCard received invalid product data:", product);
    return null;
  }
  // state cho toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Đảm bảo truy cập an toàn với optional chaining và các giá trị mặc định
  const productId = product.productId || "";
  const productName = product.productName || "Sản phẩm không tên";
  const price = product.price || 0;
  const discount = product.discount?.DiscountValue || 0;

  // Xác định URL hình ảnh
  let imageUrl = product.imageUrl;

  // Tính giá sau khi khuyến mãi
  const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;

  // Format giá theo VND
  const formatPrice = (value) => {
    return (
      value
        .toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace("₫", "")
        .trim() + "₫"
    );
  };

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    // Ngăn chặn sự kiện click lan ra Link bên ngoài
    e.stopPropagation();
    e.preventDefault();

    // Lấy giỏ hàng từ localStorage hoặc tạo mới nếu chưa có
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cart.findIndex((item) => item.productId === productId);

    if (existingItemIndex !== -1) {
      // Nếu đã có, tăng số lượng lên 1
      cart[existingItemIndex].quantity += 1;
      setToastMessage(`Đã tăng số lượng "${productName}" lên ${cart[existingItemIndex].quantity}`);
    } else {
      // Nếu chưa có, thêm mới vào giỏ hàng
      cart.push({
        productId: productId,
        productName: productName,
        price: price,
        finalPrice: finalPrice,
        imageUrl: imageUrl,
        quantity: 1,
        discount: discount,
      });
      setToastMessage(`Đã thêm "${productName}" vào giỏ hàng!`);
    }

    // Lưu giỏ hàng mới vào localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Cập nhật số lượng sản phẩm trong giỏ hàng (badge ở header nếu có)
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { totalItems } }));
    setShowToast(true);
  };
  const handleCloseToast = () => {
    setShowToast(false);
  };
  return (
    <>
      {showToast && <Toast message={toastMessage} onClose={handleCloseToast} duration={2000} />}
      <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 hover:-translate-y-1 bg-white">
        <Link to={`/product/${product.slug || productId}`}>
          <div className="relative">
            <img
              src={`http://localhost:3000${imageUrl}`}
              alt={productName}
              className="w-full h-48 object-cover mb-4 rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/200x200?text=Không+có+ảnh";
              }}
            />
            {discount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs rounded-bl-lg rounded-tr-md">
                -{discount}%
              </span>
            )}
          </div>

          <h2 className="text-base font-semibold mb-2 text-gray-800 line-clamp-2 h-12">
            {productName}
          </h2>

          {/* Hiển thị giá gốc và giá sau khuyến mãi */}
          <div className="mb-3 h-16 flex flex-col justify-center">
            {discount > 0 ? (
              <>
                <p className="text-red-600 justify-start text-lg font-bold">
                  {formatPrice(finalPrice)}
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <p className="text-gray-500 line-through">{formatPrice(price)}</p>
                  <p className="text-green-600 font-medium">-{discount}%</p>
                </div>
              </>
            ) : (
              <p className="text-red-600 text-lg font-bold">{formatPrice(price)}</p>
            )}
          </div>
        </Link>

        <button
          className="bg-red-600 text-white text-base px-4 py-2 rounded-lg w-full hover:bg-red-700 transition-colors flex items-center justify-center"
          onClick={handleAddToCart}
        >
          <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
          Thêm vào giỏ
        </button>
      </div>
    </>
  );
};

export default ProductCard;
