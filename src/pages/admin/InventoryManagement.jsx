import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faSearch,
  faTimesCircle,
  faSyncAlt,
  faSpinner,
  faPlus,
  faWarehouse,
  faBoxOpen,
  faCalendarAlt,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const InventoryManagement = () => {
  // States
  const [inventoryItems, setInventoryItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [stores, setStores] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // States cho modal thêm/sửa sản phẩm
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    storeId: "",
    productId: "",
    quantity: 0,
    expirationDate: "",
  });
  const [products, setProducts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const pageSize = 10;

  // Fetch inventory data
  useEffect(() => {
    fetchInventory();
    fetchStores();
    fetchProducts();
  }, [page, selectedStore]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `http://localhost:3000/api/inventory?page=${page}&limit=${pageSize}`;

      if (selectedStore && selectedStore !== "all") {
        url += `&storeId=${selectedStore}`;
      }

      const response = await axios.get(url, { withCredentials: true });

      if (response.data?.success) {
        setInventoryItems(response.data.data || []);
        setDisplayedItems(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        throw new Error(response.data?.message || "Failed to fetch inventory data");
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(`Không thể tải dữ liệu tồn kho: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/stores", {
        withCredentials: true,
      });

      if (response.data?.success) {
        setStores(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/products", {
        withCredentials: true,
      });

      if (response.data?.success) {
        setProducts(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Search functionality
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setDisplayedItems(inventoryItems);
      return;
    }

    const filtered = inventoryItems.filter(
      (item) =>
        item.product?.productName?.toLowerCase().includes(searchValue) ||
        item.store?.storeName?.toLowerCase().includes(searchValue)
    );

    setDisplayedItems(filtered);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDisplayedItems(inventoryItems);
  };

  // Filter by store
  const handleStoreFilter = (e) => {
    setSelectedStore(e.target.value);
    setPage(1); // Reset to first page when changing filter
  };

  // Refresh data
  const handleRefresh = () => {
    fetchInventory();
  };

  // Edit functionality
  const handleEditClick = (item) => {
    setModalData({
      storeId: item.storeId,
      productId: item.productId,
      quantity: item.quantity,
      expirationDate: item.expirationDate ? item.expirationDate.split("T")[0] : "",
    });
    setIsEditModalOpen(true);
  };

  // Add functionality
  const handleAddClick = () => {
    setModalData({
      storeId: stores[0]?.storeId || "",
      productId: "",
      quantity: 0,
      expirationDate: "",
    });
    setIsAddModalOpen(true);
  };

  // Delete functionality
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      const response = await axios.delete(
        `http://localhost:3000/api/inventory/${itemToDelete.storeId}/${itemToDelete.productId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        // Remove the deleted item from state
        const updatedItems = inventoryItems.filter(
          (item) =>
            !(item.storeId === itemToDelete.storeId && item.productId === itemToDelete.productId)
        );
        setInventoryItems(updatedItems);
        setDisplayedItems(updatedItems);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete inventory item");
      }
    } catch (err) {
      console.error("Error deleting inventory item:", err);
      setError(`Không thể xóa mục tồn kho: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalData({
      ...modalData,
      [name]: name === "quantity" ? parseInt(value) : value,
    });
  };

  // Handle form submission for adding/editing
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      let response;

      if (isAddModalOpen) {
        // Add new inventory item
        response = await axios.post(`http://localhost:3000/api/inventory`, modalData, {
          withCredentials: true,
        });
      } else {
        // Edit existing inventory item
        response = await axios.put(
          `http://localhost:3000/api/inventory/${modalData.storeId}/${modalData.productId}`,
          {
            quantity: modalData.quantity,
            expirationDate: modalData.expirationDate,
          },
          { withCredentials: true }
        );
      }

      if (response.data?.success) {
        // Close modal and refresh data
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        fetchInventory();
      } else {
        throw new Error(response.data?.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error in inventory operation:", err);
      setError(`Thao tác không thành công: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: vi });
    } catch (err) {
      return "-";
    }
  };

  // Check if product is expiring soon (within 30 days)
  const isExpiringSoon = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 30;
  };

  // Check if product is expired
  const isExpired = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    const expirationDate = new Date(dateString);

    return expirationDate < today;
  };

  return (
    <div className="p-6">
      {/* Header and Search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý tồn kho</h1>

        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Tìm kiếm sản phẩm, cửa hàng..."
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
              Tìm thấy {displayedItems.length} kết quả liên quan.
            </div>
          )}
        </div>

        {/* Filter by store */}
        <div className="mr-2">
          <select
            value={selectedStore}
            onChange={handleStoreFilter}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả cửa hàng</option>
            {stores.map((store) => (
              <option key={store.storeId} value={store.storeId}>
                {store.storeName}
              </option>
            ))}
          </select>
        </div>

        {/* Add and Refresh buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleAddClick}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Thêm mới
          </button>

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

      {/* Inventory table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left w-12">STT</th>
                  <th className="px-4 py-2 text-left">Cửa hàng</th>
                  <th className="px-4 py-2 text-left">Sản phẩm</th>
                  <th className="px-4 py-2 text-right">Số lượng</th>
                  <th className="px-4 py-2 text-center">Hạn sử dụng</th>
                  <th className="px-4 py-2 text-center">Cập nhật lần cuối</th>
                  <th className="px-4 py-2 text-center w-48">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((item, index) => (
                  <tr
                    key={`${item.storeId}-${item.productId}`}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{(page - 1) * pageSize + index + 1}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faWarehouse} className="text-gray-500 mr-2" />
                        <span className="font-medium">{item.store?.storeName || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex-shrink-0 mr-2 bg-gray-100 rounded-md flex items-center justify-center">
                          {console.log(item.product.imageUrl)}
                          {item.product?.imageUrl ? (
                            <img
                              src={`http://localhost:3000${item.product.imageUrl}`}
                              alt={item.product.productName}
                              className="h-8 w-8 object-cover rounded-md"
                            />
                          ) : (
                            <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.product?.productName || "N/A"}</div>
                          <div className="text-xs text-gray-500">
                            {item.product?.unitOfMeasurement || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-medium">
                      {item.quantity}
                      {item.quantity <= 10 && (
                        <span className="ml-2 text-orange-500" title="Sắp hết hàng">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div
                        className={`
                        flex items-center justify-center space-x-1
                        ${isExpired(item.expirationDate) ? "text-red-600" : ""}
                        ${
                          isExpiringSoon(item.expirationDate) && !isExpired(item.expirationDate)
                            ? "text-orange-500"
                            : ""
                        }
                      `}
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        <span>{formatDate(item.expirationDate)}</span>
                        {isExpired(item.expirationDate) && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-1">
                            Hết hạn
                          </span>
                        )}
                        {isExpiringSoon(item.expirationDate) && !isExpired(item.expirationDate) && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full ml-1">
                            Sắp hết hạn
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {formatDate(item.updatedAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded flex items-center text-sm font-medium transition-colors"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1.5" />
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded flex items-center text-sm font-medium transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1.5" />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {displayedItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy sản phẩm nào phù hợp"
                        : "Không có sản phẩm nào trong kho"}
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
      {isDeleteModalOpen && itemToDelete && (
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
              <p className="text-gray-700 mb-2">Bạn có chắc chắn muốn xóa sản phẩm này khỏi kho?</p>
              <p className="font-semibold text-lg">
                {itemToDelete.product?.productName || "Không xác định"}
              </p>
              <p className="text-sm text-gray-600">
                Tại cửa hàng: {itemToDelete.store?.storeName || "Không xác định"}
              </p>
              <p className="mt-2 text-sm text-red-500">Thao tác này không thể hoàn tác!</p>
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
                  "Xác nhận xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Cập nhật thông tin tồn kho</h2>

            <form onSubmit={handleModalSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Cửa hàng</label>
                <input
                  type="text"
                  value={stores.find((s) => s.storeId === modalData.storeId)?.storeName || ""}
                  className="w-full px-3 py-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Sản phẩm</label>
                <input
                  type="text"
                  value={
                    products.find((p) => p.productId === modalData.productId)?.productName || ""
                  }
                  className="w-full px-3 py-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Số lượng</label>
                <input
                  type="number"
                  name="quantity"
                  value={modalData.quantity}
                  onChange={handleModalInputChange}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Hạn sử dụng</label>
                <input
                  type="date"
                  name="expirationDate"
                  value={modalData.expirationDate}
                  onChange={handleModalInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Thêm sản phẩm vào kho</h2>

            <form onSubmit={handleModalSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Cửa hàng</label>
                <select
                  name="storeId"
                  value={modalData.storeId}
                  onChange={handleModalInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {stores.map((store) => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Sản phẩm</label>
                <select
                  name="productId"
                  value={modalData.productId}
                  onChange={handleModalInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Số lượng</label>
                <input
                  type="number"
                  name="quantity"
                  value={modalData.quantity}
                  onChange={handleModalInputChange}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Hạn sử dụng</label>
                <input
                  type="date"
                  name="expirationDate"
                  value={modalData.expirationDate}
                  onChange={handleModalInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Đang thêm...
                    </>
                  ) : (
                    "Thêm sản phẩm"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
