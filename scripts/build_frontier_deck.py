#!/usr/bin/env python3
"""Build the 前沿生态 HTML deck."""

from __future__ import annotations

from pathlib import Path

from app.services.html_export import build_html, slides_from_dicts

OUT = Path(__file__).resolve().parents[1] / "content" / "decks" / "前沿生态-营销操作系统.html"

SLIDES: list[dict] = [
    {
        "layout": "title",
        "title": "前沿生态",
        "body": {
            "subtitle": "不是新的营销工具，是新的营销操作系统",
            "footer": "利欧数字 · 智能伙伴 共创未来",
        },
    },
    {
        "layout": "bullets",
        "title": "一页主张",
        "body": {
            "bullets": [
                "营销从工具堆叠，升级为可编排的操作系统",
                "SKU / 能力单元的目标是提升生产力，不是再叠一层功能",
                "AI 不是新渠道——它重新定义入口本身",
                "品牌竞争从「被人看见」转向「被 AI 理解、被 AI 选择」",
            ],
        },
    },
    {
        "layout": "section",
        "title": "01  能力演进",
        "body": {"subtitle": "从效率单元到多智能体协同"},
    },
    {
        "layout": "two_column",
        "title": "2025 → 2026：系统成型",
        "body": {
            "left_title": "2025 · 快手报表智能体",
            "left": [
                "2 小时出报：效率单元跃迁",
                "把人肉报表切到智能体闭环",
                "单点提效，验证「可交付」",
            ],
            "right_title": "2026 · 龙虾多智能体",
            "right": [
                "创意、投放等用一套智能体",
                "生成全套方案，而非单页文案",
                "从助手协作，走向系统协同",
            ],
        },
    },
    {
        "layout": "section",
        "title": "02  入口革命",
        "body": {"subtitle": "品牌资产，有没有进入 AI 的推荐层？"},
    },
    {
        "layout": "bullets",
        "title": "品牌资产去哪了",
        "body": {
            "bullets": [
                "大量品牌资产没有被 AI 推荐——体量在，认知不在模型里",
                "「7 亿加起来」仍可能输在入口逻辑",
                "AI 不是多开一个投放渠道，而是改写流量从哪里来",
                "手机将对每个人不一样（个性化）；眼镜不是入口，讨论回到手机",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "手机 = 商业入口",
        "body": {
            "bullets": [
                "小米广告收入 278 亿：手机超越「第五媒体」叙事",
                "手机不只是信息获取工具，也是重要商业入口",
                "入口争夺 = 品牌被触达、被理解、被转化的第一战场",
            ],
        },
    },
    {
        "layout": "section",
        "title": "03  品牌认知重构",
        "body": {"subtitle": "给人看，更要给 AI 看"},
    },
    {
        "layout": "two_column",
        "title": "被理解的对象变了",
        "body": {
            "left_title": "过去",
            "left": [
                "给人讲故事、做人设",
                "SEO / 流量位 / KOL 声量",
                "饱和攻击换认知",
            ],
            "right_title": "现在",
            "right": [
                "给 AI 做营销：极度理性的读者",
                "SEO → GEO：生成式引擎优化",
                "做不到饱和时：如何被 AI 选择？",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "GEO 时代的提醒",
        "body": {
            "bullets": [
                "品牌竞争的关键能力：被 AI 理解",
                "头部视频 ≠ 头部 KOI——旧流量王座不能平移",
                "资产要进入可检索、可引用、可推荐的机器认知层",
            ],
        },
    },
    {
        "layout": "section",
        "title": "04  生产与投放重构",
        "body": {"subtitle": "等待缩短之后，别再单线程"},
    },
    {
        "layout": "bullets",
        "title": "营销生产：Cub Swarm",
        "body": {
            "bullets": [
                "人总在等：洞察、排期、复盘——等待会缩短，工作方式要改",
                "Cub Swarm：并行群体生产，替代单线程流水线",
                "调研参考意义下降：AI 可一键跑全网",
                "广告效果可实时推导、实时计算——优化节奏被压缩到「现在」",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "投放链路升级",
        "body": {
            "bullets": [
                "投放专家 → AI 投放系统 → 营销编程",
                "客户维度端到端：效果提升 + 数据优化能力",
                "人的价值上移：定义问题 · 判断结果",
                "行业压力大，但不悲观——具身智能等方向「还没有美和调性」",
            ],
        },
    },
    {
        "layout": "section",
        "title": "05  组织与系统",
        "body": {"subtitle": "WPP Media · 智能伙伴 共创未来"},
    },
    {
        "layout": "bullets",
        "title": "人才杠杆被放大",
        "body": {
            "bullets": [
                "会用系统的人，与不会用的人，差距呈指数拉开",
                "「被 AI 打倒的人会第一个站起来」——学习曲线即生存曲线",
                "把生意架构搭起来：放大器，放大可能性",
                "创意是最不容易被丢弃的东西；品牌与科技共赢",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "MOS 1+N · MCP",
        "body": {
            "bullets": [
                "专家知识进系统：持续学习，不是固定流水线",
                "自主学习 + 归因判断 + 多智能体协作",
                "MOS 1+N + MCP：主系统编排多个专家智能体与工具",
                "增强 Persona：比真人更像真人，并拓展真人能力边界",
                "AI 讲稿可以没有「AI 味」，甚至更具感染力",
            ],
        },
    },
    {
        "layout": "two_column",
        "title": "聪明不过 AI，笨有笨的用处",
        "body": {
            "left_title": "会被压缩的",
            "left": [
                "「最贵的文案自己说，写不过 AI」",
                "信息差型咨询容易被替代",
                "纯执行、可模板化的生产",
            ],
            "right_title": "仍值得用「笨方法」",
            "right": [
                "社会价值与文化价值",
                "长期在场、信任与调性",
                "定义问题与最终判断",
            ],
        },
    },
    {
        "layout": "two_column",
        "title": "上半场 / 下半场",
        "body": {
            "left_title": "上半场 · 挑战者",
            "left": [
                "国内更高效",
                "抢入口、抢系统、抢效率",
                "用智能体把生产力打穿",
            ],
            "right_title": "下半场 · 厚积薄发",
            "right": [
                "外企有机会",
                "生活 · 人本 · 品质 · 沉淀",
                "调性与长期品牌资产",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "行动含义",
        "body": {
            "bullets": [
                "把品牌资产做成 AI 可读、可推荐、可引用的认知层（GEO）",
                "把营销能力做成可编排操作系统（智能体 + MCP + 归因闭环）",
                "人盯住：定义问题、判断结果、创意与调性",
                "上半场抢效率；下半场拼人本与品质沉淀",
            ],
        },
    },
    {
        "layout": "title",
        "title": "智能伙伴 · 共创未来",
        "body": {
            "subtitle": "操作系统已至，入口已变，品牌请被 AI 理解",
            "footer": "前沿生态",
        },
    },
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    html = build_html("前沿生态：营销操作系统", slides_from_dicts(SLIDES))
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(SLIDES)} slides)")


if __name__ == "__main__":
    main()
