import React, { useEffect } from "react";

const Toast = ({ message, onClose, duration = 1500, type = "success" }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // Clear timeout if component is unmounted
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // Xác định kiểu toast (success hoặc error)
  const toastStyles = {
    container: "fixed inset-0 flex items-center justify-center z-50",
    toast:
      "bg-red-600 text-white px-6 py-3 rounded-md shadow-lg flex items-center min-w-[300px] justify-center",
  };

  return (
    <div className={toastStyles.container}>
      <div className={toastStyles.toast}>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
