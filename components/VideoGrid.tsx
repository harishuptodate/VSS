// components/VideoGrid.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabaseClient';
import VideoCard from './VideoCard';

type Thumb = { id: string; objectPath: string; timecodeSec: number };
type Vid = {
	id: string;
	title?: string | null;
	status: 'UPLOADING' | 'PROCESSING' | 'READY';
	createdAt: string;
	thumbnails: Thumb[];
};

type VideoPayload = {
	id: string;
	title?: string | null;
	status: 'UPLOADING' | 'PROCESSING' | 'READY';
	createdAt: string;
};

export default function VideoGrid({
	initial,
	userId,
}: {
	initial: Vid[];
	userId: string;
}) {
	const [videos, setVideos] = useState<Vid[]>(initial);

	// quick map for efficient updates
	const index = useMemo(() => new Map(videos.map((v) => [v.id, v])), [videos]);

	useEffect(() => {
		const supa = supabaseClient();

		// VIDEO updates
		const chVideos = supa
			.channel('videos')
			.on<RealtimePostgresChangesPayload<VideoPayload>>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'Video',
					filter: `userId=eq.${userId}`,
				},
				(payload) => {
					setVideos((curr) => {
						const copy = [...curr];
						if (payload.eventType === 'INSERT') {
							const row = payload.new as any;
							if (!copy.find((v) => v.id === row.id))
								copy.unshift({
									id: row.id,
									title: row.title,
									status: row.status,
									createdAt: row.createdAt,
									thumbnails: [],
								});
						} else if (payload.eventType === 'UPDATE') {
							const row = payload.new as any;
							const i = copy.findIndex((v) => v.id === row.id);
							if (i >= 0) copy[i] = { ...copy[i], status: row.status };
						} else if (payload.eventType === 'DELETE') {
							const old = payload.old as { id: string };
							const i = copy.findIndex((v) => v.id === old.id);
							if (i >= 0) copy.splice(i, 1);
						}
						return copy;
					});
				},
			)
			.subscribe();

		// THUMBNAILS updates
		const chThumbs = supa
			.channel('thumbs')
			.on<RealtimePostgresChangesPayload<any>>(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'Thumbnail' },
				(payload) => {
					if (payload.eventType !== 'INSERT') return;
					const t = payload.new as any; // { videoId, objectPath, ... }
					setVideos((curr) => {
						const copy = [...curr];
						const i = copy.findIndex((v) => v.id === t.videoId);
						if (i >= 0 && !copy[i].thumbnails.find((x) => x.id === t.id)) {
							copy[i] = {
								...copy[i],
								thumbnails: [
									...copy[i].thumbnails,
									{
										id: t.id,
										objectPath: t.objectPath,
										timecodeSec: t.timecodeSec,
									},
								],
							};
						}
						return copy;
					});
				},
			)
			.subscribe();

		return () => {
			supa.removeChannel(chVideos);
			supa.removeChannel(chThumbs);
		};
	}, [userId]);

	return (
		<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
			{videos.map((v) => (
				<VideoCard
					key={v.id}
					id={v.id}
					title={v.title}
					status={v.status}
					createdAt={v.createdAt}
					// show first thumb if any (we’ll let the server page sign URLs)
					thumbUrl={undefined}
				/>
			))}
			{videos.length === 0 && (
				<p className="text-sm text-gray-500">
					No videos yet. Upload one to get started.
				</p>
			)}
		</div>
	);
}
