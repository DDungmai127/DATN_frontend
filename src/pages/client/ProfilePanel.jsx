import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheck } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Hàm hỗ trợ để định dạng ngày tháng
const formatDateForInput = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Kiểm tra ngày hợp lệ
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format thành YYYY-MM-DD theo chuẩn HTML input date
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

const ProfilePanel = ({ user, onProfileUpdate }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    address: user?.address || "",
    gender: user?.gender || "",
    dateOfBirth: formatDateForInput(user?.dateOfBirth) || "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        address: user.address || prev.address,
        gender: user.gender || prev.gender,
        dateOfBirth: formatDateForInput(user.dateOfBirth) || prev.dateOfBirth,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ tên";
      isValid = false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không hợp lệ";
      isValid = false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const clientInfo = JSON.parse(localStorage.getItem("clientInfo") || "{}");
      const userId = user?.userId || clientInfo.userId;

      if (!userId) {
        setError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          localStorage.removeItem("clientInfo");
          navigate("/login?redirect=/account");
        }, 1500);
        return;
      }

      const updatedData = {
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth, // Đã ở định dạng YYYY-MM-DD
      };

      if (formData.password) {
        updatedData.password = formData.password;
        updatedData.currentPassword = formData.currentPassword;
      }

      console.log(`Sending profile update request to /api/users/${userId}`);

      // Thêm token vào header
      const token = clientInfo.token;
      const headers = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.put(`${API_URL}/users/${userId}`, updatedData, {
        withCredentials: true,
        headers: headers,
      });

      if (response.data.success) {
        // Đảm bảo định dạng ngày tháng trong dữ liệu nhận về cũng được chuẩn hóa
        const responseData = response.data.data;
        if (responseData.dateOfBirth) {
          responseData.dateOfBirth = formatDateForInput(responseData.dateOfBirth);
        }

        const updatedUserInfo = {
          ...clientInfo,
          ...responseData,
          isLoggedIn: true,
        };
        localStorage.setItem("clientInfo", JSON.stringify(updatedUserInfo));

        setSuccess(true);

        if (onProfileUpdate) {
          onProfileUpdate(updatedUserInfo);
        }

        if (formData.password) {
          setFormData((prevState) => ({
            ...prevState,
            password: "",
            confirmPassword: "",
            currentPassword: "",
          }));
        }

        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.data.message || "Cập nhật không thành công");
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error.response) {
        if (error.response.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

          // Thêm log chi tiết để debug
          console.log("401 error response:", error.response.data);
          console.log("Headers sent:", error.config.headers);

          localStorage.removeItem("clientInfo");
          setTimeout(() => {
            navigate("/login?redirect=/account");
          }, 1500);
          return;
        }

        if (error.response.data?.errors) {
          setFieldErrors((prev) => ({
            ...prev,
            ...error.response.data.errors,
          }));
        }

        setError(error.response.data?.message || "Có lỗi xảy ra khi cập nhật thông tin");
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Thông tin tài khoản</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
          <FontAwesomeIcon icon={faCheck} className="mr-2" />
          Cập nhật thông tin thành công!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                fieldErrors.fullName ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="gender" className="block text-gray-700 font-medium mb-2">
              Giới tính
            </label>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="male"
                  name="gender"
                  value="Nam"
                  checked={formData.gender === "Nam"}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="male" className="text-gray-700">
                  Nam
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="female"
                  name="gender"
                  value="Nữ"
                  checked={formData.gender === "Nữ"}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="female" className="text-gray-700">
                  Nữ
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-gray-700 font-medium mb-2">
              Ngày sinh
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth} // Đã được format đúng
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
              Địa chỉ
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Nhập địa chỉ của bạn"
            ></textarea>
          </div>

          <div>
            <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-2">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                fieldErrors.currentPassword ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            {fieldErrors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                fieldErrors.password ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              "Cập nhật thông tin"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePanel;
