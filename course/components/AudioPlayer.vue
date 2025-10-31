<script setup lang="ts">
import { ref, onUnmounted, watch, onMounted } from 'vue'
import { useNav } from "@slidev/client"
import { TimelineManager } from './timelineControllers'

// 音频相关状态
const audioPlayer = ref<HTMLAudioElement | null>(null)
const isAudioPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)
const audioProgress = ref(0)
const isAudioLoaded = ref(false)
const audioError = ref<string | null>(null)

const nav = useNav();
(window as any).nav = nav
// 字幕相关状态
const currentSubtitle = ref<string>('')
const isSubtitleVisible = ref(false)

// TimelineManager 实例
const timelineManager = new TimelineManager()

const isTimelineLoaded = ref(false);
const currentPresentation = ref<string>(''); // 当前演示文稿名称

(window as any).timelineManager = timelineManager

// 音频文件路径（动态设置）
const audioSrc = ref<string>('')
const csvPath = ref<string>('')

// 读取 slides.md 文件获取 src 路径
const loadPresentationPaths = async () => {
  try {
    const response = await fetch('/slides.md')

    if (!response.ok) {
      console.warn('⚠️ 无法读取 slides.md，使用默认路径')
      audioSrc.value = '/ComfyUI_temp_qjtey_00009_.wav'
      csvPath.value = '/时间旅行.csv'
      currentPresentation.value = '默认演示'
      return
    }

    const slidesContent = await response.text()

    // 提取 src 路径，格式：src: './pages/时间旅行.md'
    const srcMatch = slidesContent.match(/src:\s*['"]\.\/pages\/([^'"]+)['"]/)

    if (srcMatch) {
      const presentationName = srcMatch[1].replace('.md', '')
      currentPresentation.value = presentationName

      // 设置对应的音频和 CSV 文件路径
      audioSrc.value = `/${presentationName}.flac`
      csvPath.value = `/${presentationName}.csv`

      console.log(`📋 检测到演示文稿: ${presentationName}`)
      console.log(`🎵 音频文件: ${audioSrc.value}`)
      console.log(`📊 CSV 文件: ${csvPath.value}`)
    } else {
      // 如果没有找到 src，使用默认路径
      audioSrc.value = '/ComfyUI_temp_qjtey_00009_.wav'
      csvPath.value = '/时间旅行.csv'
      currentPresentation.value = '默认演示'
      console.log('⚠️ 未找到 src 配置，使用默认路径')
    }
  } catch (error) {
    console.error('❌ 读取 slides.md 失败:', error)
    // 设置默认路径作为后备
    audioSrc.value = '/ComfyUI_temp_qjtey_00009_.wav'
    csvPath.value = '/时间旅行.csv'
    currentPresentation.value = '默认演示'
  }
}

// 加载时间轴文件并初始化TimelineManager
const loadTimeline = async () => {
  try {
    // 首先加载演示文稿路径
    await loadPresentationPaths()

    // 尝试加载 CSV 文件（新的方式）
    try {
      await timelineManager.loadCSVFileWithActions(csvPath.value)
      console.log(`📊 CSV 文件加载成功: ${csvPath.value}`)
    } catch (csvError) {
      console.log("%c Line:90 🍬 csvError", "color:#f5ce50", csvError);
    }

    // 注册字幕处理器
    timelineManager.onSubtitleStart((subtitle) => {
      currentSubtitle.value = subtitle.text
      isSubtitleVisible.value = true
      console.log(`📝 字幕开始: "${subtitle.text}" (${subtitle.startTime}s - ${subtitle.endTime}s)`)
    })

    timelineManager.registerActionHandler('click', (params,curTime:number) => {
      console.log(`时间：${curTime}  👆 执行点击操作: ${params.no}`, params)
      if (nav && nav.go) {
        nav.go(params.no, params.clicks) // Slidev从0开始计数
       
      }
    })

    isTimelineLoaded.value = true

    console.log(`📋 TimelineManager 初始化完成 (${currentPresentation.value})`)

  } catch (error) {
    console.error('❌ 时间轴加载出错:', error)
  }
}

