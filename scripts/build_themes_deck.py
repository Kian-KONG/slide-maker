#!/usr/bin/env python3
"""Build the multi-theme frontier issues HTML deck."""

from __future__ import annotations

from pathlib import Path

from app.services.html_export import build_html, slides_from_dicts

OUT = Path(__file__).resolve().parents[1] / "content" / "decks" / "世界模型与前沿议题.html"
FOOTER = "世界模型 · 具身智能及其他前沿议题"

SLIDES: list[dict] = [
    {
        "layout": "title",
        "title": "世界模型 · 具身智能",
        "body": {
            "subtitle": "及其他前沿议题：医学 · 科学数据 · 美妆 · 光电 · 青年与教育",
            "footer": FOOTER,
        },
    },
    {
        "layout": "bullets",
        "title": "今天的七条线索",
        "body": {
            "bullets": [
                "世界模型 / 具身智能：动作之后世界如何变",
                "医学智能：AI + China 压缩新药长链路",
                "王坚：科学数据让 AI 成为原住民",
                "欧莱雅：以人为本的负责 AI",
                "光电算力：软硬协同与开源生态",
                "Scale Insight：可解释与反共识",
                "青年与教育：适应变化的能力",
            ],
        },
    },
    {
        "layout": "section",
        "title": "01  世界模型与具身智能",
        "body": {"subtitle": "仅仅世界模型，应该是不够的"},
    },
    {
        "layout": "bullets",
        "title": "核心问题",
        "body": {
            "bullets": [
                "做了动作之后，世界的状态会怎么改变？",
                "仅仅世界模型应该是不够的",
                "视频模型尚不能判断是否符合物理规律",
                "生成与判断逻辑分开——还不是端到端",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "感知与预测：当前冲突",
        "body": {
            "bullets": [
                "理解与重建并不一致",
                "生成与理解硬融合很难：表征不一致",
                "状态预测与动作预测，很难同时做好",
                "需要更深入的多模态理解，而非只靠生成",
            ],
        },
    },
    {
        "layout": "two_column",
        "title": "数据不对：两种量级",
        "body": {
            "left_title": "物理反馈数据",
            "left": [
                "约一千万小时带物理反馈",
                "才谈得上实现智能",
                "视频模态仍给不了很多东西",
            ],
            "right_title": "对话数据",
            "right": [
                "约一百亿小时，噪音很多",
                "不要紧：大模型天然泛化",
                "但不精确、不可靠",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "精确性策略",
        "body": {
            "bullets": [
                "找低精确性场景先落地",
                "精确性要求越高，AI「浓度」可能需要越低",
                "广泛探索，优先高容错场景",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "制造业用脚投票",
        "body": {
            "bullets": [
                "数据浓度高：一地可获大量数据",
                "有明确标准 · 有人类视角数据 · 场景广泛丰富",
                "适合具身智能框架",
                "中国是制造业老大 → 全栈技术获真实场景牵引",
                "汽车 / 线束 / 流水线 / 主机厂：物理场景中的真实 AI",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "物理知识栈",
        "body": {
            "bullets": [
                "物体 → 状态 → 动力学 → 功能 → 目标 → 行为",
                "语言是世界的投影；知识需要物理锚点",
                "用实验与物理现实修正，构建物理知识世界模型",
                "能做什么 → 做到：bridge the gap",
                "实践是检验真理的唯一标准",
            ],
        },
    },
    {
        "layout": "two_column",
        "title": "可靠性是起点",
        "body": {
            "left_title": "为何要进物理世界",
            "left": [
                "物理知识缺少互联网式记录",
                "不能只停留在网络世界",
                "老龄化：让人远离危险、补劳动力",
            ],
            "right_title": "落地原则",
            "right": [
                "通用型是终点，可靠性是起点",
                "渐进走进千家万户",
                "标准 · 仿真 · 评测 · 知识结合",
                "自己做实验，建立物理 Loop",
            ],
        },
    },
    {
        "layout": "section",
        "title": "02  医学智能",
        "body": {"subtitle": "AI + China 架构，压缩十二年长链路"},
    },
    {
        "layout": "bullets",
        "title": "参与度与政策底座",
        "body": {
            "bullets": [
                "新药研究中，RL / AI / 新分子产生参与约 1%",
                "政府政策有积累；分子合成、动物实验进展迅速",
                "方向线索：逆转衰老",
            ],
        },
    },
    {
        "layout": "two_column",
        "title": "靶向药：数字在说话",
        "body": {
            "left_title": "传统长链路",
            "left": [
                "研发约 12 年",
                "此前量级约 20 亿美金",
                "1200 个任务才进候选",
                "0 → 候选物：4–5 年",
            ],
            "right_title": "加速信号",
            "right": [
                "端到端进临床；二期好，中国进三期",
                "无 AI：中国约可缩短 2 年",
                "加 AI：约 9–12 个月",
                "框架：AI + China 架构",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "基建与共同体",
        "body": {
            "bullets": [
                "张江 18 个月打破纪录：医药基建与架构提效提质",
                "未来：学术共同体；科学—治疗—实际的共同体",
                "浦东—金桥：政府与新药研发协同",
                "价值目标：公平惠及所有人",
            ],
        },
    },
    {
        "layout": "section",
        "title": "03  王坚：科学数据",
        "body": {"subtitle": "基础模型的原住民 · 一等公民"},
    },
    {
        "layout": "bullets",
        "title": "重新思考 AI 是什么",
        "body": {
            "bullets": [
                "Nvidia「没有 AI 信仰」——就是做算力的（对比叙事）",
                "科学数据迫使我们重思：AI 是基础模型的原住民",
                "关键问题：数据如何改变科学研究",
                "转折点：基础学科的数学化",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "数据范式变化",
        "body": {
            "bullets": [
                "对数据理解不够：卫星数据发现几十万颗未发现卫星",
                "大家对数据利用不足——范式在变",
                "从旧数据中发现新问题；科学变革中重新认识数据",
                "GeoGPT 产生全球影响；「人类活过恐龙」",
            ],
        },
    },
    {
        "layout": "section",
        "title": "04  欧莱雅",
        "body": {"subtitle": "以人为本，负责的 AI"},
    },
    {
        "layout": "two_column",
        "title": "四条主张",
        "body": {
            "left_title": "体验与洞察",
            "left": [
                "更好的消费体验：人类算法与互动",
                "研究基石",
                "分子层更快获得消费者洞察",
            ],
            "right_title": "人 · 责任 · 征程",
            "right": [
                "以人为本：人是掌控 AI 的人",
                "技能与人才发展；通用技能升级",
                "负责的 AI：更高效，也更多责任",
                "技术革命开启美妆新体验",
            ],
        },
    },
    {
        "layout": "section",
        "title": "05  光电与算力",
        "body": {"subtitle": "共封装光学 · 软硬协同 · 开源生态"},
    },
    {
        "layout": "bullets",
        "title": "光电路径",
        "body": {
            "bullets": [
                "光芯片 + 电芯片 → 共封装光学",
                "技术路径约 2–4 年批量落地",
                "光电在芯片内融合；数据中心光芯片跃进",
                "Cross-layer 跨层优化",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "通信是综合学科",
        "body": {
            "bullets": [
                "数据准备极复杂：计算、搬运、同步、通信库",
                "通信库要 AI 原生，面向异构算力",
                "数据传输要大带宽；架构融合",
                "软件系统角色很大——软硬结合优化",
            ],
        },
    },
    {
        "layout": "two_column",
        "title": "训练 / 推理与两条路",
        "body": {
            "left_title": "系统诉求",
            "left": [
                "高带宽与低延迟",
                "Attention / FFN 定制芯片与系统",
                "充分发挥软件作用",
            ],
            "right_title": "发展策略",
            "right": [
                "单点：关键场景 + 高速推理自定义",
                "多点：开源 AI 原生软件生态",
                "从绑定生态 → 重新构建生态",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "木桶最短板与 Scale Up",
        "body": {
            "bullets": [
                "算子库、通信库：AI 正在补齐",
                "芯片标准互联与中间层 → 新编程生态",
                "光刻机海外主导；国内需兄弟协同，勿各自为战",
                "Scale Up 超节点：拒绝私有协议，要共识标准",
                "第一性原理：低延迟 · 低功耗 · 抗干扰；向上向善",
            ],
        },
    },
    {
        "layout": "section",
        "title": "06  Scale Insight",
        "body": {"subtitle": "理解 AI，而不是膜拜黑盒"},
    },
    {
        "layout": "bullets",
        "title": "白盒与反共识",
        "body": {
            "bullets": [
                "要可解释性：不是黑盒，是白盒",
                "符号世界与神经世界需要对话",
                "该语境主张：自回归，而非扩散模型",
                "反共识：让非共识变成可检验的共识",
            ],
        },
    },
    {
        "layout": "section",
        "title": "07  青年与教育",
        "body": {"subtitle": "旧经验解决不了新问题"},
    },
    {
        "layout": "two_column",
        "title": "AI 时代青年如何应对",
        "body": {
            "left_title": "新优势",
            "left": [
                "「偷懒」：效率向地用工具",
                "新脑子好用",
                "敢于相信 AI 的能力",
                "无知者无畏：试错成本低",
            ],
            "right_title": "新方法",
            "right": [
                "Predefine 指标",
                "清晰拆解任务",
                "可视化中间过程",
                "要能够负责",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "未来能力图景",
        "body": {
            "bullets": [
                "AI 自己做 Transformer",
                "通用最优问题求解器",
                "原生语义：网络内部 route；稀疏模型更像人脑",
                "Researcher / Recursive；AI 自进化",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "教育：培养适应变化的人",
        "body": {
            "bullets": [
                "提升本科教学质量；需要 benchmark 与评价指标",
                "引导学生发现志趣、规划职业；给足探索时间",
                "减轻负担，允许探索——企业亦然",
                "国际排名无法单独提升质量；101 计划",
                "战略适应变化 → 培养能适应变化的人才",
            ],
        },
    },
    {
        "layout": "bullets",
        "title": "跨议题收束",
        "body": {
            "bullets": [
                "物理智能：可靠性先行，高浓度真实数据牵引",
                "科学与医药：数据范式 + AI + 中国基建，压缩长链路",
                "算力生态：光电、开源、标准互联优于私有协议",
                "组织与青年：指标、拆解、可视化、负责；人掌控 AI",
                "理解 AI：可解释、白盒、把非共识变成共识",
            ],
        },
    },
    {
        "layout": "title",
        "title": "通用是终点",
        "body": {
            "subtitle": "可靠性是起点 · 实践是检验真理的唯一标准",
            "footer": FOOTER,
        },
    },
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    html = build_html("世界模型与前沿议题", slides_from_dicts(SLIDES))
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(SLIDES)} slides)")


if __name__ == "__main__":
    main()
