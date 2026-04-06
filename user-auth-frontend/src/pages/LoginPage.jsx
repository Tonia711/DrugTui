import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, X, Phone, Mail, MessageCircle } from "lucide-react";
import useAxios from "../hooks/useAxios";
import api from "../util/api";
import logoImage from "../assets/159be5b2673509fff982b6d650d9a19a8a77d2d1.png";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);

  const { sendRequest } = useAxios({
    method: "post",
    url: "/Users/login",
    runOnMount: false,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await sendRequest({ email, password });
      const token = res.data.token;
      localStorage.setItem("token", token);

      try {
        const meRes = await api.get("/Users/me");
        const role = meRes.data?.role;
        const normalizedRole = role === "User" ? "DepartmentMember" : role;
        navigate(
          normalizedRole === "DepartmentMember" ? "/inventory" : "/dashboard",
        );
      } catch {
        navigate("/dashboard");
      }
    } catch {
      setError("Login failed. Please check your email and password.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg p-8">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex items-end gap-3 relative">
              <img
                src={logoImage}
                alt="DrugTui logo"
                className="w-24 h-24 object-contain translate-y-5 z-0"
              />
              <span className="text-xl text-gray-900 font-bold relative z-10 -translate-x-[5px]">
                DrugTui
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Central Pharmacy Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Don't have an account? Contact us
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs hover:bg-blue-700 transition-colors"
            >
              Login
            </button>

            {error && (
              <p className="text-center text-red-600 text-xs">{error}</p>
            )}
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-500 mt-4">
          © 2025 Central Pharmacy Management System. All rights reserved.
        </p>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Contact Customer Service
              </h2>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-3">
                To create a new account, please contact our customer service
                team:
              </p>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-0.5">Phone</p>
                  <p className="text-xs text-blue-900">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-0.5">Email</p>
                  <p className="text-xs text-cyan-900">
                    support@pharmacare.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-0.5">Live Chat</p>
                  <p className="text-xs text-green-900">
                    Available Mon-Fri, 9AM-6PM
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full mt-5 px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