// 使用TimelineManager控制时间轴事件
const controlTimelineEvents = (currentTime: number) => {
  if (!isTimelineLoaded.value) return

  // 更新TimelineManager时间，自动触发字幕和动作事件
  timelineManager.onTimeAdd(currentTime)
}

// 初始化音频播放器
const initAudioPlayer = () => {
  if (audioPlayer.value || isAudioLoaded.value || !audioSrc.value) {
    return
  }

  try {
    audioPlayer.value = new Audio(audioSrc.value)
    audioPlayer.value.preload = 'auto'

    // 音频事件监听
    audioPlayer.value.addEventListener('loadedmetadata', () => {
      audioDuration.value = audioPlayer.value?.duration || 0
      isAudioLoaded.value = true
      audioError.value = null
      console.log(`🎵 音频加载完成，时长: ${audioDuration.value}秒`)
    })

    audioPlayer.value.addEventListener('timeupdate', () => {
      if (audioPlayer.value && audioDuration.value > 0) {
        audioCurrentTime.value = Number(audioPlayer.value.currentTime.toFixed(3))
        audioProgress.value = (audioPlayer.value.currentTime / audioDuration.value) * 100
      }
    })

    audioPlayer.value.addEventListener('play', () => {
      isAudioPlaying.value = true
      console.log('🎵 音频开始播放')
    })

    audioPlayer.value.addEventListener('pause', () => {
      isAudioPlaying.value = false
      console.log('⏸️ 音频暂停')
    })

    audioPlayer.value.addEventListener('ended', () => {
      isAudioPlaying.value = false
      audioProgress.value = 100
      console.log('🎵 音频播放结束')
    })

    audioPlayer.value.addEventListener('error', (e) => {
      const target = e.target as HTMLAudioElement
      let errorMessage = '音频播放出错'

      switch (target.error?.code) {
        case 1:
          errorMessage = '用户中止了音频播放'
          break
        case 2:
          errorMessage = '网络错误导致音频下载失败'
          break
        case 3:
          errorMessage = '音频解码失败'
          break
        case 4:
          errorMessage = '音频格式不受支持'
          break
      }

      audioError.value = errorMessage
      isAudioLoaded.value = false
      isAudioPlaying.value = false
      console.error('❌ 音频播放出错:', errorMessage, e)
    })

    audioPlayer.value.addEventListener('canplay', () => {
      console.log('🎵 音频可以播放')
    })

  } catch (error) {
    audioError.value = '音频初始化失败'
    console.error('❌ 音频初始化失败:', error)
  }
}
watch(audioCurrentTime,(v)=>{
  controlTimelineEvents(v)
}) 
// 播放音频文件
const playAudioFile = () => {
  if (!isAudioLoaded.value || !audioPlayer.value) {
    initAudioPlayer()
    // 延迟播放，等待音频加载
    setTimeout(() => {
      if (isAudioLoaded.value && audioPlayer.value) {
        attemptPlay()
      }
    }, 100)
    return
  }

  attemptPlay()
}

const attemptPlay = () => {
  if (audioPlayer.value && isAudioLoaded.value) {
    // 停止语音合成（如果正在播放）
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    audioPlayer.value.play().catch(error => {
      console.error('❌ 音频播放失败:', error)
      audioError.value = '播放失败: ' + error.message
    })
  }
}

// 暂停音频播放
const pauseAudioFile = () => {
  if (audioPlayer.value && isAudioPlaying.value) {
    audioPlayer.value.pause()
  }
}

// 切换音频播放状态
const toggleAudioPlayback = () => {
  if (isAudioPlaying.value) {
    pauseAudioFile()
  } else {
    playAudioFile()
  }
}


// 跳转到指定时间
const seekTo = (event: MouseEvent) => {
  if (audioPlayer.value && audioDuration.value > 0) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    const newTime = (percentage / 100) * audioDuration.value
    audioPlayer.value.currentTime = newTime

    // 同步TimelineManager到新时间
    if (isTimelineLoaded.value) {
      timelineManager.setTime(newTime)
    }
  }
}

