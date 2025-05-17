/**
 * Định dạng số thành tiền tệ VND
 * @param {number} amount - Số tiền cần định dạng
 * @param {boolean} showSymbol - Có hiển thị ký hiệu tiền tệ hay không
 * @returns {string} Chuỗi đã được định dạng
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount == null || isNaN(amount)) {
    return "0 ₫";
  }

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
};

/**
 * Định dạng ngày tháng theo chuẩn Việt Nam
 * @param {string|Date} date - Chuỗi ngày hoặc đối tượng Date
 * @param {boolean} includeTime - Có hiển thị giờ phút hay không
 * @returns {string} Chuỗi ngày đã định dạng
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "";
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let result = `${day}/${month}/${year}`;

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    result += ` ${hours}:${minutes}`;
  }

  return result;
};

/**
 * Rút gọn văn bản dài thành văn bản ngắn hơn
 * @param {string} text - Văn bản cần rút gọn
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} Văn bản đã được rút gọn
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
};

/**
 * Định dạng số lượng thành chuỗi có định dạng
 * @param {number} number - Số cần định dạng
 * @param {number} minimumFractionDigits - Số chữ số thập phân tối thiểu
 * @param {number} maximumFractionDigits - Số chữ số thập phân tối đa
 * @returns {string} Chuỗi số đã được định dạng
 */
export const formatNumber = (number, minimumFractionDigits = 0, maximumFractionDigits = 2) => {
  if (number == null || isNaN(number)) {
    return "0";
  }

  return Number(number).toLocaleString("vi-VN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
};

/**
 * Định dạng địa chỉ thành chuỗi đầy đủ
 * @param {Object} address - Đối tượng chứa thông tin địa chỉ
 * @returns {string} Chuỗi địa chỉ đầy đủ
 */
export const formatAddress = (address) => {
  if (!address) return "";

  const parts = [address.detail, address.ward, address.district, address.province].filter(
    (part) => part
  );

  return parts.join(", ");
};
