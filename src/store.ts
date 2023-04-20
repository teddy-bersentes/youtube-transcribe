import { create } from 'zustand'
import { videoInfo as VideoInfo } from 'ytdl-core'
import { nanoid } from 'nanoid'
import { createJSONStorage, persist } from 'zustand/middleware'
import { LocalStorage } from '@raycast/api'

export type Status = {
	status: 'loading'
	type: 'downloading' | 'transcribing'
} | {
	status: 'error'
} | {
	status: 'complete'
	transcript: string
}

export type Video = {
	id: string
	title: string
	thumbnail: string
	url: string
	createdAt: number
} & Status

type State = {
	videos: Video[]
}

export const useVideoStore = create<State>()(
	persist(
		(_set) => ({ videos: [] }),
		{
			name: 'transcribed-videos',
			storage: createJSONStorage(() => ({
				getItem: async (key) => {
					const value = await LocalStorage.getItem(key)
					return value !== undefined ? value.toString() : null
				},
				removeItem: (key) => LocalStorage.removeItem(key),
				setItem: (key, value) => LocalStorage.setItem(key, value)
			}))
		}
	)
)

type Actions = {
	createVideo: (params: { info: VideoInfo }) => Video
	updateVideo: (params: { id: string } & Status) => void
}

export const actions: Actions = {
	createVideo: ({ info }) => {
		const video: Video = {
			id: nanoid(),
			status: 'loading',
			type: 'downloading',
			thumbnail: info.videoDetails.thumbnails[0].url,
			title: info.videoDetails.title,
			url: info.videoDetails.video_url,
			createdAt: Date.now()
		}

		useVideoStore.setState(state => ({
			videos: [...state.videos, video]
		}))

		return video
	},
	updateVideo: ({ id, ...status }) => {
		useVideoStore.setState(state => ({
			videos: state.videos.map(video => {
				if (video.id === id) return { ...video, ...status }
				return video
			})
		}))
	}
}

export const useSearchStore = create<{ query: string; isLoading: boolean }>()(
	() => ({
		isLoading: false,
		query: ''
	})
)