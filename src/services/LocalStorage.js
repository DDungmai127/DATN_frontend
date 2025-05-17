/**
 * Service quản lý giỏ hàng sử dụng localStorage
 * Với thời hạn 7 ngày
 */

const CART_KEY = "cart";
const CART_EXPIRY_KEY = "cart_expiry";
const EXPIRY_DAYS = 7;

/**
 * Lấy giỏ hàng từ localStorage
 * @returns {Array} Mảng các sản phẩm trong giỏ hàng
 */
export const getCart = () => {
  // Kiểm tra xem giỏ hàng có hết hạn không
  const expiryDate = localStorage.getItem(CART_EXPIRY_KEY);
  if (expiryDate && new Date() > new Date(expiryDate)) {
    // Giỏ hàng đã hết hạn, xóa giỏ hàng và trả về mảng rỗng
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_EXPIRY_KEY);
    return [];
  }

  // Lấy giỏ hàng từ localStorage
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
};

/**
 * Lưu giỏ hàng vào localStorage và cập nhật thời hạn
 * @param {Array} cartItems Mảng các sản phẩm trong giỏ hàng
 */
export const saveCart = (cartItems) => {
  // Lưu giỏ hàng
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));

  // Cập nhật thời hạn
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
  localStorage.setItem(CART_EXPIRY_KEY, expiryDate.toISOString());

  // Cập nhật UI badge giỏ hàng
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { totalItems } }));
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {Object} product Sản phẩm cần thêm
 * @param {Number} quantity Số lượng
 * @returns {Boolean} Trả về true nếu thành công
 */
export const addToCart = (product, quantity = 1) => {
  try {
    const cartItems = getCart();

    // Kiểm tra sản phẩm đã tồn tại chưa
    const existingIndex = cartItems.findIndex((item) => item.productId === product.productId);

    if (existingIndex !== -1) {
      // Đã có sản phẩm, cập nhật số lượng
      cartItems[existingIndex].quantity += quantity;
    } else {
      // Thêm sản phẩm mới
      const discountValue = product.discount?.DiscountValue || 0;
      const finalPrice =
        discountValue > 0 ? product.price * (1 - discountValue / 100) : product.price;

      cartItems.push({
        productId: product.productId,
        productName: product.productName,
        price: product.price,
        finalPrice,
        imageUrl: product.imageUrl,
        quantity,
        discount: discountValue,
      });
    }

    // Lưu giỏ hàng và cập nhật thời hạn
    saveCart(cartItems);

    return true;
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error);
    return false;
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * @param {String} productId ID sản phẩm
 * @param {Number} quantity Số lượng mới
 * @returns {Boolean} Trả về true nếu thành công
 */
export const updateQuantity = (productId, quantity) => {
  try {
    let cartItems = getCart();

    if (quantity <= 0) {
      // Nếu số lượng <= 0, xóa sản phẩm
      cartItems = cartItems.filter((item) => item.productId !== productId);
    } else {
      // Tìm và cập nhật số lượng
      const existingIndex = cartItems.findIndex((item) => item.productId === productId);

      if (existingIndex !== -1) {
        cartItems[existingIndex].quantity = quantity;
      } else {
        return false; // Sản phẩm không tồn tại trong giỏ hàng
      }
    }

    // Lưu giỏ hàng và cập nhật thời hạn
    saveCart(cartItems);

    return true;
  } catch (error) {
    console.error("Lỗi khi cập nhật số lượng:", error);
    return false;
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * @param {String} productId ID sản phẩm cần xóa
 * @returns {Boolean} Trả về true nếu thành công
 */
export const removeItem = (productId) => {
  try {
    const cartItems = getCart().filter((item) => item.productId !== productId);

    // Lưu giỏ hàng và cập nhật thời hạn
    saveCart(cartItems);

    return true;
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    return false;
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 * @returns {Boolean} Trả về true nếu thành công
 */
export const clearCart = () => {
  try {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_EXPIRY_KEY);

    // Cập nhật UI badge giỏ hàng
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { totalItems: 0 } }));

    return true;
  } catch (error) {
    console.error("Lỗi khi xóa giỏ hàng:", error);
    return false;
  }
};

/**
 * Lấy số lượng sản phẩm trong giỏ hàng
 * @returns {Number} Tổng số sản phẩm trong giỏ hàng
 */
export const getCartItemCount = () => {
  const cartItems = getCart();
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Tính tổng tiền giỏ hàng
 * @returns {Object} Thông tin tổng tiền
 */
export const calculateCartSummary = () => {
  const cartItems = getCart();

  // Tính tổng tạm tính (giá gốc)
  const originalTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tính tổng giá cuối cùng (sau khi giảm giá)
  const finalSubtotal = cartItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

  // Tính số tiền tiết kiệm được
  const saved = originalTotal - finalSubtotal;

  // Phí vận chuyển - 20,000 nếu đơn hàng dưới 300,000, miễn phí nếu trên 300,000
  const shippingFee = finalSubtotal < 300000 ? 20000 : 0;

  // Khuyến mại (nếu có)
  const promotion = 0;

  // Thành tiền cuối cùng
  const total = finalSubtotal + shippingFee - promotion;

  return {
    temporaryTotal: originalTotal,
    finalSubtotal,
    saved,
    shippingFee,
    promotion,
    total,
  };
};
