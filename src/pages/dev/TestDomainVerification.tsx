import { useEffect, useState } from "react";
import { useStartDomainVerification } from "@/hooks/useStartDomainVerification";

export default function TestDomainVerification() {
  const { mutate, data, error, isPending, isSuccess, isError } = useStartDomainVerification();
  const [called, setCalled] = useState(false);

  useEffect(() => {
    if (!called) {
      setCalled(true);
      mutate({
        orgId: "5d42c688-d600-48fd-9296-5e0f215a3669",
        domainId: "8683f5c1-52c7-4331-8803-6641f7d27a56",
        method: "dns_txt",
      });
    }
  }, [called, mutate]);

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Test: useStartDomainVerification</h1>
      
      <div className="mb-4">
        <strong>Status:</strong>{" "}
        {isPending && <span className="text-yellow-600">Loading...</span>}
        {isSuccess && <span className="text-green-600">Success</span>}
        {isError && <span className="text-red-600">Error</span>}
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
          <strong>Error:</strong>
          <pre className="mt-2 whitespace-pre-wrap">{error?.message}</pre>
        </div>
      )}

      {isSuccess && (
        <div className="p-4 bg-green-100 border border-green-300 rounded">
          <strong>Response:</strong>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
