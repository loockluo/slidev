#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
音频字幕生成工具
使用 WhisperX 进行语音识别和强制对齐生成字幕
"""

import whisperx
import json
import os
import sys
from pathlib import Path


def generate_subtitle(audio_path, text_path=None, output_dir=None, language="zh"):
    """
    生成字幕文件

    Args:
        audio_path: 音频文件路径
        text_path: 文本文件路径（可选，用于强制对齐）
        output_dir: 输出目录
        language: 语言代码（zh=中文）
    """
    try:
        print(f"正在处理音频文件: {audio_path}")

        # 确保输出目录存在
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # 加载模型
        print("加载 WhisperX 模型...")
        model = whisperx.load_model("large-v3", device="cpu")  # 如果有GPU可改为"cuda"

        # 加载音频
        audio = whisperx.load_audio(audio_path)

        # 语音识别
        print("进行语音识别...")
        result = model.transcribe(audio, language=language)

        # 如果提供了文本文件，进行强制对齐
        if text_path and os.path.exists(text_path):
            print(f"使用文本文件进行强制对齐: {text_path}")
            # 读取文本内容
            with open(text_path, 'r', encoding='utf-8') as f:
                text_content = f.read().strip()

            # 加载对齐模型
            align_model, metadata = whisperx.load_align_model(language_code=language, device="cpu")

            # 执行强制对齐
            aligned_result = whisperx.align(
                result["segments"],
                align_model,
                metadata,
                audio,
                device="cpu"
            )

            segments = aligned_result["segments"]
        else:
            segments = result["segments"]

        # 生成文件名
        audio_name = Path(audio_path).stem
        if not output_dir:
            output_dir = Path(audio_path).parent

        # 生成不同格式的字幕文件
        generate_srt(segments, os.path.join(output_dir, f"{audio_name}.srt"))
        generate_vtt(segments, os.path.join(output_dir, f"{audio_name}.vtt"))
        generate_json(segments, os.path.join(output_dir, f"{audio_name}.json"))

        print(f"字幕文件生成完成！")
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


if __name__ == "__main__":
    # 使用示例
    if len(sys.argv) < 2:
        print("使用方法: python subtitle_generator.py <音频文件路径> [文本文件路径] [输出目录]")
        print("示例: python subtitle_generator.py public/时间旅行.wav public/时间旅行.txt public/")
        sys.exit(1)

    audio_path = sys.argv[1]
    text_path = sys.argv[2] if len(sys.argv) > 2 else None
    output_dir = sys.argv[3] if len(sys.argv) > 3 else None

    generate_subtitle(audio_path, text_path, output_dir)