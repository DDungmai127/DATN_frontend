import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEye,
  faSpinner,
  faSyncAlt,
  faEdit,
  faTrash,
  faTimesCircle,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { formatCurrency } from "../../util/formatters";

const ProductManagement = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProduct, setCurrentProduct] = useState({
    productName: "",
    description: "",
    imageUrl: "",
    providerName: "",
    price: "",
    quantity: 0,
    unitOfMeasurement: "",
    expirationDate: "",
    status: "active",
    categoryId: "",
  });

  const [productToDelete, setProductToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [nameError, setNameError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  // Detailcategory state
  const [detailCategories, setDetailCategories] = useState([]);
  const [selectedDetailCategories, setSelectedDetailCategories] = useState([]);
  const [loadingDetailCategories, setLoadingDetailCategories] = useState(false);
  const [isCategoryChanged, setIsCategoryChanged] = useState(false);
  const [productDiscounts, setProductDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  // Fetch products on mount and when page changes
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayedProducts([...products]);
    } else {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.productName.toLowerCase().includes(normalizedSearch) ||
          product.description.toLowerCase().includes(normalizedSearch) ||
          (product.providerName && product.providerName.toLowerCase().includes(normalizedSearch))
      );
      setDisplayedProducts(filtered);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    if (isModalOpen && modalMode === "edit" && currentProduct.categoryId) {
      fetchDetailCategories(currentProduct.categoryId);
    }
  }, [isModalOpen, modalMode, currentProduct.categoryId]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`http://localhost:3000/api/products?page=${page}&limit=10`);

      if (response.data?.success) {
        const productsData = response.data.data || [];

        const productsWithEmptyDetails = productsData.map((product) => ({
          ...product,
          detailCategories: [],
        }));

        setProducts(productsWithEmptyDetails);
        setDisplayedProducts(productsWithEmptyDetails);
        setTotalPages(response.data.pagination.totalPages || 1);

        if (productsData.length > 0) {
          await Promise.all(
            productsData.map(async (product) => {
              try {
                const detailResponse = await axios.get(
                  `http://localhost:3000/api/products/${product.productId}/details`,
                  {
                    withCredentials: true,
                  }
                );

                if (detailResponse.data?.success) {
                  setProducts((prevProducts) =>
                    prevProducts.map((p) =>
                      p.productId === product.productId
                        ? { ...p, detailCategories: detailResponse.data.data || [] }
                        : p
                    )
                  );

                  setDisplayedProducts((prevProducts) =>
                    prevProducts.map((p) =>
                      p.productId === product.productId
                        ? { ...p, detailCategories: detailResponse.data.data || [] }
                        : p
                    )
                  );
                }
              } catch (err) {
                console.error(`Error fetching details for ${product.productId}:`, err);
              }
            })
          );
        }
      } else {
        throw new Error(response.data?.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(`Không thể tải dữ liệu sản phẩm: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDetailCategoryName = (detailCategory) => {
    if (!detailCategory) return "Chi tiết";

    if (detailCategory.DetailType && detailCategory.DetailValue) {
      return `${detailCategory.DetailType}: ${detailCategory.DetailValue}`;
    }

    return (
      detailCategory.DetailValue ||
      detailCategory.DetailType ||
      detailCategory.DetailCategoryName ||
      "Chi tiết"
    );
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/categories");
      if (response.data?.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchDetailCategories = async (categoryId) => {
    if (!categoryId) {
      setDetailCategories([]);
      setSelectedDetailCategories([]);
      return;
    }

    try {
      setLoadingDetailCategories(true);
      const response = await axios.get(
        `http://localhost:3000/api/categories/${categoryId}/details`,
        {
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        setDetailCategories(response.data.data || []);

        if (modalMode === "edit" && currentProduct.productId && !isCategoryChanged) {
          fetchSelectedDetailCategories(currentProduct.productId);
        } else {
          setSelectedDetailCategories([]);
        }
      } else {
        console.error("Failed to fetch detail categories");
      }
    } catch (err) {
      console.error("Error fetching detail categories:", err);
    } finally {
      setLoadingDetailCategories(false);
    }
  };

  const fetchSelectedDetailCategories = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/products/${productId}/details`, {
        withCredentials: true,
      });

      if (response.data?.success) {
        const selectedIds = response.data.data.map((item) => item.DetailCategoryId);
        setSelectedDetailCategories(selectedIds);
      }
    } catch (err) {
      console.error("Error fetching selected detail categories:", err);
    }
  };

  const fetchProductDiscounts = async (productId) => {
    if (!productId) {
      setProductDiscounts(null);
      return;
    }

    try {
      setLoadingDiscounts(true);

      // Đầu tiên lấy thông tin sản phẩm để có discountId
      const productResponse = await axios.get(`http://localhost:3000/api/products/${productId}`, {
        withCredentials: true,
      });

      // Kiểm tra nếu có dữ liệu sản phẩm và có discountId
      if (productResponse.data?.data && productResponse.data.data.discountId) {
        const discountId = productResponse.data.data.discountId;
        console.log("Discount id:", discountId);

        // Lấy thông tin chi tiết mã giảm giá
        const response = await axios.get(`http://localhost:3000/api/discounts/${discountId}`, {
          withCredentials: true,
        });

        if (response.data?.success) {
          setProductDiscounts(response.data.data || null);
        } else {
          setProductDiscounts(null);
        }
      } else {
        // Nếu không có discountId, không gọi API và đặt productDiscounts = null
        console.log("Sản phẩm không có mã giảm giá");
        setProductDiscounts(null);
      }
    } catch (err) {
      console.error("Error fetching product discount:", err);
      setProductDiscounts(null);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleSearch = async (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    if (searchValue.trim() === "") {
      fetchProducts();
      return;
    }

    // Nếu có từ khóa tìm kiếm, thực hiện tìm kiếm từ server
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/products/search?keyword=${encodeURIComponent(searchValue)}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        const searchResults = response.data.data || [];
        setDisplayedProducts(searchResults);
      } else {
        setDisplayedProducts([]);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setError("Lỗi khi tìm kiếm sản phẩm");
      setDisplayedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setPage(1); // Reset về trang đầu
    fetchProducts(); // Fetch lại dữ liệu
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setCurrentProduct((prev) => ({
          ...prev,
          imageUrl: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "productName") {
      if (value.trim() === "") {
        setNameError("Tên sản phẩm không được để trống");
      } else {
        setNameError("");
      }
    }

    if (name === "categoryId" && value) {
      fetchDetailCategories(value);
    }

    setCurrentProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDetailCategoryChange = (DetailCategoryId) => {
    setSelectedDetailCategories((prev) => {
      if (prev.includes(DetailCategoryId)) {
        return prev.filter((id) => id !== DetailCategoryId);
      } else {
        return [...prev, DetailCategoryId];
      }
    });
  };

  const handleCategoryChange = (categoryId) => {
    console.log("Thay đổi danh mục từ", currentProduct.categoryId, "sang", categoryId);

    if (currentProduct.categoryId && currentProduct.categoryId !== categoryId) {
      console.log("Đang thay đổi danh mục, reset chi tiết danh mục đã chọn");

      setSelectedDetailCategories([]);
      setIsCategoryChanged(true);
    }

    setCurrentProduct((prev) => ({
      ...prev,
      categoryId,
    }));

    if (categoryId) {
      fetchDetailCategories(categoryId);
    } else {
      setDetailCategories([]);
      setSelectedDetailCategories([]);
    }
  };

  const handleAddProduct = () => {
    resetForm();
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setModalMode("edit");
    setCurrentProduct({
      productId: product.productId,
      productName: product.productName,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      unitOfMeasurement: product.unitOfMeasurement,
      expirationDate: product.expirationDate
        ? new Date(product.expirationDate).toISOString().split("T")[0]
        : "",
      providerName: product.providerName || "",
      status: product.status || "active",
      categoryId: product.categoryId || "",
      imageUrl: product.imageUrl || "",
    });

    setIsCategoryChanged(false);

    // Lấy thông tin chi tiết danh mục
    if (product.categoryId) {
      fetchDetailCategories(product.categoryId);

      axios
        .get(`http://localhost:3000/api/products/${product.productId}/details`, {
          withCredentials: true,
        })
        .then((response) => {
          if (response.data?.success) {
            const selectedIds = response.data.data.map((dc) => dc.DetailCategoryId);
            setSelectedDetailCategories(selectedIds);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi lấy chi tiết danh mục đã chọn:", error);
          setSelectedDetailCategories([]);
        });
    } else {
      setDetailCategories([]);
      setSelectedDetailCategories([]);
    }

    // Lấy thông tin mã giảm giá
    fetchProductDiscounts(product.productId);

    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setLoading(true);

      const response = await axios.delete(
        `http://localhost:3000/api/products/${productToDelete.productId}`,
        {
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        setProducts(products.filter((p) => p.productId !== productToDelete.productId));
        setDisplayedProducts(
          displayedProducts.filter((p) => p.productId !== productToDelete.productId)
        );
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(`Không thể xóa sản phẩm: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const originalProduct =
        modalMode === "edit"
          ? products.find((p) => p.productId === currentProduct.productId)
          : null;

      const isCategoryChanged =
        modalMode === "edit" &&
        originalProduct &&
        currentProduct.categoryId !== originalProduct.categoryId;

      console.log("Thông tin lưu sản phẩm:", {
        mode: modalMode,
        isCategoryChanged,
        oldCategory: originalProduct?.categoryId,
        newCategory: currentProduct.categoryId,
        selectedDetails: selectedDetailCategories,
      });

      const formData = new FormData();
      formData.append("productName", currentProduct.productName);
      formData.append("description", currentProduct.description || "");
      formData.append("price", currentProduct.price);
      formData.append("quantity", currentProduct.quantity);
      formData.append("unitOfMeasurement", currentProduct.unitOfMeasurement);
      formData.append("status", currentProduct.status);
      formData.append("categoryId", currentProduct.categoryId);

      if (currentProduct.providerName) {
        formData.append("providerName", currentProduct.providerName);
      }

      if (currentProduct.expirationDate) {
        formData.append("expirationDate", currentProduct.expirationDate);
      }

      if (selectedFile) {
        formData.append("productImage", selectedFile);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      };

      if (modalMode === "edit" && isCategoryChanged) {
        console.log("Danh mục đã thay đổi, cần xóa chi tiết danh mục cũ");
        try {
          const deleteResponse = await axios.delete(
            `http://localhost:3000/api/products/${currentProduct.productId}/details`,
            { withCredentials: true }
          );
          console.log("Kết quả xóa chi tiết danh mục cũ:", deleteResponse.data);
        } catch (deleteError) {
          console.error("Lỗi khi xóa chi tiết danh mục cũ:", deleteError);
        }
      }

      let response;
      let productId = currentProduct.productId;

      try {
        if (modalMode === "add") {
          response = await axios.post("http://localhost:3000/api/products", formData, config);
          if (response.data?.success) {
            productId = response.data.data.productId || response.data.data.id;
            console.log("Đã tạo sản phẩm mới với ID:", productId);
          }
        } else {
          response = await axios.put(
            `http://localhost:3000/api/products/${productId}`,
            formData,
            config
          );
        }

        console.log("Kết quả lưu sản phẩm:", response.data);
      } catch (error) {
        console.error("Chi tiết lỗi:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
        throw error;
      }

      if (selectedDetailCategories.length > 0) {
        try {
          console.log("Đang thêm chi tiết danh mục:", {
            productId,
            details: selectedDetailCategories,
          });

          const detailResponse = await axios.post(
            "http://localhost:3000/api/products/add-detailscatprod",
            {
              productId: productId,
              DetailCategoryIds: selectedDetailCategories,
            },
            { withCredentials: true }
          );

          console.log("Kết quả thêm chi tiết danh mục:", detailResponse.data);
        } catch (detailError) {
          console.error("Lỗi khi thêm chi tiết danh mục:", detailError);
        }
      }

      setError(null);
      resetForm();
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Lỗi:", err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentProduct({
      productName: "",
      description: "",
      price: 0,
      quantity: 0,
      unitOfMeasurement: "",
      expirationDate: "",
      providerName: "",
      status: "active",
      categoryId: "",
    });
    setSelectedFile(null);
    setSelectedDetailCategories([]);
    setNameError(null);
    setIsCategoryChanged(false);
  };

  const validateForm = () => {
    if (!currentProduct.productName?.trim()) {
      setNameError("Tên sản phẩm không được để trống");
      setError("Vui lòng nhập tên sản phẩm");
      return false;
    } else if (currentProduct.productName.length < 3) {
      setNameError("Tên sản phẩm phải có ít nhất 3 ký tự");
      setError(null);
      return false;
    }

    if (!currentProduct.description?.trim()) {
      setError("Vui lòng nhập mô tả sản phẩm");
      return false;
    } else if (currentProduct.description.length < 10) {
      setError("Mô tả sản phẩm phải có ít nhất 10 ký tự");
      return false;
    }

    if (!currentProduct.price) {
      setError("Vui lòng nhập giá sản phẩm");
      return false;
    } else if (isNaN(currentProduct.price) || currentProduct.price <= 0) {
      setError("Giá sản phẩm phải là một số dương");
      return false;
    }

    if (!currentProduct.categoryId) {
      setError("Vui lòng chọn danh mục");
      return false;
    }

    if (!currentProduct.unitOfMeasurement?.trim()) {
      setError("Vui lòng nhập đơn vị tính");
      return false;
    }

    if (!currentProduct.expirationDate) {
      setError("Vui lòng nhập hạn sử dụng");
      return false;
    } else if (new Date(currentProduct.expirationDate) < new Date()) {
      setError("Hạn sử dụng phải lớn hơn ngày hiện tại");
      return false;
    }

    if (modalMode === "add" && !selectedFile && !currentProduct.imageUrl) {
      setError("Vui lòng chọn ảnh sản phẩm");
      return false;
    }

    setNameError("");
    setError(null);
    return true;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>

        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Tìm kiếm sản phẩm"
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
              Tìm thấy {displayedProducts.length} kết quả trên toàn hệ thống.
              {displayedProducts.length > 0 && (
                <button onClick={clearSearch} className="ml-2 text-blue-600 hover:underline">
                  Quay lại danh sách đầy đủ
                </button>
              )}
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
            onClick={handleAddProduct}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Thêm sản phẩm
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
                  <th className="px-4 py-2 text-left w-12">STT</th>
                  <th className="px-4 py-2 text-left w-24">Hình ảnh</th>
                  <th className="px-4 py-2 text-left w-48">Tên sản phẩm</th>
                  <th className="px-4 py-2 text-left w-60">Mô tả</th>
                  <th className="px-4 py-2 text-right w-28">Giá</th>
                  <th className="px-4 py-2 text-left w-16">Số lượng</th>
                  <th className="px-4 py-2 text-left w-32">Danh mục</th>
                  <th className="px-4 py-2 text-left w-40">Danh mục chi tiết</th>
                  <th className="px-4 py-2 text-center w-36">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((product, index) => (
                  <tr key={product.productId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{(page - 1) * 10 + index + 1}</td>
                    <td className="px-4 py-3">
                      {product.imageUrl ? (
                        <img
                          src={`http://localhost:3000${product.imageUrl}`}
                          alt={product.productName}
                          className="h-24 w-24 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{product.productName}</td>
                    <td className="px-4 py-3 relative group">
                      <div className="max-w-xs overflow-hidden">
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {product.description || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          product.quantity > 10
                            ? "bg-green-100 text-green-800"
                            : product.quantity > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.quantity > 0 ? product.quantity : "Hết hàng"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.category?.categoryName || "Không có danh mục"}
                    </td>

                    <td className="px-4 py-3">
                      {product.detailCategories && product.detailCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.detailCategories.slice(0, 2).map((dc, idx) => (
                            <span
                              key={dc.DetailCategoryId || `detail-${product.productId}-${idx}`}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {getDetailCategoryName(dc)}
                            </span>
                          ))}
                          {product.detailCategories.length > 2 && (
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              +{product.detailCategories.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">Không có chi tiết</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" /> Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chỉ hiển thị phân trang khi không đang tìm kiếm */}
          {!searchTerm && totalPages > 1 && (
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

          {/* Khi đang tìm kiếm, hiển thị thông báo không có phân trang */}
          {searchTerm && displayedProducts.length > 0 && (
            <div className="text-center mt-4 text-sm text-gray-600">
              Đang hiển thị tất cả kết quả tìm kiếm. Phân trang bị tắt trong chế độ tìm kiếm.
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {modalMode === "add" ? "Thêm sản phẩm mới" : "Sửa sản phẩm"}
            </h2>

            <form onSubmit={handleSaveProduct}>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 pb-1 border-b">Thông tin sản phẩm</h3>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={currentProduct.productName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded shadow appearance-none ${
                        nameError ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {nameError && <p className="text-red-500 text-xs italic mt-1">{nameError}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={currentProduct.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded shadow appearance-none"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="categoryId"
                      value={currentProduct.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded shadow appearance-none"
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentProduct.categoryId && (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Danh mục chi tiết
                      </label>
                      {loadingDetailCategories ? (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                          <span>Đang tải...</span>
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border rounded p-2">
                          {detailCategories && detailCategories.length > 0 ? (
                            detailCategories.map((detailCategory) => (
                              <div key={detailCategory.DetailCategoryId} className="mb-1">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-blue-600"
                                    checked={selectedDetailCategories.includes(
                                      detailCategory.DetailCategoryId
                                    )}
                                    onChange={() =>
                                      handleDetailCategoryChange(detailCategory.DetailCategoryId)
                                    }
                                  />
                                  <span className="ml-2">
                                    {`${detailCategory.DetailType} - ${detailCategory.DetailValue} ` ||
                                      "Danh mục không có tên"}
                                  </span>
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 py-2">
                              Không có danh mục chi tiết nào cho danh mục này
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nhà cung cấp
                    </label>
                    <input
                      type="text"
                      name="providerName"
                      value={currentProduct.providerName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded shadow appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 pb-1 border-b">Giá & Thông tin khác</h3>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Giá <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={currentProduct.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded shadow appearance-none"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="0"
                      value={currentProduct.quantity}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Đơn vị tính <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="unitOfMeasurement"
                      value={currentProduct.unitOfMeasurement}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded shadow appearance-none"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Hạn sử dụng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expirationDate"
                      value={
                        currentProduct.expirationDate
                          ? new Date(currentProduct.expirationDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded shadow appearance-none"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mã giảm giá
                    </label>
                    {modalMode === "add" ? (
                      <p className="text-sm text-gray-600 italic">
                        Mã giảm giá có thể được thêm sau khi tạo sản phẩm từ trang quản lý khuyến
                        mãi
                      </p>
                    ) : loadingDiscounts ? (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        <span>Đang tải...</span>
                      </div>
                    ) : (
                      <div className="border rounded p-3">
                        {productDiscounts ? (
                          <div className="bg-green-50 p-2 rounded text-center">
                            <span className="font-medium text-green-700 text-base">
                              {productDiscounts.DiscountName} - {productDiscounts.DiscountValue}%
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 py-2 text-center">
                            Sản phẩm chưa có mã giảm giá
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 pb-1 border-b">Hình ảnh sản phẩm</h3>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Ảnh sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded shadow appearance-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ chấp nhận file ảnh (JPG, PNG, GIF). Kích thước tối đa 5MB.
                  </p>
                </div>

                {currentProduct.imageUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Xem trước:</p>
                    <img
                      src={
                        selectedFile
                          ? currentProduct.imageUrl
                          : `http://localhost:3000${currentProduct.imageUrl}`
                      }
                      alt="Product preview"
                      className="h-48 object-contain border p-2 rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
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
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && productToDelete && (
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
              <p className="text-gray-700 mb-2">Bạn có chắc chắn muốn xóa sản phẩm sau?</p>
              <p className="font-semibold text-lg">"{productToDelete.productName}"</p>
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

export default ProductManagement;
