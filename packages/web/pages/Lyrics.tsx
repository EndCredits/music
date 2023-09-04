import PageTransition from '../components/PageTransition'
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { css, cx } from '@emotion/css'
import useLyric from '@/web/api/hooks/useLyric'
import player from '@/web/states/player'
import { lyricParser } from '@/web/utils/lyric'
import { useTranslation } from 'react-i18next'
import { Player, State as PlayerState } from '@/web/utils/player'
import { startTransition } from 'react';

const Lyrics = () => {
  const containerRef = useRef(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentVolumnValue, setCurrentVolumnValue] = useState(128)
  const lyricsRes = useLyric({ id: player.trackID })
  const lyricsResponse = lyricsRes.data
  const { lyric: lyrics, tlyric: tlyric } = lyricParser(lyricsResponse)
  const { state: playerState, progress, nowVolume } = useSnapshot(player)
  const { t } = useTranslation()
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const updateCurrentLineIndex = () => {
      var find = false
      for (let i = 0; i < lyrics.length; i++) {
        if (progress >= lyrics[i]?.time && progress < lyrics[i + 1]?.time) {
          find = true
          setCurrentLineIndex(i)
          break
        } else if (i + 1 == lyrics.length && progress >= lyrics[i]?.time) {
          find = true
          setCurrentLineIndex(i)
        }
      }
      if (!find) {
        setCurrentLineIndex(0)
      }
    }
    updateCurrentLineIndex()
  }, [progress])

  useEffect(() => {
    var light = 1 / (1 + Math.exp(-(nowVolume - 128) / 64)) * 20
    setCurrentVolumnValue(light)
  }, [nowVolume])

  useEffect(() => {
    // 添加一个钩子函数，在 currentLineIndex 发生变化时，调用一个函数来滚动歌词容器
    const scrollToCurrentLine = () => {
      // 获取所有的歌词行元素
      const lines = containerRef.current?.querySelectorAll('.lyrics-row')
      if (lines == null || lines.length == 0) {
        return
      }

      // 获取当前的歌词行元素
      const currentLine = lines[currentLineIndex]
      if (currentLine) {
        // 如果存在，就将其滚动到可视区域，并指定一些选项
        currentLine.scrollIntoView({
          behavior: 'smooth', // 滚动的行为为平滑过渡
          block: 'center', // 垂直方向上将元素居中对齐
          inline: 'center', // 水平方向上将元素居中对齐
        })
      }
    }

    // 调用 scrollToCurrentLine 函数
    scrollToCurrentLine()
  }, [currentLineIndex]) // 当 currentLineIndex 变化时，重新执行该钩子函数

  const maxLength = Math.max(lyrics.length, tlyric.length)
  const renderedLyrics = Array.from({ length: maxLength }, (_, index) => {
    const lyric = lyrics[index]?.content
    const time = lyrics[index]?.time || tlyric[index]?.time
    const tLyric = tlyric[index]?.content

    const setSongToLyric = () => {
      player.progress = time
      player.play(true)
    }

    const lineClassName = cx('lyrics-row transition duration-700 ease-out leading-120 tracking-lyricSpacing mt-5 mb-5',
      index === currentLineIndex && 'line-clamp-4 font-bold text-accent-color-500 tracking-hilightLyric leading-lyric text-32',
      index !== currentLineIndex && 'lyrics-padding normal-lyric-font-size font-black tracking-lyric leading-lyric text-white/30 text-24 blur-lyric hover:blur-none',
      (index !== currentLineIndex  && isScrolling ) && 'blur-none',
    )

    const hightlightStyle = index === currentLineIndex ? {
      textShadow: "rgb(216,216,216," + (currentVolumnValue / 25) + ") 3px 3px " + currentVolumnValue + "px"
    } : {}

    return (
      <div className={cx(lineClassName, 'font-Roboto')} key={index} onDoubleClick={setSongToLyric} style={
        hightlightStyle
      }
      >
        <p>{lyric}</p>
        <p>{tLyric}</p>
      </div>
    )
  })

  if (lyricsResponse == undefined || lyricsResponse.code != 200 || lyrics.length == 0) {
    const hightlightStyle = {
      textShadow: "rgb(255,255,255," + (currentVolumnValue / 5) + ") 0px 0px " + currentVolumnValue + "px",
      padding: '12px'
    }
    return (
      <PageTransition>
        {player?.state == "playing" && <div className='artist-info padding-bottom-20 text-21 mb-8 mt-8 text-center font-medium h-921 text-white/30'
          style={{
            paddingTop: '100px',
            height: '921px',
            overflow: 'scroll'
          }}
        >
          <div className='no-lyrics mb-4 mt-8 text-center'>
            <p>{player.track?.name}</p>
            <p>By - {player.track?.ar[0].name}</p>
          </div>
          <p className='normal-lyric-font-size highlight-lyric' style={hightlightStyle}>
            请欣赏·纯音乐
          </p>
        </div>
        }
        <div className='artist-info padding-bottom-20 text-20 mb-8 mt-8 text-center font-medium text-neutral-400'>
          {player.state == "ready" && t`common.lyric-welcome`}
        </div>




      </PageTransition>
    )
  }
  const handleScroll = () => {
    startTransition(() => {
    // 设置滚动状态为 true
    setIsScrolling(true);
  
    // 在一定时间后，将滚动状态设置为 false
    clearTimeout(5000);
    const scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, 5000);
  })
  };
  return (
    <PageTransition>
      <div className={cx('lyrics-player h-921', 'font-Roboto font-bold backdrop-blur-md')}>
        <div
          className={cx('lyrics-container  mb-8 mt-8 text-left overflow-scroll h-lyric',
          css`
          &::-webkit-scrollbar {
            width: 0;
            background: transparent;
          }`)}
          ref={containerRef}
          onScroll={handleScroll}
        >
          <div className='artist-info padding-bottom-20 mb-8 mt-8 text-left text-white/30 text-24'>
            <p className=''>{player.track?.name}</p>
            <p className=''>By - {player.track?.ar[0].name}</p>
          </div>
          {renderedLyrics}
        </div>
      </div>
    </PageTransition>
  )
}

export default Lyrics
