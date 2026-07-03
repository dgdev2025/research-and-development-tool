import Link from "next/link";

interface FeedBackLinkProps {
  show: boolean;
}

export function FeedBackLink({ show }: FeedBackLinkProps) {
  if (!show) return null;

  return (
    <Link href="/dashboard" className="feed-back-link" aria-label="Back to dashboard">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
