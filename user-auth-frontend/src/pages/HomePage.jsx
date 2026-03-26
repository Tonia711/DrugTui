// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import styles from "../styles/HomePage.module.css";
import useAxios from "../hooks/useAxios";

function HomePage() {
  const { data: user, isLoading: userLoading } = useAxios({
    method: "get",
    url: "/Users/me",
  });
  const { data: medicines, isLoading: medicinesLoading } = useAxios({
    method: "get",
    url: "/Medicines",
  });
  const { data: lowStock, isLoading: lowStockLoading } = useAxios({
    method: "get",
    url: "/Medicines/low-stock",
  });

  const totalItems = medicines?.length || 0;
  const lowStockCount = lowStock?.length || 0;
  const healthyStockCount = Math.max(0, totalItems - lowStockCount);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hospital Pharmacy Dashboard</h1>
        <p>
          Welcome{user?.username ? `, ${user.username}` : ""}. Monitor
          medication stock levels and act on replenishment alerts.
        </p>
      </div>

      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <span className={styles.label}>Total Medications</span>
          <strong>{medicinesLoading ? "..." : totalItems}</strong>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Low Stock Alerts</span>
          <strong className={styles.alertText}>
            {lowStockLoading ? "..." : lowStockCount}
          </strong>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Healthy Stock</span>
          <strong>{medicinesLoading ? "..." : healthyStockCount}</strong>
        </div>
      </div>

      <div className={styles.panel}>
        <h2>Quick Actions</h2>
        <div className={styles.actions}>
          <Link to="/inventory" className={styles.button}>
            Open Inventory Module
          </Link>
          <Link to="/me" className={styles.secondaryButton}>
            View Profile
          </Link>
        </div>
      </div>

      {userLoading && (
        <p className={styles.loading}>Loading operator information...</p>
      )}
    </div>
  );
}

export default HomePage;
