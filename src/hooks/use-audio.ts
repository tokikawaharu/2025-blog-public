'use client'

import { create } from 'zustand'

export type LoopMode = 'single' | 'all'

export interface Song {
	src: string
	title: string
}

// Audio instance lives outside the store so it survives
// component mount/unmount cycles across page navigations
let audio: HTMLAudioElement | null = null
let loopModeRef: LoopMode = 'all'
let currentIndexRef = 0

function ensureAudio(): HTMLAudioElement {
	if (typeof window === 'undefined') {
		return {} as HTMLAudioElement
	}
	if (!audio) {
		audio = new Audio()
		audio.preload = 'auto'

		audio.addEventListener('timeupdate', () => {
			if (audio && audio.duration) {
				const pct = (audio.currentTime / audio.duration) * 100
				useAudioStore.setState({
					progress: pct,
					currentTime: audio.currentTime,
					duration: audio.duration,
				})
			}
		})

		audio.addEventListener('loadedmetadata', () => {
			if (audio) {
				useAudioStore.setState({
					duration: audio.duration,
					currentTime: audio.currentTime,
				})
			}
		})

		audio.addEventListener('ended', () => {
			if (loopModeRef === 'all') {
				handleNext()
			}
		})

		audio.addEventListener('play', () => {
			useAudioStore.setState({ isPlaying: true })
		})

		audio.addEventListener('pause', () => {
			useAudioStore.setState({ isPlaying: false })
		})
	}
	return audio
}

function loadSong(index: number) {
	const playlist = useAudioStore.getState().playlist
	if (playlist.length === 0) return
	const i = ((index % playlist.length) + playlist.length) % playlist.length
	currentIndexRef = i
	const a = ensureAudio()
	const wasPlaying = !a.paused
	a.pause()
	a.src = playlist[i].src
	a.loop = loopModeRef === 'single'
	useAudioStore.setState({ currentIndex: i, progress: 0, currentTime: 0 })
	if (wasPlaying) {
		a.play().catch(() => {})
	}
}

function handleNext() {
	loadSong(currentIndexRef + 1)
}

function handlePrev() {
	loadSong(currentIndexRef - 1)
}

function handleJumpTo(index: number) {
	if (index === currentIndexRef) return
	loadSong(index)
}

interface AudioState {
	playlist: Song[]
	currentIndex: number
	isPlaying: boolean
	progress: number
	loopMode: LoopMode
	currentTime: number
	duration: number

	fetchPlaylist: () => Promise<void>
	init: () => Promise<void>
	play: () => void
	pause: () => void
	toggle: () => void
	next: () => void
	prev: () => void
	toggleLoopMode: () => void
	seek: (time: number) => void
	jumpTo: (index: number) => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
	playlist: [],
	currentIndex: 0,
	isPlaying: false,
	progress: 0,
	loopMode: 'all',
	currentTime: 0,
	duration: 0,

	fetchPlaylist: async () => {
		try {
			const res = await fetch('/api/music-list')
			if (res.ok) {
				const list: Song[] = await res.json()
				set({ playlist: list })
			}
		} catch {
			// Keep existing playlist on error
		}
	},

	init: async () => {
		// Fetch playlist first (idempotent — won't refetch if already have songs)
		const { playlist } = get()
		if (playlist.length === 0) {
			await get().fetchPlaylist()
		}

		const a = ensureAudio()
		const songs = get().playlist
		if (songs.length === 0) return

		if (!a.src || a.src === window.location.origin + '/') {
			a.src = songs[currentIndexRef]?.src || songs[0].src
		}
		a.loop = loopModeRef === 'single'
	},

	play: () => {
		const a = ensureAudio()
		const songs = get().playlist
		if (!a.src || a.src === window.location.origin + '/') {
			if (songs.length > 0) {
				a.src = songs[currentIndexRef]?.src || songs[0].src
			}
			a.loop = loopModeRef === 'single'
		}
		a.play().catch(() => {})
	},

	pause: () => {
		ensureAudio().pause()
	},

	toggle: () => {
		const a = ensureAudio()
		if (a.paused) {
			get().play()
		} else {
			get().pause()
		}
	},

	next: () => {
		handleNext()
	},

	prev: () => {
		handlePrev()
	},

	jumpTo: (index: number) => {
		const { playlist } = get()
		if (index >= 0 && index < playlist.length) {
			handleJumpTo(index)
		}
	},

	toggleLoopMode: () => {
		const newMode: LoopMode = loopModeRef === 'single' ? 'all' : 'single'
		loopModeRef = newMode
		ensureAudio().loop = newMode === 'single'
		set({ loopMode: newMode })
	},

	seek: (time: number) => {
		const a = ensureAudio()
		a.currentTime = Math.max(0, Math.min(time, a.duration || 0))
		set({ currentTime: a.currentTime })
	},
}))
