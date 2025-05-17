import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faSpinner } from "@fortawesome/free-solid-svg-icons";
import Input from "../../components/client/Input";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State để quản lý thông tin người dùng nhập
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    phoneNumber: "",
    password: "",
  });
  const [checkingAuth, setCheckingAuth] = useState(true); // State để biết đang kiểm tra xác thực

  // Hàm kiểm tra đăng nhập hiệu quả hơn
  const checkLoginStatus = async () => {
    try {
      console.log("Checking login status...");
      setCheckingAuth(true);

      // Kiểm tra localStorage trước
      const clientInfoStr = localStorage.getItem("clientInfo");
      let isLoggedIn = false;

      if (clientInfoStr) {
        console.log("Found authentication info in localStorage");
        const clientInfo = JSON.parse(clientInfoStr);

        if (clientInfo && clientInfo.isLoggedIn) {
          // Kiểm tra xem xác thực có còn hiệu lực không bằng cookie
          try {
            console.log("Making request to /auth/me with credentials");

            const response = await axios.get(`${API_URL}/auth/me`, {
              withCredentials: true,
            });

            if (response.data && response.data.success) {
              console.log("Token from localStorage is valid");
              isLoggedIn = true;

              // Cập nhật thông tin người dùng trong localStorage
              const userData = response.data.data?.user || response.data.data;
              localStorage.setItem(
                "clientInfo",
                JSON.stringify({
                  ...userData,
                  isLoggedIn: true,
                })
              );
            }
          } catch (error) {
            console.log("Cookie authentication failed:", error.message);
            // Tiếp tục xác thực với localStorage
            isLoggedIn = true; // Giả định vẫn đăng nhập nếu có dữ liệu trong localStorage
          }
        }
      }

      // Điều hướng người dùng nếu đã đăng nhập
      if (isLoggedIn) {
        // Lấy đường dẫn chuyển hướng nếu có
        const params = new URLSearchParams(location.search);
        const redirectPath = params.get("redirect") || "/";
        navigate(redirectPath);
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, [navigate, location.search]);

  // Hàm validate form
  const validateForm = () => {
    const errors = {
      phoneNumber: "",
      password: "",
    };

    let isValid = true;

    // Kiểm tra số điện thoại
    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Vui lòng nhập số điện thoại";
      isValid = false;
    } else if (!/^\d{10}$/.test(phoneNumber.trim())) {
      errors.phoneNumber = "Số điện thoại phải có 10 chữ số";
      isValid = false;
    }

    // Kiểm tra mật khẩu
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Hàm xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          phoneNumber,
          password,
        },
        {
          withCredentials: true, // Đảm bảo nhận cookie
        }
      );

      if (response.data && response.data.success) {
        // Lưu thông tin người dùng, không lưu token
        const userData = response.data.data?.user || {};

        localStorage.setItem(
          "clientInfo",
          JSON.stringify({
            ...userData,
            isLoggedIn: true,
          })
        );

        // Chuyển hướng sau đăng nhập
        const redirectPath = new URLSearchParams(location.search).get("redirect") || "/";
        navigate(redirectPath);
      } else {
        setError(response.data?.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        if (err.response.data?.errors) {
          setFieldErrors({
            ...fieldErrors,
            ...err.response.data.errors,
          });
        }
        setError(err.response.data?.message || "Đăng nhập thất bại");
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleInputChange = (e, setter) => {
    setter(e.target.value);
    // Reset error khi nhập liệu
    setError("");
  };

  // Hiển thị loading khi đang kiểm tra trạng thái xác thực
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-red-600 animate-spin text-3xl mb-4" />
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-center text-red-600 flex-grow">Đăng Nhập</h2>
          <button
            onClick={handleBackToHome}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
            type="button"
          >
            <FontAwesomeIcon icon={faHome} className="text-lg" />
          </button>
        </div>

        {/* Hiển thị lỗi chung */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <Input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => handleInputChange(e, setPhoneNumber)}
            placeholder="Nhập số điện thoại (10 chữ số)"
            label="Số điện thoại"
            error={fieldErrors.phoneNumber}
          />
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => handleInputChange(e, setPassword)}
            placeholder="Nhập mật khẩu"
            label="Mật khẩu"
            error={fieldErrors.password}
          />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              "Đăng Nhập"
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">Hoặc</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="mt-6 text-center text-gray-600">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-red-600 font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
