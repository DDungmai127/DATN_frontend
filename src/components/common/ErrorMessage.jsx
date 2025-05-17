import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

/**
 * Component hiển thị thông báo lỗi
 * @param {Object} props - Component props
 * @param {string} props.message - Nội dung thông báo lỗi
 * @param {string} props.className - CSS classes bổ sung (tùy chọn)
 * @returns {JSX.Element} Error message component
 */
const ErrorMessage = ({ message, className = "" }) => {
    if (!message) return null;

    return (
        <div className={`bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 ${className}`}>
            <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                <span>{message}</span>
            </div>
        </div>
    );
};

export default ErrorMessage;
