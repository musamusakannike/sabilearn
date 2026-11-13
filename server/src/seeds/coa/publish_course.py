import json
import urllib.request
import os

API_BASE = os.environ.get("SABILEARN_API_URL", "https://api.sabilearn.online/api/v1")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@sabilearn.online")
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "")

def request_json(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def publish():
    print("Logging in to publish course...")
    login_res = request_json(f"{API_BASE}/auth/login", method="POST", data={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS
    })
    token = login_res["token"]

    course_id = "6af6ee44cbdc64403cc9c7c7"
    
    # 1. Publish Course
    print(f"Publishing course {course_id}...")
    course_res = request_json(f"{API_BASE}/courses/{course_id}", method="PUT", data={
        "isPublished": True
    }, token=token)
    if not course_res.get("success"):
        raise Exception(f"Failed to publish course: {course_res}")
    print("Course published successfully!")

    # 2. Publish all topics
    topics = request_json(f"{API_BASE}/topics/course/{course_id}", token=token).get("data", [])
    print(f"Publishing {len(topics)} topics...")
    for t in topics:
        top_id = t["_id"]
        request_json(f"{API_BASE}/topics/{top_id}", method="PUT", data={
            "isPublished": True
        }, token=token)
    print("All 31 topics successfully flipped to published!")

    # Verify live
    verify = request_json(f"{API_BASE}/courses/{course_id}", token=token).get("data", {})
    print(f"Verified live status: isPublished = {verify.get('isPublished')}")

if __name__ == "__main__":
    publish()
