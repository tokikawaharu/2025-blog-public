'use client'

import { useMemo, useEffect } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from '../app/(home)/stores/config-store'
import { CARD_SPACING } from '@/consts'
import MusicSVG from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'
import { HomeDraggableLayer } from '../app/(home)/home-draggable-layer'
import { Pause } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useAudioStore } from '@/hooks/use-audio'
import { useLayoutEditStore } from '../app/(home)/stores/layout-edit-store'

export default function MusicCard() {
	const pathname = usePathname()
	const router = useRouter()
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const editing = useLayoutEditStore(state => state.editing)
	const styles = cardStyles.musicCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard
	const calendarCardStyles = cardStyles.calendarCard

	const store = useAudioStore()

	const isHomePage = pathname === '/'

	// Initialize audio on first render
	useEffect(() => {
		store.init()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	const position = useMemo(() => {
		// If not on home page, position at bottom-right corner
		if (!isHomePage) {
			return {
				x: center.width - styles.width - 16,
				y: center.height - styles.height - 16
			}
		}

		// Default position on home page
		return {
			x: styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2 - styles.offset,
			y: styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset + CARD_SPACING + calendarCardStyles.height + CARD_SPACING
		}
	}, [isHomePage, center, styles, hiCardStyles, clockCardStyles, calendarCardStyles])

	const { x, y } = position

	const handleCardClick = () => {
		if (!editing) {
			router.push('/music')
		}
	}

	const handlePlayPause = (e: React.MouseEvent) => {
		e.stopPropagation()
		store.toggle()
	}

	// Get current song title
	const currentTitle = store.playlist[store.currentIndex]?.title || ''

	return (
		<HomeDraggableLayer cardKey='musicCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card
				order={styles.order}
				width={styles.width}
				height={styles.height}
				x={x}
				y={y}
				className={clsx(!isHomePage && 'fixed')}
			>
				<div
					className='flex h-full w-full cursor-pointer items-center gap-3'
					onClick={handleCardClick}
				>
					{siteContent.enableChristmas && (
						<>
							<img
								src='/images/christmas/snow-10.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 120, left: -8, top: -12, opacity: 0.8 }}
							/>
							<img
								src='/images/christmas/snow-11.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 80, right: -10, top: -12, opacity: 0.8 }}
							/>
						</>
					)}

					<MusicSVG className='h-8 w-8' />

					<div className='flex-1'>
						<div className='text-secondary line-clamp-1 text-sm'>{currentTitle}</div>

						<div className='mt-1 h-2 rounded-full bg-white/60'>
							<div className='bg-linear h-full rounded-full transition-all duration-300' style={{ width: `${store.progress}%` }} />
						</div>
					</div>

					<button
						onClick={handlePlayPause}
						className='flex h-10 w-10 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-80'
					>
						{store.isPlaying ? <Pause className='text-brand h-4 w-4' /> : <PlaySVG className='text-brand ml-1 h-4 w-4' />}
					</button>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
