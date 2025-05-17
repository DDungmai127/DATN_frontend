import React, { useState } from "react";
import Input from "../common/Input";

const AddModal = ({ isOpen, title, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        stock: "",
        description: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(formData); // Gửi dữ liệu sản phẩm mới lên cha
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <Input
                    label="Tên sản phẩm"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                />
                <Input
                    label="Giá"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                />
                <Input
                    label="Tồn kho"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                />
                <Input
                    label="Mô tả"
                    name="description"
                    textarea
                    value={formData.description}
                    onChange={handleChange}
                />
                <div className="flex justify-end">
                    <button
                        type="button"
                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                        onClick={onCancel}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={handleSave}
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddModal;
