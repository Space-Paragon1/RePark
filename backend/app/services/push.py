import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notifications(tokens: list[str], title: str, body: str, data: dict | None = None) -> None:
    """Send a push notification to one or more Expo push tokens. Silently ignores errors."""
    if not tokens:
        return

    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
        }
        for token in tokens
    ]

    try:
        async with httpx.AsyncClient() as client:
            await client.post(EXPO_PUSH_URL, json=messages, timeout=10)
    except Exception as e:
        print(f"Push notification error: {e}")
