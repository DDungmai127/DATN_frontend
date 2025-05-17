import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBoxOpen,
    faListAlt,
    faUsers,
    faMoneyBillWave,
    faChartLine,
    faShoppingCart,
    faExclamationCircle,
    faCheck,
    faTruck,
} from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
    // State cho thống kê
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        users: 0,
        revenue: 0,
    });

    // State cho đơn hàng mới nhất
    const [recentOrders, setRecentOrders] = useState([]);

    // State cho trạng thái loading
    const [loading, setLoading] = useState(true);

    // Fetch dữ liệu thống kê
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Trong thực tế, bạn sẽ gọi API để lấy dữ liệu
                // Ví dụ:
                // const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`);
                // const data = await response.json();

                // Dữ liệu mẫu
                setTimeout(() => {
                    setStats({
                        products: 157,
                        categories: 18,
                        users: 342,
                        revenue: 15800000,
                    });

                    setRecentOrders([
                        {
                            id: "ORD238",
                            customer: "Nguyễn Văn A",
                            total: 750000,
                            date: "2025-05-06",
                            status: "completed",
                        },
                        {
                            id: "ORD237",
                            customer: "Trần Thị B",
                            total: 1250000,
                            date: "2025-05-06",
                            status: "processing",
                        },
                        {
                            id: "ORD236",
                            customer: "Lê Văn C",
                            total: 450000,
                            date: "2025-05-05",
                            status: "shipped",
                        },
                        {
                            id: "ORD235",
                            customer: "Phạm Thị D",
                            total: 850000,
                            date: "2025-05-05",
                            status: "processing",
                        },
                        {
                            id: "ORD234",
                            customer: "Hoàng Văn E",
                            total: 320000,
                            date: "2025-05-04",
                            status: "completed",
                        },
                    ]);

                    setLoading(false);
                }, 800);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu thống kê:", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Format số tiền VND
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    // Lấy icon và màu sắc cho trạng thái đơn hàng
    const getStatusInfo = (status) => {
        switch (status) {
            case "completed":
                return {
                    icon: faCheck,
                    color: "text-green-500",
                    bg: "bg-green-100",
                    text: "Hoàn thành",
                };
            case "processing":
                return {
                    icon: faShoppingCart,
                    color: "text-blue-500",
                    bg: "bg-blue-100",
                    text: "Đang xử lý",
                };
            case "shipped":
                return {
                    icon: faTruck,
                    color: "text-yellow-500",
                    bg: "bg-yellow-100",
                    text: "Đang giao hàng",
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

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
                <p className="text-gray-600">Chào mừng đến với bảng điều khiển quản trị</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Thẻ thống kê */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 mr-4">
                                <FontAwesomeIcon
                                    icon={faBoxOpen}
                                    className="text-blue-500 text-xl"
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Sản phẩm</p>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {stats.products}
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
                            <div className="p-3 rounded-full bg-green-100 mr-4">
                                <FontAwesomeIcon
                                    icon={faListAlt}
                                    className="text-green-500 text-xl"
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Danh mục</p>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {stats.categories}
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
                            <div className="p-3 rounded-full bg-purple-100 mr-4">
                                <FontAwesomeIcon
                                    icon={faUsers}
                                    className="text-purple-500 text-xl"
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Người dùng</p>
                                <h3 className="text-2xl font-bold text-gray-800">{stats.users}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 mr-4">
                                <FontAwesomeIcon
                                    icon={faMoneyBillWave}
                                    className="text-yellow-500 text-xl"
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Doanh thu tháng</p>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {formatCurrency(stats.revenue)}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Biểu đồ doanh thu */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    <FontAwesomeIcon
                                        icon={faChartLine}
                                        className="text-blue-500 mr-2"
                                    />
                                    Doanh thu theo thời gian
                                </h2>
                                <select className="border rounded-md px-3 py-1 text-sm bg-gray-50">
                                    <option>7 ngày qua</option>
                                    <option>30 ngày qua</option>
                                    <option>3 tháng qua</option>
                                </select>
                            </div>

                            {/* Placeholder cho biểu đồ - thay thế bằng thư viện biểu đồ thực tế */}
                            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                                <div className="text-center text-gray-500">
                                    <p className="mb-2 font-medium">
                                        Biểu đồ doanh thu sẽ hiển thị ở đây
                                    </p>
                                    <p className="text-sm">
                                        Sử dụng thư viện như Chart.js hoặc Recharts
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Đơn hàng gần đây */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                <FontAwesomeIcon
                                    icon={faShoppingCart}
                                    className="text-blue-500 mr-2"
                                />
                                Đơn hàng gần đây
                            </h2>

                            <div className="space-y-4">
                                {recentOrders.map((order) => {
                                    const status = getStatusInfo(order.status);
                                    return (
                                        <div
                                            key={order.id}
                                            className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">{order.id}</span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={status.icon}
                                                        className="mr-1"
                                                    />
                                                    {status.text}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {order.customer}
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(order.date).toLocaleDateString("vi-VN")}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button className="w-full mt-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg text-sm transition">
                                Xem tất cả đơn hàng
                            </button>
                        </div>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="font-semibold mb-4">Sản phẩm bán chạy</h3>
                            <ul className="space-y-2">
                                <li className="flex justify-between text-sm">
                                    <span>Áo thun nam</span>
                                    <span className="font-medium">32 đã bán</span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span>Quần jean nữ</span>
                                    <span className="font-medium">28 đã bán</span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span>Giày thể thao</span>
                                    <span className="font-medium">25 đã bán</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="font-semibold mb-4">Danh mục phổ biến</h3>
                            <ul className="space-y-2">
                                <li className="flex justify-between text-sm">
                                    <span>Quần áo</span>
                                    <span className="font-medium">126 sản phẩm</span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span>Giày dép</span>
                                    <span className="font-medium">85 sản phẩm</span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span>Phụ kiện</span>
                                    <span className="font-medium">64 sản phẩm</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="font-semibold mb-4">Hoạt động gần đây</h3>
                            <div className="space-y-3">
                                <div className="text-sm">
                                    <div className="font-medium">Admin đã thêm sản phẩm mới</div>
                                    <div className="text-xs text-gray-500">Hôm nay, 10:23</div>
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium">Người dùng mới đăng ký</div>
                                    <div className="text-xs text-gray-500">Hôm nay, 09:41</div>
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium">Cập nhật danh mục</div>
                                    <div className="text-xs text-gray-500">Hôm qua, 15:30</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
