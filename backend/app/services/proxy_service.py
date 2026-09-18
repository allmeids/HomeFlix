import requests
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from typing import Optional

PROXY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "*/*"
}

def stream_remote_media(target_url: str, request: Request) -> Response:
    headers = PROXY_HEADERS.copy()
    
    # Repassa Range header se existir (essencial para seek em vídeos MP4)
    range_header = request.headers.get("Range")
    if range_header:
        headers["Range"] = range_header

    try:
        remote_resp = requests.get(
            target_url,
            headers=headers,
            stream=True,
            timeout=15,
            allow_redirects=True
        )

        response_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Type",
            "Accept-Ranges": remote_resp.headers.get("Accept-Ranges", "bytes"),
        }

        if "Content-Type" in remote_resp.headers:
            response_headers["Content-Type"] = remote_resp.headers["Content-Type"]
        if "Content-Length" in remote_resp.headers:
            response_headers["Content-Length"] = remote_resp.headers["Content-Length"]
        if "Content-Range" in remote_resp.headers:
            response_headers["Content-Range"] = remote_resp.headers["Content-Range"]

        status_code = remote_resp.status_code

        def iterfile():
            try:
                for chunk in remote_resp.iter_content(chunk_size=256 * 1024):
                    if chunk:
                        yield chunk
            finally:
                remote_resp.close()

        return StreamingResponse(
            iterfile(),
            status_code=status_code,
            headers=response_headers
        )

    except Exception as exc:
        return Response(content=f"Proxy Error: {str(exc)}", status_code=502)
