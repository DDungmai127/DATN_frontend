import React from "react";

const DetailsModal = ({ isOpen, title, details, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="border-b px-6 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        &times;
                    </button>
                </div>

                <div className="p-6">
                    {Object.entries(details).map(([key, value]) => (
                        <div key={key} className="mb-3">
                            <label className="block text-gray-600 text-sm">{key}</label>
                            <div className="font-medium">
                                {typeof value === "number" && key === "price"
                                    ? new Intl.NumberFormat("vi-VN", {
                                          style: "currency",
                                          currency: "VND",
                                      }).format(value)
                                    : value}
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
