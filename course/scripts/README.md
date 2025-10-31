# 字幕生成工具

这个工具使用 WhisperX 来生成音频字幕，支持语音识别和强制对齐功能。

## 安装依赖

```bash
pip install whisperx
# 如果有 GPU，安装 GPU 版本
pip install whisperx[gpu]
```

## 使用方法

### 基本用法（仅音频转字幕）

```bash
python scripts/subtitle_generator.py public/时间旅行.wav
```

### 强制对齐（音频 + 文本）

```bash
python scripts/subtitle_generator.py public/时间旅行.wav public/时间旅行.txt public/
```

### 参数说明

- `音频文件路径`: 必需，要处理的音频文件
- `文本文件路径`: 可选，用于强制对齐的文本文件
- `输出目录`: 可选，默认为音频文件所在目录

## 输出格式

工具会生成三种格式的字幕文件：

1. **SRT** - 标准字幕格式，用于视频播放器
2. **VTT** - Web 视频字幕格式
3. **JSON** - 包含详细时间戳信息

## 示例

为你的项目生成字幕：

```bash
# 进入项目目录
cd /data/code/slidev-addon-autoplay

# 生成时间旅行的字幕（强制对齐）
python scripts/subtitle_generator.py public/时间旅行.wav public/时间旅行.txt public/

# 生成后会在 public/ 目录下生成：
# - 时间旅行.srt
# - 时间旅行.vtt
# - 时间旅行.json
```

## 注意事项

- 首次运行会自动下载模型文件，可能需要一些时间
- 如果有 GPU，修改脚本中的 `device="cpu"` 为 `device="cuda"` 可以提升处理速度
- 支持的音频格式：wav, mp3, flac, m4a 等
- 中文语音识别使用 `language="zh"`