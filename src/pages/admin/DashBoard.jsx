import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faListAlt,
  faUsers,
  faMoneyBillWave,
  faStore,
  faWarehouse,
  faShoppingCart,
  faChartLine,
  faCheck,
  faClock,
  faTruck,
  faTimesCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_URL = "http://localhost:3000/api";

const Dashboard = () => {
  // State cho thống kê cơ bản
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
    revenue: 0,
    stores: 0,
    inventory: {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
    },
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState("7days");
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };
  const calculateOrderTotal = (order) => {
    // Tính tổng từ các orderItems
    return order.orderItems.reduce((total, item) => {
      return total + +item.amount;
    }, 0);
  };

  // Fetch dữ liệu khi component mount hoặc timeframe thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Chỉ fetch những API cần thiết cho dashboard đơn giản
        const [productsRes, ordersRes, storesRes] = await Promise.all([
          axios.get(`${API_URL}/products?limit=1`, { withCredentials: true }),
          axios.get(`${API_URL}/orders/all?page=1&limit=5`, { withCredentials: true }),
          axios.get(`${API_URL}/stores?limit=1`, { withCredentials: true }),
        ]);

        // Cập nhật thống kê cơ bản
        setStats((prevStats) => ({
          ...prevStats,
          products: productsRes.data.pagination?.totalItems || 0,
          stores: storesRes.data.pagination?.totalItems || 0,
          // Các thống kê khác giữ nguyên giá trị mặc định
        }));

        // Cập nhật đơn hàng gần đây
        setRecentOrders(ordersRes.data.data || []);

        // Thử fetch dữ liệu doanh thu nếu API có sẵn
        try {
          const revenueRes = await axios.get(
            `${API_URL}/orders/statistics/revenue?timeframe=${chartTimeframe}`,
            { withCredentials: true }
          );
          if (revenueRes.data && revenueRes.data.data) {
            setRevenueData(revenueRes.data.data);
          }
        } catch (err) {
          console.warn("Không thể lấy dữ liệu doanh thu:", err);
          setRevenueData([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartTimeframe]);

  // Lấy thông tin trạng thái đơn hàng
  const getStatusInfo = (status) => {
    status = String(status || "").toLowerCase();
    switch (status) {
      case "đã giao hàng":
        return {
          icon: faCheck,
          color: "text-green-500",
          bg: "bg-green-100",
          text: "Hoàn thành",
        };
      case "chờ xử lý":
        return {
          icon: faClock,
          color: "text-blue-500",
          bg: "bg-blue-100",
          text: "Đang xử lý",
        };
      case "đang giao hàng":
        return {
          icon: faTruck,
          color: "text-yellow-500",
          bg: "bg-yellow-100",
          text: "Đang giao hàng",
        };
      case "đã hủy":
        return {
          icon: faTimesCircle,
          color: "text-red-500",
          bg: "bg-red-100",
          text: "Đã hủy",
        };
      default:
        return {
          icon: faExclamationCircle,
          color: "text-gray-500",
          bg: "bg-gray-100",
          text: "Không xác định",
        };
    }
  };

  // Xử lý thay đổi timeframe biểu đồ
  const handleTimeframeChange = (e) => {
    setChartTimeframe(e.target.value);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
        <p className="text-gray-600">Quản lý cửa hàng điện máy</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Thống kê cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <FontAwesomeIcon icon={faBoxOpen} className="text-blue-500 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Sản phẩm</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.products}</h3>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 mr-4">
                <FontAwesomeIcon icon={faStore} className="text-indigo-500 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Cửa hàng</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.stores}</h3>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
              <div className="p-3 rounded-full bg-teal-100 mr-4">
                <FontAwesomeIcon icon={faShoppingCart} className="text-teal-500 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Đơn hàng</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {recentOrders.length || 0}
                  <span className="text-sm font-normal text-gray-500 ml-2">gần đây</span>
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Biểu đồ doanh thu đơn giản */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  <FontAwesomeIcon icon={faChartLine} className="text-blue-500 mr-2" />
                  Doanh thu theo thời gian
                </h2>
                <select
                  className="border rounded-md px-3 py-1 text-sm bg-gray-50"
                  value={chartTimeframe}
                  onChange={handleTimeframeChange}
                >
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                  <option value="3months">3 tháng qua</option>
                </select>
              </div>

              {/* Biểu đồ đơn giản */}
              <div className="h-64">
                {revenueData && revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <p className="mb-2 font-medium">Không có dữ liệu doanh thu</p>
                      <p className="text-sm">Dữ liệu sẽ hiển thị khi có đơn hàng</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Đơn hàng gần đây */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                <FontAwesomeIcon icon={faShoppingCart} className="text-blue-500 mr-2" />
                Đơn hàng gần đây
              </h2>

              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    console.log(order.status);
                    const status = getStatusInfo(order.status);
                    console.log(status);
                    return (
                      <div
                        key={order.orderId}
                        className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{order.orderId}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}
                          >
                            <FontAwesomeIcon icon={status.icon} className="mr-1" />
                            {status.text}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate">
                            {order.customerName || "Khách hàng"}
                          </span>
                          <span className="font-medium">
                            {" "}
                            {formatPrice(calculateOrderTotal(order))}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-4">Không có đơn hàng gần đây</div>
                )}
              </div>

              <Link to="/admin/orders">
                <button className="w-full mt-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg text-sm transition">
                  Xem tất cả đơn hàng
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
