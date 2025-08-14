// components/ShareLinksTable.tsx
"use client";
import useSWR from "swr";

type LinkRow = {
  id: string;
  token: string;
  visibility: "PUBLIC" | "PRIVATE";
  expiresAt: string | null;
  lastViewedAt: string | null;
  createdAt: string;
};
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ShareLinksTable() {
  const { data, mutate } = useSWR<LinkRow[]>("/api/links", fetcher);
  if (!data) return <div className="text-sm text-gray-500">No links yet.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">Visibility</th>
            <th className="p-2">Expiry</th>
            <th className="p-2">Status</th>
            <th className="p-2">Last Access</th>
            <th className="p-2">URL</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l) => {
            const active = !l.expiresAt || new Date(l.expiresAt) > new Date();
            return (
              <tr key={l.id} className="border-b">
                <td className="p-2">{l.visibility}</td>
                <td className="p-2">{l.expiresAt ? new Date(l.expiresAt).toLocaleString() : "Forever"}</td>
                <td className="p-2">{active ? "Active" : "Expired"}</td>
                <td className="p-2">{l.lastViewedAt ? new Date(l.lastViewedAt).toLocaleString() : "-"}</td>
                <td className="p-2">
                  <a className="text-blue-600 underline break-all" href={`/s/${l.token}`} target="_blank">
                    /s/{l.token}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
