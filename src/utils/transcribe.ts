import fs from 'node:fs'
import FormData from "form-data";
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { API_KEY } from '../constants';

type TranscribeParams = {
	filePath: string
}

export const transcribeAudio = async ({ filePath }: TranscribeParams): Promise<string> => {
	const formData = new FormData();
	formData.append("file", fs.createReadStream(filePath));
	formData.append("model", "whisper-1");

	const config: AxiosRequestConfig = {
		headers: {
			"Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
			Authorization: `Bearer ${API_KEY}`
		},
		maxBodyLength: Infinity,
		maxContentLength: Infinity
	};

	const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, config);
	return response.data.text;
};