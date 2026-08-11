'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAudioStore } from '@/hooks/use-audio'

export default function MusicPage() {
	const router = useRouter()
	const store = useAudioStore()
	const progressBarRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		store.init()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	const handleSeek = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const bar = progressBarRef.current
			if (!bar || !store.duration) return
			const rect = bar.getBoundingClientRect()
			const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
			store.seek(pct * store.duration)
		},
		[store]
	)

	const formatTime = (seconds: number) => {
		if (!isFinite(seconds) || seconds < 0) return '0:00'
		const m = Math.floor(seconds / 60)
		const s = Math.floor(seconds % 60)
		return `${m}:${s.toString().padStart(2, '0')}`
	}

	const currentSong = store.playlist[store.currentIndex]
	const playlist = store.playlist

	return (
		<div className='flex flex-col items-center px-6 pt-20 pb-8'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className='w-full max-w-[420px] space-y-4'
			>
				{/* Back button */}
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => router.back()}
					className='inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-4 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/60'
				>
					<ArrowLeft className='h-4 w-4' />
					返回
				</motion.button>

				{/* Vinyl Record Player */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className='card relative flex aspect-square items-center justify-center overflow-visible p-5' style={{ maxWidth: 380, maxHeight: 380, margin: '20px auto' }}
				>
					{/* Tonearm */}
					<div className='absolute top-4 right-7 z-20' style={{ width: 70, height: 155 }}>
						<motion.div
							className='absolute right-0 top-0 origin-top-right'
							animate={{ rotate: store.isPlaying ? 28 : -8 }}
							transition={{ type: 'spring', stiffness: 120, damping: 16 }}
						>
							<div className='bg-neutral-400 mx-auto h-3.5 w-3.5 rounded-full shadow-sm' />
							<div className='mx-auto h-[120px] w-[2.5px] bg-gradient-to-b from-neutral-400 to-neutral-300 shadow-sm' />
							<div className='bg-neutral-400 mx-auto -mt-0.5 h-2.5 w-6 rounded-full shadow-sm' />
						</motion.div>
					</div>

					{/* Spinning Record */}
					<motion.div
						animate={{ rotate: store.isPlaying ? 360 : 0 }}
						transition={store.isPlaying
							? { repeat: Infinity, duration: 3, ease: 'linear' }
							: { duration: 0.5, ease: 'easeOut' }
						}
						className='relative z-10 flex items-center justify-center'
					>
						<div
							className='flex items-center justify-center rounded-full'
							style={{
								width: 250,
								height: 250,
								background: 'conic-gradient(from 0deg, #2a2a2a 0deg, #1a1a1a 30deg, #333 60deg, #1a1a1a 90deg, #2a2a2a 120deg, #1a1a1a 150deg, #333 180deg, #1a1a1a 210deg, #2a2a2a 240deg, #1a1a1a 270deg, #333 300deg, #1a1a1a 330deg, #2a2a2a 360deg)',
								boxShadow: '0 6px 24px rgba(0,0,0,0.15), 0 0 0 5px rgba(0,0,0,0.06)',
							}}
						>
							<div
								className='flex items-center justify-center rounded-full bg-white p-1.5'
								style={{
									width: 135,
									height: 135,
									boxShadow: '0 0 0 2px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.05)',
								}}
							>
								<img
									src='/images/avatar.png'
									alt='cover'
									className='h-[122px] w-[122px] rounded-full'
								/>
							</div>
						</div>
					</motion.div>
				</motion.div>

				{/* Song info — font unchanged */}
				<div className='text-center'>
					<h1 className='text-xl font-bold'>{currentSong?.title || ''}</h1>
					<p className='text-secondary mt-1 text-sm'>
						{store.currentIndex + 1} / {playlist.length}
					</p>
				</div>

				{/* Progress bar */}
				<div className='space-y-0.5'>
					<div
						ref={progressBarRef}
						onClick={handleSeek}
						className='h-1.5 cursor-pointer rounded-full bg-white/60'
					>
						<div
							className='bg-linear h-full rounded-full transition-all duration-200'
							style={{ width: `${store.progress}%` }}
						/>
					</div>
					<div className='text-secondary flex justify-between text-xs'>
						<span>{formatTime(store.currentTime)}</span>
						<span>{formatTime(store.duration)}</span>
					</div>
				</div>

				{/* Controls */}
				<div className='flex items-center justify-center gap-4'>
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => store.toggleLoopMode()}
						className={cn(
							'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
							store.loopMode === 'single'
								? 'text-brand'
								: 'text-secondary hover:text-brand'
						)}
					>
						{store.loopMode === 'single' ? (
							<Repeat1 className='h-4 w-4' />
						) : (
							<Repeat className='h-4 w-4' />
						)}
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => store.prev()}
						className='text-secondary hover:text-brand flex h-9 w-9 items-center justify-center rounded-full transition-colors'
					>
						<SkipBack className='h-5 w-5' />
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => store.toggle()}
						className='bg-linear flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg'
					>
						{store.isPlaying ? (
							<Pause className='h-6 w-6' />
						) : (
							<Play className='ml-0.5 h-6 w-6' />
						)}
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => store.next()}
						className='text-secondary hover:text-brand flex h-9 w-9 items-center justify-center rounded-full transition-colors'
					>
						<SkipForward className='h-5 w-5' />
					</motion.button>

					<div className='h-9 w-9' />
				</div>

				{/* Playlist */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<h2 className='text-secondary mb-2 text-xs font-medium uppercase tracking-wider'>
						播放列表
					</h2>
					<div className='playlist-scroll max-h-[280px] space-y-1.5 overflow-y-auto pr-1'>
						{playlist.map((song, index) => {
							const isCurrent = index === store.currentIndex
							const isActive = isCurrent && store.isPlaying

							return (
								<motion.button
									key={song.src}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => {
										if (index === store.currentIndex) {
											store.toggle()
										} else {
											store.jumpTo(index)
										}
									}}
									className={cn(
										'flex w-full items-center gap-3 rounded-[36px] border bg-white/40 p-3 text-left backdrop-blur-sm transition-all',
										isCurrent
											? 'border-brand/40 shadow-sm'
											: 'border-white/60 hover:bg-white/60'
									)}
								>
									<div
										className={cn(
											'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
											isCurrent
												? 'bg-linear text-white'
												: 'bg-secondary/10 text-secondary'
										)}
									>
										{isActive ? (
											<Pause className='h-3.5 w-3.5' />
										) : isCurrent ? (
											<Play className='ml-0.5 h-3.5 w-3.5' />
										) : (
											index + 1
										)}
									</div>
									<div className='min-w-0 flex-1'>
										<p
											className={cn(
												'truncate text-sm font-medium',
												isCurrent && 'text-linear'
											)}
										>
											{song.title}
										</p>
									</div>
									{isCurrent && (
										<span className='bg-linear h-2 w-2 shrink-0 rounded-full' />
									)}
								</motion.button>
							)
						})}
					</div>
				</motion.div>

				{playlist.length === 0 && (
					<p className='text-secondary text-center text-sm'>
						暂无音乐，将 mp3 文件放入 <code className='rounded bg-white/40 px-1 py-0.5'>public/music/</code> 目录即可自动识别
					</p>
				)}
			</motion.div>
		</div>
	)
}
