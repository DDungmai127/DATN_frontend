import React from "react";
export default function Input(props) {
    const {
        type = "text", // Loại input (mặc định là text)
        placeholder = "",
        value = "",
        onChange = () => {},
        className = "",
        label = "", // Nhãn cho input
        error = "", // Thông báo lỗi
        ...rest // Các thuộc tính khác được truyền thêm
    } = props;

    return (
        <div className="mb-4">
            {label && (
                <label htmlFor={rest.id || ""} className="block text-gray-700 font-medium mb-2">
                    {label}
                </label>
            )}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 w-full ${className}`}
                {...rest}
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
}
