import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  faEye,
  faSpinner,
  faSyncAlt,
  faTimesCircle,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const API_URL = "http://localhost:3000/api";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentCategory, setCurrentCategory] = useState({
    categoryName: "",
    description: "",
    categoryImage: null,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [editingCategoryDetails, setEditingCategoryDetails] = useState([
    { id: Date.now(), detailType: "", detailValue: "" },
  ]);
  const [nameError, setNameError] = useState("");
  const [allCategoryDetails, setAllCategoryDetails] = useState({});
  // Phục vụ hàm tìm kiêm
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedCategories, setDisplayedCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/categories`);

      if (response.data?.success) {
        setCategories(response.data.data || []);
        console.log("Categories fetched:", response.data.data); // Log dữ liệu vừa nhận được
        setDisplayedCategories(response.data.data);
        response.data.totalPages && setTotalPages(response.data.totalPages);
      } else {
        throw new Error("Failed to fetch categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Không thể tải danh sách danh mục. Vui lòng thử lại sau.");
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page]);

  useEffect(() => {
    const fetchAllCategoriesDetails = async () => {
      if (categories.length > 0) {
        try {
          const detailsPromises = categories.map((category) =>
            axios.get(`${API_URL}/categories/${category.categoryId}/details`)
          );

          const responses = await Promise.all(detailsPromises);

          const newDetails = responses.reduce((acc, response, index) => {
            if (response.data?.success) {
              acc[categories[index].categoryId] = response.data.data || [];
            }
            return acc;
          }, {});
          setAllCategoryDetails(newDetails);
        } catch (err) {
          console.error("Error fetching category details:", err);
        }
      }
    };
    fetchAllCategoriesDetails();
  }, [categories]);
  // Thêm useEffect để lọc và hiển thị danh mục dựa trên từ khóa tìm kiếm
  useEffect(() => {
    // Nếu không có từ khóa tìm kiếm, hiển thị tất cả danh mục của trang hiện tại
    if (!searchTerm.trim()) {
      setDisplayedCategories(categories);
      return;
    }

    // Nếu có từ khóa tìm kiếm, lọc danh mục trên trang hiện tại
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = categories.filter(
      (category) =>
        category.categoryName.toLowerCase().includes(normalizedSearch) ||
        (category.description && category.description.toLowerCase().includes(normalizedSearch))
    );

    setDisplayedCategories(filtered);
  }, [searchTerm, categories]);
  const handleRefresh = () => {
    toast.info("Đang làm mới dữ liệu...");
    fetchCategories();
  };

  const handleAddCategory = () => {
    setCurrentCategory({
      categoryName: "",
      description: "",
      categoryImage: null,
    });
    setEditingCategoryDetails([{ id: Date.now(), detailType: "", detailValue: "" }]);
    setModalMode("add");
    setIsModalOpen(true);
    setSelectedFile(null);
  };
  // Thêm hàm xử lý tìm kiếm
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Thêm hàm xóa tìm kiếm
  const clearSearch = () => {
    setSearchTerm("");
  };
  const handleEditCategory = async (category) => {
    setCurrentCategory({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      description: category.description || "",
      categoryImage: category.categoryImage || null,
    });
    setModalMode("edit");
    setIsModalOpen(true);
    setSelectedFile(null);

    try {
      const response = await axios.get(`${API_URL}/categories/${category.categoryId}/details`);
      if (response.data && response.data.success) {
        const details = response.data.data || [];
        if (details.length === 0) {
          setEditingCategoryDetails([{ detailType: "", detailValue: "" }]);
        } else {
          setEditingCategoryDetails(
            details.map((detail) => ({
              id: detail.DetailCategoryId,
              detailType: detail.DetailType,
              detailValue: detail.DetailValue,
              existingRecord: true,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching detail categories:", error);
      toast.error("Không thể tải chi tiết danh mục");
      setEditingCategoryDetails([{ id: Date.now(), detailType: "", detailValue: "" }]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentCategory({
          ...currentCategory,
          categoryImage: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetailChange = (id, field, value) => {
    setEditingCategoryDetails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addDetailRow = () => {
    setEditingCategoryDetails((prev) => [
      ...prev,
      { id: Date.now(), detailType: "", detailValue: "" },
    ]);
  };

  const removeDetailRow = (id) => {
    if (editingCategoryDetails.length <= 1) {
      toast.warning("Phải có ít nhất một dòng chi tiết");
      return;
    }
    setEditingCategoryDetails((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      };
      if (!currentCategory.categoryName.trim()) {
        toast.error("Vui lòng nhập tên danh mục");
        setLoading(false);
        return;
      }

      const normalizedNewName = currentCategory.categoryName.trim().toLowerCase();

      const isDuplicateName = categories.some((category) => {
        const isSameCategory = category.categoryId === currentCategory.categoryId;
        const isSameName = isSameCategory
          ? false
          : category.categoryName.trim().toLowerCase() === normalizedNewName;

        // Chỉ kiểm tra trùng lặp nếu không phải là danh mục hiện tại
        return isSameName && modalMode === "add";
      });

      if (isDuplicateName) {
        const errorMsg = `Tên danh mục "${currentCategory.categoryName}" đã tồn tại.`;
        setNameError(errorMsg);
        setLoading(false);
        return;
      }
      setNameError("");
      const validDetails = editingCategoryDetails.filter(
        (detail) => detail.detailType.trim() && detail.detailValue.trim()
      );
      const formData = new FormData();
      formData.append("categoryName", currentCategory.categoryName);
      formData.append("description", currentCategory.description || "");

      if (selectedFile) {
        formData.append("categoryImage", selectedFile);
      }

      let categoryId = currentCategory.categoryId;

      if (modalMode === "add") {
        // Tạo category chinh
        const response = await axios.post(`${API_URL}/categories`, formData, config);
        toast.success("Thêm danh mục thành công");
        categoryId = response.data.data.categoryId;
      } else {
        // Update categoryy chính
        await axios.put(`${API_URL}/categories/${categoryId}`, formData, config);
        toast.success("Cập nhật danh mục thành công");
      }

      if (validDetails.length > 0) {
        const promises = validDetails.map((detail) => {
          const data = {
            DetailType: detail.detailType,
            DetailValue: detail.detailValue,
          };

          if (detail.existingRecord) {
            return axios.put(`${API_URL}/categories/${categoryId}/details/${detail.id}`, data, {
              withCredentials: true,
            });
          } else {
            return axios.post(`${API_URL}/categories/${categoryId}/details`, data, {
              withCredentials: true,
            });
          }
        });

        await Promise.all(promises);
        toast.success("Cập nhật chi tiết danh mục thành công");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Không thể lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/categories/${categoryToDelete.categoryId}`, {
        withCredentials: true,
      });
      toast.success("Xóa danh mục thành công");
      fetchCategories();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("Không thể xóa danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        {/* Ô tìm kiếm */}
        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Tìm kiếm danh mục trên trang hiện tại..."
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

          {/* Hiển thị thông tin tìm kiếm khi có từ khóa */}
          {searchTerm && (
            <div className="mt-1 text-sm text-gray-600">
              Tìm thấy {displayedCategories.length} kết quả liên quan.
            </div>
          )}
        </div>
        <div className="flex justify-between space-x-4">
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSyncAlt} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Làm mới
          </button>
          <button
            onClick={handleAddCategory}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            Thêm danh mục
          </button>
        </div>
      </div>
      {loading && <div className="text-center py-4">Đang tải...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">STT</th>
                  <th className="px-4 py-2 text-left">Hình ảnh</th>
                  <th className="px-4 py-2 text-left">Tên danh mục</th>
                  <th className="px-4 py-2 text-left">Mô tả</th>
                  <th className="px-4 py-2 text-left">Chi tiết phân loại</th>
                  <th className="px-4 py-2 text-left">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {displayedCategories.map((category, index) => (
                  <tr key={category.categoryId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      {category.categoryImage ? (
                        <img
                          src={`http://localhost:3000${category.categoryImage}`}
                          alt={category.categoryName}
                          className="h-24 w-24 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xl">{category.categoryName}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-xl">
                      {category.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-h-32 overflow-y-auto">
                        {allCategoryDetails[category.categoryId] &&
                        allCategoryDetails[category.categoryId].length > 0 ? (
                          <ul className="list-disc list-inside text-sm">
                            {allCategoryDetails[category.categoryId].map((detail) => (
                              <li key={detail.DetailCategoryId} className="mb-1 text-xl">
                                <span className="font-semibold">{detail.DetailType}:</span>{" "}
                                {detail.DetailValue}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500 italic">Không có chi tiết</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2"
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" /> Sửa
                      </button>

                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        disabled={loading}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}

                {displayedCategories.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-3 text-center text-gray-500">
                      {searchTerm
                        ? `Không tìm thấy danh mục nào phù hợp với từ khóa "${searchTerm}"`
                        : "Không có danh mục nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
      {/* Modal thêm danh mục / Sửa danh mục */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {modalMode === "add" ? "Thêm danh mục mới" : "Sửa danh mục"}
            </h2>

            <form onSubmit={handleSaveCategory}>
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 pb-1 border-b">Thông tin danh mục</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="categoryName"
                    value={currentCategory.categoryName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded shadow appearance-none ${
                      nameError ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {nameError && <p className="text-red-500 text-xs italic mt-1">{nameError}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Mô tả</label>
                  <textarea
                    name="description"
                    value={currentCategory.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded shadow appearance-none"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Ảnh danh mục</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded shadow appearance-none"
                  />
                </div>

                {currentCategory.categoryImage && (
                  <div className="mb-4">
                    <img
                      src={
                        selectedFile
                          ? currentCategory.categoryImage
                          : `http://localhost:3000${currentCategory.categoryImage}`
                      }
                      alt="Preview"
                      className="h-24 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2 pb-1 border-b">
                  <h3 className="font-semibold text-lg">Chi tiết phân loại</h3>
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="text-sm bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    + Thêm phân loại
                  </button>
                </div>

                <div className="space-y-3">
                  {editingCategoryDetails.map((detail, index) => (
                    <div
                      key={detail.id || `detail-${index}`}
                      className="flex items-center space-x-2"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Loại (vd: Màu sắc, Kích thước...)"
                          value={detail.detailType}
                          onChange={(e) =>
                            handleDetailChange(detail.id, "detailType", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded shadow-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Giá trị (vd: Đỏ, XL...)"
                          value={detail.detailValue}
                          onChange={(e) =>
                            handleDetailChange(detail.id, "detailValue", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded shadow-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDetailRow(detail.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Xóa"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {editingCategoryDetails.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Chưa có chi tiết phân loại nào
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setNameError("");
                    setIsModalOpen(false);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Xoá category  */}
      {isDeleteModalOpen && categoryToDelete && (
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
              <p className="text-gray-700 mb-2">Bạn có chắc chắn muốn xóa danh mục sau?</p>
              <p className="font-semibold text-lg">"{categoryToDelete.categoryName}"</p>

              {allCategoryDetails[categoryToDelete.categoryId]?.length > 0 && (
                <div className="mt-3 bg-yellow-50 text-yellow-800 p-3 rounded-md border border-yellow-200">
                  <p className="text-sm">
                    <span className="font-semibold">Cảnh báo:</span> Danh mục này có{" "}
                    <span className="font-semibold">
                      {allCategoryDetails[categoryToDelete.categoryId].length}
                    </span>{" "}
                    chi tiết phân loại sẽ bị xóa.
                  </p>
                </div>
              )}
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
    </div>
  );
};

export default CategoryManagement;
