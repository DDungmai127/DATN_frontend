import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Ref để đánh dấu trạng thái init
  const initialized = useRef(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Chỉ chạy một lần khi mount component
  useEffect(() => {
    // Tránh chạy lại nếu đã khởi tạo
    if (initialized.current) return;
    initialized.current = true;

    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Kiểm tra từ localStorage trước
        const adminInfo = localStorage.getItem("adminInfo");
        if (adminInfo) {
          try {
            const userData = JSON.parse(adminInfo);
            console.log("Found admin in localStorage:", userData.fullName || userData.phoneNumber);

            // Kiểm tra dữ liệu tối thiểu cần thiết
            if (
              userData &&
              userData.isLoggedIn &&
              (userData.role === "admin" || userData.role === "staff")
            ) {
              setUser(userData);
              setIsAuthenticated(true);

              // Xác thực lại với API nếu cần (nhưng không block UI)
              try {
                const response = await axios.get(`${API_URL}/auth/me`, {
                  withCredentials: true,
                });

                if (response.data && response.data.success) {
                  const apiUserData = response.data.user || response.data.data;

                  // Kiểm tra quyền từ API
                  const hasValidRole =
                    apiUserData && (apiUserData.role === "admin" || apiUserData.role === "staff");

                  if (!hasValidRole) {
                    console.log("API says user doesn't have admin rights, logging out");
                    setUser(null);
                    setIsAuthenticated(false);
                    localStorage.removeItem("adminInfo");
                  } else if (JSON.stringify(apiUserData) !== JSON.stringify(userData)) {
                    // Cập nhật thông tin người dùng từ API
                    console.log("Updating user data from API");
                    setUser({ ...apiUserData, isLoggedIn: true });
                    localStorage.setItem(
                      "adminInfo",
                      JSON.stringify({
                        ...apiUserData,
                        isLoggedIn: true,
                      })
                    );
                  }
                } else {
                  // API xác nhận user không hợp lệ
                  console.log("API verification failed, logging out");
                  setUser(null);
                  setIsAuthenticated(false);
                  localStorage.removeItem("adminInfo");
                }
              } catch (apiError) {
                console.error("API verification error:", apiError);
                // Không làm gì nếu API lỗi - giữ nguyên thông tin từ localStorage
              }
            } else {
              console.log("Invalid admin data in localStorage");
              setUser(null);
              setIsAuthenticated(false);
              localStorage.removeItem("adminInfo"); // Xóa dữ liệu không hợp lệ
            }
          } catch (parseError) {
            console.error("Error parsing localStorage data:", parseError);
            localStorage.removeItem("adminInfo"); // Xóa dữ liệu bị hỏng
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log("No admin info in localStorage");
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err.message);
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, [API_URL]);

  const login = async (credentials) => {
    try {
      console.log("Login attempt with credentials:", {
        phoneNumber: credentials.phoneNumber,
        password: "******",
      });

      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        withCredentials: true,
      });

      console.log("Login response:", response.data);

      if (response.data && response.data.success) {
        // Log cấu trúc chính xác
        console.log("Response data structure:", JSON.stringify(response.data, null, 2));

        // Trích xuất dữ liệu user từ cấu trúc lồng nhau phức tạp
        let userData = null;
        let token = null;

        if (response.data.data && response.data.data.user) {
          // Cấu trúc: response.data.data.user
          userData = response.data.data.user;
          token = response.data.data.token;
          console.log("Extracted from data.user:", userData);
        } else if (response.data.user && response.data.user.user) {
          // Cấu trúc: response.data.user.user
          userData = response.data.user.user;
          token = response.data.token || response.data.user.token;
          console.log("Extracted from nested user.user:", userData);
        } else if (response.data.user) {
          // Cấu trúc: response.data.user
          userData = response.data.user;
          token = response.data.token;
          console.log("Extracted from direct user:", userData);
        } else if (response.data.data) {
          // Cấu trúc: response.data.data (có thể là user object)
          userData = response.data.data;
          token = response.data.token || response.data.accessToken;
          console.log("Extracted from data:", userData);
        }

        // Nếu userData vẫn không có, thử kiểm tra cấu trúc đặc biệt
        if (!userData && response.data.data) {
          // Cấu trúc đặc biệt: Token và user riêng biệt trong data
          if (typeof response.data.data === "object") {
            // Nếu token ở cấp cao và user ở trong data
            if (response.data.data.token && typeof response.data.data === "object") {
              token = response.data.data.token;
              // Sử dụng phần còn lại của data làm userData
              userData = { ...response.data.data };
              delete userData.token;
              console.log("Extracted user from data object with token:", userData);
            }
          }
        }

        // Log chi tiết kết quả trích xuất
        console.log("Final extracted user data:", userData);
        console.log("Final extracted token:", token);

        // Kiểm tra userData có hợp lệ không
        if (!userData || !userData.role) {
          console.error("Could not find valid user data with role information");
          console.log("Full response data:", response.data);

          // Thử trích xuất từ cấu trúc cụ thể trong log của bạn
          if (response.data.data && response.data.data.user) {
            userData = response.data.data.user;
            token = response.data.data.token;
            console.log("Last attempt - extracted from data.user:", userData);
          }

          // Vẫn không tìm thấy thông tin hợp lệ
          if (!userData || !userData.role) {
            setError("Không nhận được thông tin người dùng hợp lệ");
            setLoading(false);
            return { success: false, message: "Không nhận được thông tin người dùng hợp lệ" };
          }
        }

        // Kiểm tra quyền truy cập admin
        const hasAdminAccess = userData.role === "admin" || userData.role === "staff";

        console.log("User role check:", {
          role: userData.role,
          hasAdminAccess,
        });

        if (!hasAdminAccess) {
          console.log("User doesn't have admin access rights:", userData.role);
          setError("Tài khoản của bạn không có quyền truy cập vào trang quản trị");
          setLoading(false);
          return {
            success: false,
            message: "Tài khoản của bạn không có quyền truy cập vào trang quản trị",
          };
        }

        // Lưu thông tin admin vào localStorage
        const adminInfo = {
          ...userData,
          token,
          isLoggedIn: true,
        };

        console.log("Saving admin info to localStorage:", adminInfo);
        localStorage.setItem("adminInfo", JSON.stringify(adminInfo));

        // Xác nhận đã lưu thành công
        const savedInfo = localStorage.getItem("adminInfo");
        if (!savedInfo) {
          console.error("Failed to save to localStorage");
        } else {
          console.log("Successfully saved to localStorage:", JSON.parse(savedInfo));
        }

        setUser(adminInfo);
        setIsAuthenticated(true);
        setLoading(false);

        return { success: true };
      } else {
        setUser(null);
        setIsAuthenticated(false);
        const errorMsg = (response.data && response.data.message) || "Đăng nhập thất bại";
        setError(errorMsg);
        console.log("Admin login failed:", errorMsg);
        setLoading(false);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        console.log("Error status:", err.response.status);
        console.log("Error data:", err.response.data);
      }

      const errorMsg = err.response?.data?.message || "Đã xảy ra lỗi khi đăng nhập";
      setUser(null);
      setIsAuthenticated(false);
      setError(errorMsg);
      setLoading(false);
      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Đảm bảo luôn xóa thông tin đăng nhập và cập nhật state
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("adminUserInfo");
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }

    return { success: true };
  };

  const checkPermission = (requiredRole) => {
    if (!user || !isAuthenticated) {
      setAccessError({
        message: "Vui lòng đăng nhập để tiếp tục",
        type: "UNAUTHORIZED",
      });
      return false;
    }

    if (
      requiredRole &&
      user.role !== requiredRole &&
      !(requiredRole === "staff" && user.role === "admin")
    ) {
      setAccessError({
        message: "Bạn không có quyền truy cập tính năng này",
        type: "ACCESS_DENIED",
      });
      return false;
    }

    return true;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    checkPermission,
    setAccessError,
    clearAccessError: () => setAccessError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {accessError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 text-red-700 p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <p>{accessError.message}</p>
            <button onClick={() => setAccessError(null)} className="text-red-700 font-bold">
              &times;
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};
