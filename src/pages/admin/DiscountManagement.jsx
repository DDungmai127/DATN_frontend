import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faSearch,
  faTimesCircle,
  faSyncAlt,
  faSpinner,
  faPlus,
  faCheck,
  faTimes,
  faSave,
  faTag,
  faTags,
} from "@fortawesome/free-solid-svg-icons";

const DiscountManagement = () => {
  // States
  const [discounts, setDiscounts] = useState([]);
  const [displayedDiscounts, setDisplayedDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Thêm state để quản lý tìm kiếm sản phẩm
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Đổi tên biến để rõ ràng hơn
  const [showProductsWithThisDiscountOnly, setShowProductsWithThisDiscountOnly] = useState(false);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    DiscountName: "",
    DiscountValue: 0,
    StartDate: "",
    EndDate: "",
    IsActive: true,
  });

  // Fetch discounts data
  useEffect(() => {
    fetchDiscounts();
  }, [page]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:3000/api/discounts?page=${page}&limit=${pageSize}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setDiscounts(response.data.data || []);
        setDisplayedDiscounts(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        throw new Error(response.data?.message || "Failed to fetch discounts");
      }
    } catch (err) {
      console.error("Error fetching discounts:", err);
      setError(`Không thể tải danh sách mã giảm giá: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await axios.get(`http://localhost:3000/api/products?limit=100`, {
        withCredentials: true,
      });

      if (response.data?.success) {
        setProducts(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Không thể lấy danh sách sản phẩm");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(`Không thể lấy danh sách sản phẩm: ${err.message}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Cập nhật useEffect xử lý lọc sản phẩm
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];

      // Lọc theo từ khóa tìm kiếm
      if (productSearchTerm.trim()) {
        const searchValue = productSearchTerm.toLowerCase();
        filtered = filtered.filter(
          (product) =>
            product.productName.toLowerCase().includes(searchValue) ||
            (product.category?.categoryName &&
              product.category.categoryName.toLowerCase().includes(searchValue))
        );
      }

      // Lọc để chỉ hiện sản phẩm đã áp dụng MÃ GIẢM GIÁ NÀY
      if (showProductsWithThisDiscountOnly && selectedDiscount) {
        filtered = filtered.filter((product) => product.discountId === selectedDiscount.DiscountId);
      }

      setFilteredProducts(filtered);
    }
  }, [products, productSearchTerm, showProductsWithThisDiscountOnly, selectedDiscount]);

  // Cập nhật hàm chuyển đổi
  const handleToggleShowDiscountedOnly = () => {
    setShowProductsWithThisDiscountOnly((prev) => !prev);
  };

  // Auto-select products that already have the current discount applied
  useEffect(() => {
    if (isApplyModalOpen && selectedDiscount && products.length > 0) {
      // Find products that already have this discount applied
      const productsWithCurrentDiscount = products.filter(
        (product) => product.discountId === selectedDiscount.DiscountId
      );

      // If there are products with this discount, auto-select them
      if (productsWithCurrentDiscount.length > 0) {
        const idsToSelect = productsWithCurrentDiscount.map((product) => product.productId);
        setSelectedProducts(idsToSelect);
      }
    }
  }, [isApplyModalOpen, products, selectedDiscount]);

  // Search functionality
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setDisplayedDiscounts(discounts);
      return;
    }

    const filtered = discounts.filter((discount) =>
      discount.DiscountName.toLowerCase().includes(searchValue)
    );

    setDisplayedDiscounts(filtered);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDisplayedDiscounts(discounts);
  };

  // Hàm xử lý tìm kiếm sản phẩm
  const handleProductSearch = (e) => {
    setProductSearchTerm(e.target.value);
  };

  // Hàm xóa tìm kiếm sản phẩm
  const clearProductSearch = () => {
    setProductSearchTerm("");
  };

  // Form handling
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormSubmitting(true);

      // Validate form
      if (
        !formData.DiscountName ||
        !formData.DiscountValue ||
        !formData.StartDate ||
        !formData.EndDate
      ) {
        throw new Error("Vui lòng điền đầy đủ thông tin");
      }

      if (formData.DiscountValue <= 0 || formData.DiscountValue > 100) {
        throw new Error("Giá trị giảm giá phải từ 1 đến 100%");
      }

      const startDate = new Date(formData.StartDate);
      const endDate = new Date(formData.EndDate);

      if (endDate <= startDate) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }

      let response;

      if (isEditing) {
        // Update existing discount
        response = await axios.put(
          `http://localhost:3000/api/discounts/${formData.DiscountId}`,
          formData,
          { withCredentials: true }
        );
      } else {
        // Create new discount
        response = await axios.post("http://localhost:3000/api/discounts", formData, {
          withCredentials: true,
        });
      }

      if (response.data?.success) {
        // Close modal and refresh data
        setIsFormModalOpen(false);
        fetchDiscounts();
      } else {
        throw new Error(response.data?.message || "Đã xảy ra lỗi khi lưu mã giảm giá");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "Đã xảy ra lỗi khi lưu mã giảm giá");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Add new discount
  const handleAddDiscount = () => {
    setFormData({
      DiscountName: "",
      DiscountValue: 0,
      StartDate: new Date().toISOString().split("T")[0],
      EndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
      IsActive: true,
    });
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  // Edit discount
  const handleEditDiscount = (discount) => {
    setFormData({
      ...discount,
      StartDate: new Date(discount.StartDate).toISOString().split("T")[0],
      EndDate: new Date(discount.EndDate).toISOString().split("T")[0],
    });
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  // Delete discount
  const handleDeleteClick = (discount) => {
    setDiscountToDelete(discount);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDiscountToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!discountToDelete) return;

    try {
      setLoading(true);

      const response = await axios.delete(
        `http://localhost:3000/api/discounts/${discountToDelete.DiscountId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setDiscounts(discounts.filter((d) => d.DiscountId !== discountToDelete.DiscountId));
        setDisplayedDiscounts(
          displayedDiscounts.filter((d) => d.DiscountId !== discountToDelete.DiscountId)
        );
        setIsDeleteModalOpen(false);
        setDiscountToDelete(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete discount");
      }
    } catch (err) {
      console.error("Error deleting discount:", err);
      setError(`Không thể xóa mã giảm giá: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = (discount) => {
    setSelectedDiscount(discount);
    setSelectedProducts([]);
    fetchProducts();
    setIsApplyModalOpen(true);
  };

  const handleToggleProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleApplyDiscountToProducts = async () => {
    if (!selectedProducts.length) {
      setError("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/api/discounts/apply",
        {
          discountId: selectedDiscount.DiscountId,
          productIds: selectedProducts,
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        // Cập nhật danh sách sản phẩm trong state
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            selectedProducts.includes(product.productId)
              ? { ...product, discountId: selectedDiscount.DiscountId }
              : product
          )
        );

        setIsApplyModalOpen(false);

        // Hiển thị thông báo thành công (thay vì alert)
        setSuccess(
          `Đã áp dụng mã giảm giá "${selectedDiscount.DiscountName}" cho ${selectedProducts.length} sản phẩm`
        );

        // Xóa thông báo sau 5 giây
        setTimeout(() => {
          setSuccess(null);
        }, 5000);

        // Làm mới dữ liệu
        fetchDiscounts();
      } else {
        throw new Error(response.data?.message || "Không thể áp dụng mã giảm giá");
      }
    } catch (err) {
      console.error("Error applying discount to products:", err);
      setError(`Không thể áp dụng mã giảm giá: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm xử lý bỏ mã giảm giá
  const handleRemoveDiscountFromProducts = async () => {
    if (!selectedProducts.length) {
      setError("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    try {
      setLoading(true);

      // Chỉ bỏ mã giảm giá cho các sản phẩm có cùng mã giảm giá với mã hiện tại
      const productsToRemoveDiscount = selectedProducts.filter((productId) => {
        const product = products.find((p) => p.productId === productId);
        return product && product.discountId === selectedDiscount.DiscountId;
      });

      // Nếu không có sản phẩm nào phù hợp để bỏ mã này
      if (productsToRemoveDiscount.length === 0) {
        setError("Không có sản phẩm nào được chọn có mã giảm giá này");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/api/discounts/remove",
        {
          productIds: productsToRemoveDiscount,
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        // Cập nhật danh sách sản phẩm trong state
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            productsToRemoveDiscount.includes(product.productId)
              ? { ...product, discountId: null }
              : product
          )
        );

        setSuccess(`Đã bỏ mã giảm giá cho ${productsToRemoveDiscount.length} sản phẩm`);

        // Đóng modal nếu không còn sản phẩm nào có mã giảm giá này và đang ở chế độ chỉ hiện sản phẩm có mã giảm giá này
        if (
          showProductsWithThisDiscountOnly &&
          products.filter((p) => p.discountId === selectedDiscount.DiscountId).length ===
            productsToRemoveDiscount.length
        ) {
          setIsApplyModalOpen(false);
        }

        // Xóa thông báo sau 5 giây
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        throw new Error(response.data?.message || "Không thể bỏ mã giảm giá");
      }
    } catch (err) {
      console.error("Error removing discounts from products:", err);
      setError(`Không thể bỏ mã giảm giá: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Refresh data
  const handleRefresh = () => {
    fetchDiscounts();
  };

  return (
    <div className="p-6">
      {/* Header and Search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý mã giảm giá</h1>

        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Tìm kiếm mã giảm giá..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Xóa tìm kiếm"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4" />
              </button>
            )}
          </div>

          {searchTerm && (
            <div className="mt-1 text-sm text-gray-600">
              Tìm thấy {displayedDiscounts.length} kết quả liên quan.
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {/* Add button */}
          <button
            onClick={handleAddDiscount}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Thêm mới
          </button>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSyncAlt} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Loading and error messages */}
      {loading && <div className="text-center py-4">Đang tải...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Discounts table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left w-12">STT</th>
                  <th className="px-4 py-2 text-left">Tên mã giảm giá</th>
                  <th className="px-4 py-2 text-center">Giá trị</th>
                  <th className="px-4 py-2 text-left">Ngày bắt đầu</th>
                  <th className="px-4 py-2 text-left">Ngày kết thúc</th>
                  <th className="px-4 py-2 text-center">Trạng thái</th>
                  <th className="px-4 py-2 text-center w- 70">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {displayedDiscounts.map((discount, index) => (
                  <tr key={discount.DiscountId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center">{discount.DiscountName}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                        {discount.DiscountValue}%
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(discount.StartDate)}</td>
                    <td className="px-4 py-3">{formatDate(discount.EndDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          discount.IsActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {discount.IsActive ? "Đang kích hoạt" : "Vô hiệu hóa"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        {/* Apply button */}
                        <button
                          onClick={() => handleApplyDiscount(discount)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                          disabled={loading || !discount.IsActive}
                          title={
                            !discount.IsActive
                              ? "Mã giảm giá chưa kích hoạt"
                              : "Áp dụng cho sản phẩm"
                          }
                        >
                          <FontAwesomeIcon icon={faTags} className="mr-1" /> Áp dụng
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => handleEditDiscount(discount)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" /> Sửa
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteClick(discount)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedDiscounts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy mã giảm giá nào phù hợp"
                        : "Chưa có mã giảm giá nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`mx-1 px-3 py-1 rounded ${
                  page === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white"
                }`}
              >
                Trước
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`mx-1 px-3 py-1 rounded ${
                    page === i + 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`mx-1 px-3 py-1 rounded ${
                  page === totalPages ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white"
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && discountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold mb-2 text-center">Xác nhận xóa</h2>

            <div className="mb-6 text-center">
              <p className="text-gray-700 mb-2">Bạn có chắc chắn muốn xóa mã giảm giá sau?</p>
              <p className="font-semibold text-lg">{discountToDelete.DiscountName}</p>
              <p className="text-sm text-gray-600">Giảm {discountToDelete.DiscountValue}%</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {isEditing ? "Chỉnh sửa mã giảm giá" : "Thêm mã giảm giá mới"}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="DiscountName" className="block text-sm font-medium text-gray-700">
                    Tên mã giảm giá
                  </label>
                  <input
                    type="text"
                    id="DiscountName"
                    name="DiscountName"
                    value={formData.DiscountName}
                    onChange={handleFormChange}
                    placeholder="Nhập tên mã giảm giá"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="DiscountValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Giá trị giảm giá (%)
                  </label>
                  <input
                    type="number"
                    id="DiscountValue"
                    name="DiscountValue"
                    value={formData.DiscountValue}
                    onChange={handleFormChange}
                    min="1"
                    max="100"
                    step="1"
                    placeholder="Nhập giá trị giảm giá"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="StartDate" className="block text-sm font-medium text-gray-700">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      id="StartDate"
                      name="StartDate"
                      value={formData.StartDate}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="EndDate" className="block text-sm font-medium text-gray-700">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      id="EndDate"
                      name="EndDate"
                      value={formData.EndDate}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="IsActive"
                    name="IsActive"
                    checked={formData.IsActive}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="IsActive" className="ml-2 block text-sm text-gray-700">
                    Kích hoạt mã giảm giá
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      {isEditing ? "Cập nhật" : "Thêm mới"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply discount modal */}
      {isApplyModalOpen && selectedDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Áp dụng mã giảm giá "{selectedDiscount.DiscountName}" (
                {selectedDiscount.DiscountValue}%)
              </h2>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">
                <strong>Thông tin mã giảm giá:</strong> {selectedDiscount.DiscountValue}% từ{" "}
                {formatDate(selectedDiscount.StartDate)} đến {formatDate(selectedDiscount.EndDate)}
              </p>
            </div>

            {/* Thêm ô tìm kiếm sản phẩm */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={handleProductSearch}
                  placeholder="Tìm kiếm sản phẩm theo tên hoặc danh mục..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {productSearchTerm && (
                  <button
                    onClick={clearProductSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label="Xóa tìm kiếm"
                  >
                    <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4" />
                  </button>
                )}
              </div>

              {productSearchTerm && filteredProducts.length > 0 && (
                <div className="mt-1 text-sm text-gray-600">
                  Tìm thấy {filteredProducts.length} sản phẩm phù hợp.
                </div>
              )}

              {productSearchTerm && filteredProducts.length === 0 && (
                <div className="mt-1 text-sm text-red-500">
                  Không tìm thấy sản phẩm nào phù hợp với từ khóa "{productSearchTerm}".
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Chọn sản phẩm để áp dụng:</h3>
                <div className="flex items-center space-x-4">
                  {/* Thêm nút chuyển đổi chế độ hiển thị */}
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showProductsWithThisDiscountOnly}
                      onChange={handleToggleShowDiscountedOnly}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Chỉ hiện sản phẩm đã áp dụng mã giảm giá này
                    </span>
                  </label>
                </div>
              </div>

              {/* Phần hiển thị sản phẩm tiếp theo không thay đổi */}
              {loadingProducts ? (
                <div className="flex justify-center items-center py-8">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 mr-2" />
                  <span>Đang tải danh sách sản phẩm...</span>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          Chọn
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          Ảnh
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên sản phẩm
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Giá
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                          Danh mục
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.productId}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedProducts.includes(product.productId) ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleToggleProduct(product.productId)}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.productId)}
                              onChange={() => {}} // Handled by the row click
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {product.imageUrl ? (
                              <img
                                src={`http://localhost:3000${product.imageUrl}`}
                                alt={product.productName}
                                className="h-10 w-10 object-cover rounded-md"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                No img
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">{product.productName}</div>
                            {product.discountId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <FontAwesomeIcon icon={faTag} className="mr-1" />
                                Đã có giảm giá
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-500">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.price)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {product.category?.categoryName || "Chưa phân loại"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {productSearchTerm
                    ? "Không tìm thấy sản phẩm phù hợp."
                    : "Không có sản phẩm nào."}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Đóng
              </button>

              {/* Thêm nút bỏ mã giảm giá */}
              <button
                type="button"
                onClick={handleRemoveDiscountFromProducts}
                disabled={selectedProducts.length === 0 || loading}
                className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                  selectedProducts.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    Bỏ giảm giá
                  </>
                )}
              </button>

              {/* Nút áp dụng mã giảm giá đã có sẵn */}
              <button
                type="button"
                onClick={handleApplyDiscountToProducts}
                disabled={selectedProducts.length === 0 || loading}
                className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                  selectedProducts.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Đang áp dụng...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                    Áp dụng giảm giá
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

export default DiscountManagement;
