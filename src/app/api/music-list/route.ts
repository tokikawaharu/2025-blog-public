import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function filenameToTitle(filename: string): string {
	const name = filename.replace(/\.(mp3|wav|ogg|flac|aac|m4a)$/i, '')
	return name
		.replace(/[-_]/g, ' ')
		.replace(/\b\w/g, c => c.toUpperCase())
		.trim()
}

function isChristmasEnabled(): boolean {
	try {
		const configPath = join(process.cwd(), 'src', 'config', 'site-content.json')
		const raw = readFileSync(configPath, 'utf-8')
		const config = JSON.parse(raw)
		return config.enableChristmas === true
	} catch {
		return false
	}
}

// Cache the playlist in dev to avoid repeated filesystem reads
let cachedPlaylist: { src: string; title: string }[] | null = null

export async function GET() {
	if (process.env.NODE_ENV === 'production' && cachedPlaylist) {
		return NextResponse.json(cachedPlaylist)
	}

	try {
		const musicDir = join(process.cwd(), 'public', 'music')
		const files = readdirSync(musicDir)

		let musicFiles = files.filter(f =>
			/\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(f)
		)

		// Only include Christmas music when Christmas mode is enabled
		const christmasOn = isChristmasEnabled()
		if (!christmasOn) {
			musicFiles = musicFiles.filter(f => !/christmas/i.test(f))
		}

		const playlist = musicFiles.map(file => ({
			src: `/music/${file}`,
			title: filenameToTitle(file),
		}))

		cachedPlaylist = playlist
		return NextResponse.json(playlist)
	} catch {
		return NextResponse.json([
			{ src: '/music/close-to-you.mp3', title: 'Close To You' },
			{ src: '/music/白山吉光.mp3', title: '白山吉光' },
		])
	}
}
