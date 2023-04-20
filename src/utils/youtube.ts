import ytdl from "ytdl-core";
import fs from 'node:fs'
import { Video } from "../store";

export const getVideoInfo = async ({ url }: { url: string }) => {
	const info = await ytdl.getInfo(url);
	return info;
}

type Params = {
	url: string;
	filePath: string
}
export const downloadVideo = async ({ filePath, url }: Params) => {
	await new Promise(resolve => {
		ytdl(url, {
			filter: 'audioonly',
			quality: 'highestaudio'
		})
			.pipe(fs.createWriteStream(filePath))
			.on('progress', (something) => {
				console.log('progress:', something)
			})
			.on('error', console.error)
			.on('finish', resolve)
	})
}

export const videoStatusText = (video: Video): string => {
	if (video.status === 'loading') {
		return video.type === 'downloading' ? 'Downloading' : 'Transcribing'
	}

	if (video.status === 'error') return 'Error'

	return 'Complete'
}

export const videoMarkdown = (video: Video): string => {
	return `
# ${video.title}

![${video.title}](${video.thumbnail})

---\n\n
${video.status === 'complete' ? `${video.transcript}` : ''}
${video.status === 'loading' ? video.type === 'downloading' ? 'Downloading video...' : 'Transcribing...' : ''}
`
}