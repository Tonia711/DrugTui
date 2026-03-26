// src/components/Navbar.jsx
import styles from "../styles/Navbar.module.css";
import { NavLink, useNavigate } from "react-router-dom";

function Navbar({ username, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className={styles.navbar}>
      <div className={styles.logo} onClick={() => navigate("/home")}>
        🌟 MyApp
      </div>
      <div className={styles.navRight}>
        <span className={styles.username}>👤 {username}</span>

        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/me"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          About Me
        </NavLink>

        <button className={styles.logoutButton} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
