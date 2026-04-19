import json
import os
import re
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import error, request


ROOT = Path(__file__).resolve().parent


def normalize_api_url():
    direct_url = os.environ.get("OPENAI_API_URL", "").strip()
    if direct_url:
        return direct_url

    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")
    if not base_url:
        base_url = "https://api.openai.com/v1"

    if base_url.endswith("/chat/completions"):
        return base_url

    if base_url.endswith("/v1"):
        return base_url + "/chat/completions"

    return base_url + "/v1/chat/completions"


def get_env_config():
    return {
        "api_url": normalize_api_url(),
        "api_key": os.environ.get("OPENAI_API_KEY", ""),
        "model": os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        "temperature": float(os.environ.get("OPENAI_TEMPERATURE", "0.6")),
    }


def extract_text_content(message_content):
    if isinstance(message_content, str):
        return message_content
    if isinstance(message_content, list):
        parts = []
        for item in message_content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        return "\n".join(parts)
    return ""


def extract_json_object(text):
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def normalize_payload(payload):
    if not isinstance(payload, dict):
        return {
            "assistantMessage": "上游返回格式异常。",
            "summary": "未获得可解析的结构化结果。",
            "cards": [],
            "followUps": [],
        }

    cards = []
    for card in payload.get("cards", []):
        if not isinstance(card, dict):
            continue
        title = card.get("title", "结果卡片")
        items = card.get("items")
        if items is None:
            content = card.get("content")
            if isinstance(content, list):
                items = [str(item) for item in content]
            elif content is not None:
                items = [str(content)]
            else:
                items = []
        elif not isinstance(items, list):
            items = [str(items)]
        else:
            items = [str(item) for item in items]
        cards.append({"title": title, "items": items})

    follow_ups = payload.get("followUps", [])
    if not isinstance(follow_ups, list):
        follow_ups = [str(follow_ups)]
    else:
        follow_ups = [str(item) for item in follow_ups]

    return {
        "assistantMessage": str(payload.get("assistantMessage", "已收到上游结果。")),
        "summary": str(payload.get("summary", "已完成本轮结构化处理。")),
        "cards": cards,
        "followUps": follow_ups,
    }


class AgentProxyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            return self.handle_health()
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/agent":
            return self.handle_agent()
        if self.path == "/api/health/check":
            return self.handle_health_check()
        self.send_error(HTTPStatus.NOT_FOUND, "Unknown API route")

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length else b"{}"
        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON body"}, status=HTTPStatus.BAD_REQUEST)
            return None

    def send_json(self, payload, status=HTTPStatus.OK):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def handle_health(self):
        env = get_env_config()
        self.send_json({
            "ok": True,
            "mode": "proxy",
            "upstreamConfigured": bool(env["api_key"]),
            "apiUrl": env["api_url"],
            "model": env["model"],
        })

    def handle_health_check(self):
        env = get_env_config()
        if not env["api_key"]:
            return self.send_json({
                "ok": False,
                "mode": "proxy",
                "upstreamConfigured": False,
                "message": "缺少 OPENAI_API_KEY，无法连接上游。",
                "apiUrl": env["api_url"],
                "model": env["model"],
            }, status=HTTPStatus.SERVICE_UNAVAILABLE)

        try:
            result = self.call_upstream({
                "model": env["model"],
                "temperature": 0,
                "messages": [
                    {"role": "system", "content": "你是连接测试助手。"},
                    {"role": "user", "content": "请只回复 ok"}
                ]
            })
            self.send_json({
                "ok": True,
                "mode": "proxy",
                "upstreamConfigured": True,
                "upstreamReachable": True,
                "model": env["model"],
                "apiUrl": env["api_url"],
                "preview": extract_text_content(result.get("choices", [{}])[0].get("message", {}).get("content", ""))[:80],
            })
        except Exception as exc:
            self.send_json({
                "ok": False,
                "mode": "proxy",
                "upstreamConfigured": True,
                "upstreamReachable": False,
                "message": str(exc),
                "model": env["model"],
                "apiUrl": env["api_url"],
            }, status=HTTPStatus.BAD_GATEWAY)

    def handle_agent(self):
        body = self.read_json_body()
        if body is None:
            return

        env = get_env_config()
        if not env["api_key"]:
            return self.send_json({
                "assistantMessage": "代理后端尚未配置 `OPENAI_API_KEY`，目前还不能访问真实 OpenAI 兼容服务。你可以先用 Mock 模式演示，或先启动带环境变量的代理服务。",
                "summary": "代理后端已启动，但上游凭证缺失。",
                "cards": [
                    {
                        "title": "启动要求",
                        "items": [
                            "设置 OPENAI_API_KEY",
                            "可选设置 OPENAI_BASE_URL 或 OPENAI_API_URL",
                            "可选设置 OPENAI_MODEL"
                        ]
                    }
                ],
                "followUps": ["如何启动代理后端？", "先切回 Mock 模式", "告诉我需要哪些环境变量"],
                "trace": [
                    {"title": "接收输入", "description": "代理已接收到前端请求。", "state": "done"},
                    {"title": "检查配置", "description": "未发现 OPENAI_API_KEY，无法继续请求上游。", "state": "done"},
                    {"title": "终止执行", "description": "请先配置上游凭证。", "state": "done"}
                ]
            }, status=HTTPStatus.SERVICE_UNAVAILABLE)

        user_text = body.get("text", "请先做一轮判断")
        face_image_data_url = body.get("faceImageDataUrl", "")
        tongue_image_data_url = body.get("tongueImageDataUrl", "")
        history = body.get("history", [])[-6:]
        local_analysis = body.get("localAnalysis", {})
        knowledge_context = body.get("knowledgeContext", "")
        model = body.get("model") or env["model"]
        temperature = body.get("temperature", env["temperature"])
        system_prompt = body.get("systemPrompt") or (
            "你是中医镜子 Agent。"
            "请基于面部照片、舌象照片、多轮上下文和本地预分析输出趣味化、非医疗诊断的结构化结果。"
            "如果没有对应图片，就不能分析对应维度。"
            "你必须返回 JSON，字段为 assistantMessage, summary, cards, followUps。"
            "cards 是数组，每项包含 title 和 items。"
        )

        content = [
            {"type": "text", "text": "用户问题：" + user_text},
            {"type": "text", "text": "本地预分析：" + json.dumps(local_analysis, ensure_ascii=False)},
            {"type": "text", "text": "知识库规则：" + knowledge_context},
            {"type": "text", "text": "要求：必须先分别解释面部与舌象，再做联合归纳；没有对应图片不得虚构线索；请输出 JSON，不要输出 Markdown 代码块。"}
        ]
        if face_image_data_url:
            content.append({"type": "text", "text": "下面是面部照片："})
            content.append({"type": "image_url", "image_url": {"url": face_image_data_url}})
        if tongue_image_data_url:
            content.append({"type": "text", "text": "下面是舌象照片："})
            content.append({"type": "image_url", "image_url": {"url": tongue_image_data_url}})

        upstream_messages = [{"role": "system", "content": system_prompt}]
        for item in history:
            role = item.get("role", "user")
            text = item.get("text", "")
            if text:
                upstream_messages.append({"role": role, "content": text})
        upstream_messages.append({"role": "user", "content": content})

        try:
            upstream_data = self.call_upstream({
                "model": model,
                "temperature": temperature,
                "messages": upstream_messages
            })
            content_text = extract_text_content(
                upstream_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            )
            payload = extract_json_object(content_text)
            if not payload:
                payload = {
                    "assistantMessage": content_text or "上游返回成功，但未得到结构化 JSON。",
                    "summary": "已连接真实 OpenAI 兼容后端，但上游输出不是预期结构。",
                    "cards": [
                        {"title": "本地预分析", "items": [json.dumps(local_analysis, ensure_ascii=False)]}
                    ],
                    "followUps": ["请改成 JSON 输出", "解释你为什么这样判断", "整理成更短的话"]
                }

            payload = normalize_payload(payload)

            payload["trace"] = [
                {"title": "接收输入", "description": "本地代理已收到面部图、舌象图、问题和历史上下文。", "state": "done"},
                {"title": "本地代理", "description": "已把双图、本地预分析和知识库拼装为上游请求。", "state": "done"},
                {"title": "上游模型", "description": "真实 OpenAI 兼容后端已完成返回。", "state": "done"},
                {"title": "结构化输出", "description": "代理已整理为前端可直接渲染的结果。", "state": "done"}
            ]
            payload["analysis"] = local_analysis
            self.send_json(payload)
        except Exception as exc:
            self.send_json({
                "assistantMessage": "真实后端调用失败，我把错误原因返回给你：" + str(exc),
                "summary": "上游 OpenAI 兼容后端请求失败。",
                "cards": [
                    {
                        "title": "排查建议",
                        "items": [
                            "确认 OPENAI_API_KEY 是否正确",
                            "确认 OPENAI_API_URL 或 OPENAI_BASE_URL 是否可访问",
                            "确认模型是否支持多图输入"
                        ]
                    }
                ],
                "followUps": ["再试一次", "切回 Mock 模式", "告诉我怎么配置环境变量"],
                "trace": [
                    {"title": "接收输入", "description": "代理已收到请求。", "state": "done"},
                    {"title": "请求上游", "description": "上游调用失败：" + str(exc), "state": "done"}
                ]
            }, status=HTTPStatus.BAD_GATEWAY)

    def call_upstream(self, payload):
        env = get_env_config()
        req = request.Request(
            env["api_url"],
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + env["api_key"],
            },
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=90) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"网络错误: {exc.reason}") from exc


def main():
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8787"))
    server = ThreadingHTTPServer((host, port), partial(AgentProxyHandler))
    print(f"Serving Zhongyi Mirror Agent on http://{host}:{port}")
    print("Static root:", ROOT)
    print("Proxy target:", get_env_config()["api_url"])
    server.serve_forever()


if __name__ == "__main__":
    main()
