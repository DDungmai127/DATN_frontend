import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown } from "@fortawesome/free-solid-svg-icons";

const CategoryBar = () => {
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailCategories, setDetailCategories] = useState({});

  // API URL
  const API_URL = "http://localhost:3000/api";

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/categories`);
        if (response.data && response.data.success) {
          setCategories(response.data.data || []);
        } else {
          throw new Error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Could not load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch detail categories when a category is hovered
  const fetchDetailCategories = async (categoryId) => {
    if (detailCategories[categoryId]) return; // Nếu đã có dữ liệu, không fetch lại

    try {
      console.log("Fetching details for category:", categoryId);
      const response = await axios.get(`${API_URL}/categories/${categoryId}/details`);

      if (response.data && response.data.success) {
        setDetailCategories((prev) => ({
          ...prev,
          [categoryId]: response.data.data || [],
        }));
      }
    } catch (error) {
      console.error(`Error fetching detail categories for ${categoryId}:`, error);
    }
  };

  const handleCategoryHover = (index, categoryId) => {
    setHoveredCategory(index);
    if (categoryId) {
      fetchDetailCategories(categoryId);
    }
  };

  // Hàm nhóm detail categories theo loại (nếu có)
  const groupDetailCategoriesByType = (details) => {
    if (!details || details.length === 0) return {};

    return details.reduce((groups, detail) => {
      const type = detail.detailType || detail.DetailType || "Khác";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(detail);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-md sticky top-[80px] z-40">
        <div className="container mx-auto p-4">
          <div className="flex space-x-6 animate-pulse">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-6 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  if (error) {
    return (
      <nav className="bg-white shadow-md sticky top-[80px] z-40">
        <div className="container mx-auto p-4 text-center text-red-500">{error}</div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md sticky top-[80px] z-40">
      <div className="container mx-auto">
        {/* Hiển thị danh mục theo chiều ngang */}
        <ul className="flex flex-wrap border-b">
          {categories.map((category, index) => (
            <li
              key={category.categoryId}
              className="relative"
              onMouseEnter={() => handleCategoryHover(index, category.categoryId)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link
                to={`/category/${category.categoryId}`}
                className={`block py-3 px-4 transition-colors flex items-center ${
                  hoveredCategory === index ? "text-red-600" : "hover:text-red-500 text-gray-700"
                }`}
              >
                <span className="font-medium">{category.categoryName}</span>
                <FontAwesomeIcon
                  icon={faAngleDown}
                  className={`ml-1 text-xs ${
                    hoveredCategory === index ? "text-red-600" : "text-gray-400"
                  }`}
                />
              </Link>

              {/* Dropdown khi hover vào danh mục */}
              {hoveredCategory === index && detailCategories[category.categoryId]?.length > 0 && (
                <div className="absolute left-0 bg-white shadow-lg rounded-b-md z-50 border-t-2 border-red-500 w-[500px]">
                  <div className="flex">
                    {/* Phần hiển thị hình ảnh danh mục */}
                    <div className="w-1/3 p-4 flex flex-col items-center justify-center">
                      <div className="w-full h-40 relative overflow-hidden rounded-md mb-3">
                        <img
                          src={`http://localhost:3000${category.categoryImage}`}
                          alt={category.categoryName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-center font-medium text-gray-800">
                        {category.categoryName}
                      </h3>
                    </div>

                    {/* Phần hiển thị các chi tiết danh mục */}
                    <div className="w-2/3 border-l p-4">
                      {(() => {
                        const details = detailCategories[category.categoryId];
                        const groupedDetails = groupDetailCategoriesByType(details);
                        const detailTypes = Object.keys(groupedDetails);

                        // Tìm kiếm key "Phân Loại" với nhiều cách viết khác nhau
                        const phanLoaiKey = detailTypes.find(
                          (key) =>
                            key
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/\s/g, "") === "phanloai"
                        );

                        if (phanLoaiKey) {
                          const phanLoaiDetails = groupedDetails[phanLoaiKey];
                          return (
                            <div key="PhanLoai">
                              <h3 className="font-semibold border-b pb-2 mb-2">Phân Loại</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {phanLoaiDetails.map((detail) => (
                                  <Link
                                    key={detail.detailCategoryId || detail.DetailCategoryId}
                                    to={`/category/${category.categoryId}?detail=${
                                      detail.detailCategoryId || detail.DetailCategoryId
                                    }`}
                                    className="hover:text-red-600 text-gray-700 py-1.5 block"
                                  >
                                    {detail.detailValue || detail.DetailValue}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 gap-2">
                            {details.map((detail) => (
                              <Link
                                key={detail.detailCategoryId || detail.DetailCategoryId}
                                to={`/category/${category.categoryId}?detail=${
                                  detail.detailCategoryId || detail.DetailCategoryId
                                }`}
                                className="hover:text-red-600 text-gray-700 py-1.5 block"
                              >
                                {detail.detailValue || detail.DetailValue}
                              </Link>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryBar;
