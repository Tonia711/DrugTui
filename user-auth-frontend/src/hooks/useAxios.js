import { useState, useEffect } from "react";
import api from "../util/api"; // Axios instance with token + baseURL pre-configured

// Custom React hook for making HTTP requests using Axios
// Handles GET, POST, PUT, DELETE, and tracks loading/error state
export default function useAxios({
  method,
  url,
  body = null,
  runOnMount = true,
}) {
  const [data, setData] = useState(null); // Response data
  const [isLoading, setLoading] = useState(runOnMount); // Loading state
  const [error, setError] = useState(null); // Error state
  const [refreshToken, setRefreshToken] = useState(false); // For forcing re-run of request

  // Function to manually trigger the request
  const sendRequest = async (customBody = body) => {
    setLoading(true);
    setError(null);
    try {
      const fullUrl = url.startsWith("/") ? url : `/${url}`;
      let res;

      // Send request based on method
      if (method.toLowerCase() === "get") {
        res = await api.get(fullUrl);
      } else if (method.toLowerCase() === "delete") {
        res = customBody
          ? await api.delete(fullUrl, { data: customBody })
          : await api.delete(fullUrl);
      } else {
        res = await api[method](fullUrl, customBody); // POST or PUT
      }

      setData(res.data);
      return res;
    } catch (err) {
      setError(err.response?.data || "Request failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Automatically send request on mount (optional)
  useEffect(() => {
    if (runOnMount) {
      sendRequest();
    }
  }, [url, refreshToken]);

  // Manually trigger a fresh request
  const refresh = async (customBody = body) => {
    if (runOnMount) {
      setRefreshToken((prev) => !prev);
      return;
    }

    await sendRequest(customBody);
  };

  return { data, isLoading, error, refresh, sendRequest };
}
