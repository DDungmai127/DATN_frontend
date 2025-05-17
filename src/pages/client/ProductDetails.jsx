import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faHome, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ProductCard from "../../components/client/ProductCard";
import Toast from "../../components/admin/Toast"; // Import component Toast
import { addToCart } from "../../services/LocalStorage"; // Import service LocalStorage

const ProductDetails = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State để điều khiển việc hiển thị Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const API_URL = "http://localhost:3000/api";

  // Fetch dữ liệu sản phẩm từ API
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${slug}`);
        const productData = response.data.data;
        setProduct(productData);

        // Nếu có categoryId, lấy các sản phẩm liên quan
        if (productData.categoryId) {
          const relatedResponse = await axios.get(
            `${API_URL}/products/category/${productData.categoryId}?limit=4`
          );
          // Lọc bỏ sản phẩm hiện tại
          const filtered = relatedResponse.data.data.filter(
            (item) => item.productId !== productData.productId
          );
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [slug]);

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    if (product && value <= product.quantity) {
      setQuantity(value);
    } else if (product) {
      setQuantity(product.quantity);
    }
  };

  // Xử lý thêm vào giỏ hàng bằng LocalStorage service
  const handleAddToCart = () => {
    if (!product) return;

    // Sử dụng service addToCart từ LocalStorage
    const success = addToCart(product, quantity);

    if (success) {
      setToastMessage(`Đã thêm ${quantity} sản phẩm "${product.productName}" vào giỏ hàng!`);
      setShowToast(true);
    } else {
      setToastMessage("Có lỗi xảy ra khi thêm vào giỏ hàng");
      setShowToast(true);
    }
  };

  // Xử lý đóng Toast
  const handleCloseToast = () => {
    setShowToast(false);
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-3">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/" className="text-blue-500 hover:underline">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Nếu không tìm thấy sản phẩm
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <p>Không tìm thấy thông tin sản phẩm</p>
          <Link to="/" className="text-blue-500 hover:underline">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Tính giá cuối cùng sau khi áp dụng giảm giá
  const discountValue = product.discount?.DiscountValue || 0;
  const finalPrice = discountValue > 0 ? product.price * (1 - discountValue / 100) : product.price;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Toast component */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={handleCloseToast}
          duration={1500} // 1.5 seconds
        />
      )}

      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm mb-4">
          <Link to="/" className="text-gray-500 hover:text-red-600 flex items-center">
            <FontAwesomeIcon icon={faHome} className="mr-1" />
            Trang chủ
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-gray-400 text-xs" />
          {product.category && (
            <>
              <Link
                to={`/category/${product.category.categoryId}`}
                className="text-gray-500 hover:text-red-600"
              >
                {product.category.categoryName}
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-gray-400 text-xs" />
            </>
          )}
          <span className="text-gray-800">{product.productName}</span>
        </nav>

        {/* Nội dung chính */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Hình ảnh sản phẩm */}
            <div className="flex-1">
              <div className="relative">
                <img
                  src={`http://localhost:3000${product.imageUrl}`}
                  alt={product.productName}
                  className="w-full h-auto rounded-lg object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400?text=Không+có+ảnh";
                  }}
                />
                {discountValue > 0 && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discountValue}%
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin sản phẩm */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{product.productName}</h1>

              {/* Giá sản phẩm */}
              {discountValue > 0 ? (
                <div className="mb-4">
                  <p className="text-xl text-red-600 font-semibold">{formatPrice(finalPrice)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500 line-through">{formatPrice(product.price)}</p>
                    <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded">
                      Tiết kiệm {formatPrice(product.price - finalPrice)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xl text-red-600 font-semibold mb-4">
                  {formatPrice(product.price)}
                </p>
              )}

              {/* Thông tin khác */}
              <ul className="text-gray-700 space-y-2 mb-6">
                {product.providerName && (
                  <li>
                    <strong>Nhà cung cấp:</strong> {product.providerName}
                  </li>
                )}
                {product.unitOfMeasurement && (
                  <li>
                    <strong>Đơn vị:</strong> {product.unitOfMeasurement}
                  </li>
                )}
                {product.category && (
                  <li>
                    <strong>Danh mục:</strong> {product.category.categoryName}
                  </li>
                )}
                <li>
                  <strong>Tình trạng:</strong> {product.quantity > 0 ? "Còn hàng" : "Hết hàng"}
                  {product.quantity > 0 && (
                    <span className="ml-1 text-sm text-gray-500">
                      ({product.quantity} sản phẩm)
                    </span>
                  )}
                </li>
              </ul>

              {/* Số lượng và thêm vào giỏ */}
              {product.quantity > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <label htmlFor="quantity" className="font-medium text-gray-700">
                      Chọn số lượng:
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-20 px-2 py-1 border rounded-lg focus:ring-red-500 focus:border-red-500"
                      min="1"
                      max={product.quantity}
                    />
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition flex items-center"
                  >
                    <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                    Thêm vào giỏ hàng
                  </button>
                </>
              )}

              {/* Thông báo hết hàng */}
              {product.quantity <= 0 && (
                <div className="bg-gray-100 text-gray-700 px-4 py-3 rounded">
                  Sản phẩm hiện đang hết hàng
                </div>
              )}
            </div>
          </div>

          {/* Mô tả sản phẩm */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mô tả sản phẩm</h2>
            <div className="prose text-gray-600 max-w-none">
              {product.description ? (
                <p className="whitespace-pre-line">{product.description}</p>
              ) : (
                <p>Chưa có thông tin mô tả cho sản phẩm này.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sản phẩm liên quan */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Sản phẩm liên quan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.productId} product={relatedProduct} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
