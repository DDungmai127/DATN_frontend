import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../Provider/AuthProvider";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, loading, error, login } = useAuth();

  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { phoneNumber, password } = formData;

    // Kiểm tra nhập liệu
    if (!phoneNumber || !password) {
      setFormError("Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const result = await login(formData);

      if (result.success) {
        navigate("/admin/dashboard");
      } else {
        setFormError(result.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      setFormError("Đã xảy ra lỗi, vui lòng thử lại sau");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin h-12 w-12 border-4 border-t-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập Admin</h1>

        {(formError || error) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Form fields... */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Số điện thoại</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-2 px-4 bg-blue-600 text-white rounded ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <span className="inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
            ) : (
              <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
            )}
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <a href="/" className="text-blue-600 hover:underline">
            Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
