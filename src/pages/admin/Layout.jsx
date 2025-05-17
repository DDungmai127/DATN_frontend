import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/SideBar";
import Header from "../../components/admin/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const Layout = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Đảm bảo tất cả hooks được khai báo ở đầu component, trước bất kỳ điều kiện nào
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Kiểm tra localStorage trước
                const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

                // Lấy API URL từ biến môi trường
                const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

                console.log("API URL being used:", API_URL);

                // Gọi API với xử lý lỗi tốt hơn
                if (adminInfo && adminInfo.isLoggedIn) {
                    try {
                        const response = await fetch(`${API_URL}/auth/me`, {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                Accept: "application/json",
                            },
                        });

                        if (response.ok) {
                            const data = await response.json();

                            if (data.success && data.data.role === "admin") {
                                setIsAdmin(true);
                            } else {
                                setIsAdmin(false);
                                localStorage.removeItem("adminInfo");
                            }
                        } else {
                            setIsAdmin(false);
                            localStorage.removeItem("adminInfo");
                        }
                    } catch (apiError) {
                        console.error("API error:", apiError);
                        // Vẫn tin tưởng localStorage nếu API lỗi
                        setIsAdmin(adminInfo.role === "admin");
                    }
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Authentication error:", error);
                setError("Có lỗi xảy ra khi kiểm tra trạng thái đăng nhập");
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Render UI sau khi đã khai báo tất cả hooks
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Nếu không phải admin, chuyển hướng đến trang đăng nhập
    if (!isAdmin) {
        return <Navigate to="/admin/login" />;
    }

    // Hiển thị layout khi đã đăng nhập và là admin
    return (
        <div className="flex h-screen">
            <Sidebar isAdmin={isAdmin} />

            <div className="flex-1 flex flex-col">
                <Header />

                <main className="flex-1 p-6 bg-gray-100 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
