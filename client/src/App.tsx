import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
}

const App = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Server is not reachable");
        }

        return res.json();
      })
      .then((body) => {
        setData(body);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>IT Live LMS</h1>
      {loading ? (
        <p>Checking server...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <p>Server status: {data?.status}</p>
      )}
    </div>
  );
};

export default App;
