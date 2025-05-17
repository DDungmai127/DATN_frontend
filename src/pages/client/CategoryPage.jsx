import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ProductCard from "../../components/client/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faArrowDownWideShort,
  faArrowUpWideShort,
  faChevronLeft,
  faChevronRight,
  faHome,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [price, setPrice] = useState({ min: "", max: "" });
  const [filterOpen, setFilterOpen] = useState(false);

  // State cho DetailCategory filtering
  const [filterStructure, setFilterStructure] = useState({
    detailTypes: [],
    detailValuesByType: {},
  });
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterLoading, setFilterLoading] = useState(false);

  // Số sản phẩm mỗi trang
  const PRODUCTS_PER_PAGE = 24;

  // API URL
  const API_URL = "http://localhost:3000/api";

  // Fetch cấu trúc lọc khi component được mount và khi categoryId thay đổi
  useEffect(() => {
    const fetchFilterStructure = async () => {
      if (!categoryId) return;

      try {
        setFilterLoading(true);
        const response = await axios.get(`${API_URL}/categories/structure/${categoryId}`);

        if (response.data.success) {
          setFilterStructure(response.data.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải cấu trúc lọc:", err);
      } finally {
        setFilterLoading(false);
      }
    };

    fetchFilterStructure();
  }, [categoryId]);

  // Fetch dữ liệu sản phẩm khi component được mount hoặc tham số thay đổi
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);

        // Fetch thông tin danh mục
        const categoryResponse = await axios.get(`${API_URL}/categories/${categoryId}`);
        setCategory(categoryResponse.data.data);
        document.title = `${categoryResponse.data.data?.categoryName || "Danh mục"} - Cửa hàng`;

        // Chuẩn bị các tham số cho API call
        const params = new URLSearchParams({
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
          sortBy: sortBy,
          sortOrder: sortOrder,
          categoryId: categoryId,
        });

        // Thêm điều kiện lọc giá nếu có
        if (price.min) params.append("minPrice", price.min);
        if (price.max) params.append("maxPrice", price.max);

        // Thêm điều kiện lọc theo DetailCategory nếu có
        let detailCategoryIds = [];
        Object.values(selectedFilters).forEach((ids) => {
          detailCategoryIds = [...detailCategoryIds, ...ids];
        });

        if (detailCategoryIds.length > 0) {
          params.append("detailCategoryIds", detailCategoryIds.join(","));
        }

        // Quyết định endpoint dựa vào việc có lọc theo DetailCategory hay không
        const endpoint =
          detailCategoryIds.length > 0
            ? `${API_URL}/products/filter`
            : `${API_URL}/products/category/${categoryId}`;

        const productsResponse = await axios.get(`${endpoint}?${params.toString()}`);

        // Xử lý kết quả
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data || []);
          setTotalPages(productsResponse.data.pagination?.totalPages || 1);
          setCurrentPage(productsResponse.data.pagination?.currentPage || 1);
          setTotalItems(productsResponse.data.pagination?.totalItems || 0);
          setError(null);
        } else {
          throw new Error(productsResponse.data.message || "Không thể lấy dữ liệu sản phẩm");
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
        if (error.response?.status === 404) {
          setError("Không tìm thấy danh mục sản phẩm này.");
        } else {
          setError("Đã có lỗi xảy ra khi tải thông tin danh mục sản phẩm.");
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId, currentPage, sortBy, sortOrder, price.min, price.max, selectedFilters]);

  // Hàm xử lý khi thay đổi bộ lọc DetailCategory
  const handleFilterChange = (detailType, detailCategoryId, checked) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };

      // Nếu loại lọc chưa tồn tại, khởi tạo mảng rỗng
      if (!newFilters[detailType]) {
        newFilters[detailType] = [];
      }

      if (checked) {
        // Thêm vào lọc nếu được chọn
        if (!newFilters[detailType].includes(detailCategoryId)) {
          newFilters[detailType] = [...newFilters[detailType], detailCategoryId];
        }
      } else {
        // Xóa khỏi lọc nếu bỏ chọn
        newFilters[detailType] = newFilters[detailType].filter((id) => id !== detailCategoryId);

        // Xóa loại lọc nếu không còn giá trị nào được chọn
        if (newFilters[detailType].length === 0) {
          delete newFilters[detailType];
        }
      }

      return newFilters;
    });

    // Reset về trang 1 khi thay đổi bộ lọc
    setCurrentPage(1);
  };

  // Xóa một lựa chọn lọc cụ thể
  const removeFilter = (detailType, detailCategoryId) => {
    handleFilterChange(detailType, detailCategoryId, false);
  };

  // Xóa tất cả các lọc
  const clearAllFilters = () => {
    setSelectedFilters({});
    setPrice({ min: "", max: "" });
    setCurrentPage(1);
  };

  // Hàm xử lý khi thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hàm xử lý khi thay đổi sắp xếp
  const handleSortChange = (field) => {
    if (field === sortBy) {
      // Nếu click vào cùng field, đổi chiều sắp xếp
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nếu click vào field khác, set field mới và mặc định desc
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset về trang 1 khi thay đổi sắp xếp
  };

  // Hàm xử lý khi áp dụng lọc giá
  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset về trang 1 khi lọc
  };

  // Hiển thị các lọc đã chọn
  const renderSelectedFilters = () => {
    const hasFilters = Object.keys(selectedFilters).length > 0 || price.min || price.max;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap items-center bg-white p-2 rounded-lg shadow mb-4">
        <span className="text-gray-700 mr-2 mb-2">Đang lọc theo:</span>

        {/* Hiển thị các DetailCategory đã chọn */}
        {Object.entries(selectedFilters).map(([detailType, ids]) =>
          ids.map((id) => {
            // Tìm giá trị tương ứng với id
            const detailValue =
              filterStructure.detailValuesByType[detailType]?.find(
                (item) => item.DetailCategoryId === id
              )?.DetailValue || "Không xác định";

            return (
              <div
                key={id}
                className="flex items-center bg-red-100 text-red-800 text-sm px-2 py-1 rounded mr-2 mb-2"
              >
                <span>
                  {detailType}: {detailValue}
                </span>
                <button
                  onClick={() => removeFilter(detailType, id)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            );
          })
        )}

        {/* Hiển thị lọc giá nếu có */}
        {(price.min || price.max) && (
          <div className="flex items-center bg-red-100 text-red-800 text-sm px-2 py-1 rounded mr-2 mb-2">
            <span>
              Giá: {price.min ? `từ ${Number(price.min).toLocaleString()}₫` : ""}
              {price.min && price.max ? " - " : ""}
              {price.max ? `đến ${Number(price.max).toLocaleString()}₫` : ""}
            </span>
            <button
              onClick={() => setPrice({ min: "", max: "" })}
              className="ml-1 text-red-600 hover:text-red-800"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        <button
          onClick={clearAllFilters}
          className="text-gray-600 hover:text-red-600 text-sm underline ml-2 mb-2"
        >
          Xóa tất cả
        </button>
      </div>
    );
  };

  // Render bộ lọc DetailCategory
  const renderDetailCategoryFilters = () => {
    if (!filterOpen) return null;

    const { detailTypes, detailValuesByType } = filterStructure;

    if (filterLoading) {
      return (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
            <span className="ml-2 text-gray-600">Đang tải bộ lọc...</span>
          </div>
        </div>
      );
    }

    if (!detailTypes || detailTypes.length === 0) {
      return (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-gray-500 text-center py-4">
            Không có tùy chọn lọc nào cho danh mục này
          </p>
        </div>
      );
    }

    return (
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Lọc giá */}
          <div className="filter-group">
            <h3 className="text-lg font-medium mb-3">Giá</h3>
            <form onSubmit={handleApplyPriceFilter} className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={price.min}
                  onChange={(e) => setPrice({ ...price, min: e.target.value })}
                  placeholder="Từ"
                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span>-</span>
                <input
                  type="number"
                  value={price.max}
                  onChange={(e) => setPrice({ ...price, max: e.target.value })}
                  placeholder="Đến"
                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex">
                <button
                  type="submit"
                  className="flex-1 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Áp dụng
                </button>
                {(price.min || price.max) && (
                  <button
                    type="button"
                    onClick={() => setPrice({ min: "", max: "" })}
                    className="ml-2 px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Các bộ lọc DetailCategory */}
          {detailTypes.map((detailType) => (
            <div key={detailType} className="filter-group">
              <h3 className="text-lg font-medium mb-3">{detailType}</h3>
              <div className="space-y-2">
                {detailValuesByType[detailType]?.map((detail) => (
                  <div key={detail.DetailCategoryId} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`filter-${detail.DetailCategoryId}`}
                      checked={
                        selectedFilters[detailType]?.includes(detail.DetailCategoryId) || false
                      }
                      onChange={(e) =>
                        handleFilterChange(detailType, detail.DetailCategoryId, e.target.checked)
                      }
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`filter-${detail.DetailCategoryId}`}
                      className="ml-2 text-gray-700 cursor-pointer text-sm"
                    >
                      {detail.DetailValue}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p>Đang tải sản phẩm...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500 text-xl mb-4">⚠️ {error}</p>
            <Link to="/" className="text-blue-500 hover:underline flex items-center justify-center">
              <FontAwesomeIcon icon={faHome} className="mr-2" />
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 px-4">
        {/* Phần Breadcrumb */}
        <nav className="flex mb-4">
          <ol className="flex items-center space-x-2 text-gray-500 text-sm">
            <li>
              <Link to="/" className="hover:text-red-600">
                Trang chủ
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-red-600 font-medium">
              {category?.categoryName || "Danh mục sản phẩm"}
            </li>
          </ol>
        </nav>

        {/* Tiêu đề trang và thông tin */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {category?.categoryName || "Danh mục sản phẩm"}
          </h1>
          {category?.description && <p className="text-gray-600 mt-2">{category.description}</p>}
          <p className="text-gray-500 mt-2">
            Hiển thị {products.length} sản phẩm{" "}
            {totalItems > 0
              ? `(Trang ${currentPage}/${totalPages}, tổng ${totalItems} sản phẩm)`
              : ""}
          </p>
        </div>

        {/* Hiển thị các lọc đã chọn */}
        {renderSelectedFilters()}

        {/* Bộ lọc và sắp xếp */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="mr-4 px-4 py-2 flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                <span>{filterOpen ? "Ẩn bộ lọc" : "Bộ lọc"}</span>
              </button>
              <span className="text-gray-700 hidden sm:inline">Sắp xếp theo:</span>
              <div className="flex ml-2 space-x-2">
                <button
                  onClick={() => handleSortChange("price")}
                  className={`px-3 py-1 rounded ${
                    sortBy === "price" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Giá
                  {sortBy === "price" && (
                    <FontAwesomeIcon
                      icon={sortOrder === "asc" ? faArrowUpWideShort : faArrowDownWideShort}
                      className="ml-1"
                    />
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("createdAt")}
                  className={`px-3 py-1 rounded ${
                    sortBy === "createdAt" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Mới nhất
                  {sortBy === "createdAt" && (
                    <FontAwesomeIcon
                      icon={sortOrder === "asc" ? faArrowUpWideShort : faArrowDownWideShort}
                      className="ml-1"
                    />
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("productName")}
                  className={`px-3 py-1 rounded ${
                    sortBy === "productName" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Tên
                  {sortBy === "productName" && (
                    <FontAwesomeIcon
                      icon={sortOrder === "asc" ? faArrowUpWideShort : faArrowDownWideShort}
                      className="ml-1"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Phần lọc chi tiết (hiện/ẩn) */}
          {renderDetailCategoryFilters()}
        </div>

        {/* Danh sách sản phẩm */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Không có sản phẩm nào thỏa mãn điều kiện.</p>
            <p className="mt-2 text-gray-400 text-sm">
              Vui lòng thử lại với danh mục khác hoặc thay đổi bộ lọc.
            </p>
            {Object.keys(selectedFilters).length > 0 || price.min || price.max ? (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Xóa tất cả bộ lọc
              </button>
            ) : null}
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              {/* Hiển thị các số trang */}
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;

                // Chỉ hiển thị trang hiện tại, 2 trang trước và sau, trang đầu và cuối
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? "bg-red-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }

                // Hiển thị dấu "..." nếu có khoảng cách
                if (
                  (page === 2 && currentPage > 4) ||
                  (page === totalPages - 1 && currentPage < totalPages - 3)
                ) {
                  return (
                    <span key={page} className="px-3 py-1">
                      ...
                    </span>
                  );
                }

                return null;
              })}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
