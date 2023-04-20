import { ActionPanel, List, Action, Clipboard, closeMainWindow, showHUD } from "@raycast/api";
import { cleanupTempFile, createTempFile, downloadVideo, getVideoInfo, transcribeAudio, videoMarkdown, videoStatusText } from "./utils";
import { actions, useSearchStore, useVideoStore } from "./store";
import { useCallback, useEffect } from "react";

export default function Command() {
	const videos = useVideoStore(state => state.videos)
	const query = useSearchStore(state => state.query)
	const isLoading = useSearchStore(state => state.isLoading)

	const onOpen = useCallback(async () => {
		const clipboard = await Clipboard.readText()
		if (clipboard && clipboard.includes('youtube.com')) {
			useSearchStore.setState({ query: clipboard })
		}
	}, [])

	useEffect(() => {
		onOpen()
	}, [onOpen])

	const handleTranscription = async (inputUrl: string) => {
		const { videos: videoList } = useVideoStore.getState()
		const existingVideo = videoList.find(video => video.url === inputUrl)
		if (existingVideo) {
			if (existingVideo.status !== 'complete') { return }
			Clipboard.copy(existingVideo.transcript)
			closeMainWindow({ clearRootSearch: true })
			return showHUD('Copied transcript to clipboard')
		}

		useSearchStore.setState({ isLoading: true })
		const info = await getVideoInfo({ url: inputUrl })
		const video = actions.createVideo({ info })
		try {
			const { dir, filePath } = createTempFile()

			console.log('Downloading audio...')
			await downloadVideo({ url: inputUrl, filePath })

			console.log('Video downloaded')
			useSearchStore.setState({ isLoading: false })

			actions.updateVideo({
				id: video.id,
				status: 'loading',
				type: 'transcribing'
			})

			console.log('Transcribing audio...')
			const transcript = await transcribeAudio({ filePath })
			actions.updateVideo({
				id: video.id,
				status: 'complete',
				transcript
			})

			cleanupTempFile({ dir, filePath })
		} catch (error) {
			console.error(error)
			useSearchStore.setState({ isLoading: false })
			actions.updateVideo({
				id: video.id,
				status: 'error'
			})
		}
	};

	return (
		<List
			searchText={query}
			onSearchTextChange={value => useSearchStore.setState({ query: value })}
			navigationTitle="YouTube Transcript"
			searchBarPlaceholder="Enter a YouTube URL"
			isLoading={isLoading}
			isShowingDetail
			actions={
				<ActionPanel>
					<Action autoFocus title="Transcribe" onAction={() => handleTranscription(query)} />
				</ActionPanel>
			}
		>
			{videos
				.sort((a, b) => b.createdAt - a.createdAt)
				.map(video => (
					<List.Item
						key={video.id}
						id={video.id}
						title={video.title}
						subtitle={videoStatusText(video)}
						icon={{ source: video.thumbnail }}
						detail={<List.Item.Detail markdown={videoMarkdown(video)} />}
						actions={
							<ActionPanel>
								<Action autoFocus title="Transcribe" onAction={() => handleTranscription(query)} />
							</ActionPanel>
						}
					/>
				))}
		</List>
	);
}
