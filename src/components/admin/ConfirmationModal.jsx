import React from "react";

const ConfirmationModal = ({ isOpen, title, message, onCancel, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center confirmation-modal ">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p>{message}</p>
                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                        onClick={onCancel}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="bg-red-500 text-white px-4 py-2 rounded"
                        onClick={onConfirm}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
