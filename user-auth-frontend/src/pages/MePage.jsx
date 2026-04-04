import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import api from "../util/api";

const USER_ROLE_OPTIONS = [
  { value: "WarehouseStaff", label: "Warehouse Staff" },
  { value: "DepartmentMember", label: "Department Member" },
];

const normalizeRole = (role) => (role === "User" ? "DepartmentMember" : role);

const isDepartmentRole = (role) => normalizeRole(role) === "DepartmentMember";

const formatRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "Admin") return "Admin";
  if (normalizedRole === "WarehouseStaff") return "Warehouse Staff";
  if (normalizedRole === "DepartmentMember") return "Department Member";
  return normalizedRole || "-";
};

function MePage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "DepartmentMember",
    departmentId: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [resetPasswordByUserId, setResetPasswordByUserId] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deletingUserByAdmin, setDeletingUserByAdmin] = useState(false);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [savingRoleUserId, setSavingRoleUserId] = useState(null);
  const [roleFormByUserId, setRoleFormByUserId] = useState({});
  const [editingRoleByUserId, setEditingRoleByUserId] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loadedAdminUsers, setLoadedAdminUsers] = useState(false);
  const navigate = useNavigate();

  // 🔹 1. 读取当前用户
  const {
    data: user,
    isLoading,
    refresh: refreshUser,
  } = useAxios({ method: "get", url: "/Users/me" });

  // 🔹 3. 删除用户（DELETE）
  const { sendRequest: deleteUser } = useAxios({
    method: "delete",
    url: "/Users/me",
    runOnMount: false,
  });

  const { sendRequest: changePassword, isLoading: changingPassword } = useAxios(
    {
      method: "put",
      url: "/Users/me/password",
      runOnMount: false,
    },
  );

  const {
    data: users,
    isLoading: usersLoading,
    refresh: refreshUsers,
  } = useAxios({
    method: "get",
    url: "/Users",
    runOnMount: false,
  });

  const { sendRequest: createUser, isLoading: creatingUser } = useAxios({
    method: "post",
    url: "/Users/register",
    runOnMount: false,
  });

  const isAdmin = normalizeRole(user?.role) === "Admin";

  useEffect(() => {
    if (isAdmin && !loadedAdminUsers) {
      refreshUsers();
      setLoadedAdminUsers(true);
    }
  }, [isAdmin, loadedAdminUsers]);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!isAdmin) return;
      try {
        const res = await api.get("/Departments");
        const data = Array.isArray(res.data) ? res.data : [];
        setDepartments(data);
        setAdminForm((prev) => ({
          ...prev,
          departmentId:
            prev.departmentId || (data[0] ? String(data[0].id) : ""),
        }));
      } catch {
        setDepartments([]);
      }
    };

    loadDepartments();
  }, [isAdmin]);

  useEffect(() => {
    if (!users?.length) return;

    const nextRoleForms = {};
    users.forEach((account) => {
      nextRoleForms[account.id] = {
        role: normalizeRole(account.role) || "DepartmentMember",
        departmentId: account.departmentId ? String(account.departmentId) : "",
      };
    });
    setRoleFormByUserId(nextRoleForms);
  }, [users]);

  const handleChangePassword = async () => {
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.response?.data || "Failed to change password.");
    }
  };

  const handleCreateUserByAdmin = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminMessage("");

    try {
      await createUser(adminForm);
      setAdminForm((prev) => ({
        username: "",
        email: "",
        password: "",
        role: "DepartmentMember",
        departmentId: prev.departmentId,
      }));
      setAdminMessage("User created successfully.");
      refreshUsers();
    } catch (err) {
      setAdminError(err.response?.data || "Failed to create user.");
    }
  };

  const handleDeleteUserByAdmin = async () => {
    if (!deleteUserId) return;

    try {
      setDeletingUserByAdmin(true);
      await api.delete(`/Users/${deleteUserId}`);
      setAdminMessage("User deleted successfully.");
      refreshUsers();
    } catch (err) {
      setAdminError(err.response?.data || "Failed to delete user.");
    } finally {
      setDeletingUserByAdmin(false);
      setShowConfirmModal(false);
      setDeleteUserId(null);
    }
  };

  const handleResetPasswordByAdmin = async (userId) => {
    const newPassword = resetPasswordByUserId[userId] || "";
    if (!newPassword || newPassword.length < 6) {
      setAdminError("New password must be at least 6 characters.");
      return;
    }

    try {
      setResettingUserId(userId);
      setAdminError("");
      await api.put(`/Users/${userId}/reset-password`, { newPassword });
      setAdminMessage(`Password reset successfully for user ID ${userId}.`);
      setResetPasswordByUserId((prev) => ({ ...prev, [userId]: "" }));
    } catch (err) {
      setAdminError(err.response?.data || "Failed to reset password.");
    } finally {
      setResettingUserId(null);
    }
  };

  const handleUpdateRoleByAdmin = async (account) => {
    const form = roleFormByUserId[account.id];
    if (!form?.role) {
      setAdminError("Please select a role.");
      return;
    }

    if (
      form.role === "DepartmentMember" &&
      (!form.departmentId || Number(form.departmentId) <= 0)
    ) {
      setAdminError("Department member must be assigned to a department.");
      return;
    }

    try {
      setSavingRoleUserId(account.id);
      setAdminError("");
      await api.put(`/Users/${account.id}/role`, {
        role: form.role,
        departmentId:
          form.role === "DepartmentMember" ? Number(form.departmentId) : null,
      });
      setAdminMessage("Role updated successfully.");
      setEditingRoleByUserId((prev) => ({ ...prev, [account.id]: false }));
      refreshUsers();
    } catch (err) {
      setAdminError(err.response?.data || "Failed to update role.");
    } finally {
      setSavingRoleUserId(null);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="p-8">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading user info...</p>
      ) : user ? (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg text-gray-900">Account</h1>
                <p className="text-sm text-gray-600 mt-1">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {formatRoleLabel(user.role)}
              </span>
            </div>
            {message && (
              <p className="text-sm text-green-700 mt-3">{message}</p>
            )}
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm text-gray-900 mb-3">Role</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="text-gray-500">Role Type: </span>
                {formatRoleLabel(user.role)}
              </p>
              <p>
                <span className="text-gray-500">Department: </span>
                {isDepartmentRole(user.role)
                  ? user.departmentName || "Not assigned"
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm text-gray-900 mb-3">Security</h2>
            {isChangingPassword ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </button>
            )}
          </div>

          {isAdmin && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm text-gray-900 mb-3">
                User Management (Admin)
              </h2>

              <form
                onSubmit={handleCreateUserByAdmin}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Username
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={adminForm.username}
                    onChange={(e) =>
                      setAdminForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Role Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={adminForm.role}
                    onChange={(e) =>
                      setAdminForm((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    required
                  >
                    {USER_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {adminForm.role === "DepartmentMember" && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Department
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                      value={adminForm.departmentId}
                      onChange={(e) =>
                        setAdminForm((prev) => ({
                          ...prev,
                          departmentId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                    type="submit"
                    disabled={creatingUser}
                  >
                    {creatingUser ? "Creating..." : "Add New User"}
                  </button>
                </div>
              </form>

              {adminMessage && (
                <p className="text-sm text-green-700 mt-3">{adminMessage}</p>
              )}
              {adminError && (
                <p className="text-sm text-red-600 mt-3">{adminError}</p>
              )}

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-2 text-gray-600">ID</th>
                      <th className="text-left py-2 px-2 text-gray-600">
                        Username
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600">
                        Email
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600">
                        Role Type
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600">
                        Department
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600">
                        Reset Password
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td className="py-3 px-2" colSpan={7}>
                          Loading users...
                        </td>
                      </tr>
                    ) : !users?.length ? (
                      <tr>
                        <td className="py-3 px-2" colSpan={7}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((account) => (
                        <tr
                          key={account.id}
                          className="border-b border-gray-100"
                        >
                          <td className="py-2 px-2">{account.id}</td>
                          <td className="py-2 px-2">{account.username}</td>
                          <td className="py-2 px-2">{account.email}</td>
                          <td className="py-2 px-2">
                            {account.id === user.id ? (
                              <span className="text-gray-600">
                                {formatRoleLabel(account.role)}
                              </span>
                            ) : editingRoleByUserId[account.id] ? (
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-36 px-2 py-1 border border-gray-300 rounded-md"
                                  value={
                                    roleFormByUserId[account.id]?.role ||
                                    "DepartmentMember"
                                  }
                                  onChange={(e) =>
                                    setRoleFormByUserId((prev) => ({
                                      ...prev,
                                      [account.id]: {
                                        ...prev[account.id],
                                        role: e.target.value,
                                      },
                                    }))
                                  }
                                >
                                  {USER_ROLE_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                  onClick={() => {
                                    setRoleFormByUserId((prev) => ({
                                      ...prev,
                                      [account.id]: {
                                        role:
                                          normalizeRole(account.role) ||
                                          "DepartmentMember",
                                        departmentId: account.departmentId
                                          ? String(account.departmentId)
                                          : "",
                                      },
                                    }));
                                    setEditingRoleByUserId((prev) => ({
                                      ...prev,
                                      [account.id]: false,
                                    }));
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">
                                  {formatRoleLabel(account.role)}
                                </span>
                                <button
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                  onClick={() =>
                                    setEditingRoleByUserId((prev) => ({
                                      ...prev,
                                      [account.id]: true,
                                    }))
                                  }
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {(() => {
                              const currentRole =
                                normalizeRole(account.role) ||
                                "DepartmentMember";
                              const currentDepartmentId = account.departmentId
                                ? String(account.departmentId)
                                : "";
                              const selectedRole =
                                roleFormByUserId[account.id]?.role ||
                                currentRole;
                              const selectedDepartmentId =
                                roleFormByUserId[account.id]?.departmentId ||
                                "";
                              const roleChanged = selectedRole !== currentRole;
                              const departmentChanged =
                                isDepartmentRole(selectedRole) &&
                                selectedDepartmentId !== currentDepartmentId;
                              const isDirty = roleChanged || departmentChanged;

                              if (account.id === user.id) {
                                return (
                                  <span className="text-gray-600">
                                    {isDepartmentRole(currentRole)
                                      ? account.departmentName || "-"
                                      : "N/A"}
                                  </span>
                                );
                              }

                              if (!editingRoleByUserId[account.id]) {
                                return (
                                  <span className="text-gray-600">
                                    {isDepartmentRole(currentRole)
                                      ? account.departmentName || "-"
                                      : "N/A"}
                                  </span>
                                );
                              }

                              return (
                                <div className="flex items-center gap-2">
                                  {isDepartmentRole(selectedRole) ? (
                                    <select
                                      className="w-36 px-2 py-1 border border-gray-300 rounded-md"
                                      value={selectedDepartmentId}
                                      onChange={(e) =>
                                        setRoleFormByUserId((prev) => ({
                                          ...prev,
                                          [account.id]: {
                                            ...prev[account.id],
                                            departmentId: e.target.value,
                                          },
                                        }))
                                      }
                                    >
                                      <option value="">
                                        Select Department
                                      </option>
                                      {departments.map((department) => (
                                        <option
                                          key={department.id}
                                          value={department.id}
                                        >
                                          {department.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-gray-500">N/A</span>
                                  )}

                                  {isDirty && (
                                    <button
                                      className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                      onClick={() =>
                                        handleUpdateRoleByAdmin(account)
                                      }
                                      disabled={savingRoleUserId === account.id}
                                    >
                                      {savingRoleUserId === account.id
                                        ? "..."
                                        : "Save"}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-2">
                            {account.id === user.id ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type="password"
                                  placeholder="new password"
                                  className="w-32 px-2 py-1 border border-gray-300 rounded-md"
                                  value={
                                    resetPasswordByUserId[account.id] || ""
                                  }
                                  onChange={(e) =>
                                    setResetPasswordByUserId((prev) => ({
                                      ...prev,
                                      [account.id]: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  className="px-2 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                                  onClick={() =>
                                    handleResetPasswordByAdmin(account.id)
                                  }
                                  disabled={resettingUserId === account.id}
                                >
                                  {resettingUserId === account.id
                                    ? "..."
                                    : "Reset"}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {account.id === user.id ? (
                              <span className="text-gray-400">Current</span>
                            ) : (
                              <button
                                className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                onClick={() => {
                                  setDeleteUserId(account.id);
                                  setShowConfirmModal(true);
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm text-gray-900 mb-3">Danger Zone</h2>
            <button
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
              onClick={() => {
                setDeleteUserId(null);
                setShowConfirmModal(true);
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      ) : null}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-base text-gray-900 mb-2">
              {deleteUserId ? "Delete User" : "Delete Account"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {deleteUserId
                ? "This action is irreversible. Are you sure you want to delete this user?"
                : "This action is irreversible. Are you sure you want to delete your account?"}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                onClick={
                  deleteUserId ? handleDeleteUserByAdmin : handleDeleteAccount
                }
                disabled={deletingUserByAdmin}
              >
                Yes, Delete
              </button>
              <button
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MePage;