// 组件挂载时初始化
onMounted(async () => {
  await loadTimeline()
  // 在时间轴加载完成后初始化音频播放器（此时 audioSrc 已经设置）
  if (audioSrc.value) {
    initAudioPlayer()
  } else {
    console.warn('⚠️ 音频源未设置，跳过音频播放器初始化')
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.removeEventListener('loadedmetadata', () => {})
    audioPlayer.value.removeEventListener('timeupdate', () => {})
    audioPlayer.value.removeEventListener('play', () => {})
    audioPlayer.value.removeEventListener('pause', () => {})
    audioPlayer.value.removeEventListener('ended', () => {})
    audioPlayer.value.removeEventListener('error', () => {})
    audioPlayer.value.removeEventListener('canplay', () => {})
    audioPlayer.value = null
    console.log('🎵 音频播放器组件卸载')
  }
})
</script>

<template>
  <div class="audio-player">
    <!-- 字幕显示区域 -->
    <div
      v-if="currentSubtitle"
      class="subtitle-container"
      :class="{ 'subtitle-visible': isSubtitleVisible }"
    >
      <div class="subtitle-text">
        {{ currentSubtitle }}
      </div>
    </div>

    <!-- 音频进度条 -->
    <div class="audio-progress-container">
      <div
        class="audio-progress-bar"
        @click="seekTo($event)"
      >
        <div
          class="audio-progress-fill"
          :style="{ width: `${audioProgress}%` }"
        ></div>
        <div
          class="audio-progress-handle"
          :style="{ left: `${audioProgress}%` }"
        ></div>
        <!-- 暂停/播放按钮 -->
        <div
          class="audio-play-button"
          @click.stop="toggleAudioPlayback"
        >
          <span v-if="isAudioPlaying" class="play-icon">⏸️</span>
          <span v-else class="play-icon">▶️</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  /* 播放按钮移动距离配置 */
  --button-move-up-ratio: -110%; /* 向上移动距离比例 */

}

/* 字幕样式 */
.subtitle-container {
  position: fixed;
  bottom: 20px; /* 更靠近底部 */
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  text-align: center;
  z-index: 999;
}

.subtitle-container.subtitle-visible {
  display: block;
}

.subtitle-text {
  color: white;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 600;
  text-shadow:
    0 0 4px rgba(0, 0, 0, 0.8),
    0 0 8px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(0, 0, 0, 0.4),
    1px 1px 2px rgba(0, 0, 0, 0.9);
  word-wrap: break-word;
  word-break: break-word;
}

/* 响应式字幕设计 */
@media (max-width: 768px) {
  .subtitle-container {
    bottom: 15px;
    max-width: 90%;
  }

  .subtitle-text {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .subtitle-container {
    bottom: 10px;
    max-width: 95%;
  }

  .subtitle-text {
    font-size: 14px;
  }
}

.audio-progress-container {
  position: relative;
  width: 100%;
  height: 4px;
  cursor: pointer;
}

.audio-progress-bar {
  position: relative;
  width: 100%;
  height: 100%;
  transition: height 0.2s ease;
  background-color: #D5DEF4cc;
}

.audio-progress-bar:hover {
  height: 8px;
}

.audio-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007acc, #005a9e);
  transition: width 0.1s ease;
  position: relative;
}

.audio-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.audio-progress-bar:hover .audio-progress-handle {
  opacity: 1;
}

.audio-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  background: rgba(0, 122, 204, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 1001; /* 确保在字幕(z-index: 999)之上 */
  transform: translate(-50%, var(--button-move-up-ratio));
}

.audio-progress-bar:hover .audio-play-button {
  opacity: 1;
  transition: opacity 0.2s ease;
  pointer-events: auto;
}

.audio-play-button:hover {
  background: rgba(0, 90, 158, 0.95);
  transform: translate(-50%,var(--button-move-up-ratio) ) scale(1.1);
}

.play-icon {
  font-size: 14px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audio-progress-container {
    height: 6px;
  }

  .audio-progress-bar:hover {
    height: 10px;
  }

  .audio-play-button {
    width: 36px;
    height: 36px;
  }

  .play-icon {
    font-size: 16px;
  }
}
</style>