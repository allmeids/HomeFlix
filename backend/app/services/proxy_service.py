import requests
import urllib.parse
import re
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from typing import Optional

PROXY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*"
}

def stream_remote_media(target_url: str, request: Request) -> Response:
    headers = PROXY_HEADERS.copy()
    
    # Repassa Range header se existir (essencial para seek em vídeos MP4)
    range_header = request.headers.get("Range") if request else None
    if range_header:
        headers["Range"] = range_header

    parsed = urllib.parse.urlparse(target_url)
    if "embedplayer" in parsed.netloc or "plosia" in parsed.netloc:
        headers["Referer"] = "https://embedplayer2.xyz/"
        headers["Origin"] = "https://embedplayer2.xyz"
    elif "froststream" in parsed.netloc:
        headers["User-Agent"] = "Stremio/4.4.168"
    else:
        headers["Referer"] = f"{parsed.scheme}://{parsed.netloc}/"

    try:
        remote_resp = requests.get(
            target_url,
            headers=headers,
            stream=True,
            timeout=15,
            allow_redirects=True
        )

        if remote_resp.status_code >= 400:
            return Response(
                content=remote_resp.text,
                status_code=remote_resp.status_code,
                headers={"Access-Control-Allow-Origin": "*"}
            )

        content_type = remote_resp.headers.get("Content-Type", "").lower()
        is_m3u8 = "mpegurl" in content_type or ".m3u8" in target_url or "/hls/" in target_url

        if is_m3u8:
            text = remote_resp.text
            if "#EXTM3U" in text:
                base_url = target_url
                lines = text.splitlines()
                rewritten_lines = []
                for line in lines:
                    sline = line.strip()
                    if not sline:
                        rewritten_lines.append(line)
                        continue
                    if sline.startswith("#EXT-X-MEDIA") and 'URI="' in sline:
                        def sub_repl(m):
                            u = m.group(1)
                            full = urllib.parse.urljoin(base_url, u)
                            encoded = urllib.parse.quote(full, safe="")
                            return f'URI="/api/proxy/stream?url={encoded}"'
                        rewritten_lines.append(re.sub(r'URI="([^"]+)"', sub_repl, sline))
                    elif sline.startswith("#"):
                        rewritten_lines.append(sline)
                    else:
                        full_segment = urllib.parse.urljoin(base_url, sline)
                        encoded_seg = urllib.parse.quote(full_segment, safe="")
                        rewritten_lines.append(f"/api/proxy/stream?url={encoded_seg}")
                
                body_bytes = "\n".join(rewritten_lines).encode("utf-8")
                return Response(
                    content=body_bytes,
                    media_type="application/vnd.apple.mpegurl",
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                        "Access-Control-Allow-Headers": "Range, Content-Type",
                        "Content-Length": str(len(body_bytes))
                    }
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
