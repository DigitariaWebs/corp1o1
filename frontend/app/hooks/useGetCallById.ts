import { useState, useEffect } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);
  const client = useStreamVideoClient();

  useEffect(() => {
    const loadCall = async () => {
      if (!client || !id) return;
      try {
        // Query Stream for a call with this specific ID
        const { calls } = await client.queryCalls({
          filter_conditions: { id }, 
        });
        if (calls.length > 0) setCall(calls[0]);
      } catch (error) {
        console.error("Error fetching call:", error);
      } finally {
        setIsCallLoading(false);
      }
    };
    loadCall();
  }, [client, id]);

  return { call, isCallLoading };
};
