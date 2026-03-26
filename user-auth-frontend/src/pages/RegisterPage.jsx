import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import layout from "../styles/FormLayout.module.css";
import useAxios from "../hooks/useAxios";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    bio: "",
  });
  const [error, setError] = useState("");

  // ✅ 在组件顶层调用 Hook
  const { sendRequest } = useAxios({
    method: "post",
    url: "/Users/register",
    runOnMount: false,
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await sendRequest(formData); // ✅ 调用 hook 返回的方法
      navigate("/login");
    } catch (err) {
      setError(err.response?.data || "Registration failed.");
    }
  };

  return (
    <div className={layout.container}>
      <form className={layout.form} onSubmit={handleSubmit}>
        <h2>Register</h2>

        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label>Bio:</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} />

        {error && <p className={layout.error}>{error}</p>}

        <button type="submit" className={layout.button}>
          Register
        </button>

        <p className={layout.link}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
