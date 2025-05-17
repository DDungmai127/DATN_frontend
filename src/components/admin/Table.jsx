import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faEye } from "@fortawesome/free-solid-svg-icons";

/**
 * Component bảng dữ liệu đơn giản
 * @param {Object} props
 * @param {Array} props.columns - Mảng cấu hình cột: [{key, title, width, render}]
 * @param {Array} props.data - Dữ liệu hiển thị trong bảng
 * @param {Function} props.onView - Hàm xử lý khi nhấn nút xem chi tiết
 * @param {Function} props.onEdit - Hàm xử lý khi nhấn nút sửa
 * @param {Function} props.onDelete - Hàm xử lý khi nhấn nút xóa
 * @param {boolean} props.loading - Trạng thái đang tải dữ liệu
 * @returns {JSX.Element}
 */
const Table = ({ columns, data, onView, onEdit, onDelete, loading = false }) => {
    // Nếu không có dữ liệu
    if (data.length === 0 && !loading) {
        return (
            <div className="bg-white rounded-lg p-6 text-center text-gray-500 border">
                Không có dữ liệu
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    style={{ width: column.width || "auto" }}
                                >
                                    {column.title}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                        <span className="ml-2">Đang tải...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    {columns.map((column) => (
                                        <td
                                            key={`${item.id}-${column.key}`}
                                            className="px-6 py-4 whitespace-nowrap"
                                        >
                                            {column.render
                                                ? column.render(item[column.key], item)
                                                : item[column.key]}
                                        </td>
                                    ))}

                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end space-x-2">
                                            {onView && (
                                                <button
                                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                                    onClick={() => onView(item)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                            )}

                                            {onEdit && (
                                                <button
                                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                                    onClick={() => onEdit(item)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                            )}

                                            {onDelete && (
                                                <button
                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                    onClick={() => onDelete(item)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;
