from fastapi import Request
from slowapi import Limiter


def _get_real_ip(request: Request) -> str:
    """Cloud Run 프록시 뒤에서 실제 클라이언트 IP를 추출한다.

    request.client.host는 Cloud Run 내부 LB IP이므로 사용 불가.
    X-Forwarded-For 헤더의 첫 번째 항목이 실제 클라이언트 IP.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_real_ip)
