import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize, Settings, SkipBack, SkipForward, Wifi,
} from 'lucide-react'
function fmtTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface MediaPlayerProps {
  src: string
  title?: string
  live?: boolean
  startMuted?: boolean
  autoPlay?: boolean
  onBack?: () => void
  className?: string
}

export default function MediaPlayer({ src, title = '', live = false, startMuted = false, autoPlay = true, onBack, className = '' }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(startMuted)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [showSettings, setShowSettings] = useState(false)
  const [streamReady, setStreamReady] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [centerAction, setCenterAction] = useState<{ type: 'play' | 'pause'; k: number } | null>(null)

  // baslat
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let hls: Hls | null = null

    setStreamReady(false); setStreamError(false); setPlaying(false)
    setLevels([]); setCurrentLevel(-1); setCurrentTime(0); setDuration(0); setBuffered(0)
    video.muted = startMuted
    setMuted(startMuted)

    // otomatik oynatma kapaliysa hazir bekler
    const tryPlay = () => {
      if (!autoPlay) return
      const p = video.play()
      if (p) p.catch(() => { video.muted = true; setMuted(true); video.play().catch(() => {}) })
    }

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90, maxBufferLength: 60, debug: false })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (cancelled) return
        setLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })))
        setStreamReady(true)
        tryPlay()
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setCurrentLevel(data.level))
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad()
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError()
        else setStreamError(true)
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      setStreamReady(true)
      tryPlay()
    } else {
      setStreamError(true)
    }

    return () => { cancelled = true; hls?.destroy(); hlsRef.current = null }
  }, [src, startMuted, autoPlay])

  // olaylar
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onT = () => { setCurrentTime(video.currentTime); if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1)) }
    const onD = () => setDuration(video.duration)
    const onP = () => setPlaying(true)
    const onPa = () => setPlaying(false)
    const onV = () => { setMuted(video.muted); setVolume(video.volume) }
    const onS = () => hlsRef.current?.startLoad()
    video.addEventListener('timeupdate', onT)
    video.addEventListener('durationchange', onD)
    video.addEventListener('play', onP)
    video.addEventListener('pause', onPa)
    video.addEventListener('volumechange', onV)
    video.addEventListener('stalled', onS)
    return () => {
      video.removeEventListener('timeupdate', onT)
      video.removeEventListener('durationchange', onD)
      video.removeEventListener('play', onP)
      video.removeEventListener('pause', onPa)
      video.removeEventListener('volumechange', onV)
      video.removeEventListener('stalled', onS)
    }
  }, [])

  useEffect(() => {
    const onFS = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFS)
    return () => document.removeEventListener('fullscreenchange', onFS)
  }, [])

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (flashTimer.current) clearTimeout(flashTimer.current)
  }, [])

  const showControlsNow = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [])

  const flashCenter = useCallback((type: 'play' | 'pause') => {
    setCenterAction({ type, k: Date.now() })
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setCenterAction(null), 600)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); flashCenter('play') }
    else { v.pause(); flashCenter('pause') }
  }, [flashCenter])

  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted }
  const adjustVolume = (d: number) => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.max(0, Math.min(1, v.volume + d))
    v.muted = v.volume === 0
  }
  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val; v.muted = val === 0; setVolume(val)
  }
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (v) v.currentTime = Number(e.target.value)
  }
  const skip = (sec: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec))
  }
  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
      else document.exitFullscreen()
    } catch {
      (el as HTMLDivElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.()
    }
  }
  const selectLevel = (idx: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = idx
    setCurrentLevel(idx)
    setShowSettings(false)
  }

  // klavye
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      switch (e.key) {
        case ' ': case 'k': case 'K': e.preventDefault(); togglePlay(); showControlsNow(); break
        case 'ArrowLeft': e.preventDefault(); skip(-10); showControlsNow(); break
        case 'ArrowRight': e.preventDefault(); skip(10); showControlsNow(); break
        case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); showControlsNow(); break
        case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); showControlsNow(); break
        case 'm': case 'M': toggleMute(); showControlsNow(); break
        case 'f': case 'F': toggleFullscreen(); break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [togglePlay, showControlsNow])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0
  const volPct = (muted ? 0 : volume) * 100
  const currentLevelInfo = currentLevel >= 0 && levels[currentLevel] ? `${levels[currentLevel].height}p` : 'Oto'
  const volIcon = (muted || volume === 0) ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />

  return (
    <div
      ref={containerRef}
      className={`player-container ${className}`.trim()}
      onMouseMove={showControlsNow}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      <video ref={videoRef} className="player-video" playsInline preload="auto" />

      <div className="player-gradient-top" />
      <div className="player-gradient-bottom" />

      <div className="player-click-zone" onClick={() => { togglePlay(); showControlsNow() }} onDoubleClick={toggleFullscreen} />

      {live && <div className="player-live-badge"><span className="player-live-dot" />CANLI</div>}

      {centerAction && (
        <div className="player-center-action" key={centerAction.k}>
          {centerAction.type === 'play' ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />}
        </div>
      )}

      {!streamReady && !streamError && (
        <div className="player-loading">
          <div className="spinner-stage">
            <span className="spinner-pulse" />
            <span className="spinner-pulse" />
            <span className="spinner-pulse" />
            <span className="spinner-core" />
          </div>
          <p>Akış yükleniyor…</p>
        </div>
      )}

      {streamError && (
        <div className="player-error">
          <Wifi size={48} />
          <p>Akış yüklenemedi</p>
          {onBack && <button onClick={onBack}>Geri Dön</button>}
        </div>
      )}

      <div className={`player-controls${controlsVisible ? ' visible' : ''}`}>
        <div className="player-controls__top">
          {onBack && (
            <button className="player-btn player-btn--back" onClick={onBack} aria-label="Geri">
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="player-controls__title"><span>{title}</span></div>
        </div>

        <div className="player-controls__bottom">
          <div className="player-progress-wrap">
            <div className="player-progress-track">
              <div className="player-progress-buffered" style={{ width: `${bufferedPct}%` }} />
              <div className="player-progress-played" style={{ width: `${progress}%` }} />
              <div className="player-progress-thumb" style={{ left: `${progress}%` }} />
              <input
                type="range" className="player-progress-input"
                min={0} max={duration || 100} step={0.25}
                value={currentTime} onChange={onSeek} aria-label="İlerleme"
              />
            </div>
            <div className="player-time">
              <span>{fmtTime(currentTime)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          <div className="player-controls__row">
            <div className="player-controls__left">
              <button className="player-btn" onClick={() => skip(-10)} aria-label="10 sn geri"><SkipBack size={20} /></button>
              <button className="player-btn player-btn--play" onClick={togglePlay} aria-label={playing ? 'Duraklat' : 'Oynat'}>
                {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>
              <button className="player-btn" onClick={() => skip(10)} aria-label="10 sn ileri"><SkipForward size={20} /></button>

              <div className="player-volume">
                <button className="player-btn" onClick={toggleMute} aria-label="Ses">{volIcon}</button>
                <div className="player-volume-bar-wrap">
                  <div className="player-volume-bar-fill" style={{ width: `${volPct}%` }} />
                  <div className="player-volume-thumb" style={{ left: `${volPct}%` }} />
                  <input
                    type="range" className="player-volume-input"
                    min={0} max={1} step={0.02}
                    value={muted ? 0 : volume} onChange={onVolumeChange} aria-label="Ses seviyesi"
                  />
                </div>
                <span className="player-volume-pct">{Math.round(volPct)}%</span>
              </div>
            </div>

            <div className="player-controls__right">
              <span className="player-quality-badge">{currentLevelInfo}</span>
              <div className="player-settings-wrap">
                <button className="player-btn" onClick={() => setShowSettings((p) => !p)} aria-label="Kalite"><Settings size={20} /></button>
                {showSettings && (
                  <div className="player-settings-menu">
                    <p className="player-settings-menu__label">Kalite</p>
                    <button
                      className={`player-settings-menu__item${currentLevel === -1 ? ' active' : ''}`}
                      onClick={() => selectLevel(-1)}
                    >Otomatik (ABR)</button>
                    {levels.map((l, i) => (
                      <button
                        key={i}
                        className={`player-settings-menu__item${currentLevel === i ? ' active' : ''}`}
                        onClick={() => selectLevel(i)}
                      >{l.height}p — {Math.round(l.bitrate / 1000)} kbps</button>
                    ))}
                  </div>
                )}
              </div>
              <button className="player-btn" onClick={toggleFullscreen} aria-label="Tam ekran">
                {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
