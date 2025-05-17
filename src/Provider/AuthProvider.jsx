import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Kiểm tra từ localStorage trước
        const adminInfo = localStorage.getItem("adminInfo");
        if (adminInfo) {
          const userData = JSON.parse(adminInfo);
          console.log("Found admin in localStorage:", userData.fullName || userData.phoneNumber);
          setUser(userData);
        } else {
          // Kiểm tra bằng API nếu không tìm thấy trong localStorage
          try {
            const response = await axios.get(`${API_URL}/auth/me`, {
              withCredentials: true,
            });

            if (response.data.success) {
              const adminData = response.data.user;
              console.log("Admin validated via API");

              // Lưu thông tin admin
              localStorage.setItem(
                "adminInfo",
                JSON.stringify({
                  ...adminData,
                  isLoggedIn: true,
                })
              );

              setUser(adminData);
            } else {
              console.log("Admin validation failed via API");
              setUser(null);
            }
          } catch (err) {
            console.error("Error validating admin:", err);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [API_URL]);

  // Login function - giờ chấp nhận phoneNumber/password thay vì email/password
  const login = async (credentials) => {
    try {
      console.log("Login attempt with credentials:", {
        phoneNumber: credentials.phoneNumber,
        password: "******",
      });

      setLoading(true);
      setError(null);

      // ĐIỂM CẦN SỬA: Đường dẫn endpoint đúng cho admin login
      // Thay đổi từ `/auth/login` thành `/auth/admin/login` để nhất quán
      // hoặc nếu endpoint thực tế khác, hãy sử dụng đúng endpoint đó
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        withCredentials: true,
      });

      console.log("Login response:", response.data);

      // ĐIỂM CẦN SỬA: Kiểm tra cấu trúc phản hồi từ API thực tế
      if (response.data && response.data.success) {
        // Xử lý an toàn khi truy cập các trường
        const userData = response.data.user || {};
        const token = response.data.token || response.data.accessToken || userData.token;

        // Kiểm tra và log an toàn
        console.log("User data received:", userData);

        if (!userData) {
          console.error("No user data in response");
          setError("Không nhận được thông tin người dùng");
          return { success: false, message: "Không nhận được thông tin người dùng" };
        }

        // Lưu thông tin admin kèm token
        localStorage.setItem(
          "adminInfo",
          JSON.stringify({
            ...userData,
            token,
            isLoggedIn: true,
          })
        );

        setUser({ ...userData, token });

        // Log an toàn: truy cập thuộc tính có điều kiện
        const userDisplay =
          userData.fullName || userData.phoneNumber || userData.email || "Unknown";
        console.log("Admin login successful:", userDisplay);

        return { success: true };
      } else {
        setUser(null);
        const errorMsg = (response.data && response.data.message) || "Đăng nhập thất bại";
        setError(errorMsg);
        console.log("Admin login failed:", errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      console.error("Login error:", err);

      // Log chi tiết về lỗi
      if (err.response) {
        console.log("Error status:", err.response.status);
        console.log("Error data:", err.response.data);
      }

      const errorMsg = err.response?.data?.message || "Đã xảy ra lỗi khi đăng nhập";
      setUser(null);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Gọi API đăng xuất
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      // Xóa thông tin admin
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("adminUserInfo"); // Xóa cả key cũ nếu có

      setUser(null);
      console.log("Admin logout successful");
      return { success: true };
    } catch (err) {
      console.error("Logout error:", err);
      // Vẫn xóa thông tin user khỏi localStorage và state
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("adminUserInfo"); // Xóa cả key cũ
      setUser(null);
      return { success: true, message: "Forced logout due to error" };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
