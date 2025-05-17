import React from "react";

const EditModal = ({ isOpen, title, formData, onChange, onSave, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="border-b px-6 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        &times;
                    </button>
                </div>

                <div className="p-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSave();
                        }}
                    >
                        {Object.entries(formData).map(([key, value]) => {
                            if (key === "id") return null; // Skip ID field

                            return (
                                <div key={key} className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </label>
                                    <input
                                        type={typeof value === "number" ? "number" : "text"}
                                        name={key}
                                        value={value}
                                        onChange={(e) => onChange(e, key)}
                                        className="border rounded w-full py-2 px-3"
                                    />
                                </div>
                            );
                        })}

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                Lưu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
