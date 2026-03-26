// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "../styles/Layout.module.css";
import useAxios from "../hooks/useAxios";

function Layout() {
  const navigate = useNavigate();
  const { data: user } = useAxios({ method: "get", url: "/Users/me" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>DrugTui HMS</div>
        <div className={styles.userBlock}>
          <div className={styles.userName}>
            {user?.username || "Pharmacist"}
          </div>
          <div className={styles.userEmail}>{user?.email || ""}</div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
            }
          >
            Inventory
          </NavLink>
          <NavLink
            to="/me"
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
            }
          >
            Profile
          </NavLink>
        </nav>

        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className={styles.contentArea}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
