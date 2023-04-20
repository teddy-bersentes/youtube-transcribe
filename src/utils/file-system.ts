import fs from 'node:fs'
import path from 'node:path';
import os from 'node:os';
import { nanoid } from 'nanoid';

export const createTempFile = () => {
	const audioFileName = `${nanoid()}.mp3`;
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmp-")); // Use the OS temp directory
	const audioPath = path.join(tempDir, audioFileName);
	return {
		filePath: audioPath,
		dir: tempDir
	}
}

export const cleanupTempFile = (params: ReturnType<typeof createTempFile>) => {
	fs.unlinkSync(params.filePath);
	fs.rmdirSync(params.dir);
	console.log('Video downloaded and cleaned up')
}