import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export function useApiResource(path, initialValue) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await apiRequest(path));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [path]);

  return { data, setData, loading, error, reload: load };
}
