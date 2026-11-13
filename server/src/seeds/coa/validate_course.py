import json
import urllib.request
import urllib.error
import re
import os
import sys

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

def check_url(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in [200, 301, 302]
    except Exception:
        # Retry with GET in case HEAD is disallowed
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status in [200, 301, 302]
        except Exception as e:
            return False

def validate():
    print("==========================================")
    print("RUNNING COMPREHENSIVE COURSE VALIDATION")
    print("==========================================")
    
    # Login
    login_res = request_json(f"{API_BASE}/auth/login", method="POST", data={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS
    })
    token = login_res["token"]

    # 1. Fetch Course
    courses = request_json(f"{API_BASE}/courses?limit=100&includeDrafts=true", token=token).get("data", [])
    course = next((c for c in courses if c.get("slug") == "computer-organization-and-architecture-cpe-301"), None)
    if not course:
        print("ERROR: Course 'computer-organization-and-architecture-cpe-301' not found!")
        return False

    course_id = course["_id"]
    print(f"PASS: Course found: {course['title']} ({course_id})")
    print(f"      Track: {course.get('track')}, Category: {course.get('category')}")
    print(f"      Academic Meta: {course.get('academicMeta')}")
    print(f"      Banner: {course.get('banner')}")
    print(f"      isPublished: {course.get('isPublished')}")

    banner_ok = check_url(course["banner"])
    print(f"      Banner Reachable: {banner_ok}")

    # 2. Fetch Chapters
    chapters = request_json(f"{API_BASE}/chapters/course/{course_id}", token=token).get("data", [])
    print(f"\nPASS: Total Modules (Chapters): {len(chapters)}")
    for ch in chapters:
        print(f"      - [Order {ch.get('order')}] {ch.get('title')}")

    # 3. Fetch Topics
    topics = request_json(f"{API_BASE}/topics/course/{course_id}", token=token).get("data", [])
    print(f"\nPASS: Total Topics: {len(topics)}")

    total_blocks = 0
    total_quizzes = 0
    total_mcqs = 0
    images = set()
    videos = set()
    errors = []

    for idx, top in enumerate(topics):
        top_id = top["_id"]
        # Fetch full topic details
        full_top = request_json(f"{API_BASE}/topics/{top_id}", token=token).get("data", {})
        contents = full_top.get("contents", [])
        total_blocks += len(contents)

        # Check quizzes inside contents
        quizzes_in_top = [b for b in contents if b.get("type") == "quiz"]
        total_quizzes += len(quizzes_in_top)

        # Collect images and videos
        for b in contents:
            if b.get("type") == "image":
                images.add(b.get("content"))
            elif b.get("type") == "youtube":
                videos.add(b.get("content"))
            elif b.get("type") == "group":
                for sub in b.get("blocks", []):
                    if sub.get("type") == "image":
                        images.add(sub.get("content"))
                    elif sub.get("type") == "youtube":
                        videos.add(sub.get("content"))

        # Fetch MCQs from MCQ collection
        mcqs = request_json(f"{API_BASE}/mcqs/topic/{top_id}", token=token).get("data", [])
        total_mcqs += len(mcqs)

        # Validation assertions
        if len(contents) == 0:
            errors.append(f"Topic {top.get('title')} has empty contents!")
        if len(quizzes_in_top) == 0:
            errors.append(f"Topic {top.get('title')} has no in-lesson quiz step!")
        if len(mcqs) < 2:
            errors.append(f"Topic {top.get('title')} has only {len(mcqs)} MCQs (minimum 2 required)!")

    # Verify images
    print(f"\nVerifying {len(images)} unique diagram images...")
    broken_images = []
    for img_url in images:
        if not check_url(img_url):
            broken_images.append(img_url)
    print(f"Images verified: {len(images) - len(broken_images)}/{len(images)} reachable (200 OK)")

    # Verify videos
    print(f"\nVerifying {len(videos)} unique YouTube playlist video links...")
    broken_videos = []
    for v_url in videos:
        # Check standard YouTube pattern
        m = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", v_url)
        if not m:
            broken_videos.append(v_url)
    print(f"Videos verified: {len(videos) - len(broken_videos)}/{len(videos)} valid video URLs")

    print("\n==========================================")
    print("VALIDATION REPORT")
    print("==========================================")
    print(f"Course Title:       {course['title']}")
    print(f"Total Modules:      {len(chapters)}")
    print(f"Total Topics:       {len(topics)}")
    print(f"Total Lesson Steps: {total_blocks}")
    print(f"In-Lesson Quizzes:  {total_quizzes}")
    print(f"Question Bank MCQs: {total_mcqs}")
    print(f"Diagram Images:     {len(images)} (Broken: {len(broken_images)})")
    print(f"YouTube Videos:     {len(videos)} (Broken: {len(broken_videos)})")
    print(f"Errors Found:       {len(errors)}")

    if errors:
        print("\nErrors detail:")
        for e in errors:
            print(f"  - {e}")

    report = {
        "course_id": course_id,
        "title": course["title"],
        "modules_count": len(chapters),
        "topics_count": len(topics),
        "lesson_steps_count": total_blocks,
        "in_lesson_quizzes": total_quizzes,
        "total_mcqs": total_mcqs,
        "images_count": len(images),
        "broken_images": broken_images,
        "videos_count": len(videos),
        "broken_videos": broken_videos,
        "errors": errors,
        "is_valid": len(errors) == 0 and len(broken_images) == 0 and len(broken_videos) == 0
    }

    with open("validation_report.json", "w") as f:
        json.dump(report, f, indent=2)

    return report

if __name__ == "__main__":
    validate()
