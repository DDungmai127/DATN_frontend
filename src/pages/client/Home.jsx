import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductCard from "../../components/client/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faTag, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const HomePage = () => {
  // State đơn giản hóa
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // API URL
  const API_URL = "http://localhost:3000/api";

  // Số sản phẩm trong một hàng
  const PRODUCTS_PER_ROW = 6;

  // Fetch dữ liệu khi component được mount
  useEffect(() => {
    console.log("Fetching data for Home page");
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch danh mục
        const categoriesResponse = await axios.get(`${API_URL}/categories`);
        const allCategories = categoriesResponse.data.data || [];
        console.log("Categories loaded:", allCategories.length);
        setCategories(allCategories);

        // Fetch sản phẩm cho từng danh mục
        const productsData = {};
        const categoryPromises = allCategories.map(async (category) => {
          try {
            const response = await axios.get(
              `${API_URL}/products/category/${category.categoryId}?limit=${PRODUCTS_PER_ROW * 2}`
            );
            return {
              categoryId: category.categoryId,
              products: response.data?.data || response.data?.products || [],
            };
          } catch (error) {
            console.error(`Error fetching products for category ${category.categoryName}:`, error);
            return { categoryId: category.categoryId, products: [] };
          }
        });

        const categoryResults = await Promise.all(categoryPromises);
        categoryResults.forEach((result) => {
          productsData[result.categoryId] = result.products;
        });

        setCategoryProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Đã có lỗi xảy ra khi tải dữ liệu.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Xử lý nút "Xem thêm"
  const handleShowMore = (categoryId) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: true,
    });
  };

  // Loading state đơn giản
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-red-500 text-xl mb-4">⚠️ Lỗi</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Danh mục sản phẩm</h1>

        {/* Danh sách danh mục */}
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.categoryId} className="mb-8">
              {/* Tiêu đề danh mục */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <span className="w-1 bg-red-600 h-6 mr-2 rounded"></span>
                  <FontAwesomeIcon icon={faTag} className="text-red-600 mr-2" />
                  {category.categoryName}
                </h2>
                <Link
                  to={`/category/${category.categoryId}`}
                  className="text-red-600 hover:text-red-700 flex items-center text-sm"
                >
                  Xem tất cả
                  <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-xs" />
                </Link>
              </div>

              {/* Sản phẩm trong danh mục */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Array.isArray(categoryProducts[category.categoryId]) &&
                  categoryProducts[category.categoryId].length > 0 ? (
                    categoryProducts[category.categoryId]
                      .slice(
                        0,
                        expandedCategories[category.categoryId]
                          ? PRODUCTS_PER_ROW * 2
                          : PRODUCTS_PER_ROW
                      )
                      .map((product) => <ProductCard key={product.productId} product={product} />)
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">Không có sản phẩm trong danh mục này.</p>
                    </div>
                  )}
                </div>

                {/* Nút xem thêm */}
                {Array.isArray(categoryProducts[category.categoryId]) &&
                  categoryProducts[category.categoryId].length > PRODUCTS_PER_ROW &&
                  !expandedCategories[category.categoryId] && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => handleShowMore(category.categoryId)}
                        className="inline-flex items-center px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Xem thêm sản phẩm
                        <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Không có danh mục sản phẩm nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
