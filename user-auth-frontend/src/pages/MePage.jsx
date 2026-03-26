import { useState } from "react";
import styles from "../styles/MePage.module.css";
import { useNavigate } from "react-router-dom";
import useAxios from "../hooks/useAxios";

function MePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  // 🔹 1. 读取当前用户
  const {
    data: user,
    isLoading,
    refresh: refreshUser,
  } = useAxios({ method: "get", url: "/Users/me" });

  // 🔹 2. 更新用户（PUT）—— 仅在调用 sendRequest 时传 body
  const { sendRequest: updateUser, isLoading: updating } = useAxios({
    method: "put",
    url: "/Users/me",
    runOnMount: false,
  });

  // 🔹 3. 删除用户（DELETE）
  const { sendRequest: deleteUser } = useAxios({
    method: "delete",
    url: "/Users/me",
    runOnMount: false,
  });

  const handleEditClick = () => {
    setNewUsername(user.username);
    setNewBio(user.bio || "");
    setError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError("");
    try {
      await updateUser({ username: newUsername, bio: newBio });
      refreshUser(); // 重新获取用户信息
      setIsEditing(false);
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data);
      } else {
        setError("Something went wrong.");
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
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
    <div className={styles.container}>
      {isLoading ? (
        <p className={styles.loading}>Loading user info...</p>
      ) : user ? (
        <div className={styles.card}>
          <h2>{user.username}</h2>
          <p className={styles.email}>{user.email}</p>

          <div className={styles.about}>
            <h3>About Me</h3>
            {isEditing ? (
              <>
                <label>Username:</label>
                <input
                  className={styles.input}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
                {error && <p className={styles.error}>{error}</p>}

                <label>Bio:</label>
                <textarea
                  className={styles.textarea}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                />
                <div className={styles.buttonRow}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={updating}
                  >
                    {updating ? "Saving..." : "Save"}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p>{user.bio || "No bio yet. Maybe add something cool here!"}</p>
            )}
          </div>

          {!isEditing && (
            <button className={styles.editButton} onClick={handleEditClick}>
              Edit Profile
            </button>
          )}

          {!isEditing && (
            <div className={styles.deleteSection}>
              <button
                className={styles.deleteButton}
                onClick={() => setShowConfirmModal(true)}
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      ) : null}

      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Account</h3>
            <p>
              This action is irreversible. Are you sure you want to delete your
              account?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.confirmButton}
                onClick={handleDeleteAccount}
              >
                Yes, Delete
              </button>
              <button
                className={styles.cancelButton}
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
