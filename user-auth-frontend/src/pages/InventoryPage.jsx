import { useMemo, useState } from "react";
import useAxios from "../hooks/useAxios";
import api from "../util/api";
import styles from "../styles/InventoryPage.module.css";

const initialCreateForm = {
  name: "",
  batchNumber: "",
  unit: "box",
  initialStock: 0,
  reorderLevel: 10,
  expiryDate: "",
  supplier: "",
  notes: "",
};

function InventoryPage() {
  const [keyword, setKeyword] = useState("");
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [adjustQuantityById, setAdjustQuantityById] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const queryUrl = useMemo(() => {
    if (!keyword.trim()) return "/Medicines";
    return `/Medicines?keyword=${encodeURIComponent(keyword.trim())}`;
  }, [keyword]);

  const {
    data: medicines,
    isLoading,
    refresh,
  } = useAxios({ method: "get", url: queryUrl });

  const { sendRequest: createMedicine, isLoading: creating } = useAxios({
    method: "post",
    url: "/Medicines",
    runOnMount: false,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await createMedicine({
        ...createForm,
        initialStock: Number(createForm.initialStock),
        reorderLevel: Number(createForm.reorderLevel),
        expiryDate: createForm.expiryDate || null,
      });
      setCreateForm(initialCreateForm);
      setMessage("Medication created successfully.");
      refresh();
    } catch (err) {
      setError(err.response?.data || "Failed to create medication.");
    }
  };

  const handleAdjust = async (id, type) => {
    setMessage("");
    setError("");

    const qty = Number(adjustQuantityById[id] || 0);
    if (!qty || qty < 1) {
      setError("Please enter a valid quantity.");
      return;
    }

    const endpoint = `/Medicines/${id}/${type === "in" ? "stock-in" : "stock-out"}`;

    try {
      await api.post(endpoint, { quantity: qty });
      setAdjustQuantityById((prev) => ({ ...prev, [id]: "" }));
      setMessage(
        type === "in" ? "Stock-in completed." : "Stock-out completed.",
      );
      refresh();
    } catch (err) {
      setError(err.response?.data || "Stock update failed.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1>Medication Inventory</h1>
          <p>Manage pharmacy stock, thresholds, and replenishment actions.</p>
        </div>
        <button onClick={refresh}>Refresh</button>
      </div>

      <div className={styles.grid}>
        <form className={styles.panel} onSubmit={handleCreate}>
          <h2>Add New Medication</h2>

          <label>Name</label>
          <input
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />

          <label>Batch Number</label>
          <input
            value={createForm.batchNumber}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                batchNumber: e.target.value,
              }))
            }
            required
          />

          <label>Unit</label>
          <input
            value={createForm.unit}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, unit: e.target.value }))
            }
            required
          />

          <div className={styles.twoCol}>
            <div>
              <label>Initial Stock</label>
              <input
                type="number"
                min="0"
                value={createForm.initialStock}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    initialStock: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label>Reorder Level</label>
              <input
                type="number"
                min="0"
                value={createForm.reorderLevel}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    reorderLevel: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <label>Expiry Date</label>
          <input
            type="date"
            value={createForm.expiryDate}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, expiryDate: e.target.value }))
            }
          />

          <label>Supplier</label>
          <input
            value={createForm.supplier}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, supplier: e.target.value }))
            }
          />

          <label>Notes</label>
          <textarea
            rows={3}
            value={createForm.notes}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />

          <button type="submit" disabled={creating}>
            {creating ? "Saving..." : "Create Medication"}
          </button>
        </form>

        <div className={styles.panel}>
          <div className={styles.listTop}>
            <h2>Stock List</h2>
            <input
              className={styles.search}
              placeholder="Search name / batch / supplier"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Batch</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>Loading...</td>
                  </tr>
                ) : !medicines?.length ? (
                  <tr>
                    <td colSpan={6}>No medication records.</td>
                  </tr>
                ) : (
                  medicines.map((item) => {
                    const isLowStock = item.stockQuantity <= item.reorderLevel;
                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.batchNumber}</td>
                        <td>
                          {item.stockQuantity} {item.unit}
                        </td>
                        <td>{item.reorderLevel}</td>
                        <td>
                          <span
                            className={
                              isLowStock ? styles.badgeWarn : styles.badgeOk
                            }
                          >
                            {isLowStock ? "Low" : "Normal"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.adjustRow}>
                            <input
                              type="number"
                              min="1"
                              value={adjustQuantityById[item.id] || ""}
                              onChange={(e) =>
                                setAdjustQuantityById((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className={styles.inBtn}
                              onClick={() => handleAdjust(item.id, "in")}
                            >
                              +In
                            </button>
                            <button
                              type="button"
                              className={styles.outBtn}
                              onClick={() => handleAdjust(item.id, "out")}
                            >
                              -Out
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;
