import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faChevronLeft,
  faChevronRight,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";

const CategoryBar = () => {
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailCategories, setDetailCategories] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Refs
  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

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

  // Calculate visible and hidden categories when categories change or on window resize
  useEffect(() => {
    if (categories.length === 0) return;

    const calculateVisibleCategories = () => {
      if (!scrollContainerRef.current) return;

      const containerWidth = scrollContainerRef.current.clientWidth;
      let availableWidth = containerWidth - 70; // Trừ đi chiều rộng của nút "More"
      let visibleCats = [];
      let hiddenCats = [];

      // Calculate which categories fit on screen
      for (const category of categories) {
        const catRef = categoryRefs.current[category.categoryId];
        if (catRef) {
          const catWidth = catRef.offsetWidth;

          if (availableWidth >= catWidth) {
            visibleCats.push(category);
            availableWidth -= catWidth;
          } else {
            hiddenCats.push(category);
          }
        } else {
          // If ref isn't available yet, assume it's visible
          visibleCats.push(category);
        }
      }

      setVisibleCategories(visibleCats);
      setHiddenCategories(hiddenCats);
    };

    // Set initial values (all categories visible)
    setVisibleCategories(categories);

    // Use a small timeout to let the DOM render first
    setTimeout(calculateVisibleCategories, 100);

    // Recalculate on window resize
    window.addEventListener("resize", calculateVisibleCategories);

    return () => {
      window.removeEventListener("resize", calculateVisibleCategories);
    };
  }, [categories]);

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

  const handleMoreHover = (event) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom, left: rect.left });
    setShowMore(true);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
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

  // Render dropdown content sử dụng Portal
  const renderDropdownContent = (category) => {
    const details = detailCategories[category.categoryId];
    if (!details || details.length === 0) return null;

    const categoryElement = categoryRefs.current[category.categoryId];
    if (!categoryElement) return null;

    const rect = categoryElement.getBoundingClientRect();
    const groupedDetails = groupDetailCategoriesByType(details);
    const detailTypes = Object.keys(groupedDetails);
    const phanLoaiKey = detailTypes.find(
      (key) =>
        key
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s/g, "") === "phanloai"
    );

    const dropdownContent = (
      <div
        className="fixed bg-white shadow-lg rounded-b-md z-[1000] w-[500px]"
        style={{
          top: `${rect.bottom}px`,
          left: `${rect.left}px`,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Thanh đỏ phía trên */}
        <div
          className="h-0.5 bg-red-600 w-full"
          style={{
            width: rect.width,
            position: "absolute",
            top: "-0.5px",
            left: 0,
          }}
        />

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
            <h3 className="text-center font-medium text-gray-800">{category.categoryName}</h3>
          </div>

          {/* Phần hiển thị các chi tiết danh mục */}
          <div className="w-2/3 border-l p-4">
            {phanLoaiKey ? (
              <div key="PhanLoai">
                <h3 className="font-semibold border-b pb-2 mb-2">Phân Loại</h3>
                <div className="grid grid-cols-2 gap-2">
                  {groupedDetails[phanLoaiKey].map((detail) => (
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
            ) : (
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
            )}
          </div>
        </div>
      </div>
    );

    return createPortal(dropdownContent, document.body);
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
      <div className="container mx-auto relative overflow-visible">
        {/* Hiển thị danh mục theo chiều ngang với scroll */}
        <div className="flex items-center border-b relative">
          {/* Left scroll button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 h-full bg-gradient-to-r from-white via-white to-transparent px-2 z-10 flex items-center"
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-gray-500 hover:text-gray-700" />
          </button>

          {/* Scrollable categories container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto py-1 px-8 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {visibleCategories.map((category, index) => (
              <div
                key={category.categoryId}
                ref={(el) => (categoryRefs.current[category.categoryId] = el)}
                className="relative flex-shrink-0"
                onMouseEnter={() => handleCategoryHover(index, category.categoryId)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={`/category/${category.categoryId}`}
                  className={`block py-3 px-4 transition-colors flex items-center whitespace-nowrap ${
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
                {hoveredCategory === index && renderDropdownContent(category)}
              </div>
            ))}

            {/* More categories dropdown button */}
            {hiddenCategories.length > 0 && (
              <div
                className="relative flex-shrink-0 ml-2"
                onMouseEnter={handleMoreHover}
                onMouseLeave={() => setShowMore(false)}
              >
                <button className="py-3 px-4 flex items-center text-gray-700 hover:text-red-500 whitespace-nowrap">
                  <FontAwesomeIcon icon={faEllipsisV} className="mr-2" />
                  <span>Xem thêm</span>
                </button>

                {/* More categories dropdown */}
                {showMore && (
                  <div
                    className="fixed bg-white shadow-lg rounded-md z-[200] border min-w-[200px] max-h-[400px] overflow-y-auto"
                    style={{
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                    }}
                  >
                    <div className="py-2">
                      {hiddenCategories.map((category) => (
                        <div key={category.categoryId} className="relative hover:bg-gray-50">
                          <Link
                            to={`/category/${category.categoryId}`}
                            className="block px-4 py-2 hover:text-red-500 text-gray-700"
                            onMouseEnter={() => fetchDetailCategories(category.categoryId)}
                          >
                            {category.categoryName}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right scroll button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 h-full bg-gradient-to-l from-white via-white to-transparent px-2 z-10 flex items-center"
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default CategoryBar;
