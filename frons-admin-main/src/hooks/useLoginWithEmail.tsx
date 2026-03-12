import { useLoginWithEmail as usePrivyLoginWithEmail } from "@privy-io/react-auth";

// Re-export the Privy email login hook for use in components
export const useLoginWithEmail = usePrivyLoginWithEmail;

export default useLoginWithEmail;
