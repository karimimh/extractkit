import { useState, useEffect } from "react";
import type { Label } from "@notes/types/label-types";
import { apiClient } from "@notes/utils/api";

export const useLabels = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.labels.fetchLabels();
      setLabels(response.labels);
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    } finally {
      setLoading(false);
    }
  };

  return { labels, loading, refetch: fetchLabels };
};
