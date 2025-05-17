import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/client/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faSpinner } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    gender: "Nam",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = "Số điện thoại phải có 10 chữ số";
      isValid = false;
    }

    // Validate fullName (at least 2 characters)
    if (formData.fullName.trim().length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
      isValid = false;
    }

    // Validate password (at least 6 characters)
    if (formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      isValid = false;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu và xác nhận mật khẩu không khớp";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear errors when typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data to send to API
      const userData = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        gender: formData.gender,
        role: "customer", // Default role for registration
      };

      // Call API to register
      const response = await axios.post("http://localhost:3000/api/auth/register", userData);

      // Handle successful registration
      if (response.data.success) {
        setSuccess("Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...");

        // Reset form
        setFormData({
          fullName: "",
          phoneNumber: "",
          password: "",
          confirmPassword: "",
          gender: "Nam",
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // Handle unsuccessful but non-error response
        setError(response.data.message || "Đăng ký không thành công, vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Registration error:", err);

      // Handle known backend error messages
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Đăng ký không thành công, vui lòng thử lại.");

        // Handle field-specific errors if the API returns them
        if (err.response.data.errors) {
          setFieldErrors(err.response.data.errors);
        }
      } else {
        // Handle network or other errors
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoToSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-center text-red-600 flex-grow">Đăng ký</h2>
          <button
            onClick={handleBackToHome}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
            type="button"
          >
            <FontAwesomeIcon icon={faHome} className="text-lg" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <Input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Nhập số điện thoại (10 số)"
            label="Số điện thoại"
            error={fieldErrors.phoneNumber}
          />
          <Input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            label="Họ và Tên"
            error={fieldErrors.fullName}
          />
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Giới tính:</label>
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
          <Input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            label="Mật khẩu"
            error={fieldErrors.password}
          />
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Xác nhận mật khẩu"
            label="Xác nhận mật khẩu"
            error={fieldErrors.confirmPassword}
          />
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
              "Đăng Ký"
            )}
          </button>
        </form>
        <div className="h-1 bg-gray-600 my-5 w-1/1"></div>
        <button
          onClick={handleGoToSignIn}
          className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition mt-4"
          type="button"
          disabled={loading}
        >
          Đăng Nhập
        </button>
      </div>
    </div>
  );
};

export default Register;
