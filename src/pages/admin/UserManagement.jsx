import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faSearch,
  faTimesCircle,
  faSyncAlt,
  faSpinner,
  faEye,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

const UserManagement = () => {
  // States
  const [users, setUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const pageSize = 10;

  // States mới cho modal xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  // Fetch users data
  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy danh sách người dùng có phân trang
      const response = await axios.get(
        `http://localhost:3000/api/users?page=${page}&limit=${pageSize}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setUsers(response.data.data || []);
        setDisplayedUsers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        throw new Error(response.data?.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Không thể tải dữ liệu người dùng: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setDisplayedUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        user.fullName?.toLowerCase().includes(searchValue)
    );

    setDisplayedUsers(filtered);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDisplayedUsers(users);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchUsers();
  };

  // Delete functionality
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);

      const response = await axios.delete(
        `http://localhost:3000/api/users/${userToDelete.userId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setUsers(users.filter((u) => u.userId !== userToDelete.userId));
        setDisplayedUsers(displayedUsers.filter((u) => u.userId !== userToDelete.userId));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(`Không thể xóa người dùng: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  // Xem chi tiết người dùng
  const handleViewDetail = async (user) => {
    try {
      setUserDetailLoading(true);
      setSelectedUser(user);
      setIsDetailModalOpen(true);

      // Lấy thông tin chi tiết từ API (tùy chọn nếu bạn cần thêm thông tin)
      const response = await axios.get(`http://localhost:3000/api/users/${user.userId}`, {
        withCredentials: true,
      });

      if (response.data?.success) {
        setSelectedUser(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      // Vẫn hiển thị thông tin đã có
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };
  return (
    <div className="p-6">
      {/* Header and Search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>

        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Tìm kiếm người dùng..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Xóa tìm kiếm"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4" />
              </button>
            )}
          </div>

          {searchTerm && (
            <div className="mt-1 text-sm text-gray-600">
              Tìm thấy {displayedUsers.length} kết quả liên quan.
            </div>
          )}
        </div>

        {/* Refresh button */}
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSyncAlt} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Loading and error messages */}
      {loading && <div className="text-center py-4">Đang tải...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Users table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left w-12">STT</th>
                  <th className="px-4 py-2 text-left">Tên người dùng</th>
                  <th className="px-4 py-2 text-left">SỐ điện thoại</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Vai trò</th>
                  <th className="px-4 py-2 text-left">Ngày tạo</th>
                  <th className="px-4 py-2 text-center w-48">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user, index) => (
                  <tr key={user.userId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{user.fullName}</td>
                    <td className="px-4 py-3">{user.phoneNumber} </td>

                    <td className="px-4 py-3">{user.email || "Chưa có"} </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(user.createdAt)}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(user)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded flex items-center text-sm font-medium transition-colors"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1.5" />
                          Chi tiết
                        </button>

                        {/* Nút xóa */}
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded flex items-center text-sm font-medium transition-colors"
                          disabled={loading || user.role === "admin"}
                          title={
                            user.role === "admin"
                              ? "Không thể xóa tài khoản quản trị viên"
                              : "Xóa người dùng"
                          }
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1.5" />
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy người dùng nào phù hợp"
                        : "Không có người dùng nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`mx-1 px-3 py-1 rounded ${
                  page === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white"
                }`}
              >
                Trước
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`mx-1 px-3 py-1 rounded ${
                    page === i + 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`mx-1 px-3 py-1 rounded ${
                  page === totalPages ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white"
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold mb-2 text-center">Xác nhận xóa</h2>

            <div className="mb-6 text-center">
              <p className="text-gray-700 mb-2">Bạn có chắc chắn muốn xóa người dùng sau?</p>
              <p className="font-semibold text-lg">{userToDelete.username}</p>
              <p className="text-sm text-gray-600">{userToDelete.email}</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {userDetailLoading ? (
              <div className="flex justify-center items-center py-8">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 text-2xl" />
                <span className="ml-2">Đang tải thông tin...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Thông tin chi tiết người dùng</h2>
                  <button
                    onClick={handleCloseDetailModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row">
                  {/* Avatar và thông tin chính */}
                  <div className="md:w-1/3 flex flex-col items-center mb-4 md:mb-0">
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faUser} className="text-gray-400 text-5xl" />
                    </div>
                    <h3 className="text-lg font-bold">{selectedUser.fullName || "-"}</h3>
                    <span
                      className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedUser.role === "admin" ? "Quản trị viên" : "Người dùng"}
                    </span>
                  </div>
                  {/* Thông tin chi tiết */}
                  <div className="md:w-2/3 md:pl-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500">ID</h4>
                        <p className="text-gray-800">{selectedUser.userId}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500">Họ và tên</h4>
                        <p className="text-gray-800">{selectedUser.fullName || "-"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Số điện thoại</h4>
                        <p className="text-gray-800">{selectedUser.phoneNumber || "-"}</p>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500">Email</h4>
                        <p className="text-gray-800 break-words">{selectedUser.email || "-"}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Giới tính</h4>
                        <p className="text-gray-800">{selectedUser.gender || "-"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Ngày sinh</h4>
                        <p className="text-gray-800">
                          {formatDate(selectedUser.dateOfBirth) || "-"}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500">Địa chỉ</h4>
                        <p className="text-gray-800">{selectedUser.address || "-"}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Ngày tạo</h4>
                        <p className="text-gray-800">{formatDate(selectedUser.createdAt)}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Cập nhật lần cuối</h4>
                        <p className="text-gray-800">{formatDate(selectedUser.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t flex justify-end">
                  <button
                    onClick={handleCloseDetailModal}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
