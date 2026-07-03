"use client";

import Link from "next/link";
import { DeleteFeedButton } from "@/components/DeleteFeedButton";
import type { FeedWithUploader } from "@/lib/types";
import { displayName, formatDate } from "@/lib/profiles";

interface DashboardTableProps {
  feeds: FeedWithUploader[];
  isAdmin: boolean;
}

export function DashboardTable({ feeds, isAdmin }: DashboardTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Uploaded by</th>
            <th>Uploaded</th>
            <th>Last modified</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {feeds.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 5 : 4} className="empty-cell">
                No feeds yet.
                {isAdmin && (
                  <>
                    {" "}
                    <Link href="/feeds/new">Import your first feed</Link>
                  </>
                )}
              </td>
            </tr>
          ) : (
            feeds.map((feed) => (
              <tr key={feed.id}>
                <td>
                  <Link href={`/feeds/${feed.id}`} className="table-link">
                    {feed.title}
                  </Link>
                </td>
                <td>{displayName(feed.uploader)}</td>
                <td>{formatDate(feed.created_at)}</td>
                <td>{formatDate(feed.updated_at)}</td>
                {isAdmin && (
                  <td>
                    <DeleteFeedButton
                      feedId={feed.id}
                      feedTitle={feed.title}
                      variant="icon"
                    />
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
