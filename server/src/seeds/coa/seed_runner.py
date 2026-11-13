import json
import urllib.request
import urllib.error
import time
import os
import sys

# Import modules data
from course_meta import course_metadata
from module0_data import module0
from module1_data import module1
from module2_data import module2
from module3_data import module3
from module4_data import module4
from module5_data import module5
from module6_data import module6

API_BASE = os.environ.get("SABILEARN_API_URL", "https://api.sabilearn.online/api/v1")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@sabilearn.online")
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "")

if not ADMIN_PASS:
    # Attempt to load from .env if present or prompt
    pass

def request_json(url, method="GET", data=None, token=None, timeout=30):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body)
        except Exception:
            return {"success": False, "status": e.code, "message": err_body}
    except Exception as e:
        return {"success": False, "message": str(e)}

def login():
    print("Logging into SabiLearn API...")
    res = request_json(f"{API_BASE}/auth/login", method="POST", data={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS
    })
    if not res.get("success") or not res.get("token"):
        raise Exception(f"Login failed: {res}")
    print(f"Logged in successfully as {res['user']['name']} ({res['user']['role']})")
    return res["token"]

def seed_course(token):
    all_modules = [module0, module1, module2, module3, module4, module5, module6]
    
    # 1. Check if course exists
    print("Checking for existing course...")
    existing_courses = request_json(f"{API_BASE}/courses?limit=100", token=token).get("data", [])
    target_course = None
    for c in existing_courses:
        if c.get("slug") == course_metadata["slug"] or c.get("title") == course_metadata["title"]:
            target_course = c
            break
            
    if target_course:
        course_id = target_course["_id"]
        print(f"Found existing course {course_id} ('{target_course.get('title')}'). Updating metadata...")
        # Update course
        up_res = request_json(f"{API_BASE}/courses/{course_id}", method="PUT", data=course_metadata, token=token)
        if not up_res.get("success"):
            print(f"Warning updating course: {up_res}")
    else:
        print("Creating new course...")
        create_res = request_json(f"{API_BASE}/courses", method="POST", data=course_metadata, token=token)
        if not create_res.get("success"):
            raise Exception(f"Failed to create course: {create_res}")
        course_id = create_res["data"]["_id"]
        print(f"Created course {course_id}")

    # 2. Get existing chapters
    existing_chapters = request_json(f"{API_BASE}/chapters/course/{course_id}", token=token).get("data", [])
    chap_map = {ch["title"]: ch for ch in existing_chapters}

    # 3. Get existing topics
    existing_topics = request_json(f"{API_BASE}/topics/course/{course_id}", token=token).get("data", [])
    top_map = {t["title"]: t for t in existing_topics}

    stats = {
        "course_id": course_id,
        "modules_created": 0,
        "modules_updated": 0,
        "topics_created": 0,
        "topics_updated": 0,
        "mcqs_created": 0,
        "images_checked": 0,
        "videos_checked": 0
    }

    # Iterate through modules
    for mod_idx, mod in enumerate(all_modules):
        mod_title = mod["title"]
        print(f"\n==========================================")
        print(f"Processing Module {mod_idx}: {mod_title}")
        print(f"==========================================")

        chapter_payload = {
            "course": course_id,
            "title": mod_title,
            "description": mod["description"],
            "order": mod["order"],
            "capstoneGoal": mod.get("capstoneGoal", ""),
            "capstoneDifficulty": mod.get("capstoneDifficulty", "medium")
        }

        if mod_title in chap_map:
            chapter_id = chap_map[mod_title]["_id"]
            up_ch = request_json(f"{API_BASE}/chapters/{chapter_id}", method="PUT", data=chapter_payload, token=token)
            stats["modules_updated"] += 1
            print(f"Updated Chapter {chapter_id} ('{mod_title}')")
        else:
            cr_ch = request_json(f"{API_BASE}/chapters", method="POST", data=chapter_payload, token=token)
            if not cr_ch.get("success"):
                print(f"Error creating chapter: {cr_ch}")
                continue
            chapter_id = cr_ch["data"]["_id"]
            chap_map[mod_title] = cr_ch["data"]
            stats["modules_created"] += 1
            print(f"Created Chapter {chapter_id} ('{mod_title}')")

        # Process topics inside module
        for top_idx, top in enumerate(mod["topics"]):
            top_title = top["title"]
            print(f"  -> Topic {top_idx+1}/{len(mod['topics'])}: {top_title}")
            
            topic_payload = {
                "course": course_id,
                "chapter": chapter_id,
                "title": top_title,
                "description": top["description"],
                "order": top["order"],
                "xp": top.get("xp", 50),
                "isPublished": False, # Kept unpublished initially
                "contents": top["contents"]
            }

            if top_title in top_map:
                topic_id = top_map[top_title]["_id"]
                up_top = request_json(f"{API_BASE}/topics/{topic_id}", method="PUT", data=topic_payload, token=token)
                stats["topics_updated"] += 1
            else:
                cr_top = request_json(f"{API_BASE}/topics", method="POST", data=topic_payload, token=token)
                if not cr_top.get("success"):
                    print(f"    Error creating topic: {cr_top}")
                    continue
                topic_id = cr_top["data"]["_id"]
                top_map[top_title] = cr_top["data"]
                stats["topics_created"] += 1

            # Seed MCQs for topic
            if top.get("mcqs"):
                # Clean up existing MCQs for idempotency
                old_mcqs = request_json(f"{API_BASE}/mcqs/topic/{topic_id}", token=token).get("data", [])
                for old_m in old_mcqs:
                    request_json(f"{API_BASE}/mcqs/{old_m['_id']}", method="DELETE", token=token)
                
                # Bulk create MCQs
                mcq_res = request_json(f"{API_BASE}/mcqs/bulk", method="POST", data={
                    "topic": topic_id,
                    "mcqs": top["mcqs"]
                }, token=token)
                if mcq_res.get("success"):
                    stats["mcqs_created"] += len(top["mcqs"])
                    print(f"    Seeded {len(top['mcqs'])} MCQs")
                else:
                    print(f"    Error seeding MCQs: {mcq_res}")

    print("\n==========================================")
    print("SEEDING SUMMARY")
    print("==========================================")
    print(json.dumps(stats, indent=2))
    
    with open("seeding_summary.json", "w") as f:
        json.dump(stats, f, indent=2)

    return stats

if __name__ == "__main__":
    tok = login()
    seed_course(tok)
