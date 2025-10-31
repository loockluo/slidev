#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的音频字幕生成工具
使用系统安装的 whisper 或提供基础的字幕生成功能
"""

import json
import os
import sys
import subprocess
from pathlib import Path


def check_whisper_available():
    """检查系统是否安装了 whisper"""
    try:
        result = subprocess.run(['whisper', '--help'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False


def generate_subtitle_with_whisper(audio_path, output_dir=None, language="zh"):
    """使用系统 whisper 命令生成字幕"""
    try:
        print(f"使用系统 whisper 处理音频文件: {audio_path}")

        # 确保输出目录存在
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        audio_name = Path(audio_path).stem
        if not output_dir:
            output_dir = Path(audio_path).parent

        # 构建 whisper 命令
        cmd = [
            'whisper',
            audio_path,
            '--language', language,
            '--output_dir', output_dir,
            '--output_format', 'all'
        ]

        print(f"执行命令: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print("字幕文件生成完成！")
            return True
        else:
            print(f"Whisper 命令执行失败: {result.stderr}")
            return False

    except Exception as e:
        print(f"错误: {e}")
        return False


def generate_fallback_subtitle(audio_path, text_path=None, output_dir=None):
    """生成备用字幕文件（基于文本文件或音频文件名）"""
    try:
        print("生成备用字幕文件...")

        # 确保输出目录存在
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        audio_name = Path(audio_path).stem
        if not output_dir:
            output_dir = Path(audio_path).parent

        # 读取文本内容
        text_content = ""
        if text_path and os.path.exists(text_path):
            with open(text_path, 'r', encoding='utf-8') as f:
                text_content = f.read().strip()
        else:
            # 尝试读取同名的txt文件
            txt_path = Path(audio_path).with_suffix('.txt')
            if txt_path.exists():
                with open(txt_path, 'r', encoding='utf-8') as f:
                    text_content = f.read().strip()
            else:
                text_content = f"音频文件: {audio_name}"

        # 简单分段（按句号、感叹号、问号分段）
        sentences = []
        for sentence in text_content.replace('！', '。').replace('？', '。').split('。'):
            if sentence.strip():
                sentences.append(sentence.strip() + '。')

        if not sentences:
            sentences = [text_content]

        # 生成时间戳（简单平分）
        total_duration = 60  # 假设60秒，实际应该获取音频长度
        segment_duration = total_duration / len(sentences)

        segments = []
        for i, sentence in enumerate(sentences):
            start_time = i * segment_duration
            end_time = (i + 1) * segment_duration
            segments.append({
                'start': start_time,
                'end': end_time,
                'text': sentence
            })

        # 生成文件
        generate_srt(segments, os.path.join(output_dir, f"{audio_name}.srt"))
        generate_vtt(segments, os.path.join(output_dir, f"{audio_name}.vtt"))
        generate_json(segments, os.path.join(output_dir, f"{audio_name}.json"))

        print(f"备用字幕文件生成完成！")
        print(f"- SRT: {audio_name}.srt")
        print(f"- VTT: {audio_name}.vtt")
        print(f"- JSON: {audio_name}.json")

        return segments

    except Exception as e:
        print(f"错误: {e}")
        return None


def generate_srt(segments, output_path):
    """生成 SRT 格式字幕"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for i, segment in enumerate(segments, 1):
            start_time = segment['start']
            end_time = segment['end']
            text = segment['text'].strip()

            # 转换时间格式
            start_srt = format_time_srt(start_time)
            end_srt = format_time_srt(end_time)

            f.write(f"{i}\n{start_srt} --> {end_srt}\n{text}\n\n")


def generate_vtt(segments, output_path):
    """生成 VTT 格式字幕"""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("WEBVTT\n\n")
        for segment in segments:
            start_time = format_time_vtt(segment['start'])
            end_time = format_time_vtt(segment['end'])
            text = segment['text'].strip()

            f.write(f"{start_time} --> {end_time}\n{text}\n\n")


def generate_json(segments, output_path):
    """生成 JSON 格式字幕"""
    data = {
        "segments": segments,
        "total_duration": max(seg['end'] for seg in segments) if segments else 0,
        "segment_count": len(segments)
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def format_time_srt(seconds):
    """格式化时间为 SRT 格式"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def format_time_vtt(seconds):
    """格式化时间为 VTT 格式"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法: python simple_subtitle_generator.py <音频文件路径> [文本文件路径] [输出目录]")
        print("示例: python simple_subtitle_generator.py public/时间旅行.wav public/时间旅行.txt public/")
        print("\n功能说明:")
        print("1. 如果系统安装了 whisper，优先使用 whisper 生成字幕")
        print("2. 如果没有 whisper，使用文本文件生成基础字幕")
        print("3. 支持中文，生成 SRT、VTT、JSON 三种格式")
        sys.exit(1)

    audio_path = sys.argv[1]
    text_path = sys.argv[2] if len(sys.argv) > 2 else None
    output_dir = sys.argv[3] if len(sys.argv) > 3 else None

    # 检查音频文件是否存在
    if not os.path.exists(audio_path):
        print(f"错误: 音频文件不存在: {audio_path}")
        sys.exit(1)

    # 尝试使用系统 whisper
    if check_whisper_available():
        print("检测到系统安装了 whisper，使用 whisper 生成字幕...")
        success = generate_subtitle_with_whisper(audio_path, output_dir)
        if not success:
            print("whisper 生成失败，使用备用方案...")
            generate_fallback_subtitle(audio_path, text_path, output_dir)
    else:
        print("未检测到系统 whisper，使用备用方案生成字幕...")
        print("建议安装 whisper: pip install openai-whisper")
        generate_fallback_subtitle(audio_path, text_path, output_dir)


if __name__ == "__main__":
    main()