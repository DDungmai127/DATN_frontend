import React from "react";

const Input = ({ label, name, value, onChange, type = "text", textarea = false }) => {
    return (
        <div className="mb-4">
            <label className="block text-gray-700">{label}</label>
            {textarea ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            )}
        </div>
    );
};

export default Input;
